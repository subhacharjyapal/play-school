/** Merge conditional class names; filters falsy values. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function ageFromDob(dob: string | Date): string {
  const d = typeof dob === "string" ? new Date(dob) : dob;
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  let months = now.getMonth() - d.getMonth();
  if (now.getDate() < d.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years <= 0) return `${months} months`;
  return `${years}y ${months}m`;
}

/** Extract field errors from a server 400 response. */
export function serverFieldErrors(details: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (Array.isArray(details)) {
    for (const d of details) {
      if (d && typeof d === "object" && "field" in d && "message" in d) {
        const field = String((d as { field: unknown }).field);
        if (!out[field]) out[field] = String((d as { message: unknown }).message);
      }
    }
  }
  return out;
}
