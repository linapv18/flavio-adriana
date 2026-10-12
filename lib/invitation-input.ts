export type InvitationInput = { id?: string; name: string; seats: number; requestId: string; response?: { attending: boolean; partySize: number } | null };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: unknown): value is string => typeof value === "string" && uuid.test(value);

// Server actions receive untrusted values, so every field is checked at runtime.
export function parseInvitationInput(input: InvitationInput): { error: string } | { value: InvitationInput } {
  if (!input || typeof input !== "object") return { error: "Solicitud inválida. Actualiza la página." };
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name || name.length > 200) return { error: "Escribe un nombre de hasta 200 caracteres." };
  if (!Number.isInteger(input.seats) || input.seats < 1 || input.seats > 20) return { error: "Los cupos deben ser un número entero entre 1 y 20." };
  if (!isUuid(input.requestId) || (input.id !== undefined && !isUuid(input.id))) return { error: "Solicitud inválida. Actualiza la página." };
  const response = input.response;
  if (response !== undefined && response !== null && (typeof response !== "object" || typeof response.attending !== "boolean" || !Number.isInteger(response.partySize) || (response.attending ? response.partySize < 1 || response.partySize > input.seats : response.partySize !== 0))) {
    return { error: "La cantidad confirmada debe estar entre 1 y los cupos asignados." };
  }
  return { value: { id: input.id, name, seats: input.seats, requestId: input.requestId, response: response && { attending: response.attending, partySize: response.partySize } } };
}
