import { useEffect, useState, type FormEvent } from "react";
import {
  fetchAdminStudents,
  createStudent,
  updateStudent,
  archiveStudent,
  fetchAdminClasses,
  fetchAdminParents,
  type AdminStudent,
  type AdminClass,
  type AdminParent,
} from "../../api/admin.api";
import { Card, Badge, Alert, Spinner } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/FormFields";
import { Modal } from "../../components/ui/Modal";
import { PROGRAMS, PROGRAM_LABELS, GENDERS } from "../../lib/constants";
import { formatDate } from "../../lib/utils";
import { apiErrorMessage, apiFieldErrors } from "../../api/client";

export default function AdminStudents() {
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [parents, setParents] = useState<AdminParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminStudent | "new" | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [s, c, p] = await Promise.all([fetchAdminStudents(), fetchAdminClasses(), fetchAdminParents()]);
      setStudents(s);
      setClasses(c);
      setParents(p);
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onArchive(student: AdminStudent) {
    if (!window.confirm(`Archive ${student.fullName}? They will no longer appear in class lists.`)) return;
    try {
      await archiveStudent(student.id);
      setMessage({ tone: "success", text: `${student.fullName} archived.` });
      load();
    } catch (err) {
      setMessage({ tone: "error", text: apiErrorMessage(err) });
    }
  }

  if (loading) return <Spinner label="Loading students" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold">Students ({students.filter((s) => s.isActive).length})</h2>
        <Button onClick={() => setEditing("new")}>+ Add Student</Button>
      </div>

      {message && <Alert tone={message.tone}>{message.text}</Alert>}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b-2 border-slate-100 text-slate-500">
              <th scope="col" className="py-2 pr-4 font-bold">Name</th>
              <th scope="col" className="py-2 pr-4 font-bold">DOB</th>
              <th scope="col" className="py-2 pr-4 font-bold">Program</th>
              <th scope="col" className="py-2 pr-4 font-bold">Class</th>
              <th scope="col" className="py-2 pr-4 font-bold">Parent</th>
              <th scope="col" className="py-2 pr-4 font-bold">Status</th>
              <th scope="col" className="py-2 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-b border-slate-50 hover:bg-violet-50/40">
                <td className="py-3 pr-4 font-bold">{s.fullName}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{formatDate(s.dob)}</td>
                <td className="py-3 pr-4">{PROGRAM_LABELS[s.program as keyof typeof PROGRAM_LABELS] ?? s.program}</td>
                <td className="py-3 pr-4">{s.classroom?.name ?? "—"}</td>
                <td className="py-3 pr-4">{s.parent.fullName}</td>
                <td className="py-3 pr-4">
                  <Badge tone={s.isActive ? "mint" : "slate"}>{s.isActive ? "Active" : "Archived"}</Badge>
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(s)}>
                      Edit
                    </Button>
                    {s.isActive && (
                      <Button size="sm" variant="ghost" onClick={() => onArchive(s)}>
                        Archive
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {editing && (
        <StudentModal
          student={editing === "new" ? null : editing}
          classes={classes}
          parents={parents}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setMessage({ tone: "success", text: "Student saved ✔" });
            load();
          }}
        />
      )}
    </div>
  );
}

function StudentModal({
  student,
  classes,
  parents,
  onClose,
  onSaved,
}: {
  student: AdminStudent | null;
  classes: AdminClass[];
  parents: AdminParent[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    fullName: student?.fullName ?? "",
    dob: student ? student.dob.slice(0, 10) : "",
    gender: student?.gender ?? "MALE",
    program: student?.program ?? "PLAYGROUP",
    classroomId: student?.classroom?.id ?? "",
    parentId: student?.parentId ?? parents[0]?.id ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError("");
    const local: Record<string, string> = {};
    if (form.fullName.trim().length < 2) local.fullName = "Name is required";
    if (!form.dob) local.dob = "Date of birth is required";
    if (!form.parentId) local.parentId = "Please select a parent";
    if (Object.keys(local).length > 0) {
      setErrors(local);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const payload = { ...form, classroomId: form.classroomId || undefined };
      if (student) await updateStudent(student.id, payload);
      else await createStudent(payload);
      onSaved();
    } catch (err) {
      setSaving(false);
      const fieldErrs = apiFieldErrors(err);
      if (Object.keys(fieldErrs).length > 0) setErrors(fieldErrs);
      else setServerError(apiErrorMessage(err));
    }
  }

  return (
    <Modal open onClose={onClose} title={student ? `Edit ${student.fullName}` : "Add Student"} wide>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Full name"
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            error={errors.fullName}
          />
          <Input
            label="Date of birth"
            type="date"
            required
            value={form.dob}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
            error={errors.dob}
          />
          <Select
            label="Gender"
            options={GENDERS.map((g) => ({ value: g, label: g.charAt(0) + g.slice(1).toLowerCase() }))}
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
          />
          <Select
            label="Program"
            options={PROGRAMS.map((p) => ({ value: p, label: PROGRAM_LABELS[p] }))}
            value={form.program}
            onChange={(e) => setForm({ ...form, program: e.target.value })}
          />
          <Select
            label="Class"
            placeholder="Not assigned"
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
            value={form.classroomId}
            onChange={(e) => setForm({ ...form, classroomId: e.target.value })}
          />
          <Select
            label="Parent"
            required
            placeholder="Select…"
            options={parents.map((p) => ({ value: p.id, label: `${p.fullName} (${p.user.email})` }))}
            value={form.parentId}
            onChange={(e) => setForm({ ...form, parentId: e.target.value })}
            error={errors.parentId}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {student ? "Save Changes" : "Add Student"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
