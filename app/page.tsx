import { getInvitation } from "@/lib/invitations";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ModernaInvitation from "@/components/moderna/ModernaInvitation";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { referrer: "no-referrer", robots: { index: false, follow: false } };
type Search = { token?: string; abierta?: string; capitulo?: string; rsvp?: string };
export default async function Home({ searchParams }: { searchParams: Promise<Search> }) {
  const { token, abierta, capitulo, rsvp } = await searchParams;
  const invitation = token ? await getInvitation(token) : null;
  if (token && !invitation) notFound();
  return <ModernaInvitation invitation={invitation} token={token} startOpen={abierta === "1"} startChapter={capitulo} startRsvp={rsvp === "1"} />;
}
