"use client";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNow } from "@/lib/use-now";
import { weddingConfig as w, coupleNames } from "@/config/weddingConfig";
import { guestStatus, invitationMessage, summarize, type GuestRow } from "@/lib/guest-rows";
import { countdown, monogram, seatAnswers, seatLabels } from "@/lib/moderna";
import { logout, removeInvitation, saveInvitation, setInvitationSent } from "@/app/organizacion/actions";
import "./moderna.css";

type Tab = "resumen" | "invitados" | "enviar";
type Status = "Asistirán" | "No asistirán" | "Sin respuesta";
type Result = { error?: string; success?: boolean };
const TABS: [Tab, string][] = [["resumen", "Resumen"], ["invitados", "Invitados"], ["enviar", "Enviar"]];
const FILTERS: ("Todas" | Status)[] = ["Todas", "Asistirán", "No asistirán", "Sin respuesta"];
const dotClass = (r: GuestRow) => r.attending === null ? "" : r.attending ? "is-yes" : "is-no";
const cupos = (n: number) => `${n} ${n === 1 ? "cupo" : "cupos"}`;
const message = (r: GuestRow) => invitationMessage(w.invitation.message, r, coupleNames);
const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const rowResponse = (r: GuestRow) => r.attending === null ? null : { attending: r.attending, partySize: r.partySize ?? 0, attendance: r.attendance };
// Keeps one entry per seat when the seat count changes.
const resize = <T,>(list: T[], length: number, fill: T) => Array.from({ length }, (_, i) => i < list.length ? list[i] : fill);

