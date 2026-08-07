// TripHub shared helpers — pure functions used across pages and components.

export function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 140);
}

// Format a number as Uzbek som with thin-space thousands separators.
export function formatPrice(value) {
  const n = Math.round(Number(value) || 0);
  return n.toLocaleString("en-US").replace(/,/g, " ") + " so'm";
}

export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateRange(start, end) {
  const s = formatDate(start);
  if (!end) return s;
  const e = formatDate(end);
  if (s === e) return s;
  return `${s} – ${e}`;
}

export function timeUntil(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = d - now;
  const days = Math.round(diff / 86400000);
  if (days < 0) return "Departed";
  if (days === 0) return "Departs today";
  if (days === 1) return "Departs tomorrow";
  return `Departs in ${days} days`;
}

// Average rating helper from a list of review objects.
export function averageRating(reviews) {
  if (!reviews || !reviews.length) return 0;
  const sum = reviews.reduce((s, r) => s + (r.rating || 0), 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

// Build a query string from a filter object, dropping empty values.
export function toQuery(filters) {
  const q = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) q.append(k, v);
  });
  return q.toString();
}

export function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}