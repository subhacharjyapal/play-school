import type { TeacherClassroom } from "../../api/teacher.api";
import { PROGRAM_LABELS } from "../../lib/constants";
import { Card, EmptyState } from "../../components/ui/Card";
import { ageFromDob } from "../../lib/utils";

export default function TeacherOverview({ classes }: { classes: TeacherClassroom[] }) {
  if (classes.length === 0) {
    return (
      <EmptyState
        title="No classes assigned"
        message="Ask the admin to assign a classroom to your account."
        icon="🏫"
      />
    );
  }

  return (
    <div className="space-y-8">
      {classes.map((cls) => (
        <Card key={cls.id}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-2xl font-extrabold">{cls.name}</h2>
            <span className="rounded-full bg-emerald-100 px-4 py-1 text-sm font-bold text-emerald-800">
              {cls.studentCount} students · {PROGRAM_LABELS[cls.program as keyof typeof PROGRAM_LABELS] ?? cls.program}
            </span>
          </div>
          {cls.students.length === 0 ? (
            <p className="text-slate-500">No active students in this class yet.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cls.students.map((s) => (
                <li key={s.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  {s.photoUrl ? (
                    <img src={s.photoUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-2xl" aria-hidden="true">
                      🧒
                    </span>
                  )}
                  <div>
                    <p className="font-bold">{s.fullName}</p>
                    <p className="text-xs text-slate-500">{ageFromDob(s.dob)} old</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
}
