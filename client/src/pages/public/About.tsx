import { useEffect, useState } from "react";
import { PageHero, Section } from "../../components/layout/PageHero";
import { PROGRAM_INFO, SCHOOL } from "../../lib/constants";
import { fetchStaff, type StaffProfile } from "../../api/site.api";

const facilities = [
  { emoji: "🏠", title: "Bright Classrooms", text: "Airy, pastel rooms with learning corners for reading, art and blocks." },
  { emoji: "🌳", title: "Safe Play Yard", text: "Soft-floored outdoor area with slides, sandpit and a tiny garden." },
  { emoji: "📚", title: "Story Nook", text: "A cozy library corner with 800+ picture books in English and Hindi." },
  { emoji: "🍽️", title: "Nut-Free Kitchen", text: "Fresh meals cooked daily in a hygiene-audited on-site kitchen." },
  { emoji: "🏥", title: "Medical Room", text: "First-aid trained staff and a tie-up clinic five minutes away." },
  { emoji: "🚌", title: "Safe Transport", text: "GPS-tracked buses with lady attendants on every route." },
];

const routine = [
  { time: "8:00 AM", label: "Warm Welcome", detail: "Gentle arrival, free play and breakfast." },
  { time: "9:00 AM", label: "Circle Time", detail: "Good morning song, weather chart and sharing." },
  { time: "9:30 AM", label: "Learning Fun", detail: "Phonics, numbers, art or sensory activities." },
  { time: "11:00 AM", label: "Outdoor Play", detail: "Slides, races, gardening and water play." },
  { time: "12:30 PM", label: "Lunch & Rest", detail: "Healthy lunch followed by a nap or quiet time." },
  { time: "2:30 PM", label: "Activity Hour", detail: "Music, dance, storytelling or puppet shows." },
  { time: "3:45 PM", label: "Goodbye Circle", detail: "Recap of the day and happy goodbyes." },
];

export default function About() {
  const [staff, setStaff] = useState<StaffProfile[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchStaff()
      .then((s) => !cancelled && setStaff(s))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageHero
        emoji="🏫"
        title="About Our School"
        subtitle={`A home away from home for little ones in ${SCHOOL.city} since 2015.`}
      />

      {/* Story */}
      <Section title="Our Story" emoji="📖">
        <div className="mx-auto max-w-3xl text-center text-lg leading-relaxed text-slate-600">
          <p>
            {SCHOOL.name} began in 2015 in a cozy living room with six children, two teachers and
            one big idea: <strong className="text-brand-ink">childhood should feel like childhood.</strong>
          </p>
          <p className="mt-4">
            A decade later, we are a proud community of 200+ families — still small enough that
            every teacher knows every child by name, and every parent has the principal's phone
            number. We grow together, one giggle at a time.
          </p>
        </div>
      </Section>

      {/* Mission & Vision */}
      <Section className="bg-sky-50/60">
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-sky-100">
            <h2 className="text-2xl font-extrabold text-brand-sky">🎯 Our Mission</h2>
            <p className="mt-3 text-slate-600">
              To nurture curious, confident and kind human beings through play-based learning,
              warm relationships and a safe environment where every child feels seen and valued.
            </p>
          </article>
          <article className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-rose-100">
            <h2 className="text-2xl font-extrabold text-brand-coral">🔭 Our Vision</h2>
            <p className="mt-3 text-slate-600">
              To be the neighborhood's most trusted first school — where academic readiness grows
              side by side with emotional wellbeing, creativity and a lifelong love of learning.
            </p>
          </article>
        </div>
      </Section>

      {/* Philosophy */}
      <Section title="Our Teaching Philosophy" emoji="💡">
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
          {[
            ["Children learn through play", "Every game, song and block tower is a lesson in disguise."],
            ["Every child is unique", "We follow each child's pace — no comparisons, no pressure."],
            ["Feelings come first", "Emotional safety builds the confidence needed for academics."],
            ["Families are partners", "Daily updates, parent meetups and an open-door policy."],
          ].map(([title, text]) => (
            <div key={title} className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <span className="text-3xl" aria-hidden="true">🧸</span>
              <div>
                <h3 className="font-bold text-brand-ink">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Programs */}
      <Section title="Age Groups & Programs" emoji="🎈" className="bg-amber-50/50">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PROGRAM_INFO.map((p, i) => {
            const tones = ["bg-sky-100", "bg-amber-100", "bg-rose-100", "bg-emerald-100"];
            const emojis = ["🐥", "🦋", "🌞", "🚀"];
            return (
              <article key={p.program} className={`rounded-3xl p-6 ${tones[i]}`}>
                <div className="text-4xl" aria-hidden="true">{emojis[i]}</div>
                <h3 className="mt-2 text-xl font-extrabold">{p.program}</h3>
                <p className="text-sm font-bold text-slate-600">{p.ages}</p>
                <p className="mt-2 text-sm text-slate-700">{p.blurb}</p>
              </article>
            );
          })}
        </div>
      </Section>

      {/* Facilities */}
      <Section title="Our Facilities" emoji="🏡">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((f) => (
            <div key={f.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <span className="text-3xl" aria-hidden="true">{f.emoji}</span>
              <h3 className="mt-2 font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Daily routine */}
      <Section title="A Day at Little Stars" emoji="⏰" className="bg-rose-50/50">
        <ol className="mx-auto max-w-3xl space-y-3">
          {routine.map((r) => (
            <li key={r.time} className="flex items-start gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-rose-100">
              <span className="w-24 shrink-0 rounded-full bg-brand-coral-soft px-3 py-1 text-center text-sm font-extrabold text-rose-800">
                {r.time}
              </span>
              <div>
                <h3 className="font-bold">{r.label}</h3>
                <p className="text-sm text-slate-600">{r.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* Staff */}
      <Section title="Meet Our Teachers" emoji="👩‍🏫">
        {staff.length === 0 ? (
          <p className="text-center text-slate-500">Loading staff profiles…</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {staff.map((s) => (
              <article key={s.id} className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
                {s.photoUrl ? (
                  <img
                    src={s.photoUrl}
                    alt={`Portrait of ${s.fullName}`}
                    loading="lazy"
                    className="mx-auto h-32 w-32 rounded-full object-cover ring-4 ring-brand-sun-soft"
                  />
                ) : (
                  <div
                    className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-sky-100 text-4xl"
                    aria-hidden="true"
                  >
                    👩‍🏫
                  </div>
                )}
                <h3 className="mt-4 text-xl font-extrabold">{s.fullName}</h3>
                {s.qualification && <p className="text-sm font-bold text-brand-sky">{s.qualification}</p>}
                {s.classrooms.length > 0 && (
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Teaches: {s.classrooms.map((c) => c.name).join(", ")}
                  </p>
                )}
                {s.bio && <p className="mt-3 text-sm text-slate-600">{s.bio}</p>}
              </article>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
