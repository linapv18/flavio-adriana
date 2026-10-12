export type RsvpInput = { attending: boolean; partySize: number; dietary: string; message: string };

export function parseRsvp(value: unknown, seats: number): RsvpInput {
  if (!value || typeof value !== "object") throw new Error("Revisa los datos del formulario.");
  const v = value as Record<string, unknown>;
  if (typeof v.attending !== "boolean") throw new Error("Indica si podrás asistir.");
  if (!Number.isInteger(v.partySize) || typeof v.partySize !== "number" || v.partySize < 0 || v.partySize > seats || (v.attending ? v.partySize < 1 : v.partySize !== 0)) {
    throw new Error(`Esta invitación tiene ${seats} ${seats === 1 ? "cupo" : "cupos"}. Revisa la cantidad de asistentes.`);
  }
  const text = (key: string, max: number) => {
    if (typeof v[key] !== "string" || v[key].length > max) throw new Error("Revisa la longitud de tus respuestas.");
    return v[key].trim();
  };
  const dietary = text("dietary", 1000);
  return { attending: v.attending, partySize: v.partySize, dietary: v.attending ? dietary : "", message: text("message", 2000) };
}
