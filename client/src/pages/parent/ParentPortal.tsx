import { useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import { fetchChildren, type Child } from "../../api/portal.api";
import { Spinner } from "../../components/ui/Card";
import { cn } from "../../lib/utils";
import ParentDashboard from "./ParentDashboard";
import AcademicProgress from "./AcademicProgress";
import TestResults from "./TestResults";
import ParentProfile from "./ParentProfile";

const tabs = [
  { to: "/parent", label: "Dashboard", emoji: "🏠", end: true },
  { to: "/parent/progress", label: "Academic Progress", emoji: "📈" },
  { to: "/parent/results", label: "Test Results", emoji: "📝" },
  { to: "/parent/profile", label: "My Profile", emoji: "👤" },
];

/** Shared layout: sub-nav + children context for all portal pages. */
export default function ParentPortal() {
  return (
    <ProtectedRoute roles={["PARENT"]}>
      <PortalShell />
    </ProtectedRoute>
  );
}

function PortalShell() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchChildren()
      .then((c) => !cancelled && setChildren(c))
      .catch(() => undefined)
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold">
          Hello, {user?.parent?.fullName?.split(" ")[0] ?? "Parent"}! 👋
        </h1>
        <p className="text-slate-500">Follow your little one's journey at school.</p>
      </header>

      <nav aria-label="Portal sections" className="mb-8 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              cn(
                "rounded-full px-4 py-2 text-sm font-bold transition-colors",
                isActive
                  ? "bg-brand-sky text-white shadow"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-sky-50"
              )
            }
          >
            <span aria-hidden="true">{t.emoji} </span>
            {t.label}
          </NavLink>
        ))}
      </nav>

      {loading ? (
        <Spinner label="Loading your children's data" />
      ) : (
        <Routes>
          <Route index element={<ParentDashboard children={children} />} />
          <Route path="progress" element={<AcademicProgress children={children} />} />
          <Route path="results" element={<TestResults children={children} />} />
          <Route path="profile" element={<ParentProfile />} />
          <Route path="*" element={<Navigate to="/parent" replace />} />
        </Routes>
      )}
    </div>
  );
}
