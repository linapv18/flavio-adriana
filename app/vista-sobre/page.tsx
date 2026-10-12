import type { Metadata } from "next";
import ModernaInvitation from "@/components/moderna/ModernaInvitation";
import { weddingConfig as w } from "@/config/weddingConfig";
export const metadata: Metadata = { title: "Vista previa de la invitación", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
// Preview a guest's invitation without a database:
// /vista-sobre?nombre=Familia%20Pérez&invitados=Ana%20Pérez,Juan%20Pérez  (or &cupos=4 without names)
export default async function Preview({ searchParams }: { searchParams: Promise<{ nombre?: string; cupos?: string; invitados?: string }> }) {
  const { nombre, cupos, invitados } = await searchParams;
  const name = (nombre ?? w.invitation.previewGuest).trim().slice(0, 200) || w.invitation.previewGuest;
  const guestNames = (invitados ?? "").split(",").map(g => g.trim().slice(0, 120)).filter(Boolean).slice(0, 20);
  const seats = guestNames.length || Math.min(20, Math.max(1, Number.parseInt(cupos ?? "", 10) || 2));
  return <ModernaInvitation invitation={{ id: "vista-previa", name, seats, guestNames, response: null }} preview />;
}
