import { useEffect, useState, type FormEvent } from "react";
import {
  fetchAdminParents,
  fetchAdminTeachers,
  createTeacher,
  toggleTeacherActive,
  type AdminParent,
  type AdminTeacher,
} from "../../api/admin.api";
import { Card, Badge, Alert, Spinner } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/FormFields";
import { Modal } from "../../components/ui/Modal";
import { apiErrorMessage, apiFieldErrors } from "../../api/client";

export default function AdminPeople() {
  const [parents, setParents] = useState<AdminParent[]>([]);
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [p, t] = await Promise.all([fetchAdminParents(), fetchAdminTeachers()]);
      setParents(p);
      setTeachers(t);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onToggle(teacher: AdminTeacher) {
    try {
      const isActive = await toggleTeacherActive(teacher.id);
      setMessage({
        tone: "success",
        text: `${teacher.fullName} ${isActive ? "activated" : "deactivated"}.`,
      });
      load();
    } catch (err) {
      setMessage({ tone: "error", text: apiErrorMessage(err) });
    }
  }

  if (loading) return <Spinner label="Loading people" />;

  return (
    <div className="space-y-10">
      {message && <Alert tone={message.tone}>{message.text}</Alert>}

      {/* Teachers */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold">Teachers ({teachers.length})</h2>
          <Button onClick={() => setShowCreate(true)}>+ Add Teacher</Button>
        </div>

        {createdCreds && (
          <Alert tone="success">
            <p>
              Teacher account created for <strong>{createdCreds.email}</strong>.
            </p>
            <p className="mt-1">
              Temporary password: <code className="rounded bg-white px-2 py-0.5 font-bold">{createdCreds.password}</code>
            </p>
            <p className="mt-1 text-sm">Copy it now — it is shown only once. The teacher should change it after first login.</p>
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => setCreatedCreds(null)}>
              I saved it, dismiss
            </Button>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {teachers.map((t) => (
            <Card key={t.id}>
              <div className="flex items-start gap-4">
                {t.photoUrl ? (
                  <img src={t.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-2xl" aria-hidden="true">
                    👩‍🏫
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-extrabold">
                    {t.fullName}{" "}
                    <Badge tone={t.user.isActive ? "mint" : "slate"}>
                      {t.user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </h3>
                  <p className="text-sm text-slate-500">{t.user.email}</p>
                  {t.qualification && <p className="text-xs font-bold text-brand-sky">{t.qualification}</p>}
                  {t.classrooms.length > 0 && (
                    <p className="mt-1 text-xs text-slate-500">
                      Classes: {t.classrooms.map((c) => c.name).join(", ")}
                    </p>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => onToggle(t)}>
                  {t.user.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Parents */}
      <section className="space-y-4">
        <h2 className="text-2xl font-extrabold">Parents ({parents.length})</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {parents.map((p) => (
            <Card key={p.id}>
              <h3 className="text-lg font-extrabold">
                {p.fullName}{" "}
                <Badge tone={p.user.isActive ? "mint" : "slate"}>
                  {p.user.isActive ? "Active" : "Inactive"}
                </Badge>
              </h3>
              <p className="text-sm text-slate-500">
                {p.user.email} · {p.phone}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Children:{" "}
                {p.students.length === 0
                  ? "—"
                  : p.students.map((s) => s.fullName).join(", ")}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {showCreate && (
        <CreateTeacherModal
          onClose={() => setShowCreate(false)}
          onCreated={(email, password) => {
            setCreatedCreds({ email, password });
            setShowCreate(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function CreateTeacherModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (email: string, password: string) => void;
}) {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", qualification: "", bio: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError("");
    const local: Record<string, string> = {};
    if (form.fullName.trim().length < 2) local.fullName = "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) local.email = "Valid email is required";
    if (Object.keys(local).length > 0) {
      setErrors(local);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const { temporaryPassword } = await createTeacher(form);
      onCreated(form.email, temporaryPassword);
    } catch (err) {
      setSaving(false);
      const fieldErrs = apiFieldErrors(err);
      if (Object.keys(fieldErrs).length > 0) setErrors(fieldErrs);
      else setServerError(apiErrorMessage(err));
    }
  }

  return (
    <Modal open onClose={onClose} title="Add Teacher">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}
        <Input
          label="Full name"
          required
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          error={errors.fullName}
        />
        <Input
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
        />
        <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input
          label="Qualification"
          value={form.qualification}
          onChange={(e) => setForm({ ...form, qualification: e.target.value })}
        />
        <Textarea label="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        <p className="text-xs text-slate-400">A temporary password will be generated and shown once.</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Create Teacher
          </Button>
        </div>
      </form>
    </Modal>
  );
}
