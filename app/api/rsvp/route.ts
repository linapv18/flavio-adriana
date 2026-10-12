import { weddingDatabaseUrl, databaseConfigured } from "@/lib/database.mjs";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { parseRsvp } from "@/lib/rsvp";
import { getInvitation, isInvitationToken } from "@/lib/invitations";

const reply = (data: object, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (!databaseConfigured()) return reply({ error: "RSVP no disponible: la plantilla no tiene una base de datos conectada." }, 503);
  try {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== request.headers.get("host")) return reply({ error: "Solicitud no permitida." }, 403);
  } catch { return reply({ error: "Solicitud no permitida." }, 403); }
  if (!request.headers.get("content-type")?.includes("application/json")) return reply({ error: "Formato no válido." }, 415);
  let raw;
  try {
    const body = await request.text();
    if (body.length > 16000) return reply({ error: "La respuesta es demasiado larga." }, 413);
    raw = JSON.parse(body);
  } catch { return reply({ error: "Formato no válido." }, 400); }
  if (!raw || raw.website || !isInvitationToken(raw.token)) return reply({ error: "Abre el enlace personal de tu invitación para confirmar." }, 403);
  try {
    const invitation = await getInvitation(raw.token);
    if (!invitation) return reply({ error: "Esta invitación no está disponible. Revisa tu enlace personal." }, 403);
    let input;
    try { input = parseRsvp(raw, invitation.seats); }
    catch (e) { return reply({ error: e instanceof Error ? e.message : "Revisa tus datos." }, 400); }
    const sql = neon(weddingDatabaseUrl());
    // Validate the current allocation again inside the write, ignoring all client identity fields.
    const rows = await sql`INSERT INTO invitation_responses (invitation_id, attending, party_size, dietary_requirements, message)
      SELECT id, ${input.attending}, ${input.partySize}, ${input.dietary}, ${input.message}
      FROM invitations WHERE id=${invitation.id} AND active=true AND seats >= ${input.partySize}
      ON CONFLICT (invitation_id) DO UPDATE SET attending=EXCLUDED.attending,
      party_size=EXCLUDED.party_size, dietary_requirements=EXCLUDED.dietary_requirements,
      message=EXCLUDED.message, updated_at=now() RETURNING invitation_id`;
    if (!rows.length) return reply({ error: "La invitación cambió. Recarga la página para confirmar tus cupos." }, 409);
    return reply({ success: true });
  } catch { return reply({ error: "No pudimos guardar tu respuesta. Intenta nuevamente en unos minutos." }, 503); }
}
