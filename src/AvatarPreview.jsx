import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, Captions, Info, Mic, Pause, Play, RotateCcw, Video, Volume2, VolumeX } from "lucide-react";
import "./avatar-preview.css";

export default function AvatarPreview({ onVoice, reducedMotion = false, blocked = false }) {
  const player = useRef(null);
  const [pane, setPane] = useState("preview");
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [ended, setEnded] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [error, setError] = useState("");
  const [systemReducedMotion, setSystemReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const media = player.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReducedMotion(preference.matches);
    const hide = () => { if (document.hidden) media?.pause(); };
    preference.addEventListener("change", update);
    document.addEventListener("visibilitychange", hide);
    return () => { media?.pause(); preference.removeEventListener("change", update); document.removeEventListener("visibilitychange", hide); };
  }, []);
  useEffect(() => {
    if (blocked || pane !== "preview" || reducedMotion || systemReducedMotion) player.current?.pause();
  }, [blocked, pane, reducedMotion, systemReducedMotion]);
  async function playIntroduction(restart = false) {
    const media = player.current;
    if (!media || blocked) return;
    if (restart || media.ended) media.currentTime = 0;
    setError("");
    try { await media.play(); }
    catch { setError("Playback could not start. Please tap Play to try again."); }
  }
  function toggleSound() {
    const media = player.current;
    if (!media || blocked) return;
    if (muted) {
      media.muted = false;
      if (!media.volume) media.volume = 1;
      // Start the spoken introduction again so its opening isn't missed.
      void playIntroduction(true);
    } else media.muted = true;
  }
  function toggleCaptions() {
    const next = !captions;
    for (const track of player.current.textTracks) track.mode = next ? "showing" : "hidden";
    setCaptions(next);
  }
  return <>
    <div className="guide-pane-switch" aria-label="Avatar preview panels">
      <button aria-pressed={pane === "preview"} aria-controls="siddharth-preview" onClick={() => setPane("preview")}><Video size={15} />Preview</button>
      <button aria-pressed={pane === "about"} aria-controls="siddharth-information" onClick={() => setPane("about")}><Info size={15} />About Siddharth</button>
    </div>
    <section className="avatar-preview" data-pane={pane} aria-label="Siddharth avatar preview">
      <div className="avatar-film" id="siddharth-preview">
        <div className="avatar-film-header"><span><i />RECORDED PREVIEW</span></div>
        <div className="avatar-video-frame">
          <video ref={player} src="/media/siddharth-introduction.mp4" poster="/media/siddharth-poster.jpg"
            aria-label="Siddharth's recorded introduction" aria-describedby="avatar-development-note"
            playsInline muted autoPlay={!reducedMotion && !systemReducedMotion && !blocked} preload="metadata"
            onPlay={() => { if (blocked || document.hidden || !player.current.getClientRects().length) player.current?.pause(); else { setPlaying(true); setEnded(false); } }}
            onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setEnded(true); }}
            onVolumeChange={() => setMuted(player.current.muted || player.current.volume === 0)}
            onError={() => setError("The introduction could not load. Please refresh to try again.")}>
            <track kind="captions" src="/media/siddharth-introduction.en.vtt" srcLang="en" label="English" default />
            Your browser does not support this video.
          </video>
        </div>
        <div className="avatar-film-controls">
          <button className="avatar-icon-control" onClick={() => playing ? player.current?.pause() : playIntroduction()} disabled={blocked}
            aria-label={playing ? "Pause introduction" : ended ? "Replay introduction" : "Play introduction"} title={playing ? "Pause" : ended ? "Replay" : "Play"}>
            {playing ? <Pause size={15} /> : ended ? <RotateCcw size={15} /> : <Play size={15} />}
          </button>
          <button onClick={toggleSound} disabled={blocked} aria-label={muted ? "Play introduction with sound" : "Mute introduction"}>
            {muted ? <Volume2 size={15} /> : <VolumeX size={15} />}<span className="avatar-sound-label">{muted ? "Sound on" : "Mute"}</span>
          </button>
          <button className="avatar-icon-control" onClick={toggleCaptions} aria-pressed={captions} aria-label="Video captions" title="Captions"><Captions size={15} /></button>
        </div>
        {error && <p className="avatar-playback-error" role="status">{error}</p>}
      </div>
      <div className="avatar-details">
        <div className="avatar-info" id="siddharth-information" tabIndex={0} aria-label="About Siddharth">
          <span className="eyebrow">A FACE FOR THE ARCHIVE</span>
          <h2>Meet <em>Siddharth.</em></h2>
          <p className="avatar-role">Your conversational archive guide.</p>
          <div className="avatar-development" id="avatar-development-note">
            <span>IN DEVELOPMENT</span>
            <p>This is a recorded concept demonstration. Open the Interactive avatar tab to explore the experimental 3D guide when its service is connected.</p>
          </div>
          <div className="avatar-plans" aria-label="Planned avatar experience">
            <span className="eyebrow">THE EXPERIENCE WE’RE BUILDING</span>
            <div><span>01</span><p><strong>Ask face to face</strong>Speak naturally and ask follow-up questions.</p></div>
            <div><span>02</span><p><strong>Explore in your language</strong>Discover Dr. Ambedkar’s life, writings and ideas.</p></div>
            <div><span>03</span><p><strong>Follow the original sources</strong>Open the evidence behind each answer.</p></div>
          </div>
        </div>
        <div className="avatar-actions">
          <p className="avatar-mobile-note"><strong>Siddharth · Recorded introduction</strong>Explore the experimental guide in the Interactive avatar tab.</p>
          <button className="button primary wide" onClick={onVoice}><Mic size={16} />Try live voice conversation<ArrowRight size={16} /></button>
          <p className="avatar-identity">Siddharth represents Abhilekh, not Dr. Ambedkar.</p>
        </div>
      </div>
    </section>
  </>;
}
