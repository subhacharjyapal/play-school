import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Section } from "../../components/layout/PageHero";
import { SCHOOL } from "../../lib/constants";
import { fetchAnnouncements, type Announcement } from "../../api/public.api";

const highlights = [
  {
    emoji: "🛡️",
    title: "Safe & Caring",
    text: "CCTV-monitored rooms, secure entry and a nurturing ratio of 1 teacher per 8 children.",
    tone: "bg-sky-50 ring-sky-200",
  },
  {
    emoji: "🎓",
    title: "Qualified Teachers",
    text: "Montessori-certified educators with years of experience in early childhood development.",
    tone: "bg-amber-50 ring-amber-200",
  },
  {
    emoji: "🎨",
    title: "Play-Based Learning",
    text: "Phonics, art, music, sand-play and outdoor discovery — learning that feels like fun.",
    tone: "bg-rose-50 ring-rose-200",
  },
  {
    emoji: "🍎",
    title: "Healthy Meals",
    text: "Fresh, nut-free, home-style snacks and lunches prepared on-site daily.",
    tone: "bg-emerald-50 ring-emerald-200",
  },
];

const testimonials = [
  {
    quote:
      "My daughter ran into class every single morning. The teachers truly love each child — she came home singing new songs and counting everything in sight!",
    name: "Sunita R.",
    role: "Mom of Kavya (LKG)",
    tone: "bg-sky-100",
  },
  {
    quote:
      "The progress reports are so detailed. We could see exactly where our son was improving each term. The parent portal is a lovely touch.",
    name: "Amit P.",
    role: "Dad of Aarav & Diya",
    tone: "bg-amber-100",
  },
  {
    quote:
      "Warm, patient and incredibly organized. They handled our twins' separation anxiety with so much care. Highly recommended to every parent in Austin.",
    name: "James C.",
    role: "Dad of Ethan & Lily",
    tone: "bg-rose-100",
  },
];

export default function Home() {
  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-amber-50">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-brand-sky-soft opacity-60 blur-2xl" aria-hidden="true" />
        <div className="pointer-events-none absolute top-20 -right-20 h-72 w-72 rounded-full bg-brand-coral-soft opacity-50 blur-2xl" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-brand-sun-soft opacity-50 blur-2xl" aria-hidden="true" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-24 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <p className="font-bold text-brand-sky">Welcome to {SCHOOL.name} 🎉</p>
            <h1 className="mt-2 text-4xl leading-tight font-extrabold text-brand-ink sm:text-5xl lg:text-6xl">
              Where little minds <span className="text-brand-coral">bloom</span> with{" "}
              <span className="text-brand-sun">joy</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600 lg:mx-0">
              A cheerful, safe and play-based preschool in {SCHOOL.city} for children aged
              1.5 – 5.5 years. Playgroup, Nursery, LKG & UKG admissions open!
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link to="/admissions">
                <Button size="lg">Register Now ✨</Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">Parent Login 🔑</Button>
              </Link>
            </div>
          </div>

          {/* CSS illustration */}
          <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
            <svg viewBox="0 0 400 320" className="w-full drop-shadow-xl" role="presentation">
              {/* school house */}
              <rect x="80" y="140" width="240" height="150" rx="18" fill="#bae6fd" />
              <rect x="80" y="140" width="240" height="150" rx="18" fill="none" stroke="#7dd3fc" strokeWidth="4" />
              <path d="M60 150 L200 60 L340 150 Z" fill="#fb7185" />
              <rect x="175" y="210" width="50" height="80" rx="8" fill="#fbbf24" />
              <rect x="105" y="170" width="45" height="45" rx="8" fill="#fff" stroke="#7dd3fc" strokeWidth="3" />
              <rect x="250" y="170" width="45" height="45" rx="8" fill="#fff" stroke="#7dd3fc" strokeWidth="3" />
              <circle cx="200" cy="115" r="18" fill="#fde68a" />
              <text x="200" y="122" textAnchor="middle" fontSize="20">⭐</text>
              {/* ground */}
              <rect x="20" y="288" width="360" height="14" rx="7" fill="#a7f3d0" />
              {/* balloons */}
              <circle cx="330" cy="70" r="22" fill="#fca5a5" />
              <path d="M330 92 Q326 110 330 130" stroke="#94a3b8" strokeWidth="2" fill="none" />
              <circle cx="60" cy="90" r="18" fill="#a78bfa" />
              <path d="M60 108 Q56 124 60 140" stroke="#94a3b8" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>
      </section>

      {/* ---------- Highlights ---------- */}
      <Section title="Why Parents Love Us" emoji="💛">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h) => (
            <article
              key={h.title}
              className={`rounded-3xl p-6 text-center ring-1 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg ${h.tone}`}
            >
              <div className="text-5xl" aria-hidden="true">{h.emoji}</div>
              <h3 className="mt-3 text-xl font-bold">{h.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{h.text}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* ---------- Announcements ---------- */}
      <AnnouncementsSection />

      {/* ---------- Testimonials ---------- */}
      <Section title="Happy Parents" emoji="🥰">
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className={`rounded-3xl p-6 ring-1 ring-white/60 ${t.tone}`}>
              <blockquote className="text-slate-700">
                <span className="text-3xl" aria-hidden="true">“</span>
                <p className="inline">{t.quote}</p>
              </blockquote>
              <figcaption className="mt-4 font-bold text-slate-800">
                {t.name}
                <span className="block text-sm font-semibold text-slate-500">{t.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* ---------- Gallery preview ---------- */}
      <GalleryPreview />

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="rounded-[2.5rem] bg-gradient-to-r from-brand-sky to-brand-lavender px-6 py-12 text-center text-white shadow-xl">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Ready to join our happy family?</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/90">
            Book a campus tour or apply online — seats for the new session fill up quickly!
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/admissions">
              <Button size="lg" className="bg-white text-brand-sky hover:bg-sky-50">
                Register Now
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/20">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function AnnouncementsSection() {
  return <AnnouncementsLazy />;
}

function AnnouncementsLazy() {
  const [items, setItems] = useState<Announcement[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchAnnouncements()
      .then((a) => !cancelled && setItems(a.slice(0, 3)))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  if (items.length === 0) return null;
  return (
    <Section title="News & Events" emoji="📣" className="bg-amber-50/50">
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((a) => (
          <article key={a.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-amber-100">
            <h3 className="text-lg font-bold text-brand-ink">{a.title}</h3>
            {a.eventDate && (
              <p className="mt-1 text-sm font-bold text-brand-coral">
                📅 {new Date(a.eventDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
            <p className="mt-2 text-sm text-slate-600">{a.body}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

function GalleryPreview() {
  const [images, setImages] = useState<Array<{ id: string; title: string; imageUrl: string }>>([]);
  useEffect(() => {
    let cancelled = false;
    import("../../api/gallery.api")
      .then(({ fetchGalleryImages }) => fetchGalleryImages())
      .then((imgs) => !cancelled && setImages(imgs.slice(0, 6)))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (images.length === 0) return null;

  return (
    <Section title="Peek Inside Our World" emoji="📸">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((img) => (
          <div key={img.id} className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-100">
            <img
              src={img.imageUrl}
              alt={img.title}
              loading="lazy"
              className="aspect-square w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link to="/gallery">
          <Button variant="secondary">View Full Gallery 🖼️</Button>
        </Link>
      </div>
    </Section>
  );
}
