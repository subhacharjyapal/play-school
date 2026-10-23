import { useEffect, useState, type FormEvent } from "react";
import {
  fetchGalleryImages,
  type GalleryImage,
} from "../../api/gallery.api";
import { uploadGalleryImage, deleteGalleryImage } from "../../api/admin.api";
import { Card, Alert, Spinner } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/FormFields";
import { Modal } from "../../components/ui/Modal";
import { GALLERY_CATEGORIES, GALLERY_CATEGORY_LABELS } from "../../lib/constants";
import { apiErrorMessage, apiFieldErrors } from "../../api/client";

const MAX_MB = 5;

export default function AdminGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setImages(await fetchGalleryImages());
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onDelete(img: GalleryImage) {
    if (!window.confirm(`Delete "${img.title}" from the gallery?`)) return;
    setBusyId(img.id);
    try {
      await deleteGalleryImage(img.id);
      setImages((prev) => prev.filter((x) => x.id !== img.id));
      setMessage({ tone: "success", text: "Photo deleted." });
    } catch (err) {
      setMessage({ tone: "error", text: apiErrorMessage(err) });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold">Gallery ({images.length} photos)</h2>
        <Button onClick={() => setShowUpload(true)}>+ Upload Photo</Button>
      </div>

      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      {loading && <Spinner label="Loading gallery" />}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img) => (
          <Card key={img.id} className="overflow-hidden p-0">
            <img src={img.imageUrl} alt={img.title} loading="lazy" className="aspect-square w-full object-cover" />
            <div className="p-3">
              <p className="truncate text-sm font-bold">{img.title}</p>
              <p className="text-xs text-slate-500">
                {GALLERY_CATEGORY_LABELS[img.category]}
              </p>
              <Button
                size="sm"
                variant="danger"
                className="mt-2 w-full"
                loading={busyId === img.id}
                onClick={() => onDelete(img)}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={(img) => {
            setImages((prev) => [img, ...prev]);
            setShowUpload(false);
            setMessage({ tone: "success", text: "Photo uploaded ✔" });
          }}
        />
      )}
    </div>
  );
}

function UploadModal({
  onClose,
  onUploaded,
}: {
  onClose: () => void;
  onUploaded: (img: GalleryImage) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("EVENT");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError("");
    const local: Record<string, string> = {};
    if (!file) local.file = "Please choose an image file";
    else if (file.size > MAX_MB * 1024 * 1024) local.file = `Image must be smaller than ${MAX_MB} MB`;
    else if (!["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"].includes(file.type))
      local.file = "Only JPEG, PNG, WebP, GIF or SVG images are allowed";
    if (title.trim().length < 2) local.title = "Title is required";
    if (Object.keys(local).length > 0) {
      setErrors(local);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const img = await uploadGalleryImage(file!, title, category);
      onUploaded(img);
    } catch (err) {
      setSaving(false);
      const fieldErrs = apiFieldErrors(err);
      if (Object.keys(fieldErrs).length > 0) setErrors(fieldErrs);
      else setServerError(apiErrorMessage(err));
    }
  }

  return (
    <Modal open onClose={onClose} title="Upload Photo">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}
        <div>
          <label htmlFor="gallery-file" className="mb-1 block text-sm font-bold text-slate-700">
            Image file <span className="text-coral-500">*</span>
          </label>
          <input
            id="gallery-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            aria-describedby={errors.file ? "gallery-file-error" : undefined}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-sky-100 file:px-4 file:py-2 file:font-bold file:text-sky-800 hover:file:bg-sky-200"
          />
          {errors.file && (
            <p id="gallery-file-error" role="alert" className="mt-1 text-sm font-semibold text-red-600">
              {errors.file}
            </p>
          )}
        </div>
        <Input
          label="Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
        />
        <Select
          label="Category"
          options={GALLERY_CATEGORIES.map((c) => ({ value: c, label: GALLERY_CATEGORY_LABELS[c] }))}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <p className="text-xs text-slate-400">Max size: {MAX_MB} MB. JPG, PNG, WebP, GIF or SVG.</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Upload
          </Button>
        </div>
      </form>
    </Modal>
  );
}
