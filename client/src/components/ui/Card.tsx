import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100", className)}>
      {children}
    </div>
  );
}

type BadgeTone = "sky" | "sun" | "coral" | "mint" | "lavender" | "slate";

const badgeTones: Record<BadgeTone, string> = {
  sky: "bg-sky-100 text-sky-800",
  sun: "bg-amber-100 text-amber-800",
  coral: "bg-rose-100 text-rose-800",
  mint: "bg-emerald-100 text-emerald-800",
  lavender: "bg-violet-100 text-violet-800",
  slate: "bg-slate-100 text-slate-700",
};

export function Badge({
  children,
  tone = "sky",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold",
        badgeTones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "error";
  children: ReactNode;
}) {
  const tones = {
    info: "bg-sky-50 text-sky-900 ring-sky-200",
    success: "bg-emerald-50 text-emerald-900 ring-emerald-200",
    error: "bg-rose-50 text-rose-900 ring-rose-200",
  } as const;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-2xl px-4 py-3 font-semibold ring-1", tones[tone])}
    >
      {children}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-slate-500">
      <span
        className="inline-block h-6 w-6 animate-spin rounded-full border-[3px] border-sky-200 border-t-brand-sky"
        aria-hidden="true"
      />
      <span className="font-bold">{label}…</span>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  icon = "🌟",
}: {
  title: string;
  message: string;
  icon?: string;
}) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 px-6 py-12 text-center">
      <div className="text-5xl" aria-hidden="true">
        {icon}
      </div>
      <h3 className="mt-3 text-xl font-bold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-slate-500">{message}</p>
    </div>
  );
}