export default function ModernaOrganizer({ rows, loadedAt, preview = false }: { rows: GuestRow[]; loadedAt: string; preview?: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("resumen");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Todas");
  const [sheet, setSheet] = useState<{ id: string; kind: "detail" | "share" } | null>(null);
  const [toast, setToast] = useState("");
  const scroll = useRef<HTMLDivElement>(null);
  const toastTimer = useRef(0);
  useEffect(() => { scroll.current?.scrollTo({ top: 0 }); }, [tab]);

  const say = (text: string) => { window.clearTimeout(toastTimer.current); setToast(text); toastTimer.current = window.setTimeout(() => setToast(""), 1800); };
  // Runs a server action; on success refreshes the server data so every view stays in sync.
  async function run(action: () => Promise<Result>, done: string) {
    if (preview) { say("Vista previa: sin base de datos"); return false; }
    try {
      const result = await action();
      if (result.error) { say(result.error); return false; }
      router.refresh(); say(done); return true;
    } catch { say("Revisa tu conexión e intenta de nuevo."); return false; }
  }
  async function copy(text: string, label: string) {
    try { await navigator.clipboard.writeText(text); say(label); } catch { say("No se pudo copiar"); }
  }

  const totals = summarize(rows);
  const declinedPeople = rows.reduce((n, r) => n + (r.attending === null ? 0 : r.seats - (r.attending ? r.partySize ?? 0 : 0)), 0);
  const pct = (n: number) => `${totals.seats ? (n / totals.seats) * 100 : 0}%`;
  const byStatus = (s: Status) => rows.filter(r => guestStatus(r) === s).length;
  const visible = rows.filter(r => (filter === "Todas" || guestStatus(r) === filter) && normalize([r.name, ...r.guestNames].join(" ")).includes(normalize(search)));
  const totalsText = `${rows.length} invitaciones · ${totals.seats} cupos asignados`;
  const sent = rows.filter(r => r.sent), pendingSend = rows.filter(r => !r.sent);
  const cd = countdown(useNow());
  const active = sheet && rows.find(r => r.id === sheet.id);
  const goFilter = (s: Status) => { setFilter(s); setTab("invitados"); };

  function downloadCsv() {
    // Prevent spreadsheet programs from treating guest-provided text as formulas.
    const cell = (v: unknown) => { let s = String(v ?? ""); if (/^[\s]*[=+@-]/.test(s)) s = "'" + s; return '"' + s.replaceAll('"', '""') + '"'; };
    const values = [["Invitación", "Invitados", "Estado", "Cupos asignados", "Personas confirmadas", "Asisten", "Restricciones alimentarias", "Mensaje", "Enviada", "Enlace de invitación"], ...visible.map(r => {
      const names = seatLabels(r.name, r.seats, r.guestNames), answers = seatAnswers(r.seats, rowResponse(r));
      return [r.name, names.join(", "), guestStatus(r), r.seats, r.partySize ?? "", names.filter((_, i) => answers[i]).join(", "), r.dietary, r.message, r.sent ? "Sí" : "No", r.invitationUrl];
    })];
    const url = URL.createObjectURL(new Blob(["﻿" + values.map(r => r.map(cell).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "confirmaciones-boda.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    say("CSV exportado");
  }

  const sessionLinks = (compact: boolean) => preview
    ? <a className="mo-org-textbtn is-dim" href="/organizacion">{compact ? "Salir" : "Volver al acceso"}</a>
    : <form action={logout}><button className="mo-org-textbtn is-dim">{compact ? "Salir" : "Cerrar sesión"}</button></form>;

  return <div className="mo mo-dark mo-org">
    <aside className="mo-org-rail">
      <p className="mo-org-mono">{monogram.a}&amp;{monogram.b}</p>
      <p className="mo-label is-dim" style={{ margin: "10px 0 40px", letterSpacing: ".32em" }}>Novios</p>
      <nav aria-label="Panel de los novios">{TABS.map(([k, label], i) => <button key={k} type="button" className="mo-org-tab" aria-current={tab === k ? "page" : undefined} onClick={() => setTab(k)}><small>0{i + 1}</small><span>{label}</span></button>)}</nav>
      <div style={{ marginTop: "auto" }}>
        {cd && !cd.done && <p className="mo-serif is-dim" style={{ fontStyle: "italic", fontSize: 20, lineHeight: 1.3 }}>Faltan {cd.d} días</p>}
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
          <Link className="mo-org-textbtn" href="/?abierta=1">Ver invitación</Link>
          {sessionLinks(false)}
        </div>
      </div>
    </aside>

    <div className="mo-org-body">
      <header className="mo-org-head">
        <span className="mo-serif" style={{ fontStyle: "italic", fontSize: 24 }}>{monogram.a}&amp;{monogram.b} <span className="mo-label is-dim" style={{ marginLeft: 8, letterSpacing: ".32em", fontStyle: "normal" }}>Novios</span></span>
        {sessionLinks(true)}
      </header>
      <div ref={scroll} className="mo-org-scroll mo-ns">
        <div className="mo-org-inner" key={tab}>
          {preview && <p className="mo-preview-note">Vista previa del diseño · sin base de datos conectada ni datos de invitados. Las acciones de guardado están desactivadas.</p>}

          {tab === "resumen" && <>
            <p className="mo-kicker is-dim">Personas confirmadas</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 10 }}><span className="mo-big">{totals.confirmed}</span><span className="mo-serif is-dim" style={{ fontStyle: "italic", fontSize: 34 }}>de {totals.seats}</span></div>
            <div className="mo-meter" style={{ marginTop: 28 }} role="img" aria-label={`${totals.confirmed} asistirán y ${declinedPeople} no asistirán de ${totals.seats} cupos`}><div style={{ width: pct(totals.confirmed), background: "var(--ivory)" }} /><div style={{ width: pct(declinedPeople), background: "var(--soft)" }} /></div>
            <div className="mo-legend"><span><i style={{ background: "var(--ivory)" }} />Asistirán</span><span><i style={{ background: "var(--soft)" }} />No asistirán</span><span><i style={{ background: "var(--line-dark)" }} />Sin responder</span></div>
            <div className="mo-stats">{([["Asistirán", "Invitaciones asisten"], ["No asistirán", "No asisten"], ["Sin respuesta", "Sin respuesta"]] as [Status, string][]).map(([k, label]) => <button key={k} type="button" onClick={() => goFilter(k)}><strong>{byStatus(k)}</strong><span>{label}</span></button>)}</div>
            <p style={{ marginTop: 18, fontSize: 12, lineHeight: 1.7 }} className="is-dim">{totalsText}. Las respuestas se registran por invitación.</p>
            <div style={{ marginTop: 44, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><h2 className="mo-serif" style={{ fontSize: 34 }}>Mensajes</h2><button type="button" className="mo-underline" onClick={() => setTab("invitados")}>Ver todos</button></div>
            {rows.some(r => r.message)
              ? <div className="mo-cards mo-ns">{[...rows].filter(r => r.message).sort((a, b) => (b.updated ?? "").localeCompare(a.updated ?? "")).map(r => <button key={r.id} type="button" onClick={() => setSheet({ id: r.id, kind: "detail" })}><q>{r.message}</q><span className="mo-label is-dim" style={{ marginTop: 18, letterSpacing: ".22em" }}>{r.name}</span></button>)}</div>
              : <p className="mo-serif is-dim" style={{ marginTop: 18, fontStyle: "italic", fontSize: 20 }}>Aquí aparecerán los mensajes de tus invitados.</p>}
          </>}

          {tab === "invitados" && <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
              <div><p className="mo-kicker is-dim">{totalsText}</p><h1 className="mo-org-h1">Invitados</h1></div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button type="button" className="mo-outline-btn" onClick={() => { router.refresh(); say("Datos actualizados"); }}>Actualizar</button><button type="button" className="mo-outline-btn" onClick={downloadCsv}>Exportar CSV</button></div>
            </div>
            <input className="mo-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar invitación o invitado…" aria-label="Buscar invitación o invitado" />
            <div className="mo-chips mo-ns">{FILTERS.map(k => <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>{k} <small>{k === "Todas" ? rows.length : byStatus(k)}</small></button>)}</div>
            <div style={{ marginTop: 18 }}>
              {visible.map(r => <button key={r.id} type="button" className="mo-guest-row" onClick={() => setSheet({ id: r.id, kind: "detail" })}>
                <span className={`mo-sdot ${dotClass(r)}`} aria-hidden="true" />
                <span style={{ minWidth: 0 }}><strong>{r.name}</strong><small>{r.message ? `“${r.message}”` : `${guestStatus(r)} · ${r.sent ? "enviada" : "sin enviar"}`}</small></span>
                <span aria-label={`${r.attending === null ? "Sin respuesta" : `${r.partySize ?? 0} confirmados`} de ${cupos(r.seats)}`}>{r.attending === null ? "—" : r.partySize ?? 0}/{r.seats}</span>
              </button>)}
              {!visible.length && <p className="mo-serif is-dim" style={{ padding: "28px 0", fontStyle: "italic", fontSize: 20 }}>{rows.length ? "No hay invitaciones que coincidan con estos filtros." : "Aún no hay invitaciones. Créalas en Enviar."}</p>}
            </div>
            {loadedAt && <p className="is-dim" style={{ marginTop: 18, fontSize: 11 }}>Datos consultados: {new Date(loadedAt).toLocaleString(w.site.locale, { timeZone: w.site.timeZone })}</p>}
          </>}

          {tab === "enviar" && <>
            <p className="mo-kicker is-dim">{sent.length} de {rows.length} enviadas</p>
            <h1 className="mo-org-h1">Enviar <em>invitaciones</em></h1>
            <div className="mo-meter" style={{ marginTop: 22 }}><div style={{ width: `${rows.length ? (sent.length / rows.length) * 100 : 0}%`, background: "var(--ivory)" }} /></div>
            <div className="mo-send-grid">
              <div>
                {[{ title: "Pendientes", list: pendingSend }, { title: "Enviadas", list: sent }].filter(g => g.list.length).map(g => <div key={g.title} style={{ marginBottom: 28 }}>
                  <p className="mo-label is-dim" style={{ marginBottom: 6 }}>{g.title} · {g.list.length}</p>
                  {g.list.map(r => <div key={r.id} className="mo-send-row"><span style={{ minWidth: 0 }}><strong>{r.name}</strong><small>{cupos(r.seats)}</small></span><button type="button" className={r.sent ? "is-sent" : ""} onClick={() => setSheet({ id: r.id, kind: "share" })}>{r.sent ? "Reenviar" : "Compartir"}</button></div>)}
                </div>)}
                {!rows.length && <p className="mo-serif is-dim" style={{ fontStyle: "italic", fontSize: 20 }}>Crea tu primera invitación para compartirla.</p>}
              </div>
              <NewInvitation onCreate={(name, seats, guestNames, requestId) => run(() => saveInvitation({ name, seats, guestNames, requestId }), "Invitación creada")} />
            </div>
            <p className="is-dim" style={{ marginTop: 18, fontSize: 11, lineHeight: 1.6 }}>Copiar un mensaje no lo envía: compártelo por el medio que prefieras.</p>
          </>}
        </div>
      </div>
      <nav className="mo-org-tabs" aria-label="Secciones del panel">{TABS.map(([k, label]) => <button key={k} type="button" aria-current={tab === k ? "page" : undefined} onClick={() => setTab(k)}><span>{label}</span><span /></button>)}</nav>
    </div>

    {active && sheet && <Sheet onClose={() => setSheet(null)} status={guestStatus(active)} dot={dotClass(active)}>
      {sheet.kind === "share"
        ? <ShareView row={active} onCopyMessage={async () => { await copy(message(active), "Mensaje copiado"); if (!active.sent) await run(() => setInvitationSent(active.id, true), "Mensaje copiado"); }} onCopyLink={() => copy(active.invitationUrl, "Enlace copiado")} onToggleSent={() => run(() => setInvitationSent(active.id, !active.sent), active.sent ? "Marcada como no enviada" : "Marcada como enviada")} />
        : <DetailView key={active.id} row={active} onShare={() => setSheet({ id: active.id, kind: "share" })} onCopyLink={() => copy(active.invitationUrl, "Enlace copiado")} run={run} onRemoved={() => setSheet(null)} />}
    </Sheet>}

    {toast && <div className="mo-toast is-light" role="status">{toast}</div>}
  </div>;
}

function Sheet({ children, onClose, status, dot }: { children: ReactNode; onClose: () => void; status: string; dot: string }) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => { close.current?.focus(); }, []);
  return <div className="mo-scrim" onKeyDown={(e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }}>
    <button type="button" className="mo-scrim-close" onClick={onClose} aria-label="Cerrar" tabIndex={-1} />
    <div className="mo-sheet mo-ns" role="dialog" aria-modal="true" aria-labelledby="mo-sheet-title" style={{ maxWidth: 480 }}>
      <div className="mo-sheet-head"><span className="mo-label is-dim" style={{ display: "flex", alignItems: "center", gap: 8, letterSpacing: ".24em" }}><span className={`mo-sdot ${dot}`} aria-hidden="true" />{status}</span><button ref={close} type="button" className="mo-close" onClick={onClose} aria-label="Cerrar">×</button></div>
      {children}
    </div>
  </div>;
}

function SheetTitle({ row }: { row: GuestRow }) {
  return <><h2 id="mo-sheet-title" className="mo-serif" style={{ marginTop: 22, fontSize: 44, lineHeight: 1, letterSpacing: "-.02em" }}>{row.name}</h2>
    <p className="is-dim" style={{ marginTop: 10, fontSize: 12 }}>{cupos(row.seats)} · {row.sent ? "Invitación enviada" : "Invitación sin enviar"}</p></>;
}

function ShareView({ row, onCopyMessage, onCopyLink, onToggleSent }: { row: GuestRow; onCopyMessage: () => void; onCopyLink: () => void; onToggleSent: () => void }) {
  return <>
    <SheetTitle row={row} />
    <p className="mo-label is-dim" style={{ margin: "26px 0 10px" }}>Mensaje</p>
    <p className="mo-msg-box">{message(row)}</p>
    <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <button type="button" className="mo-pill is-outline is-small" onClick={onCopyMessage}>Copiar mensaje</button>
      <button type="button" className="mo-pill is-outline is-small" onClick={onCopyLink}>Copiar enlace</button>
      <button type="button" className="mo-pill is-outline is-small" style={{ gridColumn: "1 / -1" }} onClick={onToggleSent}>{row.sent ? "Marcar como no enviada" : "Marcar como enviada"}</button>
    </div>
  </>;
}

function DetailView({ row, onShare, onCopyLink, run, onRemoved }: { row: GuestRow; onShare: () => void; onCopyLink: () => void; run: (a: () => Promise<Result>, done: string) => Promise<boolean>; onRemoved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<"reset" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);
  const response = rowResponse(row);
  const answers = seatAnswers(row.seats, response);
  const act = async (a: () => Promise<Result>, done: string) => { setBusy(true); const ok = await run(a, done); setBusy(false); return ok; };

  if (editing) return <EditView row={row} busy={busy} onCancel={() => setEditing(false)} onSave={async input => { if (await act(() => saveInvitation({ id: row.id, requestId: crypto.randomUUID(), ...input }), "Invitación guardada")) setEditing(false); }} />;
  return <>
    <SheetTitle row={row} />
    <p className="mo-label is-dim" style={{ margin: "28px 0 4px" }}>Asistencia</p>
    {seatLabels(row.name, row.seats, row.guestNames).map((name, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderTop: "1px solid #F4F0E81A" }}><span className="mo-serif" style={{ fontSize: 20 }}>{name}</span><span className="mo-label" style={{ letterSpacing: ".2em", color: answers[i] === null ? "var(--stone)" : "var(--ivory)" }}>{answers[i] === null ? "Pendiente" : answers[i] ? "Asiste" : "No asiste"}</span></div>)}
    {row.dietary && <><p className="mo-label is-dim" style={{ margin: "26px 0 8px" }}>Restricciones alimentarias</p><p style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{row.dietary}</p></>}
    <p className="mo-label is-dim" style={{ margin: "26px 0 8px" }}>Mensaje</p>
    <p className="mo-serif" style={{ fontStyle: "italic", fontSize: 22, lineHeight: 1.4, whiteSpace: "pre-wrap" }}>{row.message || "—"}</p>
    <p className="mo-label is-dim" style={{ margin: "26px 0 8px" }}>Enlace</p>
    <p style={{ fontSize: 13, wordBreak: "break-all", color: "#D8D0C4" }}>{row.invitationUrl}</p>
    <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <button type="button" className="mo-pill is-light is-small" onClick={onCopyLink}>Copiar enlace</button>
      <button type="button" className="mo-pill is-outline is-small" onClick={onShare}>Compartir</button>
      <button type="button" className="mo-pill is-outline is-small" onClick={() => setEditing(true)}>Editar</button>
      <button type="button" className="mo-pill is-outline is-small" disabled={!response} onClick={() => setConfirm("reset")}>Borrar respuesta</button>
    </div>
    <button type="button" className="mo-org-textbtn mo-danger" style={{ marginTop: 22 }} onClick={() => setConfirm("delete")}>Borrar invitación</button>
    {confirm && <div className="mo-card" style={{ marginTop: 18 }} role="alertdialog" aria-labelledby="mo-confirm">
      <p id="mo-confirm" className="mo-serif" style={{ fontSize: 22 }}>{confirm === "reset" ? "¿Borrar la respuesta?" : "¿Borrar la invitación?"}</p>
      <p className="is-dim" style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6 }}>{confirm === "reset" ? "Se quitarán la confirmación, las restricciones y el mensaje. El enlace sigue funcionando." : "Se quitará de la lista y de los totales, y su enlace dejará de funcionar. Su respuesta se conserva en el historial."}</p>
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button type="button" className="mo-pill is-light is-small" disabled={busy} onClick={async () => {
          if (confirm === "reset") { if (await act(() => saveInvitation({ id: row.id, name: row.name, seats: row.seats, guestNames: row.guestNames, requestId: crypto.randomUUID(), response: null }), "Respuesta borrada")) setConfirm(null); }
          else if (await act(() => removeInvitation(row.id), "Invitación borrada")) onRemoved();
        }}>{busy ? "Guardando…" : "Sí, borrar"}</button>
        <button type="button" className="mo-pill is-outline is-small" onClick={() => setConfirm(null)}>Cancelar</button>
      </div>
    </div>}
  </>;
}

