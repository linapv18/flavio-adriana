import Link from "next/link";
import ModernaOrganizer from "@/components/moderna/ModernaOrganizer";
import "@/components/moderna/moderna.css";
import { weddingConfig as w, coupleNames } from "@/config/weddingConfig";
import type { Metadata } from "next";
import { weddingDatabaseUrl, databaseConfigured } from "@/lib/database.mjs";
import { neon } from "@neondatabase/serverless";
import { reportAuthorized } from "@/lib/report-auth";
import { monogram } from "@/lib/moderna";
import { login } from "./actions";
import type { GuestRow } from "@/lib/guest-rows";
import { invitationUrl } from "@/lib/invitation-links.mjs";
import { siteUrl } from "@/lib/site-url.mjs";
const loginErrors: Record<string, string> = {
  "1": "No pudimos iniciar sesión. Revisa la clave.",
  limited: "Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo.",
  unavailable: "No pudimos verificar el acceso. Revisa que la base de datos esté configurada (npm run db:setup) e intenta de nuevo.",
};
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: `Organización | ${coupleNames}`, robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function ReportPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const configured = databaseConfigured();
  if (!configured || !(await reportAuthorized())) {
    const { error } = await searchParams;
    return <main className="mo mo-dark mo-login">
      <div>
        <p className="mo-login-mono">{monogram.a}&amp;{monogram.b}</p>
        <h1 className="mo-kicker" style={{ marginTop: 18, color: "var(--stone)" }}>Espacio de los novios</h1>
        {configured && process.env.WEDDING_REPORT_PASSWORD
          ? <form action={login}>
              <input className="mo-login-input" type="password" name="password" required autoComplete="current-password" placeholder="Contraseña" aria-label="Contraseña" />
              {error && <p role="alert" className="mo-login-error">{loginErrors[error] ?? loginErrors["1"]}</p>}
              <button className="mo-pill is-light" style={{ marginTop: 30, height: 56 }}>Entrar</button>
            </form>
          : <><p className="mo-login-note">Base de datos desconectada. El acceso privado se activará cuando configures una base nueva y una contraseña.</p>
              <a className="mo-pill is-light" style={{ marginTop: 30, height: 56 }} href="/organizacion/vista-previa">Ver diseño del panel</a></>}
        <Link className="mo-login-back" href="/?abierta=1">Volver a la invitación</Link>
      </div>
    </main>;
  }
  let rows: GuestRow[];
  try {
    const sql = neon(weddingDatabaseUrl());
    const records = await sql`SELECT i.token_hash, i.id, i.display_name AS name, i.seats, i.sent_at IS NOT NULL AS sent, r.attending, r.party_size AS "partySize", r.dietary_requirements AS dietary, r.message, r.updated_at AS updated FROM invitations i LEFT JOIN invitation_responses r ON r.invitation_id=i.id WHERE i.active=true ORDER BY i.display_name` ;
    rows = records.map(({ token_hash, ...row }) => ({ ...row, invitationUrl: invitationUrl(siteUrl(w.site.url), token_hash) })) as GuestRow[];
  } catch {
    return <main className="mo mo-dark mo-login"><div>
      <p className="mo-login-mono">{monogram.a}&amp;{monogram.b}</p>
      <h1 className="mo-serif" style={{ marginTop: 24, fontSize: 34 }}>No pudimos cargar las confirmaciones</h1>
      <p className="mo-login-note">Intenta actualizar la página en unos minutos. Si acabas de actualizar el sitio, ejecuta <code>npm run db:setup</code>.</p>
      <a className="mo-pill is-light" style={{ marginTop: 30, height: 56 }} href="/organizacion">Reintentar</a>
    </div></main>;
  }
  return <ModernaOrganizer rows={rows} loadedAt={new Date().toISOString()} />;
}
