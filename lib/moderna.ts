import { weddingConfig as w } from "@/config/weddingConfig";

export type ChapterId = "portada" | "cuenta-atras" | "el-dia" | "confirmacion" | "historia" | "viaje" | "preguntas";
// The travel chapter shows lodging and the city guide for guests coming from out of town.
export const hasTravel = w.pages.travel && (w.hotel.enabled || w.tourism.enabled);
export const CHAPTERS: { id: ChapterId; name: string }[] = [
  { id: "portada", name: "Portada" },
  { id: "cuenta-atras", name: "Cuenta atrás" },
  { id: "el-dia", name: "El día" },
  { id: "confirmacion", name: "Confirmación" },
  ...(w.pages.story ? [{ id: "historia" as const, name: "Historia" }] : []),
  ...(w.pages.faqs ? [{ id: "preguntas" as const, name: "Preguntas" }] : []),
  ...(hasTravel ? [{ id: "viaje" as const, name: "Viaje" }] : []),
];

export const weddingTime = w.date.iso ? Date.parse(w.date.iso) : NaN;
const dateParts = (options: Intl.DateTimeFormatOptions) => Number.isFinite(weddingTime)
  ? Object.fromEntries(new Intl.DateTimeFormat(w.site.locale, { timeZone: w.site.timeZone, ...options }).formatToParts(weddingTime).map(p => [p.type, p.value]))
  : null;
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// "12.06.2027", "Sábado · 12 de junio · 2027", and the El día heading pieces.
export const shortDate = (() => { const p = dateParts({ day: "2-digit", month: "2-digit", year: "numeric" }); return p ? `${p.day}.${p.month}.${p.year}` : ""; })();
const long = dateParts({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
export const longDate = long ? `${capitalize(long.weekday)} · ${long.day} de ${long.month} · ${long.year}` : w.date.label;
export const dayHeading = long ? { first: `${capitalize(long.weekday)},`, second: `${long.day} de ${long.month}` } : { first: w.date.label, second: "" };

export const monogram = (() => { const [a = "", b = ""] = w.couple.initials.split("&").map(s => s.trim()); return { a, b }; })();

// Splits an addressee across the envelope's seam: "Para Familia" | "Rodríguez".
export function seamName(name: string | undefined) {
  const words = `Para ${name ?? "nuestros seres queridos"}`.trim().split(/\s+/);
  const cut = Math.ceil(words.length / 2);
  return [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
}

// Each seat shows its guest's name; invitations saved before names existed fall back to "Persona N".
export const seatLabels = (name: string, seats: number, guestNames: string[] = []) =>
  Array.from({ length: seats }, (_, i) => guestNames[i] || (seats === 1 ? name : `Persona ${i + 1}`));
// Per-person answers; older responses only stored a count, so the first N seats count as attending.
export const seatAnswers = (seats: number, response: { attending: boolean; partySize: number; attendance?: boolean[] | null } | null) =>
  Array.from({ length: seats }, (_, i) => !response ? null
    : response.attendance?.length === seats ? response.attendance[i]
    : response.attending && i < response.partySize);

export function countdown(now: number | null) {
  if (now === null || !Number.isFinite(weddingTime)) return null;
  const diff = Math.max(0, weddingTime - now);
  const p2 = (n: number) => String(n).padStart(2, "0");
  return { done: diff === 0, d: Math.floor(diff / 864e5), h: p2(Math.floor(diff / 36e5) % 24), m: p2(Math.floor(diff / 6e4) % 60), s: p2(Math.floor(diff / 1e3) % 60) };
}
