"use client";
import Image from "next/image";
import { useEffect, useRef, useState, type Dispatch, type KeyboardEvent, type SetStateAction } from "react";
import { weddingConfig as w, coupleNames } from "@/config/weddingConfig";
import type { Invitation } from "@/lib/invitations";
import { useWeddingMusic } from "@/components/WeddingMusic";
import { useNow } from "@/lib/use-now";
import { CHAPTERS, hasTravel, countdown, dayHeading, longDate, monogram, seamName, seatAnswers, seatLabels, shortDate, type ChapterId } from "@/lib/moderna";
import "./moderna.css";

type Response = Invitation["response"];
// `preview` shows a sample guest's invitation: the address is left alone and confirmations are not saved.
type Props = { invitation: Invitation | null; token?: string; startOpen?: boolean; startChapter?: string; startRsvp?: boolean; preview?: boolean };

const FAQ = [
  { group: "Vestimenta", q: "¿Hay código de vestimenta?", a: w.dressCode.description, links: w.dressCode.links.filter(l => l.url && l.url !== "#") },
  { group: "Vestimenta", q: "¿Hay colores reservados?", a: w.dressCode.reservedColors, links: [] },
  ...w.faqs.flatMap(g => g.items.map(i => ({ group: g.title, q: i.question, a: i.answer, links: [] as { label: string; url: string }[] }))),
  { group: "Regalos", q: "¿Hay lista de regalos?", a: `${w.gifts.title} ${w.gifts.description}`, links: w.gifts.url && w.gifts.url !== "#" ? [{ label: w.gifts.linkLabel, url: w.gifts.url }] : [] },
];
// The story's main photo and its thumbnails, without repeats, for the full-screen viewer.
const STORY_PHOTOS = [...new Set([w.photos.story, ...w.photos.storyThumbs])];
const realUrl = (url: string) => !!url && url !== "#";
// Chapters can be taller than the screen (Viaje, Preguntas), so positions come from the sections themselves.
const sectionTop = (scroller: HTMLElement | null, i: number) => (scroller?.children[i] as HTMLElement | undefined)?.offsetTop ?? 0;
const chapterPhotos = w.photos.chapters as Record<ChapterId, string>;

