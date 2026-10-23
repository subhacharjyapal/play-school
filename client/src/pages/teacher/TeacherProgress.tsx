import { useEffect, useState } from "react";
import {
  fetchOverview,
  saveProgress,
  type TeacherClassroom,
} from "../../api/teacher.api";
import { Card, Alert, Spinner } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select, Textarea } from "../../components/ui/FormFields";
import { SKILLS, TERMS, TERM_LABELS, PROGRAM_LABELS } from "../../lib/constants";
import { apiErrorMessage } from "../../api/client";

export default function TeacherProgress({ classes }: { classes: TeacherClassroom[] }) {
  const [localClasses, setLocalClasses] = useState<TeacherClassroom[]>(classes);
  const [loading, setLoading] = useState(classes.length === 0);

  useEffect(() => {
    if (classes.length === 0) {
      fetchOverview()
        .then(setLocalClasses)
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Spinner label="Loading classes" />;
  if (localClasses.length === 0) {
    return (
      <Card>
        <p className="text-slate-500">No classes are assigned to you yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-extrabold">Progress Reports ⭐</h2>
      <p className="text-slate-500">
        Rate each skill 1–5 (1 = developing, 5 = excellent). Saving again updates the same term.
      </p>
      {localClasses.map((cls) => (
        <Card key={cls.id}>
          <h3 className="mb-3 text-xl font-extrabold">{cls.name}</h3>
          {cls.students.length === 0 ? (
            <p className="text-slate-500">No students yet.</p>
          ) : (
            <div className="space-y-4">
              {cls.students.map((s) => (
                <ProgressForm key={s.id} student={s} />
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function ProgressForm({
  student,
}: {
  student: TeacherClassroom["students"][number];
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("TERM1");
  const [year, setYear] = useState("2025-26");
  const [attendancePct, setAttendancePct] = useState("90");
  const [ratings, setRatings] = useState<Record<string, number>>(
    Object.fromEntries(SKILLS.map((s) => [s.key, 3]))
  );
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function onSave() {
    const pct = Number(attendancePct);
    if (!(pct >= 0 && pct <= 100)) {
      setMessage({ tone: "error", text: "Attendance must be between 0 and 100" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await saveProgress({
        studentId: student.id,
        term,
        academicYear: year,
        attendancePct: pct,
        languageRating: ratings.languageRating,
        mathRating: ratings.mathRating,
        motorRating: ratings.motorRating,
        socialRating: ratings.socialRating,
        creativityRating: ratings.creativityRating,
        disciplineRating: ratings.disciplineRating,
        teacherRemarks: remarks,
      });
      setMessage({ tone: "success", text: `Report saved for ${student.fullName} ✔` });
    } catch (err) {
      setMessage({ tone: "error", text: apiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {student.photoUrl ? (
            <img src={student.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100" aria-hidden="true">
              🧒
            </span>
          )}
          <div>
            <p className="font-bold">{student.fullName}</p>
            <p className="text-xs text-slate-500">
              {PROGRAM_LABELS[student.program as keyof typeof PROGRAM_LABELS] ?? student.program}
            </p>
          </div>
        </div>
        <Button size="sm" variant={open ? "ghost" : "secondary"} onClick={() => setOpen((v) => !v)}>
          {open ? "Close" : "Write Report"}
        </Button>
      </div>

      {open && (
        <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
          {message && <Alert tone={message.tone}>{message.text}</Alert>}
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Term"
              options={TERMS.map((t) => ({ value: t, label: TERM_LABELS[t] }))}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
            <Input
              label="Academic year"
              hint="Format: 2025-26"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
            <Input
              label="Attendance %"
              type="number"
              min={0}
              max={100}
              value={attendancePct}
              onChange={(e) => setAttendancePct(e.target.value)}
            />
          </div>

          <fieldset>
            <legend className="mb-2 font-bold text-slate-700">Skill ratings (1–5)</legend>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SKILLS.map((s) => (
                <div key={s.key} className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
                  <span className="text-sm font-bold">{s.label}</span>
                  <div className="mt-1 flex gap-1" role="group" aria-label={`${s.label} rating`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRatings({ ...ratings, [s.key]: n })}
                        aria-pressed={ratings[s.key] === n}
                        aria-label={`${s.label}: ${n} out of 5`}
                        className={`h-8 w-8 rounded-full text-sm font-bold transition-colors ${
                          ratings[s.key] >= n
                            ? "bg-amber-400 text-white"
                            : "bg-white text-slate-300 ring-1 ring-slate-200"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <Textarea
            label="Teacher remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />

          <Button onClick={onSave} loading={saving}>
            Save Report
          </Button>
        </div>
      )}
    </div>
  );
}
