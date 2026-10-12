// `response` is who attends, one answer per seat (aligned with `guestNames`); null clears the response.
export type InvitationInput = { id?: string; name: string; seats: number; requestId: string; guestNames: string[]; response?: { attendance: boolean[] } | null };
export type ParsedInvitation = Omit<InvitationInput, "response"> & { response?: { attending: boolean; partySize: number; attendance: boolean[] } | null };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: unknown): value is string => typeof value === "string" && uuid.test(value);
export const MAX_GUEST_NAME = 120;

// Server actions receive untrusted values, so every field is checked at runtime.
export function parseInvitationInput(input: InvitationInput): { error: string } | { value: ParsedInvitation } {
  if (!input || typeof input !== "object") return { error: "Solicitud inválida. Actualiza la página." };
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name || name.length > 200) return { error: "Escribe un nombre de hasta 200 caracteres." };
  if (!Number.isInteger(input.seats) || input.seats < 1 || input.seats > 20) return { error: "Los cupos deben ser un número entero entre 1 y 20." };
  if (!isUuid(input.requestId) || (input.id !== undefined && !isUuid(input.id))) return { error: "Solicitud inválida. Actualiza la página." };
  // One name per seat; an empty list is only for invitations saved before names existed.
  if (!Array.isArray(input.guestNames) || (input.guestNames.length !== input.seats && input.guestNames.length !== 0) || input.guestNames.some(g => typeof g !== "string")) return { error: "Escribe el nombre de cada invitado." };
  const guestNames = input.guestNames.map(g => g.trim());
  if (guestNames.some(g => !g || g.length > MAX_GUEST_NAME)) return { error: `Escribe el nombre de cada invitado (hasta ${MAX_GUEST_NAME} caracteres).` };
  const response = input.response;
  if (response !== undefined && response !== null) {
    const attendance = typeof response === "object" ? response.attendance : undefined;
    if (!Array.isArray(attendance) || attendance.length !== input.seats || attendance.some(a => typeof a !== "boolean")) return { error: "Indica si cada invitado asistirá." };
    const partySize = attendance.filter(Boolean).length;
    return { value: { id: input.id, name, seats: input.seats, requestId: input.requestId, guestNames, response: { attending: partySize > 0, partySize, attendance: [...attendance] } } };
  }
  return { value: { id: input.id, name, seats: input.seats, requestId: input.requestId, guestNames, response } };
}
