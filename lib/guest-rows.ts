export type GuestRow = { id: string; invitationUrl: string; name: string; seats: number; attending: boolean | null; partySize: number | null; dietary: string | null; message: string | null; updated: string | null; sent: boolean; guestNames: string[]; attendance: boolean[] | null };

export const guestStatus = (row: Pick<GuestRow, "attending">) => row.attending === null ? "Sin respuesta" : row.attending ? "Asistirán" : "No asistirán";

// Replacer functions keep "$" sequences in names or URLs literal.
export const invitationMessage = (template: string, row: Pick<GuestRow, "name" | "invitationUrl">, couple: string) => {
  const firstName = row.name.trim().split(/\s+/)[0];
  return template.replace("{firstName}", () => firstName).replace("{url}", () => row.invitationUrl).replace("{couple}", () => couple);
};

export const summarize = (rows: GuestRow[]) => ({
  confirmed: rows.reduce((n, r) => n + (r.attending ? r.partySize || 0 : 0), 0),
  attending: rows.filter(r => r.attending === true).length,
  declined: rows.filter(r => r.attending === false).length,
  pending: rows.filter(r => r.attending === null).length,
  seats: rows.reduce((n, r) => n + r.seats, 0),
});
