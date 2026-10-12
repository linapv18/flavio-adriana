import { weddingDatabaseUrl, databaseConfigured } from "@/lib/database.mjs";
import { neon } from "@neondatabase/serverless";

import { isInvitationToken } from "./invitation-token";
export { isInvitationToken } from "./invitation-token";
import { tokenLookup } from "@/lib/invitation-links.mjs";

export type Invitation = {
  id: string;
  name: string;
  seats: number;
  guestNames: string[];
  response: null | { attending: boolean; partySize: number; attendance: boolean[] | null; dietary: string; message: string };
};

export async function getInvitation(token: string): Promise<Invitation | null> {
  if (!isInvitationToken(token)) return null;
  if (!databaseConfigured()) return null;
  const sql = neon(weddingDatabaseUrl());
  const { short, lookup } = tokenLookup(token);
  const rows = await sql`SELECT i.id, i.display_name, i.seats, i.guest_names, r.attending, r.party_size, r.attendance,
    r.dietary_requirements, r.message FROM invitations i
    LEFT JOIN invitation_responses r ON r.invitation_id=i.id
    WHERE (CASE WHEN ${short} THEN left(i.token_hash, 24) ELSE i.token_hash END)=${lookup} AND i.active=true LIMIT 2`;
  if (rows.length !== 1) return null;
  const [row] = rows;
  if (!row) return null;
  return { id: row.id, name: row.display_name, seats: row.seats, guestNames: row.guest_names ?? [],
    response: row.attending === null ? null : { attending: row.attending, partySize: row.party_size, attendance: row.attendance, dietary: row.dietary_requirements, message: row.message } };
}
