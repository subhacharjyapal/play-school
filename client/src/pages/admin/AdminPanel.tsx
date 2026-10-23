import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { cn } from "../../lib/utils";
import AdminDashboard from "./AdminDashboard";
import AdminApplications from "./AdminApplications";
import AdminStudents from "./AdminStudents";
import AdminPeople from "./AdminPeople";
import AdminClasses from "./AdminClasses";
import AdminGallery from "./AdminGallery";
import AdminContent from "./AdminContent";
import AdminMessages from "./AdminMessages";

const tabs = [
  { to: "/admin", label: "Dashboard", emoji: "📊", end: true },
  { to: "/admin/applications", label: "Applications", emoji: "📄" },
  { to: "/admin/students", label: "Students", emoji: "🧒" },
  { to: "/admin/people", label: "Parents & Teachers", emoji: "👥" },
  { to: "/admin/classes", label: "Classes", emoji: "🏫" },
  { to: "/admin/gallery", label: "Gallery", emoji: "🖼️" },
  { to: "/admin/content", label: "Content", emoji: "📣" },
  { to: "/admin/messages", label: "Messages", emoji: "💌" },
];

export default function AdminPanel() {
  return (
    <ProtectedRoute roles={["ADMIN"]}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold">Admin Panel 🛠️</h1>
          <p className="text-slate-500">Manage the school: admissions, people, classes and content.</p>
        </header>

        <nav aria-label="Admin sections" className="mb-8 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-4 py-2 text-sm font-bold transition-colors",
                  isActive
                    ? "bg-brand-lavender text-white shadow"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-violet-50"
                )
              }
            >
              <span aria-hidden="true">{t.emoji} </span>
              {t.label}
            </NavLink>
          ))}
        </nav>

        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="applications" element={<AdminApplications />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="people" element={<AdminPeople />} />
          <Route path="classes" element={<AdminClasses />} />
          <Route path="gallery" element={<AdminGallery />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </ProtectedRoute>
  );
}
