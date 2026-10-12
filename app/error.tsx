"use client";
export default function InvitationError({ reset }: { reset: () => void }) {
  return <main className="max-w-xl mx-auto px-6 py-32 text-center"><h1 className="section-title">Un momento, por favor</h1><p className="my-7 leading-7">No pudimos cargar tu invitación. Tu enlace sigue siendo el mismo; intenta nuevamente en unos minutos.</p><button onClick={reset}>Volver a intentar</button></main>;
}
