import { Link } from "react-router-dom";
import type { Child } from "../../api/portal.api";
import { ChildSummary } from "./ChildBits";
import { Card } from "../../components/ui/Card";

export default function ParentDashboard({ children: kids }: { children: Child[] }) {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-extrabold">My Children 👧👦</h2>

      {kids.length === 0 ? (
        <Card>
          <p className="text-slate-500">
            No children are linked to your account yet. Please contact the school office.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {kids.map((child) => (
            <div key={child.id} className="space-y-3">
              <ChildSummary child={child} />
              <div className="flex flex-wrap gap-3 px-2">
                <Link
                  to="/parent/progress"
                  className="rounded-full bg-amber-100 px-4 py-1.5 text-sm font-bold text-amber-800 transition hover:bg-amber-200"
                >
                  📈 Progress
                </Link>
                <Link
                  to="/parent/results"
                  className="rounded-full bg-rose-100 px-4 py-1.5 text-sm font-bold text-rose-800 transition hover:bg-rose-200"
                >
                  📝 Test Results
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Card className="bg-sky-50 ring-sky-100">
        <h3 className="font-bold">💡 Did you know?</h3>
        <p className="mt-1 text-sm text-slate-600">
          You can download a colorful PDF report card from the Test Results page — perfect for
          sharing with grandparents!
        </p>
      </Card>
    </div>
  );
}
