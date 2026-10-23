import { Link } from "react-router-dom";
import type { Child } from "../../api/portal.api";
import { PROGRAM_LABELS, TERM_LABELS } from "../../lib/constants";
import { EmptyState, Card } from "../../components/ui/Card";
import { ageFromDob } from "../../lib/utils";

export function ChildPicker({
  children: kids,
  selectedId,
  onSelect,
}: {
  children: Child[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (kids.length === 0) {
    return (
      <EmptyState
        title="No children linked yet"
        message="Once the school office approves your admission, your child will appear here. Contact us if this seems wrong."
        icon="🧒"
      />
    );
  }
  if (kids.length === 1) {
    return <ChildSummary child={kids[0]} />;
  }
  return (
    <div>
      <h2 className="mb-3 font-display text-lg font-bold">Choose a child</h2>
      <div className="flex flex-wrap gap-3">
        {kids.map((c) => {
          const active = c.id === selectedId;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              aria-pressed={active}
              className={`flex items-center gap-3 rounded-full py-2 pr-5 pl-2 transition-all ${
                active
                  ? "bg-brand-sky text-white shadow-md"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-sky-50"
              }`}
            >
              {c.photoUrl ? (
                <img src={c.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-sun-soft text-lg" aria-hidden="true">
                  🧸
                </span>
              )}
              <span className="font-bold">{c.fullName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ChildSummary({ child }: { child: Child }) {
  return (
    <Card className="flex items-center gap-5">
      {child.photoUrl ? (
        <img
          src={child.photoUrl}
          alt={`Photo of ${child.fullName}`}
          className="h-20 w-20 rounded-2xl object-cover ring-4 ring-brand-sun-soft"
        />
      ) : (
        <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-sky-100 text-4xl" aria-hidden="true">
          🧸
        </span>
      )}
      <div>
        <h2 className="text-2xl font-extrabold">{child.fullName}</h2>
        <p className="text-slate-500">
          {PROGRAM_LABELS[child.program as keyof typeof PROGRAM_LABELS] ?? child.program} ·{" "}
          {ageFromDob(child.dob)}
        </p>
        <p className="mt-1 text-sm font-bold text-brand-sky">
          Class: {child.className ?? "Not assigned"} · Teacher: {child.teacherName ?? "—"}
        </p>
      </div>
    </Card>
  );
}

export function termLabel(term: string): string {
  return TERM_LABELS[term as keyof typeof TERM_LABELS] ?? term;
}

export function ChildDataLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="text-sm font-bold text-brand-sky hover:underline">
      {label} →
    </Link>
  );
}
