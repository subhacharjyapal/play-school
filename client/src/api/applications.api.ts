import { api } from "./client";

export interface ApplicationInput {
  childFullName: string;
  dob: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  program: "PLAYGROUP" | "NURSERY" | "LKG" | "UKG";
  parentName: string;
  relationship: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  medicalNotes?: string;
  message?: string;
}

export interface SubmittedApplication {
  id: string;
  status: string;
  createdAt: string;
}

export async function submitApplication(
  input: ApplicationInput
): Promise<{ application: SubmittedApplication; message: string }> {
  const { data } = await api.post("/applications", input);
  return data;
}

export interface AdminApplication extends ApplicationInput {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedAt: string | null;
  createdAt: string;
  studentId: string | null;
}

export async function fetchApplications(status?: string): Promise<AdminApplication[]> {
  const { data } = await api.get<{ applications: AdminApplication[] }>("/applications", {
    params: status ? { status } : undefined,
  });
  return data.applications;
}

export async function reviewApplication(
  id: string,
  status: "APPROVED" | "REJECTED"
): Promise<void> {
  await api.post(`/applications/${id}/${status.toLowerCase()}`);
}

export async function resendCredentials(id: string): Promise<void> {
  await api.post(`/applications/${id}/resend-credentials`);
}
