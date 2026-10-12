import { redirect } from "next/navigation";
export default async function LegacyInvitation({ params }: { params: Promise<{ token: string }> }) {
 const { token } = await params;
 redirect(`/?token=${encodeURIComponent(token)}`);
}
