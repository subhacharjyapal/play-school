import { useEffect, useState, type FormEvent } from "react";
import {
  fetchAdminClasses,
  createClass,
  updateClass,
  fetchAdminTeachers,
  type AdminClass,
  type AdminTeacher,
} from "../../api/admin.api";
import { Card, Alert, Spinner, Badge } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/FormFields";
import { Modal } from "../../components/ui/Modal";
import { PROGRAMS, PROGRAM_LABELS } from "../../lib/constants";
import { apiErrorMessage, apiFieldErrors } from "../../api/client";

export default function AdminClasses() {
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminClass | "new" | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [c, t] = await Promise.all([fetchAdminClasses(), fetchAdminTeachers()]);
      setClasses(c);
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

  if (loading) return <Spinner label="Loading classes" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold">Classes ({classes.length})</h2>
        <Button onClick={() => setEditing("new")}>+ New Class</Button>
      </div>

      {message && <Alert tone={message.tone}>{message.text}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-xl font-extrabold">{c.name}</h3>
              <Badge tone="sky">{c._count.students} students</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {PROGRAM_LABELS[c.program as keyof typeof PROGRAM_LABELS] ?? c.program}
            </p>
            <p className="mt-2 text-sm">
              <span className="font-bold text-slate-500">Teacher: </span>
              {c.teacher?.fullName ?? <span className="text-amber-600">Unassigned</span>}
            </p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setEditing(c)}>
              Edit
            </Button>
          </Card>
        ))}
      </div>

      {editing && (
        <ClassModal
          classroom={editing === "new" ? null : editing}
          teachers={teachers}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setMessage({ tone: "success", text: "Class saved ✔" });
            load();
          }}
        />
      )}
    </div>
  );
}

function ClassModal({
  classroom,
  teachers,
  onClose,
  onSaved,
}: {
  classroom: AdminClass | null;
  teachers: AdminTeacher[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: classroom?.name ?? "",
    program: classroom?.program ?? "PLAYGROUP",
    teacherId: classroom?.teacher?.id ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      setErrors({ name: "Class name is required" });
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const payload = { ...form, teacherId: form.teacherId || undefined };
      if (classroom) await updateClass(classroom.id, payload);
      else await createClass(payload);
      onSaved();
    } catch (err) {
      setSaving(false);
      const fieldErrs = apiFieldErrors(err);
      if (Object.keys(fieldErrs).length > 0) setErrors(fieldErrs);
      else setServerError(apiErrorMessage(err));
    }
  }

  return (
    <Modal open onClose={onClose} title={classroom ? `Edit ${classroom.name}` : "New Class"}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}
        <Input
          label="Class name"
          required
          placeholder="e.g. LKG - Blue"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
        />
        <Select
          label="Program"
          options={PROGRAMS.map((p) => ({ value: p, label: PROGRAM_LABELS[p] }))}
          value={form.program}
          onChange={(e) => setForm({ ...form, program: e.target.value })}
        />
        <Select
          label="Teacher"
          placeholder="Unassigned"
          options={teachers.map((t) => ({ value: t.id, label: t.fullName }))}
          value={form.teacherId}
          onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save Class
          </Button>
        </div>
      </form>
    </Modal>
  );
}
