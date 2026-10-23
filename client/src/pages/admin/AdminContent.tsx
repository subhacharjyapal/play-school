import { useEffect, useState, type FormEvent } from "react";
import {
  fetchAnnouncements,
  type Announcement,
} from "../../api/public.api";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../api/admin.api";
import { Card, Alert, Spinner, Badge } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/FormFields";
import { Modal } from "../../components/ui/Modal";
import { formatDate } from "../../lib/utils";
import { apiErrorMessage, apiFieldErrors } from "../../api/client";

export default function AdminContent() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Announcement | "new" | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function load() {
    setLoading(true);
    try {
      setItems(await fetchAnnouncements());
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onDelete(item: Announcement) {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
      await deleteAnnouncement(item.id);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      setMessage({ tone: "success", text: "Announcement deleted." });
    } catch (err) {
      setMessage({ tone: "error", text: apiErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold">Announcements & Events</h2>
        <Button onClick={() => setEditing("new")}>+ New Announcement</Button>
      </div>

      <p className="text-sm text-slate-500">
        These appear on the home page ("News & Events" section).
      </p>

      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      {loading && <Spinner label="Loading announcements" />}

      {!loading && items.length === 0 && (
        <Card>
          <p className="text-slate-500">No announcements yet.</p>
        </Card>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold">
                  {item.title} <Badge tone="mint">Active</Badge>
                </h3>
                {item.eventDate && (
                  <p className="text-sm font-bold text-brand-coral">
                    📅 {formatDate(item.eventDate)}
                  </p>
                )}
                <p className="mt-1 max-w-2xl text-sm text-slate-600">{item.body}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(item)}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => onDelete(item)}>
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {editing && (
        <AnnouncementModal
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setMessage({ tone: "success", text: "Announcement saved ✔" });
            load();
          }}
        />
      )}
    </div>
  );
}

function AnnouncementModal({
  item,
  onClose,
  onSaved,
}: {
  item: Announcement | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: item?.title ?? "",
    body: item?.body ?? "",
    eventDate: item?.eventDate ? item.eventDate.slice(0, 10) : "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError("");
    const local: Record<string, string> = {};
    if (form.title.trim().length < 2) local.title = "Title is required";
    if (form.body.trim().length < 2) local.body = "Body is required";
    if (Object.keys(local).length > 0) {
      setErrors(local);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        body: form.body,
        eventDate: form.eventDate ? new Date(form.eventDate).toISOString() : null,
        isActive: true,
      };
      if (item) await updateAnnouncement(item.id, payload);
      else await createAnnouncement(payload);
      onSaved();
    } catch (err) {
      setSaving(false);
      const fieldErrs = apiFieldErrors(err);
      if (Object.keys(fieldErrs).length > 0) setErrors(fieldErrs);
      else setServerError(apiErrorMessage(err));
    }
  }

  return (
    <Modal open onClose={onClose} title={item ? "Edit Announcement" : "New Announcement"} wide>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}
        <Input
          label="Title"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          error={errors.title}
        />
        <Textarea
          label="Body"
          required
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          error={errors.body}
        />
        <Input
          label="Event date (optional)"
          type="date"
          value={form.eventDate}
          onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
