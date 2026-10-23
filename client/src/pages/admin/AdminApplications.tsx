import { useEffect, useState } from "react";
import {
  fetchApplications,
  reviewApplication,
  resendCredentials,
  type AdminApplication,
} from "../../api/applications.api";
import { Card, Badge, Alert, Spinner, EmptyState } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { PROGRAM_LABELS } from "../../lib/constants";
import { formatDate } from "../../lib/utils";
import { apiErrorMessage } from "../../api/client";

const filterTabs = ["PENDING", "APPROVED", "REJECTED"] as const;

export default function AdminApplications() {
  const [apps, setApps] = useState<AdminApplication[]>([]);
  const [filter, setFilter] = useState<(typeof filterTabs)[number]>("PENDING");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load(status: (typeof filterTabs)[number]) {
    setLoading(true);
    try {
      setApps(await fetchApplications(status));
    } catch {
      // handled by empty state
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function onReview(app: AdminApplication, status: "APPROVED" | "REJECTED") {
    const confirmText =
      status === "APPROVED"
        ? `Approve the application for ${app.childFullName}? A parent account will be created and credentials emailed to ${app.email}.`
        : `Reject the application for ${app.childFullName}?`;
    if (!window.confirm(confirmText)) return;
    setBusyId(app.id);
    setMessage(null);
    try {
      await reviewApplication(app.id, status);
      setMessage({
        tone: "success",
        text:
          status === "APPROVED"
            ? `Approved! Login credentials were emailed to ${app.email} (shown in the server console in dev).`
            : "Application rejected.",
      });
      load(filter);
    } catch (err) {
      setMessage({ tone: "error", text: apiErrorMessage(err) });
    } finally {
      setBusyId(null);
    }
  }

  async function onResend(app: AdminApplication) {
    setBusyId(app.id);
    try {
      await resendCredentials(app.id);
      setMessage({ tone: "success", text: `Credentials reminder emailed to ${app.email}.` });
    } catch (err) {
      setMessage({ tone: "error", text: apiErrorMessage(err) });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter applications">
        {filterTabs.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              filter === f ? "bg-brand-lavender text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      {loading && <Spinner label="Loading applications" />}

      {!loading && apps.length === 0 && (
        <EmptyState title="Nothing here" message={`No ${filter.toLowerCase()} applications.`} icon="🗂️" />
      )}

      {!loading &&
        apps.map((app) => (
          <Card key={app.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-extrabold">
                  {app.childFullName}{" "}
                  <Badge tone={app.status === "PENDING" ? "sun" : app.status === "APPROVED" ? "mint" : "coral"}>
                    {app.status}
                  </Badge>
                </h3>
                <p className="text-sm text-slate-500">
                  {PROGRAM_LABELS[app.program] ?? app.program} · applied {formatDate(app.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {app.status === "PENDING" ? (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={busyId === app.id}
                      onClick={() => onReview(app, "APPROVED")}
                    >
                      ✓ Approve
                    </Button>
                    <Button size="sm" variant="danger" loading={busyId === app.id} onClick={() => onReview(app, "REJECTED")}>
                      ✕ Reject
                    </Button>
                  </>
                ) : (
                  app.status === "APPROVED" && (
                    <Button size="sm" variant="outline" loading={busyId === app.id} onClick={() => onResend(app)}>
                      Resend credentials
                    </Button>
                  )
                )}
              </div>
            </div>

            <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="font-bold text-slate-500">DOB</dt><dd>{formatDate(app.dob)}</dd></div>
              <div><dt className="font-bold text-slate-500">Gender</dt><dd>{app.gender}</dd></div>
              <div><dt className="font-bold text-slate-500">Parent</dt><dd>{app.parentName} ({app.relationship})</dd></div>
              <div><dt className="font-bold text-slate-500">Phone</dt><dd>{app.phone}</dd></div>
              <div><dt className="font-bold text-slate-500">Email</dt><dd>{app.email}</dd></div>
              <div><dt className="font-bold text-slate-500">Emergency</dt><dd>{app.emergencyContact}</dd></div>
              <div className="sm:col-span-2 lg:col-span-3"><dt className="font-bold text-slate-500">Address</dt><dd>{app.address}</dd></div>
              {app.medicalNotes && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <dt className="font-bold text-rose-600">Medical notes</dt>
                  <dd>{app.medicalNotes}</dd>
                </div>
              )}
              {app.message && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <dt className="font-bold text-slate-500">Message</dt>
                  <dd className="italic">“{app.message}”</dd>
                </div>
              )}
            </dl>
          </Card>
        ))}
    </div>
  );
}
