import { redirect } from "next/navigation";
// Pages now covered by a chapter of the invitation send guests to that chapter, keeping their link.
export async function redirectToChapter(searchParams: Promise<{ token?: string }>, chapter: string, extra = "") {
  const { token } = await searchParams;
  const params = new URLSearchParams({ ...(token ? { token } : {}), abierta: "1", capitulo: chapter });
  redirect(`/?${params}${extra}`);
}