function EditView({ row, busy, onCancel, onSave }: { row: GuestRow; busy: boolean; onCancel: () => void; onSave: (input: { name: string; seats: number; guestNames: string[]; response?: { attendance: boolean[] } | null }) => void }) {
  const initialAnswers = seatAnswers(row.seats, rowResponse(row));
  const answered = row.attending !== null;
  const [name, setName] = useState(row.name);
  const [seats, setSeats] = useState(row.seats);
  const [names, setNames] = useState(() => resize(row.guestNames, row.seats, ""));
  const [mode, setMode] = useState<"pending" | "answered">(answered ? "answered" : "pending");
  const [answers, setAnswers] = useState<(boolean | null)[]>(initialAnswers);
  const [error, setError] = useState("");
  const changeSeats = (n: number) => { setSeats(n); setNames(list => resize(list, n, "")); setAnswers(list => resize(list, n, null)); setError(""); };
  const sameAnswers = seats === row.seats && answers.every((a, i) => a === initialAnswers[i]);
  function submit() {
    if (names.some(g => !g.trim())) { setError("Escribe el nombre de cada invitado."); return; }
    if (mode === "answered" && answers.some(a => a === null)) { setError("Indica si cada invitado asistirá."); return; }
    // Unchanged answers keep the guest's dietary notes and message; clearing removes them.
    const response = mode === "pending" ? (answered ? null : undefined) : answered && sameAnswers ? undefined : { attendance: answers as boolean[] };
    onSave({ name, seats, guestNames: names, response });
  }
  const setAnswer = (i: number, value: boolean) => { setAnswers(answers.map((a, j) => j === i ? value : a)); setError(""); };
  return <form onSubmit={e => { e.preventDefault(); submit(); }}>
    <h2 id="mo-sheet-title" className="mo-serif" style={{ marginTop: 22, fontSize: 36 }}>Editar invitación</h2>
    <label className="mo-field">Nombre de la invitación (persona o familia)<input required maxLength={200} value={name} onChange={e => setName(e.target.value)} /></label>
    <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span className="mo-kicker is-dim" style={{ letterSpacing: ".24em" }}>Cupos</span><Stepper value={seats} min={1} max={20} onChange={changeSeats} label="cupos" /></div>
    <GuestNameFields names={names} onChange={list => { setNames(list); setError(""); }} />
    <p className="mo-kicker is-dim" style={{ marginTop: 24, letterSpacing: ".24em" }}>Asistencia</p>
    <div className="mo-seg" style={{ gridTemplateColumns: "1fr 1fr" }}>{([["pending", "Sin respuesta"], ["answered", "Con respuesta"]] as const).map(([k, label]) => <button key={k} type="button" aria-pressed={mode === k} onClick={() => { setMode(k); setError(""); }}>{label}</button>)}</div>
    {mode === "answered" && <div style={{ marginTop: 12 }}>
      {seats > 1 && <button type="button" className="mo-org-textbtn" style={{ textDecoration: "underline", textUnderlineOffset: 5 }} onClick={() => { setAnswers(answers.map(() => true)); setError(""); }}>Todos asistirán</button>}
      {names.map((guest, i) => <div key={i} className="mo-person">
        <span id={`mo-edit-seat-${i}`} style={{ fontSize: 19 }}>{guest.trim() || `Invitado ${i + 1}`}</span>
        <div className={`mo-switch ${answers[i] === true ? "is-yes" : answers[i] === false ? "is-no" : ""}`} role="group" aria-labelledby={`mo-edit-seat-${i}`}>
          <button type="button" aria-pressed={answers[i] === true} onClick={() => setAnswer(i, true)}>Sí</button>
          <button type="button" aria-pressed={answers[i] === false} onClick={() => setAnswer(i, false)}>No</button>
        </div>
      </div>)}
    </div>}
    <p className="is-dim" style={{ marginTop: 16, fontSize: 12, lineHeight: 1.6 }}>{mode === "pending" && answered ? "Al guardar se quitará la respuesta anterior, incluidas sus restricciones y mensaje. El enlace se conserva." : mode === "answered" && answered && seats !== row.seats ? "Cambiaste los cupos: indica de nuevo quién asistirá." : "Se conservan el enlace, las restricciones alimentarias y el mensaje."}</p>
    {error && <p role="alert" className="mo-error" style={{ fontSize: 12 }}>{error}</p>}
    <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <button type="submit" className="mo-pill is-light is-small" disabled={busy || !name.trim()}>{busy ? "Guardando…" : "Guardar"}</button>
      <button type="button" className="mo-pill is-outline is-small" onClick={onCancel}>Cancelar</button>
    </div>
  </form>;
}

