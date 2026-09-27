import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight, AudioLines, Captions, FileText, Globe2, Mic, MicOff, Pause, RotateCcw, Square } from "lucide-react";
import { RESEARCH_LANGUAGES, findResearchLanguage } from "./research-languages.js";
import { createVoiceConversation, initialConversation } from "./voice-conversation.js";
import { recordingMimeType } from "./cloud-speech.js";
import { speechText } from "./speech.js";
import "./voice-guide.css";

const titles = {
  idle: "A voice for your curiosity.", starting: "One moment…", listening: "I’m listening.",
  transcribing: "Let me understand.", thinking: "Preparing a reply.", preparing: "An answer is on its way.",
  speaking: "Listen. Discover.", ready: "What else would you like to know?", paused: "Take your time.", error: "Let’s try that again.",
};

export default function VoiceGuide({ onSource, blocked = false, languageCode = "en", onLanguageChange }) {
  const language = findResearchLanguage(languageCode);
  const [state, setState] = useState(initialConversation);
  const [connection, setConnection] = useState("checking");
  const [captions, setCaptions] = useState(false);
  const [sources, setSources] = useState(false);
  const session = useRef(null);
  const supported = Boolean(window.isSecureContext && navigator.mediaDevices?.getUserMedia && recordingMimeType(window.MediaRecorder));
  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    const timeout = setTimeout(() => controller.abort(), 5000);
    fetch("/api/voice", { signal: controller.signal }).then(r => r.ok ? r.json() : null)
      .then(data => { if (mounted) setConnection(data?.cloud ? "connected" : "unavailable"); })
      .catch(() => { if (mounted) setConnection("unavailable"); }).finally(() => clearTimeout(timeout));
    return () => { mounted = false; clearTimeout(timeout); controller.abort(); };
  }, []);
  useEffect(() => {
    setState({ ...initialConversation });
    const current = createVoiceConversation({ language, onChange: setState, speechOptions: {
      mediaDevices: navigator.mediaDevices, Recorder: window.MediaRecorder, AudioClass: window.Audio,
    } });
    session.current = current;
    const hide = () => { if (document.hidden) current.pause(); };
    const offline = () => current.pause();
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("offline", offline);
    return () => { current.dispose(); session.current = null; document.removeEventListener("visibilitychange", hide); window.removeEventListener("offline", offline); };
  }, [language]);
  useEffect(() => { if (blocked) session.current?.pause(); }, [blocked]);
  const speaking = ["speaking", "preparing"].includes(state.phase);
  const busy = ["starting", "transcribing", "thinking", "ready"].includes(state.phase);
  const refs = state.answer?.citations || [];
  const canStart = supported && connection === "connected" && !blocked;
  function end() { session.current?.end(); setSources(false); setCaptions(false); }
  function toggleSources() { if (!sources) session.current?.pause(); setSources(!sources); }
  return (
    <section className={`voice-exhibit ${sources || captions ? "with-companion" : ""}`} data-phase={state.phase} aria-label="Voice conversation guide">
      <div className="voice-exhibit-top">
        <span className="voice-connection"><i />{connection === "checking" ? "CONNECTING" : connection === "connected" ? "VOICE CONNECTED" : "VOICE UNAVAILABLE"}</span>
        <label className="guide-language" htmlFor="guide-language"><Globe2 size={14} /><span className="sr-only">Conversation language</span>
          <select id="guide-language" value={languageCode} onChange={e => { session.current?.end(); onLanguageChange(e.target.value); setSources(false); }}>
            {RESEARCH_LANGUAGES.map(item => <option value={item.code} key={item.code}>{item.label}</option>)}
          </select>
        </label>
      </div>
      <div className="voice-exhibit-body">
        <div className="voice-presence">
          <div className="voice-seal" aria-hidden="true">
            <div className="voice-seal-ring ring-outer" /><div className="voice-seal-ring ring-inner" />
            <div className="voice-seal-core"><span lang="hi">अ</span></div>
            <div className="voice-bars">{Array.from({ length: 9 }, (_, index) => <i key={index} style={{ "--bar-index": index, "--bar-size": `${12 + Math.sin(index * 1.3) ** 2 * 24}px` }} />)}</div>
          </div>
          <span className="voice-exhibit-eyebrow">ABHILEKH / THE ARCHIVE, IN CONVERSATION</span>
          <h2>{titles[state.phase]}</h2>
          <p className="voice-session-status" role="status">{state.error || (!supported ? "Microphone recording is unavailable in this browser. Open the site in Chrome or Edge." : connection === "unavailable" ? "The voice service is unavailable. Please try again later." : state.notice || "Ask about a life, an idea, a moment that shaped India.")}</p>
          <div className="voice-turn-indicator"><span>{state.phase === "listening" ? <Mic size={13} /> : <MicOff size={13} />}{state.phase === "listening" ? "MICROPHONE ON" : "MICROPHONE OFF"}</span><span>{state.turns ? `${String(state.turns).padStart(2, "0")} ${state.turns === 1 ? "ANSWER" : "ANSWERS"}` : "A CONVERSATION AT YOUR PACE"}</span></div>
        </div>
        {(captions || sources) && <aside className="voice-companion" aria-label="Conversation details" tabIndex={0}>
          {state.error && <p role="status">{state.error}</p>}
          {captions && <div className="voice-caption-content">
            <span className="eyebrow">LATEST EXCHANGE</span>
            {state.question ? <><small>YOU ASKED</small><p lang={languageCode}>{state.question}</p></> : <p>Your spoken question will appear here.</p>}
            {state.answer && <><small>THE GUIDE</small><p lang={state.answer.language || languageCode}>{speechText(state.answer.answer)}</p></>}
          </div>}
          {sources && <div className="voice-evidence"><span className="eyebrow">SOURCES FOR THE LATEST ANSWER</span>
            {refs.length ? refs.map(ref => <button key={ref.number} onClick={() => { session.current?.pause(); onSource({ ...ref, institution: ref.domain, type: ref.kind, isResearch: true }); }}><span>{ref.number}</span><span>{ref.title}<small>{ref.domain}</small></span><ArrowUpRight size={15} /></button>) : <p>{state.answer?.mode === "conversation" ? "Greetings and everyday replies do not need source references." : state.answer ? "This answer has limited source support. Please verify it before relying on it." : "References will appear after the guide answers."}</p>}
            {!!refs.length && <p>Check claims against the original publications.</p>}
          </div>}
        </aside>}
      </div>
      <div className="voice-exhibit-controls">
        <div className="voice-main-controls">
          {!state.active ? <button className="voice-primary" disabled={!canStart} onClick={() => { setSources(false); session.current?.start(); }}><Mic size={20} />{state.phase === "idle" ? "Start conversation" : "Resume conversation"}</button>
            : state.phase === "listening" ? <button className="voice-primary" onClick={() => session.current?.finish()}><AudioLines size={19} />Answer now</button>
              : speaking ? <button className="voice-primary" onClick={() => session.current?.interrupt()}><Mic size={19} />Interrupt & speak</button>
                : <button className="voice-primary" disabled={busy}><AudioLines size={19} />{state.phase === "thinking" ? "Finding an answer…" : state.phase === "transcribing" ? "Understanding…" : "Connecting…"}</button>}
          {state.active && <button className="voice-secondary" onClick={() => session.current?.pause()} aria-label="Pause conversation"><Pause size={19} /><span>Pause</span></button>}
          {(state.active || state.phase !== "idle") && <button className="voice-secondary" onClick={end} aria-label="End conversation"><Square size={17} /><span>End</span></button>}
        </div>
        <p className="voice-interaction-hint">{state.phase === "listening" ? "Pause after your question. The guide will answer automatically." : state.active ? "The microphone stays off while the guide answers." : "Speak naturally. Listen to the reply. Continue with a follow-up."}</p>
        <div className="voice-utility-controls">
          <button aria-pressed={captions} onClick={() => setCaptions(!captions)}><Captions size={16} />Captions</button>
          <button aria-pressed={sources} onClick={toggleSources}><FileText size={15} />Sources{refs.length > 0 && <span>{refs.length}</span>}</button>
          {state.answer && !state.active && <button onClick={() => { setSources(false); session.current?.replay(); }}><RotateCcw size={14} />Replay answer</button>}
        </div>
      </div>
      <p className="voice-exhibit-note">Audio is processed online. Starting enables follow-up listening until you pause or end. This guide represents the archive.</p>
    </section>
  );
}
