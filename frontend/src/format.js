export const DAYS = { ma: "maandag", di: "dinsdag", wo: "woensdag", do: "donderdag", vr: "vrijdag", za: "zaterdag", zo: "zondag" };
const MONTHS = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

const EUR = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
export const eur = (n) => (n == null || isNaN(n) ? "" : EUR.format(Number(n))); // keeps the no-break space after €
export const cap = (t) => (t ? t[0].toUpperCase() + t.slice(1) : "");
export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
export const dayName = (d) => DAYS[d] || d;

export const isoDay = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const addDays = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  return isoDay(new Date(y, m - 1, d + n));
};
export const dayNum = (iso) => Number(/^\d{4}-\d{2}-(\d{2})/.exec(iso || "")?.[1]) || "";

/** "za 5 dec 13:00" from an ISO timestamp, falling back to the plan's own text. */
export function when(iso, text) {
  const d = iso ? new Date(iso) : null;
  if (!d || isNaN(d)) return text || "";
  const wd = ["zo", "ma", "di", "wo", "do", "vr", "za"][d.getDay()];
  return `${wd} ${d.getDate()} ${MONTHS[d.getMonth()]} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export const mmss = (sec) => `${Math.floor(sec / 60)}:${String(Math.max(0, sec) % 60).padStart(2, "0")}`;

export const IMG = (id) => `https://storefront-prod.nl.picnicinternational.com/static/images/${encodeURIComponent(id)}/small.png`;

// Photo of a dish: recipe.image_url (e.g. a Picnic recipe) or recipe.image_id (Picnic image).
export const DISH = (r) => {
  if (r?.image_url && /^https:\/\//.test(r.image_url)) {
    // Picnic recipe photos exist as 600x600.png, not as large.png/medium.png
    return r.image_url.replace(/(\/static\/images\/recipes\/[^/]+\/)(?:small|medium|large|extra-large)\.png$/, "$1600x600.png");
  }
  if (r?.image_id) return `https://storefront-prod.nl.picnicinternational.com/static/images/${encodeURIComponent(r.image_id)}/large.png`;
  return null;
};

export const timerFromText = (s) => {
  if (s?.timer_sec) return Number(s.timer_sec);
  const m = String(s?.text || "").match(/(\d+)\s*(?:-|–|tot)?\s*(\d+)?\s*(min|minuten|minuut)\b/i);
  return m ? Number(m[2] || m[1]) * 60 : null;
};
