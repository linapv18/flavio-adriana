"use client";
import { weddingConfig as w } from "@/config/weddingConfig";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

const MusicContext = createContext<() => void>(() => {});

export default function WeddingMusic({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isOrganizer = pathname === "/organizacion" || pathname.startsWith("/organizacion/");
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOrganizer) audio.current?.pause();
  }, [isOrganizer]);

  function play() {
    if (isOrganizer || !w.music.enabled || !w.music.src) return;
    const player = audio.current;
    if (!player) return;
    setError(false);
    player.volume = 0.55;
    void player.play().catch(() => { setPlaying(false); setError(true); });
  }

  return (
    <MusicContext.Provider value={play}>
      {children}
      {w.music.enabled && w.music.src && <audio ref={audio} src={w.music.src} loop preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => { setPlaying(false); setError(true); }} />}
      {!isOrganizer && w.music.enabled && w.music.src && <div className="wedding-music">
        {error && <p role="status" className="music-notice">No se pudo reproducir. Toca para reintentar.</p>}
        <button type="button" onClick={() => playing ? audio.current?.pause() : play()} aria-label={playing ? "Pausar música" : "Reproducir música"} aria-pressed={playing} title={w.music.title}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            {playing ? <><path d="M9 5v14M15 5v14" /></> : <path d="m9 5 10 7-10 7V5Z" />}
          </svg>
          <span>{playing ? "Pausar" : "Música"}</span>
        </button>
        {w.music.playlistUrl && <a href={w.music.playlistUrl} className="music-notice">Playlist</a>}
      </div>}
    </MusicContext.Provider>
  );
}

// Lets the invitation's seal start the music as part of the same tap.
export const useWeddingMusic = () => useContext(MusicContext);
