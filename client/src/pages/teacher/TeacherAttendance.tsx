import { useEffect, useState } from "react";
import { fetchOverview, markAttendance, type TeacherClassroom } from "../../api/teacher.api";
import { Card, Alert, Spinner } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/FormFields";
import { ATTENDANCE_STATUSES } from "../../lib/constants";
import { cn } from "../../lib/utils";
import { apiErrorMessage } from "../../api/client";

type Status = "PRESENT" | "ABSENT" | "LATE";

const statusStyles: Record<Status, string> = {
  PRESENT: "bg-emerald-500 text-white",
  ABSENT: "bg-rose-400 text-white",
  LATE: "bg-amber-400 text-white",
};

const statusButtons: Array<{ value: Status; label: string }> = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "LATE", label: "Late" },
];

export default function TeacherAttendance({ classes }: { classes: TeacherClassroom[] }) {
  // Re-fetch so state stays fresh even if opened directly
  const [localClasses, setLocalClasses] = useState<TeacherClassroom[]>(classes);
  const [classroomId, setClassroomId] = useState(classes[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (classes.length === 0) {
      setLoading(true);
      fetchOverview()
        .then(setLocalClasses)
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeClass = localClasses.find((c) => c.id === classroomId) ?? localClasses[0];

  useEffect(() => {
    // Default everyone to PRESENT when the class changes
    if (activeClass) {
      setStatuses(Object.fromEntries(activeClass.students.map((s) => [s.id, "PRESENT" as Status])));
    }
  }, [activeClass?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSave() {
    if (!activeClass) return;
    setSaving(true);
    setMessage(null);
    try {
      const saved = await markAttendance(
        activeClass.id,
        date,
        activeClass.students.map((s) => ({ studentId: s.id, status: statuses[s.id] ?? "PRESENT" }))
      );
      setMessage({ tone: "success", text: `Attendance saved for ${saved} students ✔` });
    } catch (err) {
      setMessage({ tone: "error", text: apiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  if (localClasses.length === 0 && loading) return <Spinner label="Loading classes" />;
  if (localClasses.length === 0) {
    return (
      <Card>
        <p className="text-slate-500">No classes are assigned to you yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-extrabold">Mark Attendance 🗓️</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Select
            label="Class"
            options={localClasses.map((c) => ({ value: c.id, label: `${c.name} (${c.studentCount})` }))}
            value={activeClass?.id ?? ""}
            onChange={(e) => setClassroomId(e.target.value)}
          />
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-slate-700">Date</span>
            <input
              type="date"
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 focus:border-emerald-500"
            />
          </label>
        </div>
      </Card>

      {message && <Alert tone={message.tone}>{message.text}</Alert>}

      {activeClass && (
        <Card>
          {activeClass.students.length === 0 ? (
            <p className="text-slate-500">No students in this class.</p>
          ) : (
            <>
              <ul className="space-y-3">
                {activeClass.students.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3"
                  >
                    <span className="font-bold">{s.fullName}</span>
                    <div className="flex gap-2" role="group" aria-label={`Attendance for ${s.fullName}`}>
                      {statusButtons.map((b) => (
                        <button
                          key={b.value}
                          onClick={() => setStatuses({ ...statuses, [s.id]: b.value })}
                          aria-pressed={statuses[s.id] === b.value}
                          className={cn(
                            "rounded-full px-4 py-1.5 text-sm font-bold transition-colors",
                            statuses[s.id] === b.value
                              ? statusStyles[b.value]
                              : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100"
                          )}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center gap-3">
                <Button onClick={onSave} loading={saving}>
                  Save Attendance
                </Button>
                <p className="text-xs text-slate-400">
                  {ATTENDANCE_STATUSES.length} statuses · saving again updates the same day.
                </p>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
