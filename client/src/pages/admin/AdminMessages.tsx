import { useEffect, useState } from "react";
import { fetchContactMessages, type ContactMessageRow } from "../../api/admin.api";
import { Card, Alert, Spinner, EmptyState, Badge } from "../../components/ui/Card";
import { formatDate } from "../../lib/utils";
import { apiErrorMessage } from "../../api/client";

export default function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchContactMessages()
      .then(setMessages)
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading messages" />;
  if (error) return <Alert tone="error">{error}</Alert>;

  if (messages.length === 0) {
    return (
      <EmptyState
        title="No messages yet"
        message="Messages submitted through the contact form will appear here."
        icon="💌"
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-extrabold">Contact Messages ({messages.length})</h2>
      {messages.map((m) => (
        <Card key={m.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold">
                {m.name}{" "}
                <Badge tone={m.isRead ? "slate" : "sun"}>{m.isRead ? "Read" : "New"}</Badge>
              </h3>
              <p className="text-sm text-slate-500">
                {m.email}
                {m.phone ? ` · ${m.phone}` : ""} · {formatDate(m.createdAt)}
              </p>
            </div>
            <a
              className="rounded-full bg-sky-100 px-4 py-1.5 text-sm font-bold text-sky-800 hover:bg-sky-200"
              href={`mailto:${m.email}?subject=Re: your message to Little Stars Play School`}
            >
              Reply by email
            </a>
          </div>
          <p className="mt-3 whitespace-pre-line rounded-2xl bg-slate-50 p-4 text-slate-700">
            {m.message}
          </p>
        </Card>
      ))}
    </div>
  );
}
