"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "../icon";

interface VideoPlayerProps {
  src: string;
  poster?: string | undefined;
  captionsSrc?: string | undefined;
  label: string;
  onPlay?: (() => void) | undefined;
  onError?: (() => void) | undefined;
  style?: React.CSSProperties | undefined;
}

const SPEEDS = [1, 1.25, 1.5, 2, 0.75] as const;

const clock = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const m = Math.floor(whole / 60);
  const s = String(whole % 60).padStart(2, "0");
  return `${m}:${s}`;
};

// Phosphor pause, speaker-high, speaker-x, closed-captioning, arrows-out and arrows-in, 256 viewbox.
const PAUSE = "M216,48V208a16,16,0,0,1-16,16H168a16,16,0,0,1-16-16V48a16,16,0,0,1,16-16h32A16,16,0,0,1,216,48ZM88,32H56A16,16,0,0,0,40,48V208a16,16,0,0,0,16,16H88a16,16,0,0,0,16-16V48A16,16,0,0,0,88,32Z";
const SOUND = "M155.51,24.81a8,8,0,0,0-8.42.88L77.25,80H32A16,16,0,0,0,16,96v64a16,16,0,0,0,16,16H77.25l69.84,54.31A8,8,0,0,0,160,224V32A8,8,0,0,0,155.51,24.81ZM144,207.64,84.91,161.69A7.94,7.94,0,0,0,80,160H32V96H80a7.94,7.94,0,0,0,4.91-1.69L144,48.36ZM208,128a39.93,39.93,0,0,1-10,26.46,8,8,0,0,1-12-10.58,24,24,0,0,0,0-31.76,8,8,0,1,1,12-10.58A39.93,39.93,0,0,1,208,128Z";
const MUTED = "M155.51,24.81a8,8,0,0,0-8.42.88L77.25,80H32A16,16,0,0,0,16,96v64a16,16,0,0,0,16,16H77.25l69.84,54.31A8,8,0,0,0,160,224V32A8,8,0,0,0,155.51,24.81ZM144,207.64,84.91,161.69A7.94,7.94,0,0,0,80,160H32V96H80a7.94,7.94,0,0,0,4.91-1.69L144,48.36ZM237.66,138.34a8,8,0,0,1-11.32,11.32L208,131.31l-18.34,18.35a8,8,0,0,1-11.32-11.32L196.69,120l-18.35-18.34a8,8,0,0,1,11.32-11.32L208,108.69l18.34-18.35a8,8,0,0,1,11.32,11.32L219.31,120Z";
const CAPTIONS = "M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200ZM104,120a8,8,0,0,1-8,8H88v16a8,8,0,0,1-16,0V112a8,8,0,0,1,8-8H96A8,8,0,0,1,104,120Zm80,0a8,8,0,0,1-8,8h-8v16a8,8,0,0,1-16,0V112a8,8,0,0,1,8-8h16A8,8,0,0,1,184,120Z";
const EXPAND = "M216,48V96a8,8,0,0,1-16,0V67.31l-42.34,42.35a8,8,0,0,1-11.32-11.32L188.69,56H160a8,8,0,0,1,0-16h48A8,8,0,0,1,216,48ZM98.34,146.34,56,188.69V160a8,8,0,0,0-16,0v48a8,8,0,0,0,8,8H96a8,8,0,0,0,0-16H67.31l42.35-42.34a8,8,0,0,0-11.32-11.32Z";

/**
 * A video player with its own controls, in place of the browser's. Play, seek, time, mute, speed, captions (when the video has
 * a captions file) and full screen. Space or K plays, the arrow keys seek by five seconds, M mutes, F goes full screen.
 */
export function VideoPlayer({ src, poster, captionsSrc, label, onPlay, onError, style }: VideoPlayerProps): React.JSX.Element {
  const shell = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [length, setLength] = useState(0);
  const [muted, setMuted] = useState(false);
  const [captions, setCaptions] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);

  useEffect(() => {
    const track = video.current?.textTracks[0];
    if (track) track.mode = captions ? "showing" : "hidden";
  }, [captions]);

  const toggle = (): void => {
    const el = video.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  };
  const seek = (to: number): void => {
    const el = video.current;
    if (el) el.currentTime = Math.min(Math.max(0, to), Number.isFinite(el.duration) ? el.duration : to);
  };
  const fullscreen = (): void => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void shell.current?.requestFullscreen?.();
  };
  const cycleSpeed = (): void => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length] ?? 1;
    setSpeed(next);
    if (video.current) video.current.playbackRate = next;
  };

  const onKey = (event: React.KeyboardEvent): void => {
    if (event.target instanceof HTMLInputElement) return;
    const key = event.key.toLowerCase();
    if (key === " " || key === "k") toggle();
    else if (key === "arrowleft") seek((video.current?.currentTime ?? 0) - 5);
    else if (key === "arrowright") seek((video.current?.currentTime ?? 0) + 5);
    else if (key === "m") setMuted((m) => !m);
    else if (key === "f") fullscreen();
    else return;
    event.preventDefault();
  };

  return (
    <div className="vp" ref={shell} style={style} onKeyDown={onKey}>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard users play with the Play button and the shortcut keys on the player */}
      <video
        ref={video}
        className="vp-v"
        preload="metadata"
        playsInline
        aria-label={label}
        src={src}
        poster={poster}
        muted={muted}
        onClick={toggle}
        onPlay={() => {
          setPlaying(true);
          onPlay?.();
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setLength(e.currentTarget.duration)}
        onError={onError}
      >
        {captionsSrc ? <track kind="captions" src={captionsSrc} srcLang="en" label="Captions" /> : null}
      </video>
      {!playing ? (
        <button type="button" className="vp-big" aria-label={`Play ${label}`} onClick={toggle}>
          <Icon name="play" />
        </button>
      ) : null}
      <div className="vp-bar">
        <button type="button" className="vp-b" aria-label={playing ? "Pause" : "Play"} onClick={toggle}>
          <Icon {...(playing ? { d: PAUSE } : { name: "play" as const })} />
        </button>
        <span className="vp-t">{clock(time)}</span>
        <input
          type="range"
          className="vp-seek"
          aria-label="Seek"
          min={0}
          max={length > 0 ? length : 0}
          step={0.1}
          value={Math.min(time, length > 0 ? length : 0)}
          onChange={(e) => seek(Number(e.target.value))}
          style={{ ["--vp-fill" as string]: `${length > 0 ? (time / length) * 100 : 0}%` }}
        />
        <span className="vp-t">{clock(length)}</span>
        <button type="button" className="vp-b vp-sp" aria-label={`Speed ${speed} times, change`} onClick={cycleSpeed}>
          {speed}x
        </button>
        {captionsSrc ? (
          <button type="button" className={`vp-b${captions ? " vp-on" : ""}`} aria-label="Captions" aria-pressed={captions} onClick={() => setCaptions((c) => !c)}>
            <Icon d={CAPTIONS} />
          </button>
        ) : null}
        <button type="button" className="vp-b" aria-label={muted ? "Unmute" : "Mute"} aria-pressed={muted} onClick={() => setMuted((m) => !m)}>
          <Icon d={muted ? MUTED : SOUND} />
        </button>
        <button type="button" className="vp-b" aria-label="Full screen" onClick={fullscreen}>
          <Icon d={EXPAND} />
        </button>
      </div>
    </div>
  );
}
