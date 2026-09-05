"use client";

import { useEffect, useRef, useState } from "react";
import { Music, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useInvitation } from "@/components/InvitationContext";

export default function MusicPlayer() {
  const invitation = useInvitation();
  const songs = invitation?.content.music ?? [];
  const autoplayRequested = invitation?.content.musicSettings?.autoplayRequested ?? false;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const song = songs[index];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !song) return;
    audio.src = song.url;
    audio.muted = muted;
    if (playing) audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }, [song, playing, muted]);

  useEffect(() => {
    if (!autoplayRequested || !song) return;
    const startAfterGesture = () => {
      setPlaying(true);
      window.removeEventListener("pointerdown", startAfterGesture);
      window.removeEventListener("keydown", startAfterGesture);
    };
    window.addEventListener("pointerdown", startAfterGesture, { once: true });
    window.addEventListener("keydown", startAfterGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", startAfterGesture);
      window.removeEventListener("keydown", startAfterGesture);
    };
  }, [autoplayRequested, song]);

  if (!song) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 min-w-[260px] rounded-2xl border border-black/10 bg-white/95 p-3 shadow-xl backdrop-blur-md">
      <audio
        ref={audioRef}
        preload="metadata"
        onEnded={() => songs.length > 1 ? setIndex((current) => (current + 1) % songs.length) : setPlaying(false)}
      />
      <div className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-rose-100">
          {song.cover ? <img src={song.cover} alt="" className="h-full w-full object-cover" /> : <Music className="size-5 text-rose-500" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-800">{song.title || "Wedding Music"}</p>
          <p className="truncate text-xs text-gray-500">{song.artist || ""}</p>
        </div>
        <button type="button" onClick={() => setPlaying((value) => !value)} className="flex size-9 items-center justify-center rounded-full bg-rose-500 text-white" aria-label={playing ? "Pause music" : "Play music"}>
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <button type="button" onClick={() => setMuted((value) => !value)} className="text-gray-600" aria-label={muted ? "Unmute" : "Mute"}>
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      </div>
      {songs.length > 1 && (
        <div className="mt-2 flex gap-1 overflow-x-auto pt-1">
          {songs.map((item, itemIndex) => (
            <button key={item.id} type="button" onClick={() => { setIndex(itemIndex); setPlaying(true); }} className={`rounded px-2 py-1 text-[10px] ${itemIndex === index ? "bg-rose-100 text-rose-700" : "bg-gray-100 text-gray-600"}`}>
              {itemIndex + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
