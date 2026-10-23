import type { ReactNode } from "react";

/** Colorful hero banner used at the top of interior pages. */
export function PageHero({
  title,
  subtitle,
  emoji = "🌟",
}: {
  title: string;
  subtitle?: string;
  emoji?: string;
}) {
  return (
    <section className="bg-gradient-to-r from-sky-100 via-amber-50 to-rose-100">
      <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:py-16">
        <span className="text-5xl animate-float" aria-hidden="true">{emoji}</span>
        <h1 className="mt-3 text-3xl font-extrabold text-brand-ink sm:text-5xl">{title}</h1>
        {subtitle && (
          <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 sm:text-lg">{subtitle}</p>
        )}
      </div>
    </section>
  );
}

export function Section({
  title,
  emoji,
  children,
  className = "",
  id,
}: {
  title?: string;
  emoji?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`mx-auto max-w-6xl px-4 py-12 sm:py-16 ${className}`}>
      {title && (
        <h2 className="mb-8 text-center text-3xl font-extrabold text-brand-ink sm:text-4xl">
          {emoji && <span aria-hidden="true">{emoji} </span>}
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
