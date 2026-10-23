import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { hashPassword } from "./auth.service";
import { getEmailService, appBaseUrl } from "./email.service";
import { logger } from "../lib/logger";

/** Generates a readable temporary password meeting our policy. */
function generateTemporaryPassword(): string {
  const words = ["Sunny", "Happy", "Bright", "Playful", "Merry", "Jolly", "Bouncy", "Cheery"];
  const word = words[crypto.randomInt(words.length)];
  return `${word}${crypto.randomInt(1000, 9999)}!`;
}

/**
 * Approves an application: creates (or reuses) the parent account, creates the
 * student, links them, and emails login details. Runs in a transaction so
 * partial approvals never persist.
 */
export async function approveApplication(applicationId: string, reviewerId: string) {
  const application = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!application) throw new Error("Application not found");
  if (application.status !== "PENDING") throw new Error("Only pending applications can be approved");

  const tempPassword = generateTemporaryPassword();

  const result = await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { email: application.email },
      include: { parent: true },
    });

    let userId: string;
    let createdNewUser = false;

    if (existingUser) {
      userId = existingUser.id;
      if (!existingUser.parent) {
        await tx.parent.create({
          data: {
            userId: existingUser.id,
            fullName: application.parentName,
            phone: application.phone,
            address: application.address,
            emergencyContact: application.emergencyContact,
            relationshipLabel: application.relationship,
          },
        });
      }
    } else {
      const user = await tx.user.create({
        data: {
          email: application.email,
          passwordHash: await hashPassword(tempPassword),
          role: "PARENT",
          parent: {
            create: {
              fullName: application.parentName,
              phone: application.phone,
              address: application.address,
              emergencyContact: application.emergencyContact,
              relationshipLabel: application.relationship,
            },
          },
        },
      });
      userId = user.id;
      createdNewUser = true;
    }

    const parent = await tx.parent.findUniqueOrThrow({ where: { userId } });

    const student = await tx.student.create({
      data: {
        fullName: application.childFullName,
        dob: application.dob,
        gender: application.gender,
        program: application.program,
        parentId: parent.id,
      },
    });

    const updatedApplication = await tx.application.update({
      where: { id: application.id },
      data: {
        status: "APPROVED",
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        studentId: student.id,
      },
    });

    return { student, application: updatedApplication, createdNewUser };
  });

  // Email outside the transaction: an email hiccup must not undo an approval.
  try {
    await getEmailService().send({
      to: application.email,
      subject: "Welcome to Little Stars Play School - your admission is confirmed!",
      text: [
        `Dear ${application.parentName},`,
        "",
        `Great news! The admission application for ${application.childFullName} has been APPROVED.`,
        "",
        result.createdNewUser
          ? [
              "Your parent portal account is ready:",
              `  Email:     ${application.email}`,
              `  Password:  ${tempPassword}`,
              "",
              `Log in here: ${appBaseUrl()}/login`,
              "",
              "Please change your password after your first login (Profile page in the portal).",
            ].join("\n")
          : [
              `A record for ${application.childFullName} has been added to your existing parent portal account.`,
              `Log in here: ${appBaseUrl()}/login`,
            ].join("\n"),
        "",
        "We are excited to welcome your family to our school!",
        "",
        "Little Stars Play School",
      ].join("\n"),
    });
  } catch (err) {
    logger.warn("Approval succeeded but email failed", { applicationId });
  }

  logger.info("Application approved", {
    applicationId,
    studentId: result.student.id,
    createdNewUser: result.createdNewUser,
  });

  return result;
}

/** Rejects an application (no account is created). */
export async function rejectApplication(applicationId: string, reviewerId: string) {
  return prisma.application.update({
    where: { id: applicationId },
    data: { status: "REJECTED", reviewedById: reviewerId, reviewedAt: new Date() },
  });
}
