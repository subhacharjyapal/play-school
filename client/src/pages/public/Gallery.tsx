import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHero } from "../../components/layout/PageHero";
import { fetchGalleryImages, type GalleryImage } from "../../api/gallery.api";
import { GALLERY_CATEGORIES, GALLERY_CATEGORY_LABELS } from "../../lib/constants";
import { Spinner, EmptyState } from "../../components/ui/Card";
import { cn } from "../../lib/utils";

type Filter = "ALL" | GalleryImage["category"];

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchGalleryImages()
      .then((imgs) => !cancelled && setImages(imgs))
      .catch(() => undefined)
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => (filter === "ALL" ? images : images.filter((i) => i.category === filter)),
    [images, filter]
  );

  const openLightbox = useCallback(
    (index: number) => setLightboxIndex(index),
    []
  );
  const close = useCallback(() => setLightboxIndex(null), []);
  const goNext = useCallback(
    () => setLightboxIndex((i) => (i === null ? null : (i + 1) % filtered.length)),
    [filtered.length]
  );
  const goPrev = useCallback(
    () => setLightboxIndex((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length)),
    [filtered.length]
  );

  // Keyboard support for the lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, close, goNext, goPrev]);

  const current = lightboxIndex !== null ? filtered[lightboxIndex] : null;

  return (
    <>
      <PageHero
        emoji="🖼️"
        title="Gallery"
        subtitle="Sunny days, messy art tables and big smiles — peek into life at our school."
      />

      <section className="mx-auto max-w-6xl px-4 py-10">
        {/* Filters */}
        <div
          className="mb-8 flex flex-wrap justify-center gap-2"
          role="group"
          aria-label="Filter photos by category"
        >
          {(["ALL", ...GALLERY_CATEGORIES] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold transition-all",
                filter === f
                  ? "bg-brand-sky text-white shadow-md"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-sky-50"
              )}
            >
              {f === "ALL" ? "All Photos" : GALLERY_CATEGORY_LABELS[f]}
            </button>
          ))}
        </div>

        {loading ? (
          <Spinner label="Loading photos" />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No photos here yet"
            message="Photos for this category will appear soon. Check back later!"
            icon="📷"
          />
        ) : (
          /* CSS-columns masonry */
          <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
            {filtered.map((img, index) => (
              <button
                key={img.id}
                onClick={() => openLightbox(index)}
                className="group block w-full break-inside-avoid overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-slate-100 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
                aria-label={`Open photo: ${img.title}`}
              >
                <img
                  src={img.imageUrl}
                  alt={img.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full transition-transform duration-300 group-hover:scale-105"
                />
                <div className="flex items-center justify-between gap-2 p-3">
                  <span className="text-sm font-bold text-slate-700">{img.title}</span>
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-700">
                    {GALLERY_CATEGORY_LABELS[img.category]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox */}
      {current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo viewer: ${current.title}`}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <button
            onClick={close}
            aria-label="Close photo viewer"
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/30"
          >
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <button
            onClick={goPrev}
            aria-label="Previous photo"
            className="absolute left-2 z-10 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/30 sm:left-6"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <figure className="animate-pop-in mx-auto max-h-[85vh] max-w-4xl">
            <img
              src={current.imageUrl}
              alt={current.title}
              className="max-h-[75vh] w-auto rounded-2xl object-contain shadow-2xl"
            />
            <figcaption className="mt-3 text-center text-white">
              <span className="font-display text-xl font-bold">{current.title}</span>
              <span className="mt-1 block text-sm text-white/70">
                {GALLERY_CATEGORY_LABELS[current.category]} · {lightboxIndex! + 1} of {filtered.length}
              </span>
            </figcaption>
          </figure>

          <button
            onClick={goNext}
            aria-label="Next photo"
            className="absolute right-2 z-10 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/30 sm:right-6"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
