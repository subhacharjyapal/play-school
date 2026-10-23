import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { Child } from "../../api/portal.api";
import { fetchResults, downloadReportCard, type TestResultRow } from "../../api/portal.api";
import { ChildPicker, termLabel } from "./ChildBits";
import { Alert, Card, EmptyState, Spinner } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Card";
import { formatDate } from "../../lib/utils";
import { apiErrorMessage } from "../../api/client";

function gradeTone(grade: string): "mint" | "sky" | "sun" | "coral" {
  if (grade.startsWith("A")) return "mint";
  if (grade === "B") return "sky";
  if (grade === "C") return "sun";
  return "coral";
}

export default function TestResults({ children: kids }: { children: Child[] }) {
  const [selectedId, setSelectedId] = useState(kids[0]?.id ?? "");
  const [results, setResults] = useState<TestResultRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setError("");
    fetchResults(selectedId)
      .then(setResults)
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const chartData = useMemo(
    () =>
      results.map((r) => ({
        name: r.title.length > 14 ? `${r.title.slice(0, 12)}…` : r.title,
        fullName: r.title,
        percentage: r.percentage,
        subject: r.subject,
      })),
    [results]
  );

  const selectedChild = kids.find((k) => k.id === selectedId);

  async function handleDownload() {
    if (!selectedChild) return;
    setDownloading(true);
    try {
      const filename = `report-card-${selectedChild.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
      await downloadReportCard(selectedChild.id, filename);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not generate the report card."));
    } finally {
      setDownloading(false);
    }
  }

  if (kids.length === 0) return <ChildPicker children={kids} selectedId={selectedId} onSelect={setSelectedId} />;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ChildPicker children={kids} selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      {loading && <Spinner label="Loading test results" />}
      {error && <Alert tone="error">{error}</Alert>}

      {!loading && !error && results.length === 0 && (
        <EmptyState
          title="No test results yet"
          message="Assessments will show up here once teachers publish them."
          icon="📝"
        />
      )}

      {!loading && results.length > 0 && (
        <>
          {/* Progress chart */}
          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-extrabold">Performance Over Time 📈</h3>
              <Button variant="secondary" size="sm" onClick={handleDownload} loading={downloading}>
                ⬇️ Download report card (PDF)
              </Button>
            </div>
            <div className="h-72" role="img" aria-label={`Line chart of ${selectedChild?.fullName}'s test percentages over time`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" unit="%" />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Score"]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName ?? label}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                  />
                  <ReferenceLine y={60} stroke="#fbbf24" strokeDasharray="4 4" label={{ value: "pass", fontSize: 10, fill: "#fbbf24" }} />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#fb7185", strokeWidth: 0 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Results table */}
          <Card className="overflow-x-auto">
            <h3 className="mb-4 text-xl font-extrabold">All Assessments</h3>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-100 text-slate-500">
                  <th scope="col" className="py-2 pr-4 font-bold">Date</th>
                  <th scope="col" className="py-2 pr-4 font-bold">Test</th>
                  <th scope="col" className="py-2 pr-4 font-bold">Subject</th>
                  <th scope="col" className="py-2 pr-4 font-bold">Marks</th>
                  <th scope="col" className="py-2 pr-4 font-bold">%</th>
                  <th scope="col" className="py-2 pr-4 font-bold">Grade</th>
                  <th scope="col" className="py-2 font-bold">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-sky-50/50">
                    <td className="py-3 pr-4 whitespace-nowrap">{formatDate(r.date)}</td>
                    <td className="py-3 pr-4 font-bold">{r.title}</td>
                    <td className="py-3 pr-4">{r.subject}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {r.marksObtained}/{r.maxMarks}
                    </td>
                    <td className="py-3 pr-4">{r.percentage}%</td>
                    <td className="py-3 pr-4">
                      <Badge tone={gradeTone(r.grade)}>{r.grade}</Badge>
                    </td>
                    <td className="py-3 text-slate-500">{r.remarks ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-slate-400">
              Terms: {[...new Set(results.map((r) => termLabel(r.term)))].join(" · ")}
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
