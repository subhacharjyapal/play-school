import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchStats, type AdminStats } from "../../api/admin.api";
import { Card, Spinner } from "../../components/ui/Card";

const tiles: Array<{ key: keyof AdminStats; label: string; emoji: string; to: string; tone: string }> = [
  { key: "students", label: "Active Students", emoji: "🧒", to: "/admin/students", tone: "bg-sky-100" },
  { key: "pendingApps", label: "Pending Applications", emoji: "📄", to: "/admin/applications", tone: "bg-amber-100" },
  { key: "teachers", label: "Teachers", emoji: "👩‍🏫", to: "/admin/people", tone: "bg-rose-100" },
  { key: "parents", label: "Parents", emoji: "👪", to: "/admin/people", tone: "bg-emerald-100" },
  { key: "classes", label: "Classes", emoji: "🏫", to: "/admin/classes", tone: "bg-violet-100" },
  { key: "messages", label: "Unread Messages", emoji: "💌", to: "/admin/messages", tone: "bg-orange-100" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    fetchStats().then(setStats).catch(() => undefined);
  }, []);

  if (!stats) return <Spinner label="Loading dashboard" />;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((tile) => (
        <Link key={tile.key} to={tile.to}>
          <Card className={`transition-transform hover:-translate-y-1 hover:shadow-lg ${tile.tone}`}>
            <div className="flex items-center justify-between">
              <span className="text-4xl" aria-hidden="true">{tile.emoji}</span>
              <span className="font-display text-4xl font-extrabold">{stats[tile.key]}</span>
            </div>
            <p className="mt-2 font-bold text-slate-700">{tile.label}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
