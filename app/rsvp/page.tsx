import { redirectToChapter } from "@/lib/chapter-redirect";
export default function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  return redirectToChapter(searchParams, "confirmacion", "&rsvp=1");
}
