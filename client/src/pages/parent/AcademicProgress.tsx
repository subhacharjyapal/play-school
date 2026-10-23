import { useEffect, useState } from "react";
import type { Child } from "../../api/portal.api";
import { fetchProgress, type ProgressReport } from "../../api/portal.api";
import { ChildPicker } from "./ChildBits";
import { Alert, Card, EmptyState, Spinner } from "../../components/ui/Card";
import { SKILLS } from "../../lib/constants";
import { apiErrorMessage } from "../../api/client";

export default function AcademicProgress({ children: kids }: { children: Child[] }) {
  const [selectedId, setSelectedId] = useState(kids[0]?.id ?? "");
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setError("");
    fetchProgress(selectedId)
      .then(setReports)
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [selectedId]);

  if (kids.length === 0) return <ChildPicker children={kids} selectedId={selectedId} onSelect={setSelectedId} />;

  return (
    <div className="space-y-8">
      <ChildPicker children={kids} selectedId={selectedId} onSelect={setSelectedId} />

      {loading && <Spinner label="Loading progress reports" />}
      {error && <Alert tone="error">{error}</Alert>}

      {!loading && !error && reports.length === 0 && (
        <EmptyState
          title="No progress reports yet"
          message="Reports appear here after your child's teachers complete each term's assessment."
          icon="📋"
        />
      )}

      {!loading &&
        reports.map((r) => (
          <Card key={r.id}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-extrabold">
                Term {r.term.replace("TERM", "")} · {r.academicYear}
              </h3>
              <span className="rounded-full bg-brand-mint-soft px-4 py-1 font-bold text-emerald-800">
                Attendance: {r.attendancePct}%
              </span>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SKILLS.map((skill) => {
                const value = r.ratings[skill.key.replace("Rating", "") as keyof typeof r.ratings];
                return (
                  <li key={skill.key} className="rounded-2xl bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">{skill.label}</span>
                      <span className="text-xs font-bold text-slate-400">{value}/5</span>
                    </div>
                    <div
                      className="mt-1 text-lg text-amber-400"
                      role="img"
                      aria-label={`${skill.label}: ${value} out of 5 stars`}
                    >
                      {"★".repeat(value)}
                      <span className="text-slate-300">{"★".repeat(5 - value)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>

            {r.teacherRemarks && (
              <blockquote className="mt-4 rounded-2xl bg-sky-50 p-4 text-slate-600 italic ring-1 ring-sky-100">
                “{r.teacherRemarks}”
                {r.teacherName && (
                  <footer className="mt-1 text-sm font-bold not-italic text-sky-700">
                    — {r.teacherName}
                  </footer>
                )}
              </blockquote>
            )}
          </Card>
        ))}
    </div>
  );
}
