import type { Metadata } from "next";
import ModernaInvitation from "@/components/moderna/ModernaInvitation";
import { weddingConfig as w } from "@/config/weddingConfig";
export const metadata: Metadata = { title: "Vista previa de la invitación", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
// Preview a guest's invitation without a database: /vista-sobre?nombre=Familia%20Pérez&cupos=4
export default async function Preview({ searchParams }: { searchParams: Promise<{ nombre?: string; cupos?: string }> }) {
  const { nombre, cupos } = await searchParams;
  const name = (nombre ?? w.invitation.previewGuest).trim().slice(0, 200) || w.invitation.previewGuest;
  const seats = Math.min(20, Math.max(1, Number.parseInt(cupos ?? "", 10) || 2));
  return <ModernaInvitation invitation={{ id: "vista-previa", name, seats, response: null }} preview />;
}
