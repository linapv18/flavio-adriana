"use server";
import { weddingDatabaseUrl } from "@/lib/database.mjs";
import { neon } from "@neondatabase/serverless";
import { randomBytes, createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { matches, reportAuthorized, reportPassword, createReportSession, clearReportSession } from "@/lib/report-auth";
import { parseInvitationInput, isUuid, type InvitationInput } from "@/lib/invitation-input";

const maxFailures = 5;
const failure = () => new Promise(resolve => setTimeout(resolve, 1000));

export async function login(form: FormData) {
  const password = form.get("password");
  const expected = reportPassword();
  if (!expected) redirect("/organizacion?error=1");
  // Hosting platforms set these headers; only a hash of the address is stored.
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-real-ip") || requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const client = createHash("sha256").update(`report-login:${forwarded}`).digest("hex");
  let outcome: "ok" | "invalid" | "limited" | "unavailable";
  try {
    const sql = neon(weddingDatabaseUrl());
    const [{ failures }] = await sql`SELECT count(*)::int AS failures FROM report_login_failures
      WHERE client_hash=${client} AND attempted_at > now() - interval '15 minutes'`;
    if (failures >= maxFailures) outcome = "limited";
    else if (typeof password === "string" && matches(password.trim(), expected)) {
      await sql`DELETE FROM report_login_failures WHERE client_hash=${client} OR attempted_at < now() - interval '1 day'`;
      outcome = "ok";
    } else {
      await sql`INSERT INTO report_login_failures(client_hash) VALUES(${client})`;
      outcome = "invalid";
    }
  } catch { outcome = "unavailable"; }
  if (outcome === "ok") {
    await createReportSession();
    redirect("/organizacion");
  }
  if (outcome === "invalid") await failure();
  redirect(`/organizacion?error=${outcome === "invalid" ? "1" : outcome}`);
}
export async function logout() { await clearReportSession(); redirect("/organizacion"); }

export async function saveInvitation(raw: InvitationInput) {
  if (!(await reportAuthorized())) return { error: "Tu sesión venció. Vuelve a iniciar sesión." };
  const parsed = parseInvitationInput(raw);
  if ("error" in parsed) return { error: parsed.error };
  const input = parsed.value, { name, response } = input;
  try {
    const sql = neon(weddingDatabaseUrl());
    if (input.id && response === null) {
      // A missing response is the existing representation of a pending invitation.
      // Update the invitation and clear its response atomically.
      const updated = await sql`WITH edited AS (
        UPDATE invitations SET display_name=${name}, seats=${input.seats}
        WHERE id=${input.id} AND active=true RETURNING id
      ), cleared AS (
        DELETE FROM invitation_responses WHERE invitation_id IN (SELECT id FROM edited)
        RETURNING invitation_id
      ) SELECT id FROM edited`;
      if (!updated.length) return { error: "La invitación ya no está disponible." };
    } else if (input.id && response) {
      const updated = await sql`WITH edited AS (
        UPDATE invitations SET display_name=${name}, seats=${input.seats}
        WHERE id=${input.id} AND active=true RETURNING id
      ) INSERT INTO invitation_responses(invitation_id,attending,party_size)
        SELECT id,${response.attending},${response.partySize} FROM edited
        ON CONFLICT(invitation_id) DO UPDATE SET attending=EXCLUDED.attending,party_size=EXCLUDED.party_size,
        dietary_requirements=CASE WHEN EXCLUDED.attending THEN invitation_responses.dietary_requirements ELSE '' END,updated_at=now()
        RETURNING invitation_id`;
      if (!updated.length) return { error: "La invitación ya no está disponible." };
    } else if (input.id) {
      const updated = await sql`UPDATE invitations i SET display_name=${name}, seats=${input.seats}
        WHERE i.id=${input.id} AND i.active=true AND NOT EXISTS (
          SELECT 1 FROM invitation_responses r WHERE r.invitation_id=i.id AND r.party_size > ${input.seats}
        ) RETURNING id`;
      if (!updated.length) return { error: "No se pudo guardar: la invitación no está disponible o tiene más personas confirmadas que los cupos indicados." };
    } else {
      const hash = createHash("sha256").update(randomBytes(32)).digest("hex");
      // A retry with the same requestId (e.g. after a lost response) applies the latest name and seats.
      await sql`INSERT INTO invitations(id,source_key,display_name,seats,token_hash)
        VALUES(${input.requestId},${"panel-" + input.requestId},${name},${input.seats},${hash})
        ON CONFLICT(id) DO UPDATE SET display_name=EXCLUDED.display_name, seats=EXCLUDED.seats
        WHERE invitations.source_key=EXCLUDED.source_key AND invitations.active=true`;
    }
    revalidatePath("/organizacion");
    return { success: true };
  } catch { return { error: "No pudimos guardar la invitación. Intenta nuevamente." }; }
}

export async function removeInvitation(id: string) {
  if (!(await reportAuthorized())) return { error: "Tu sesión venció. Vuelve a iniciar sesión." };
  if (!isUuid(id)) return { error: "Solicitud inválida. Actualiza la página." };
  try {
    const sql = neon(weddingDatabaseUrl());
    // Keep historical responses, but revoke the invitation and exclude it from reports.
    const rows = await sql`UPDATE invitations SET active=false WHERE id=${id} AND active=true RETURNING id`;
    if (!rows.length) return { error: "La invitación ya no está disponible." };
    revalidatePath("/organizacion");
    return { success: true };
  } catch { return { error: "No pudimos borrar la invitación. Intenta de nuevo." }; }
}


export async function setInvitationSent(id: string, sent: boolean) {
  if (!(await reportAuthorized())) return { error: "Tu sesión venció. Vuelve a iniciar sesión." };
  if (!isUuid(id) || typeof sent !== "boolean") return { error: "Solicitud inválida. Actualiza la página." };
  try {
    const sql = neon(weddingDatabaseUrl());
    // Keep the first time it was sent; clearing it marks the invitation as pending again.
    const rows = await sql`UPDATE invitations SET sent_at = CASE WHEN ${sent} THEN coalesce(sent_at, now()) ELSE NULL END
      WHERE id=${id} AND active=true RETURNING id`;
    if (!rows.length) return { error: "La invitación ya no está disponible." };
    revalidatePath("/organizacion");
    return { success: true };
  } catch { return { error: "No pudimos guardar el cambio. Intenta de nuevo." }; }
}
