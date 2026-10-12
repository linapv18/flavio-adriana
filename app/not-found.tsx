import { weddingConfig as w, coupleNames } from "@/config/weddingConfig";
export default function MissingInvitation() {
  return <main className="max-w-xl mx-auto px-6 py-32 text-center"><p className="eyebrow mb-6">{coupleNames}</p><h1 className="section-title">No encontramos esta invitación</h1><p className="mt-7 leading-7">Revisa que hayas abierto el enlace completo que te enviamos. Si necesitas ayuda, escríbenos para recuperar tu invitación.</p><a href={w.contact.url} className="button mt-8" rel="noreferrer">Contáctanos</a></main>;
}
