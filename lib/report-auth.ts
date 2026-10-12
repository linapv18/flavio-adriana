import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
const cookieName = "wedding-report";
// Hosting dashboards make it easy to save a stray space or line break with a secret, so ignore them at the ends.
export const reportPassword = () => process.env.WEDDING_REPORT_PASSWORD?.trim() ?? "";
export function matches(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
function signature(expires: string) {
  return createHmac("sha256", reportPassword()).update(`report:${expires}`).digest("hex");
}
export async function reportAuthorized() {
  if (!reportPassword()) return false;
  const value = (await cookies()).get(cookieName)?.value || "";
  const [expires, sig] = value.split(".");
  return !!sig && Number(expires) > Date.now() && matches(sig, signature(expires));
}
export async function createReportSession() {
  const expires = String(Date.now() + 8 * 3600 * 1000);
  (await cookies()).set(cookieName, `${expires}.${signature(expires)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 8 * 3600 });
}
export async function clearReportSession() { (await cookies()).delete(cookieName); }