export default function ModernaInvitation({ invitation, token, startOpen = false, startChapter, startRsvp = false, preview = false }: Props) {
  const play = useWeddingMusic();
  const [screen, setScreen] = useState<"open" | "guest">(startOpen ? "guest" : "open");
  const [phase, setPhase] = useState(0);
  const [chapter, setChapter] = useState(() => startOpen ? Math.max(0, CHAPTERS.findIndex(c => c.id === startChapter)) : 0);
  const now = useNow();
  const [faqOpen, setFaqOpen] = useState(0);
  const [guideOpen, setGuideOpen] = useState(0);
  const [dressOpen, setDressOpen] = useState(false);
  const [photo, setPhoto] = useState<number | null>(null);
  const [response, setResponse] = useState<Response>(invitation?.response ?? null);
  const [rsvpOpen, setRsvpOpen] = useState(startRsvp && !!invitation);
  const scroller = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const withToken = (path: string, extra = "") => token ? `${path}?token=${encodeURIComponent(token)}${extra && "&" + extra}` : `${path}${extra && "?" + extra}`;

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  // Deep links (?capitulo=…) land on their chapter on first load only; reopening starts at the cover.
  const deepLinkUsed = useRef(false);
  useEffect(() => {
    if (screen !== "guest" || deepLinkUsed.current) return;
    deepLinkUsed.current = true;
    const i = CHAPTERS.findIndex(c => c.id === startChapter);
    if (i > 0 && scroller.current) scroller.current.scrollTo({ top: sectionTop(scroller.current, i), behavior: "instant" });
  }, [screen, startChapter]);

  function openInvitation() {
    if (phase) return;
    play();
    setPhase(1);
    timers.current.push(window.setTimeout(() => { setPhase(2); setScreen("guest"); setChapter(0); }, 380));
    timers.current.push(window.setTimeout(() => setPhase(0), 1850));
    if (!preview) window.history.replaceState(null, "", withToken("/", "abierta=1"));
  }
  function showEnvelope() {
    setScreen("open"); setRsvpOpen(false); setPhoto(null);
    setChapter(0); setFaqOpen(0); setGuideOpen(0); setDressOpen(false);
    if (!preview) window.history.replaceState(null, "", withToken("/"));
  }
  const goChapter = (i: number) => scroller.current?.scrollTo({ top: sectionTop(scroller.current, i), behavior: "smooth" });
  const cd = countdown(now);
  const [seamLeft, seamRight] = seamName(invitation?.name);
  const current = CHAPTERS[chapter];
  // Closing links sit at the end of whichever chapter comes last.
  const lastChapter = CHAPTERS[CHAPTERS.length - 1].id;
  const footer = <div className="mo-foot">
    <button type="button" onClick={showEnvelope}>Ver invitación</button>
  </div>;
  const showEnv = screen === "open" || phase > 0;

  const yes = response?.attending ? response.partySize : 0;
  const answered = response !== null;
  const seats = invitation?.seats ?? 0;
  const labels = invitation ? seatLabels(invitation.name, seats) : [];
  const answers = seatAnswers(seats, response);

  return <div className={`mo ${w.photos.monochrome ? "is-mono" : ""}`} data-chapter={current.id}>
    {showEnv && <div className={`mo-env ${phase ? "is-busy" : ""} ${phase >= 2 ? "is-open" : ""}`}>
      {(["left", "right"] as const).map(side => <div key={side} className={`mo-door is-${side}`} aria-hidden={side === "right" ? true : undefined}>
        <div className="mo-door-face">
          <div className="mo-env-top mo-kicker"><span>{monogram.a} — {monogram.b}</span><span>{shortDate}</span></div>
          <div className="mo-env-head">
            <p className="mo-kicker">Una invitación para un día inolvidable</p>
            <p className="mo-env-mono">{monogram.a}<em>&amp;</em>{monogram.b}</p>
          </div>
          <div className="mo-env-name"><span>{seamLeft}</span><span>{seamRight}</span></div>
        </div>
      </div>)}
      <button type="button" className="mo-seal" onClick={openInvitation} aria-label="Abrir la invitación"><span>&amp;</span></button>
      <p className="mo-env-hint">Toca el sello para abrir tu invitación</p>
    </div>}

    {screen === "guest" && <div className="mo-guest">
      <div className="mo-side" aria-hidden="true">
        {CHAPTERS.map((c, i) => <Image key={c.id} src={chapterPhotos[c.id]} alt="" fill sizes="44vw" priority={i === 0} className={i === chapter ? "is-on" : ""} />)}
        <div className="mo-side-cap"><span className="mo-serif" style={{ fontStyle: "italic", fontSize: 30, lineHeight: 1 }}>{current.name}</span></div>
      </div>
      <div className="mo-main">
        <div className="mo-bar mo-chrome">
          <button type="button" className="mo-bar-brand" onClick={() => goChapter(0)} aria-label="Ir a la portada">{monogram.a}<em>&amp;</em>{monogram.b}</button>
          <nav aria-label="Capítulos">{CHAPTERS.slice(1).map((c, i) => <button key={c.id} type="button" onClick={() => goChapter(i + 1)} aria-current={chapter === i + 1}>{c.name}</button>)}</nav>
        </div>

        <div ref={scroller} className="mo-scroller mo-ns" onScroll={e => {
          const el = e.currentTarget, mid = el.scrollTop + el.clientHeight / 2;
          let i = 0;
          for (let j = 0; j < el.children.length; j++) if ((el.children[j] as HTMLElement).offsetTop <= mid) i = j;
          if (i !== chapter) setChapter(i);
        }}>
          <section className="mo-ch mo-cover" aria-label="Portada">
            <Image className="mo-photo" src={w.photos.cover} alt={coupleNames} fill sizes="100vw" priority style={{ objectPosition: "center 35%" }} />
            <div className="mo-cover-copy">
              <p className="mo-kicker">{longDate}</p>
              <h1>{w.couple.bride}<br /><em>&amp; {w.couple.groom}</em></h1>
              <p className="mo-cover-intro">{invitation ? `Nos vamos a casar y queremos celebrarlo con ustedes, ${invitation.name}.` : "Nos vamos a casar y queremos celebrarlo contigo."}</p>
              <button type="button" className="mo-discover" onClick={() => goChapter(1)}><span aria-hidden="true">↓</span> Descubrir</button>
            </div>
          </section>

          <section className="mo-ch is-dark" aria-label="Cuenta atrás">
            <p className="mo-kicker">Faltan</p>
            <div className="mo-count">
              {cd?.done ? <p className="mo-count-days"><span>¡Hoy!</span></p> : <>
                <p className="mo-count-days"><span>{cd ? cd.d : "—"}</span><span>días</span></p>
                <div className="mo-count-grid" role="timer" aria-live="off">
                  <div><strong>{cd?.h ?? "—"}</strong><span>Horas</span></div>
                  <div><strong>{cd?.m ?? "—"}</strong><span>Minutos</span></div>
                  <div><strong>{cd?.s ?? "—"}</strong><span>Segundos</span></div>
                </div>
              </>}
            </div>
            <p className="mo-count-note">{Number.isFinite(Date.parse(w.date.iso)) ? "Cada vez falta menos para celebrar juntos." : "Fecha por confirmar."}</p>
          </section>

          <section className="mo-ch is-grow" aria-label="El día">
            <p className="mo-kicker">El día</p>
            <h2 className="mo-display" style={{ marginTop: 18 }}>{dayHeading.first}{dayHeading.second && <><br /><em>{dayHeading.second}</em></>}</h2>
            <div style={{ marginTop: "auto" }}>
              <div className="mo-row">
                <span className="mo-row-time">{w.date.time}</span>
                <div><p className="mo-row-title">Ceremonia</p><p className="mo-row-text">{w.venues.ceremony.name}<br />{w.venues.ceremony.address}</p><a className="mo-underline" href={w.venues.ceremony.mapUrl} target="_blank" rel="noopener noreferrer">Cómo llegar ↗</a></div>
              </div>
              <div className="mo-row">
                <span className="mo-row-key">Después</span>
                <div><p className="mo-row-title">Recepción</p><p className="mo-row-text">{w.venues.reception.name}<br />{w.venues.reception.address}</p><a className="mo-underline" href={w.venues.reception.mapUrl} target="_blank" rel="noopener noreferrer">Cómo llegar ↗</a></div>
              </div>
              {/* The dress code opens in place, so guests keep their spot in the invitation. */}
              <div className={`mo-dress ${dressOpen ? "is-open" : ""}`}>
                <button type="button" className="mo-row" aria-expanded={dressOpen} aria-controls="mo-dress" onClick={() => setDressOpen(open => !open)}>
                  <span className="mo-row-key">Nota</span><span className="mo-row-title">{w.dressCode.title}</span><span className="mo-faq-plus" aria-hidden="true">+</span>
                </button>
                {dressOpen && <div id="mo-dress" className="mo-dress-body">
                  <p>{w.dressCode.description}</p>
                  {w.dressCode.reservedColors && <><p className="mo-label" style={{ marginTop: 16, color: "var(--muted)" }}>Colores reservados</p><p>{w.dressCode.reservedColors}</p></>}
                  {w.dressCode.links.some(l => realUrl(l.url)) && <p className="mo-dress-links">{w.dressCode.links.filter(l => realUrl(l.url)).map(l => <a key={l.url} className="mo-underline" href={l.url} target="_blank" rel="noopener noreferrer">{l.label} ↗</a>)}</p>}
                </div>}
              </div>
            </div>
          </section>

          <section className="mo-ch is-sand" aria-label="Confirmación">
            <p className="mo-kicker">Confirmación</p>
            <h2 className="mo-display" style={{ marginTop: 18 }}>{!invitation || !answered ? "¿Nos acompañan?" : yes ? "Nos vemos pronto." : "Les extrañaremos."}</h2>
            <p className="mo-text" style={{ marginTop: 18, maxWidth: 380 }}>{!invitation ? "Abre el enlace personal que te enviamos para confirmar tu asistencia y ver los cupos reservados." : answered ? `Recibimos su respuesta. Pueden cambiarla en cualquier momento antes de ${w.date.rsvpDeadline}.` : `${seats === 1 ? "Tienes 1 cupo reservado" : `Tienen ${seats} cupos reservados`}. Confirmen por persona antes de ${w.date.rsvpDeadline}.`}</p>
            <div style={{ marginTop: "auto" }}>
              {labels.map((name, i) => <div key={i} className="mo-person"><span>{name}</span><span className="mo-status"><span className={`mo-dot ${answers[i] ? "is-yes" : ""}`} />{answers[i] === null ? "Pendiente" : answers[i] ? "Asiste" : "No asiste"}</span></div>)}
              {invitation
                ? <button type="button" className="mo-pill" style={{ marginTop: 22 }} onClick={() => setRsvpOpen(true)}>{answered ? "Editar confirmación" : "Confirmar asistencia"}</button>
                : <a className="mo-pill" style={{ marginTop: 22 }} href={w.contact.url}>Necesito mi enlace</a>}
            </div>
          </section>

          {w.pages.story && <section className="mo-ch mo-story" aria-label="Historia">
            <button type="button" className="mo-story-photo" onClick={() => setPhoto(0)} aria-label="Ver la foto en grande"><Image className="mo-photo" src={w.photos.story} alt={coupleNames} fill sizes="56vw" /></button>
            <div className="mo-story-copy">
              <p className="mo-kicker">{w.story.title}</p>
              <h2><StoryTitle text={w.story.previewTitle} /></h2>
              <p className="mo-text" style={{ marginTop: 16, maxWidth: 460 }}>{w.story.paragraphs.join(" ")}</p>
              <div className="mo-thumbs mo-ns">{w.photos.storyThumbs.map((src, i) => <button key={src} type="button" className="mo-thumb-btn" onClick={() => setPhoto(STORY_PHOTOS.indexOf(src))} aria-label={`Ver la foto ${i + 1} en grande`}><Image className="mo-thumb" src={src} alt="" width={64} height={84} /></button>)}</div>
            </div>
          </section>}

          {w.pages.faqs && <section className="mo-ch is-tall" aria-label="Preguntas">
            <p className="mo-kicker">Preguntas</p>
            <h2 className="mo-display" style={{ margin: "18px 0 28px" }}>Los detalles</h2>
            {FAQ.map((f, i) => <div key={i} className={`mo-faq ${faqOpen === i ? "is-open" : ""}`}>
              <button type="button" aria-expanded={faqOpen === i} onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}>
                <span><span className="mo-label" style={{ display: "block", color: "var(--muted)" }}>{f.group}</span><span className="mo-faq-q">{f.q}</span></span>
                <span className="mo-faq-plus" aria-hidden="true">+</span>
              </button>
              {faqOpen === i && <p className="mo-faq-a">{f.a}{f.links.length > 0 && <><br />{f.links.map(l => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">{l.label} ↗</a>)}</>}</p>}
            </div>)}
            {lastChapter === "preguntas" && footer}
          </section>}

          {hasTravel && <section className="mo-ch is-tall" aria-label="Viaje">
            <p className="mo-kicker">Viaje</p>
            <h2 className="mo-display" style={{ marginTop: 18 }}>Si vienen <em>de viaje</em></h2>
            <p className="mo-text" style={{ marginTop: 18, maxWidth: 460 }}>Todo lo que necesitan para llegar, descansar y conocer la ciudad durante esos días.</p>

            {w.hotel.enabled && <div style={{ marginTop: 40 }}>
              <p className="mo-label" style={{ color: "var(--muted)", marginBottom: 6 }}>{w.hotel.title}</p>
              <div className="mo-row">
                <span className="mo-row-key">Hotel</span>
                <div><p className="mo-row-title">{w.hotel.name}</p><p className="mo-row-text">{w.hotel.description}</p>{realUrl(w.hotel.mapUrl) ? <a className="mo-underline" href={w.hotel.mapUrl} target="_blank" rel="noopener noreferrer">{w.hotel.address} ↗</a> : <p className="mo-row-text">{w.hotel.address}</p>}</div>
              </div>
              <div className="mo-row">
                <span className="mo-row-key">Código</span>
                <div><p className="mo-row-title">{w.hotel.bookingCode}</p><p className="mo-row-text">{w.hotel.bookingInstructions}</p></div>
              </div>
              <div className="mo-row" style={{ borderBottom: "1px solid var(--line)" }}>
                <span className="mo-row-key">Detalles</span>
                <dl className="mo-details">{w.hotel.details.map(d => <div key={d.title}><dt>{d.title}</dt>{d.lines.map((line, i) => <dd key={i}>{line}</dd>)}</div>)}</dl>
              </div>
              {realUrl(w.hotel.bookingUrl) && <a className="mo-pill" style={{ marginTop: 22 }} href={w.hotel.bookingUrl} target="_blank" rel="noopener noreferrer">Reservar</a>}
            </div>}

            {w.tourism.enabled && <div style={{ marginTop: 48 }}>
              <p className="mo-label" style={{ color: "var(--muted)" }}>Guía de la ciudad</p>
              <h3 className="mo-serif" style={{ margin: "10px 0 20px", fontSize: 34, lineHeight: 1.05 }}>{w.tourism.title}</h3>
              {w.tourism.groups.map((g, i) => <div key={g.id} className={`mo-faq ${guideOpen === i ? "is-open" : ""}`}>
                <button type="button" aria-expanded={guideOpen === i} onClick={() => setGuideOpen(guideOpen === i ? -1 : i)}>
                  <span className="mo-faq-q" style={{ marginTop: 0 }}>{g.title}</span>
                  <span className="mo-faq-plus" aria-hidden="true">+</span>
                </button>
                {guideOpen === i && <div className="mo-guide">
                  {g.note && <p className="mo-guide-note">{g.note}</p>}
                  <ul>{g.items.map((item, j) => <li key={j}>{realUrl(item.url) ? <a href={item.url} target="_blank" rel="noopener noreferrer">{item.name} ↗</a> : <span>{item.name}</span>}<p>{item.description}</p></li>)}</ul>
                </div>}
              </div>)}
              <div style={{ borderTop: "1px solid var(--line)" }} />
            </div>}
            {lastChapter === "viaje" && footer}
          </section>}
        </div>

        <div className="mo-ticks mo-chrome">{CHAPTERS.map((c, i) => <button key={c.id} type="button" onClick={() => goChapter(i)} aria-label={c.name} aria-current={i === chapter}><span /></button>)}</div>
      </div>
    </div>}

    {photo !== null && <PhotoViewer photos={STORY_PHOTOS} index={photo} onChange={setPhoto} onClose={() => setPhoto(null)} />}

    {rsvpOpen && invitation && (token || preview) && screen === "guest" && <RsvpSheet invitation={invitation} token={token} preview={preview} labels={labels} response={response} onSaved={setResponse} onClose={() => setRsvpOpen(false)} />}
  </div>;
}

function PhotoViewer({ photos, index, onChange, onClose }: { photos: string[]; index: number; onChange: Dispatch<SetStateAction<number | null>>; onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  useEffect(() => { close.current?.focus(); }, []);
  const step = (d: number) => onChange(i => i === null ? null : (i + d + photos.length) % photos.length);
  const many = photos.length > 1;
  return <div className="mo-viewer" role="dialog" aria-modal="true" aria-label="Fotos de nuestra historia"
    onKeyDown={e => { if (e.key === "Escape") onClose(); else if (many && e.key === "ArrowRight") step(1); else if (many && e.key === "ArrowLeft") step(-1); }}
    onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
    onTouchEnd={e => { const start = touchX.current; touchX.current = null; if (many && start !== null) { const dx = e.changedTouches[0].clientX - start; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); } }}>
    <button type="button" className="mo-viewer-scrim" onClick={onClose} aria-label="Cerrar" tabIndex={-1} />
    <div className="mo-viewer-frame"><Image key={photos[index]} className="mo-viewer-img" src={photos[index]} alt={`Foto ${index + 1} de ${photos.length}`} fill sizes="92vw" /></div>
    <button ref={close} type="button" className="mo-viewer-btn is-close" onClick={onClose} aria-label="Cerrar">×</button>
    {many && <>
      <button type="button" className="mo-viewer-btn is-prev" onClick={() => step(-1)} aria-label="Foto anterior">‹</button>
      <button type="button" className="mo-viewer-btn is-next" onClick={() => step(1)} aria-label="Foto siguiente">›</button>
    </>}
  </div>;
}

function StoryTitle({ text }: { text: string }) {
  const words = text.split(/\s+/);
  const cut = Math.ceil(words.length / 2);
  return <>{words.slice(0, cut).join(" ")} <em>{words.slice(cut).join(" ")}</em></>;
}

function RsvpSheet({ invitation, token, preview, labels, response, onSaved, onClose }: { invitation: Invitation; token?: string; preview: boolean; labels: string[]; response: Response; onSaved: (r: Response) => void; onClose: () => void }) {
  const [editing, setEditing] = useState(response === null);
  const [draft, setDraft] = useState(() => seatAnswers(invitation.seats, response));
  const [dietary, setDietary] = useState(response?.dietary ?? "");
  const [message, setMessage] = useState(response?.message ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => { close.current?.focus(); }, []);
  const yes = draft.filter(Boolean).length;
  const set = (i: number, v: boolean) => { setDraft(d => d.map((a, j) => j === i ? v : a)); setError(""); };

  async function submit() {
    if (pending) return;
    if (draft.some(a => a === null)) { setError("Indica si cada persona de la invitación podrá asistir."); return; }
    setPending(true); setError("");
    try {
      if (preview) await new Promise(resolve => setTimeout(resolve, 600));
      else {
        const res = await fetch("/api/rsvp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, attending: yes > 0, partySize: yes, dietary: yes ? dietary : "", message }) });
        const result = await res.json().catch(() => ({}));
        if (!res.ok || !result.success) throw new Error(result.error || "No pudimos guardar tu respuesta.");
      }
      onSaved({ attending: yes > 0, partySize: yes, dietary: yes ? dietary.trim() : "", message: message.trim() });
      setEditing(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Revisa tu conexión e intenta nuevamente."); }
    finally { setPending(false); }
  }
  const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
  const saved = seatAnswers(invitation.seats, response);
  const savedYes = saved.filter(Boolean).length;

  return <div className="mo-scrim" onKeyDown={onKey}>
    <button type="button" className="mo-scrim-close" onClick={onClose} aria-label="Cerrar" tabIndex={-1} />
    <div className="mo-sheet mo-ns" role="dialog" aria-modal="true" aria-labelledby="mo-rsvp-title">
      <div className="mo-sheet-head"><span className="mo-kicker" style={{ color: "var(--muted)" }}>Confirmación</span><button ref={close} type="button" className="mo-close" onClick={onClose} aria-label="Cerrar">×</button></div>
      {!editing && response ? <div className="mo-thanks">
        <p id="mo-rsvp-title">Gracias.</p>
        <p className="mo-text" style={{ marginTop: 22, fontSize: 15 }}>{savedYes ? `Nos encantará celebrar con ustedes. Confirmamos ${savedYes} ${savedYes === 1 ? "asistente" : "asistentes"}.` : "Gracias por hacérnoslo saber. Les tendremos presentes en este día tan especial."}</p>
        <div style={{ marginTop: 28 }}>{labels.map((name, i) => <div key={i} className="mo-person" style={{ padding: "12px 0" }}><span style={{ fontSize: 20 }}>{name}</span><span className="mo-status">{saved[i] ? "Asiste" : "No asiste"}</span></div>)}</div>
        <div style={{ marginTop: 28, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="mo-pill" style={{ flex: 1, minWidth: 140, height: 56 }} onClick={onClose}>Volver</button>
          <button type="button" className="mo-pill is-outline" style={{ flex: 1, minWidth: 140, height: 56 }} onClick={() => { setDraft(saved); setEditing(true); }}>Editar respuesta</button>
        </div>
      </div> : <div style={{ opacity: pending ? .5 : 1, transition: "opacity .3s" }}>
        <h2 id="mo-rsvp-title" className="mo-serif" style={{ marginTop: 26, fontSize: 46, lineHeight: 1, letterSpacing: "-.02em" }}><StoryTitle text={invitation.name} /></h2>
        <p className="mo-text" style={{ marginTop: 12, fontSize: 13 }}>{invitation.seats} {invitation.seats === 1 ? "cupo reservado" : "cupos reservados"}.</p>
        <div style={{ marginTop: 26, display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <span className="mo-kicker" style={{ letterSpacing: ".28em" }}>¿Quién nos acompaña?</span>
          {invitation.seats > 1 && <button type="button" className="mo-kicker" style={{ letterSpacing: ".2em", textDecoration: "underline", textUnderlineOffset: 5, padding: "4px 0" }} onClick={() => { setDraft(draft.map(() => true)); setError(""); }}>Todos asistirán</button>}
        </div>
        <div style={{ marginTop: 10 }}>
          {labels.map((name, i) => <div key={i} className="mo-person">
            <span id={`mo-seat-${i}`}>{name}</span>
            <div className={`mo-switch ${draft[i] === true ? "is-yes" : draft[i] === false ? "is-no" : ""}`} role="group" aria-labelledby={`mo-seat-${i}`}>
              <button type="button" aria-pressed={draft[i] === true} onClick={() => set(i, true)}>Sí</button>
              <button type="button" aria-pressed={draft[i] === false} onClick={() => set(i, false)}>No</button>
            </div>
          </div>)}
        </div>
        {yes > 0 && <label className="mo-field">Restricciones alimentarias <span style={{ color: "var(--muted)" }}>· opcional</span>
          <textarea rows={2} maxLength={1000} value={dietary} onChange={e => setDietary(e.target.value)} placeholder={invitation.seats === 1 ? "¿Alguna restricción?" : "Indica a quién corresponde cada una…"} />
        </label>}
        <label className="mo-field">Un mensaje para nosotros <span style={{ color: "var(--muted)" }}>· opcional</span>
          <textarea rows={3} maxLength={2000} value={message} onChange={e => setMessage(e.target.value)} placeholder="Escríbanos unas palabras…" />
        </label>
        {error && <p role="alert" className="mo-error">{error}</p>}
        <button type="button" className="mo-pill" style={{ marginTop: 26 }} disabled={pending} onClick={submit}>{pending ? "Enviando…" : "Enviar confirmación"}</button>
        <p style={{ marginTop: 14, fontSize: 11, lineHeight: 1.6, color: "var(--muted)", textAlign: "center" }}>{preview ? "Vista previa: esta respuesta no se guarda." : "Usaremos estos datos únicamente para organizar la boda."}</p>
      </div>}
    </div>
  </div>;
}
