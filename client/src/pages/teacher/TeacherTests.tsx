import { useEffect, useState, type FormEvent } from "react";
import {
  fetchTests,
  createTest,
  deleteTest,
  fetchTestRows,
  saveResult,
  type TeacherClassroom,
  type TeacherTest,
  type TestRow,
} from "../../api/teacher.api";
import { Card, Spinner, Alert, Badge } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/FormFields";
import { Modal } from "../../components/ui/Modal";
import { TERMS, TERM_LABELS } from "../../lib/constants";
import { cn, formatDate } from "../../lib/utils";
import { apiErrorMessage, apiFieldErrors } from "../../api/client";

export default function TeacherTests({ classes }: { classes: TeacherClassroom[] }) {
  const [tests, setTests] = useState<TeacherTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [activeTest, setActiveTest] = useState<TeacherTest | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setTests(await fetchTests());
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onDelete(test: TeacherTest) {
    if (!window.confirm(`Delete "${test.title}" and all its results? This cannot be undone.`)) return;
    try {
      await deleteTest(test.id);
      setTests((t) => t.filter((x) => x.id !== test.id));
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold">Tests & Assessments</h2>
        <Button onClick={() => setShowCreate(true)} disabled={classes.length === 0}>
          + New Test
        </Button>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {loading && <Spinner label="Loading tests" />}

      {!loading && tests.length === 0 && (
        <Card>
          <p className="text-slate-500">No tests created yet. Click "New Test" to create one.</p>
        </Card>
      )}

      {!loading &&
        tests.map((t) => (
          <Card key={t.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold">{t.title}</h3>
              <p className="text-sm text-slate-500">
                {t.subject} · {formatDate(t.date)} · {TERM_LABELS[t.term as keyof typeof TERM_LABELS] ?? t.term} ·{" "}
                {t.academicYear} · max {t.maxMarks} · {t.classroom.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={t._count.results > 0 ? "mint" : "slate"}>
                {t._count.results} marked
              </Badge>
              <Button size="sm" variant="secondary" onClick={() => setActiveTest(t)}>
                Record Results
              </Button>
              <Button size="sm" variant="danger" onClick={() => onDelete(t)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}

      {showCreate && (
        <CreateTestModal
          classes={classes}
          onClose={() => setShowCreate(false)}
          onCreated={(test) => {
            setTests((prev) => [test, ...prev]);
            setShowCreate(false);
          }}
        />
      )}

      {activeTest && (
        <RecordResultsModal
          test={activeTest}
          onClose={() => setActiveTest(null)}
        />
      )}
    </div>
  );
}

function CreateTestModal({
  classes,
  onClose,
  onCreated,
}: {
  classes: TeacherClassroom[];
  onClose: () => void;
  onCreated: (t: TeacherTest) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    subject: "",
    date: new Date().toISOString().slice(0, 10),
    maxMarks: "20",
    term: "TERM1",
    academicYear: "2025-26",
    classroomId: classes[0]?.id ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError("");

    // light client validation
    const local: Record<string, string> = {};
    if (form.title.trim().length < 2) local.title = "Title is required";
    if (!form.subject.trim()) local.subject = "Subject is required";
    if (!(Number(form.maxMarks) > 0)) local.maxMarks = "Max marks must be positive";
    if (!/^\d{4}-\d{2}$/.test(form.academicYear)) local.academicYear = "Format: 2025-26";
    if (Object.keys(local).length > 0) {
      setErrors(local);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const test = await createTest({
        ...form,
        maxMarks: Number(form.maxMarks),
      });
      onCreated(test);
    } catch (err) {
      setSaving(false);
      const fieldErrs = apiFieldErrors(err);
      if (Object.keys(fieldErrs).length > 0) {
        setErrors(fieldErrs);
      } else {
        setServerError(apiErrorMessage(err));
      }
    }
  }

  return (
    <Modal open onClose={onClose} title="Create a New Test">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}
        <Input
          label="Test title"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          error={errors.title}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Subject"
            required
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            error={errors.subject}
          />
          <Input
            label="Date"
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            error={errors.date}
          />
          <Input
            label="Max marks"
            type="number"
            min={1}
            required
            value={form.maxMarks}
            onChange={(e) => setForm({ ...form, maxMarks: e.target.value })}
            error={errors.maxMarks}
          />
          <Select
            label="Term"
            options={TERMS.map((t) => ({ value: t, label: TERM_LABELS[t] }))}
            value={form.term}
            onChange={(e) => setForm({ ...form, term: e.target.value })}
          />
          <Input
            label="Academic year"
            required
            hint="Format: 2025-26"
            value={form.academicYear}
            onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
            error={errors.academicYear}
          />
          <Select
            label="Class"
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
            value={form.classroomId}
            onChange={(e) => setForm({ ...form, classroomId: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Create Test
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function RecordResultsModal({ test, onClose }: { test: TeacherTest; onClose: () => void }) {
  const [rows, setRows] = useState<TestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchTestRows(test.id)
      .then((r) => {
        setRows(r);
        setMarks(Object.fromEntries(r.map((x) => [x.studentId, x.marksObtained?.toString() ?? ""])));
        setRemarks(Object.fromEntries(r.map((x) => [x.studentId, x.remarks ?? ""])));
      })
      .catch((err) => setMessage({ tone: "error", text: apiErrorMessage(err) }))
      .finally(() => setLoading(false));
  }, [test.id]);

  async function onSave(row: TestRow) {
    const value = Number(marks[row.studentId]);
    if (marks[row.studentId] === "" || Number.isNaN(value) || value < 0 || value > test.maxMarks) {
      setMessage({ tone: "error", text: `Marks must be between 0 and ${test.maxMarks}` });
      return;
    }
    setSavingId(row.studentId);
    setMessage(null);
    try {
      await saveResult(test.id, row.studentId, value, remarks[row.studentId]);
      setRows((prev) =>
        prev.map((r) =>
          r.studentId === row.studentId
            ? { ...r, marksObtained: value, remarks: remarks[row.studentId] || null }
            : r
        )
      );
      setMessage({ tone: "success", text: `Saved for ${row.studentName} ✔` });
    } catch (err) {
      setMessage({ tone: "error", text: apiErrorMessage(err) });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Results: ${test.title}`} wide>
      <p className="mb-3 text-sm text-slate-500">
        {test.subject} · max {test.maxMarks} marks · grades are computed automatically.
      </p>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      {loading ? (
        <Spinner label="Loading students" />
      ) : (
        <ul className="mt-3 space-y-3">
          {rows.map((row) => {
            const val = Number(marks[row.studentId]);
            const pct = Number.isFinite(val) && test.maxMarks > 0 ? (val / test.maxMarks) * 100 : null;
            return (
              <li key={row.studentId} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="min-w-32 flex-1 font-bold">{row.studentName}</span>
                  <label className="sr-only" htmlFor={`marks-${row.studentId}`}>
                    Marks for {row.studentName}
                  </label>
                  <input
                    id={`marks-${row.studentId}`}
                    type="number"
                    min={0}
                    max={test.maxMarks}
                    value={marks[row.studentId] ?? ""}
                    onChange={(e) => setMarks({ ...marks, [row.studentId]: e.target.value })}
                    className="w-24 rounded-xl border-2 border-slate-200 px-3 py-1.5 focus:border-emerald-500"
                  />
                  <span
                    className={cn(
                      "w-24 text-sm font-bold",
                      pct === null
                        ? "text-slate-400"
                        : pct >= 80
                          ? "text-emerald-600"
                          : pct >= 60
                            ? "text-amber-600"
                            : "text-rose-600"
                    )}
                  >
                    {pct === null ? "—" : `${Math.round(pct)}%`}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={savingId === row.studentId}
                    onClick={() => onSave(row)}
                  >
                    Save
                  </Button>
                </div>
                <input
                  aria-label={`Remarks for ${row.studentName}`}
                  type="text"
                  placeholder="Remarks (optional)"
                  value={remarks[row.studentId] ?? ""}
                  onChange={(e) => setRemarks({ ...remarks, [row.studentId]: e.target.value })}
                  className="mt-2 w-full rounded-xl border-2 border-slate-200 px-3 py-1.5 text-sm focus:border-emerald-500"
                />
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
