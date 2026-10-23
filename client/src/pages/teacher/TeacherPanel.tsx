import { useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import { fetchOverview, type TeacherClassroom } from "../../api/teacher.api";
import { Spinner } from "../../components/ui/Card";
import { cn } from "../../lib/utils";
import TeacherOverview from "./TeacherOverview";
import TeacherTests from "./TeacherTests";
import TeacherAttendance from "./TeacherAttendance";
import TeacherProgress from "./TeacherProgress";

const tabs = [
  { to: "/teacher", label: "My Classes", emoji: "🏫", end: true },
  { to: "/teacher/tests", label: "Tests & Results", emoji: "📝" },
  { to: "/teacher/attendance", label: "Attendance", emoji: "🗓️" },
  { to: "/teacher/progress", label: "Progress Reports", emoji: "⭐" },
];

export default function TeacherPanel() {
  return (
    <ProtectedRoute roles={["TEACHER", "ADMIN"]}>
      <TeacherShell />
    </ProtectedRoute>
  );
}

export function TeacherShell() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<TeacherClassroom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchOverview()
      .then((c) => !cancelled && setClasses(c))
      .catch(() => undefined)
      .finally(() => !cancelled && setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold">
          Teacher Panel 👩‍🏫
        </h1>
        <p className="text-slate-500">
          Welcome, {user?.teacher?.fullName ?? user?.email}. Manage your classes, tests and
          attendance here.
        </p>
      </header>

      <nav aria-label="Teacher sections" className="mb-8 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              cn(
                "rounded-full px-4 py-2 text-sm font-bold transition-colors",
                isActive
                  ? "bg-brand-mint text-white shadow"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-emerald-50"
              )
            }
          >
            <span aria-hidden="true">{t.emoji} </span>
            {t.label}
          </NavLink>
        ))}
      </nav>

      {loading ? (
        <Spinner label="Loading your classes" />
      ) : (
        <Routes>
          <Route index element={<TeacherOverview classes={classes} />} />
          <Route path="tests" element={<TeacherTests classes={classes} />} />
          <Route path="attendance" element={<TeacherAttendance classes={classes} />} />
          <Route path="progress" element={<TeacherProgress classes={classes} />} />
          <Route path="*" element={<Navigate to="/teacher" replace />} />
        </Routes>
      )}
    </div>
  );
}