function GuestNameFields({ names, onChange }: { names: string[]; onChange: (names: string[]) => void }) {
  return <fieldset className="mo-guest-names">
    <legend className="mo-kicker is-dim">Invitados</legend>
    {names.map((guest, i) => <label key={i}>
      <span aria-hidden="true">{i + 1}</span>
      <input maxLength={120} value={guest} onChange={e => onChange(names.map((g, j) => j === i ? e.target.value : g))} placeholder="Nombre y apellido" aria-label={`Nombre del invitado ${i + 1}`} />
    </label>)}
  </fieldset>;
}

function NewInvitation({ onCreate }: { onCreate: (name: string, seats: number, guestNames: string[], requestId: string) => Promise<boolean> }) {
  const [name, setName] = useState("");
  const [seats, setSeats] = useState(2);
  const [names, setNames] = useState(["", ""]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const changeSeats = (n: number) => { setSeats(n); setNames(list => resize(list, n, "")); setError(""); };
  return <form className="mo-card" onSubmit={async e => {
    e.preventDefault();
    if (!name.trim()) { setError("Escribe el nombre de la invitación."); return; }
    if (names.some(g => !g.trim())) { setError("Escribe el nombre de cada invitado."); return; }
    setBusy(true);
    if (await onCreate(name.trim(), seats, names.map(g => g.trim()), requestId)) { setName(""); setSeats(2); setNames(["", ""]); setRequestId(crypto.randomUUID()); }
    setBusy(false);
  }}>
    <p className="mo-serif" style={{ fontSize: 30 }}>Nueva invitación</p>
    <input className="mo-search" style={{ marginTop: 18, padding: "10px 0" }} maxLength={200} value={name} onChange={e => { setName(e.target.value); setError(""); }} placeholder="Nombre de la invitación" aria-label="Nombre de la invitación" />
    <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span className="mo-kicker is-dim" style={{ letterSpacing: ".24em" }}>Cupos</span><Stepper value={seats} min={1} max={20} onChange={changeSeats} label="cupos" /></div>
    <GuestNameFields names={names} onChange={list => { setNames(list); setError(""); }} />
    {error && <p role="alert" className="mo-error" style={{ fontSize: 12 }}>{error}</p>}
    <button type="submit" className="mo-pill is-light" style={{ marginTop: 24, height: 52, fontSize: 10 }} disabled={busy}>{busy ? "Creando…" : "Crear invitación"}</button>
  </form>;
}

function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (n: number) => void; label: string }) {
  return <div className="mo-stepper">
    <button type="button" aria-label={`Menos ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
    <output aria-live="polite">{value}</output>
    <button type="button" aria-label={`Más ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
  </div>;
}
