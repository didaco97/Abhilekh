import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import TimelineExhibit from "./TimelineExhibit.jsx";
import ResearchSources from "./ResearchSources.jsx";
import VoiceGuide from "./VoiceGuide.jsx";
import AvatarPreview from "./AvatarPreview.jsx";
import PrototypeWelcome from "./PrototypeWelcome.jsx";
import Workspaces, { WorkspacesPreview } from "./Workspaces.jsx";
import useResearchVoice from "./useResearchVoice.js";
import { RESEARCH_LANGUAGES, findResearchLanguage } from "./research-languages.js";
import {
  ArrowUpRight,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
  Bookmark,
  Check,
  Plus,
  Globe2,
  Maximize,
  Minimize,
  MessageSquare,
  Mic,
  Volume2,
  Square,
  Video,
  Play,
  Pause,
  MapPin,
  FileText,
  ExternalLink,
  Layers,
  Download,
  RotateCcw,
  Info,
  Accessibility,
  Link2,
  Menu,
  ShieldCheck,
} from "lucide-react";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import { events, sources, photos } from "./archive.js";
import { searchArchive } from "./search.js";
import "./styles.css";
import "./research-room.css";
import "./guide-room.css";

const routes = ["home", "timeline", "research", "guide", "workspaces"];
const routeFromHash = () =>
  routes.includes(location.hash.slice(1)) ? location.hash.slice(1) : "home";
export default function App() {
  const [view, setView] = useState(routeFromHash);
  const [welcomeOpen, setWelcomeOpen] = useState(true);
  const [eventModal, setEventModal] = useState(null);
  const [notice, setNotice] = useState(null);
  const [source, setSource] = useState(null);
  const [credits, setCredits] = useState(false);
  const [access, setAccess] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [saved, setSaved] = useState([]);
  const [showNotesExport, setShowNotesExport] = useState(false);
  const [messages, setMessages] = useState([]);
  const [researchPending, setResearchPending] = useState(false);
  const [researchPane, setResearchPane] = useState("chat");
  const [guideMode, setGuideMode] = useState("voice");
  const [sourceSelection, setSourceSelection] = useState(null);
  const researchRequest = useRef(null);
  const [query, setQuery] = useState("");
  const [answerLanguage, setAnswerLanguage] = useState("en");
  const [autoRead, setAutoRead] = useState(false);
  const language = findResearchLanguage(answerLanguage);
  const voice = useResearchVoice(setQuery, view === "research" && !welcomeOpen, language);
  const lastVoiceAnswer = useRef(null);
  const [context, setContext] = useState(null);
  const [largeText, setLargeText] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const chatArea = useRef(null);
  const followLatest = useRef(true);
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const answer = messages.at(-1);
    if (answer?.mode !== "web-research" || answer.id === lastVoiceAnswer.current) return;
    lastVoiceAnswer.current = answer.id;
    if (autoRead && view === "research" && !welcomeOpen && !document.hidden)
      voice.read(answer, findResearchLanguage(answer.language) || RESEARCH_LANGUAGES[0]);
  }, [messages, autoRead, view, welcomeOpen]);
  useEffect(() => () => researchRequest.current?.abort(), []);
  useEffect(() => {
    const route = () => {
      setView(routeFromHash());
      setMenu(false);
      window.scrollTo({ top: 0 });
    };
    const net = () => setOnline(navigator.onLine);
    const fs = () => setFullScreen(Boolean(document.fullscreenElement));
    window.addEventListener("hashchange", route);
    window.addEventListener("online", net);
    window.addEventListener("offline", net);
    document.addEventListener("fullscreenchange", fs);
    return () => {
      window.removeEventListener("hashchange", route);
      window.removeEventListener("online", net);
      window.removeEventListener("offline", net);
      document.removeEventListener("fullscreenchange", fs);
    };
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("large-text", largeText);
    document.documentElement.classList.toggle("reduce-motion", reduceMotion);
  }, [largeText, reduceMotion]);
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(""), 3200);
      return () => clearTimeout(id);
    }
  }, [toast]);
  useEffect(() => {
    const container = chatArea.current;
    if (container && followLatest.current && researchPane === "chat")
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "instant",
      });
  }, [messages, researchPending, view, researchPane]);
  const researchAnswers = messages.filter((m) => m.mode === "web-research");
  const sourceAnswer =
    researchAnswers.find((m) => m.id === sourceSelection?.answerId) ||
    researchAnswers.at(-1);
  function showReferences(message, number = null) {
    setSourceSelection({ answerId: message.id, number });
    setResearchPane("sources");
  }
  function navigate(next) {
    if (next !== "research") voice.stop();
    setView(next);
    location.hash = next;
    setMenu(false);
    window.scrollTo({ top: 0 });
  }
  function saveRecord(event) {
    if (saved.some((e) => e.id === event.id)) {
      setSaved(saved.filter((e) => e.id !== event.id));
      setToast("Removed from your visit notes");
    } else {
      setSaved([...saved, event]);
      setToast("Source saved to your visit notes");
    }
  }
  function cancelResearch() {
    researchRequest.current?.abort();
    researchRequest.current = null;
    setResearchPending(false);
  }
  async function ask(text, linkedEvent = context) {
    if (!text.trim() || researchRequest.current) return;
    voice.stop();
    const question = text.trim();
    followLatest.current = true;
    setResearchPane("chat");
    setSourceSelection(null);
    const history = messages
      .filter((m) => m.role === "user" || m.mode === "web-research")
      .slice(-6)
      .map((m) => ({
        role: m.role,
        content: m.role === "user" ? m.text : m.answer,
      }));
    const controller = new AbortController();
    researchRequest.current = controller;
    setResearchPending(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", text: question, language: answerLanguage, id: crypto.randomUUID() },
    ]);
    setQuery("");
    const timeout = setTimeout(() => controller.abort("timeout"), 50000);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: question,
          contextId: linkedEvent?.id,
          history,
          language: answerLanguage,
        }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.message || "Live research is unavailable. Please try again.",
        );
      if (researchRequest.current !== controller) return;
      followLatest.current = true;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", ...data, id: crypto.randomUUID(), query: question, matches: [] },
      ]);
    } catch (error) {
      if (researchRequest.current !== controller) return;
      followLatest.current = true;
      const fallback = searchArchive(question, linkedEvent?.id);
      const reason = controller.signal.aborted
        ? "Research took longer than expected. Please try again."
        : error instanceof TypeError
          ? "The research service is unreachable. Please check your connection."
          : error.message;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          ...fallback,
          mode: "fallback",
          intro:
            reason +
            (fallback.matches.length
              ? " Here are related curated exhibit records in the meantime."
              : " The timeline and original-page preview are still available."),
        },
      ]);
    } finally {
      clearTimeout(timeout);
      if (researchRequest.current === controller) {
        researchRequest.current = null;
        setResearchPending(false);
      }
    }
  }
  function knowMore(event) {
    cancelResearch();
    setContext(event);
    setEventModal(null);
    navigate("research");
    ask(event.question, event);
  }
  const notesText =
    "# Abhilekh · Visit notes\n\n" +
    saved
      .map(
        (e) =>
          `## ${e.title} (${e.date})\n${e.summary}\n\n${e.references ? "AI research summary; check the cited sources." : "Exhibit summary. Consult the linked originals."}\n${(e.references || e.sourceIds.map((id) => sources[id])).map((s) => `${s.number ? "[" + s.number + "] " : ""}${s.title || s.institution}: ${s.url}`).join("\n")}`,
      )
      .join("\n\n---\n\n");
  function exportNotes() {
    setShowNotesExport(true);
    const url = URL.createObjectURL(
      new Blob([notesText], { type: "text/markdown;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "abhilekh-visit-notes.md";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setToast("Fullscreen is unavailable in this browser.");
    }
  }
  function resetVisit() {
    voice.reset();
    setAnswerLanguage("en");
    setAutoRead(false);
    cancelResearch();
    setSaved([]);
    setShowNotesExport(false);
    setMessages([]);
    setSourceSelection(null);
    setResearchPane("chat");
    setContext(null);
    setQuery("");
    setNotesOpen(false);
    navigate("home");
    setWelcomeOpen(true);
    setToast("A new visit is ready");
  }
  function openEvent(event) {
    setEventModal(event);
  }
  const sourceButtons = (event) =>
    event.sourceIds.map((id, i) => (
      <button
        className="source-link"
        onClick={() => setSource(sources[id])}
        key={id}
      >
        <FileText size={14} />
        <span>{sources[id].institution}</span>
        <ArrowUpRight size={14} />
      </button>
    ));
  return (
    <div className={`app-shell${view === "research" ? " research-shell" : view === "guide" ? " guide-shell" : ""}`}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content").focus();
        }}
      >
        Skip to content
      </a>
      <header className="site-header">
        <button
          className="brand"
          onClick={() => navigate("home")}
          aria-label="Abhilekh home"
        >
          <span className="brand-mark" lang="hi">
            अ
          </span>
          <span>
            <strong>
              abhilekh<span className="brand-period">.</span>
            </strong>
            <small>THE AMBEDKAR ARCHIVE</small>
          </span>
        </button>
        <nav
          aria-label="Main navigation"
          className={menu ? "main-nav open" : "main-nav"}
        >
          {[
            ["home", "Discover"],
            ["timeline", "Life & timeline"],
            ["research", "Research room"],
            ["guide", "AI guide"],
            ["workspaces", "Workspaces"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              aria-current={view === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              {label}
              {id === "guide" && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="language-button"
            onClick={() => {
              if (view === "guide") {
                setGuideMode("voice");
                requestAnimationFrame(() => document.getElementById("guide-language")?.focus());
                return;
              }
              navigate("research");
              setResearchPane("chat");
              requestAnimationFrame(() => document.getElementById("research-language")?.focus());
            }}
            aria-label={view === "guide" ? "Choose conversation language" : "Choose research language"}
          >
            <Globe2 size={16} /> {answerLanguage.toUpperCase()}
          </button>
          <button
            className="icon-button"
            aria-label="Visit notes"
            onClick={() => setNotesOpen(true)}
          >
            <Bookmark size={19} />
            {saved.length > 0 && (
              <span className="count-dot">{saved.length}</span>
            )}
          </button>
          <button
            className="icon-button fullscreen-button"
            aria-label={
              fullScreen ? "Exit fullscreen" : "Enter kiosk fullscreen"
            }
            onClick={toggleFullscreen}
          >
            {fullScreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
          <button
            className="icon-button mobile-menu"
            aria-label="Toggle navigation"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>
      {!online && (
        <div className="offline-note">
          You’re offline. Already-loaded exhibit records remain available. Live
          research and external source pages need internet.
        </div>
      )}
      <main id="main-content" tabIndex={-1}>
        {view === "home" && (
          <div className="home-view view-enter">
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="tiny-line" /> A LIFE. A VISION. AN ENDURING
                  LEGACY.
                </div>
                <h1>
                  A life that
                  <br />
                  changed
                  <br />
                  <em>India.</em>
                </h1>
                <p className="hero-description">
                  Enter the world of Dr. B. R. Ambedkar.
                  <br />
                  Explore the moments, read the original words,
                  <br className="desktop-break" /> and follow the ideas that
                  shaped a nation.
                </p>
                <div className="hero-buttons">
                  <button
                    className="button primary"
                    onClick={() => navigate("timeline")}
                  >
                    Explore his journey <ArrowUpRight size={19} />
                  </button>
                  <button
                    className="button text-button"
                    onClick={() => navigate("research")}
                  >
                    Ask the archive <ArrowRight size={17} />
                  </button>
                </div>
                <div className="hero-footnote">
                  <span className="status-dot" /> An interactive heritage
                  experience <span className="footnote-separator">/</span> SIH
                  MVP
                </div>
              </div>
              <div className="hero-art">
                <div className="portrait-frame">
                  <div className="frame-topline">
                    <span>THE SCHOLAR · THE REFORMER · THE NATION-BUILDER</span>
                    <span>01</span>
                  </div>
                  <img
                    className="hero-portrait"
                    src={photos.portrait.src}
                    alt="Archival portrait of Dr. B. R. Ambedkar"
                  />
                  <div className="portrait-wash" />
                  <div className="portrait-caption">
                    <span>DR. BHIMRAO RAMJI</span>
                    <strong>Ambedkar</strong>
                    <span>1891 — 1956</span>
                  </div>
                  <button
                    className="photo-credit"
                    onClick={() => setCredits(true)}
                    aria-label="View photograph credits"
                  >
                    <Info size={15} />
                  </button>
                </div>
                <div className="archival-label">
                  <span className="label-rule" />
                  <span>
                    Ideas live on.
                    <br />
                    <em>Begin a conversation.</em>
                  </span>
                </div>
                <div className="vertical-label">
                  PRESERVING THE PAST. OPENING POSSIBILITIES.
                </div>
              </div>
            </section>
            <TimelineExhibit
              compact
              onOpen={openEvent}
              onAsk={knowMore}
              onAll={() => navigate("timeline")}
              onCredits={() => setCredits(true)}
              reducedMotion={reduceMotion}
              paused={Boolean(welcomeOpen || eventModal || credits || access)}
            />
            <section className="conversation-banner">
              <div className="banner-orbit" aria-hidden="true">
                <MessageSquare size={32} />
                <span />
                <span />
              </div>
              <div>
                <span className="eyebrow">A NEW WAY TO EXPLORE</span>
                <h2>History invites a conversation.</h2>
                <p>Meet the archive guide. Bring your curiosity.</p>
              </div>
              <button
                className="button light"
                onClick={() => navigate("guide")}
              >
                Explore the AI guide <ArrowUpRight size={18} />
              </button>
            </section>
            <WorkspacesPreview onPreview={setNotice} onAll={() => navigate("workspaces")} />
          </div>
        )}
        {view === "timeline" && (
          <div className="timeline-museum-view view-enter">
            <TimelineExhibit
              onOpen={openEvent}
              onAsk={knowMore}
              onCredits={() => setCredits(true)}
              reducedMotion={reduceMotion}
              paused={Boolean(welcomeOpen || eventModal || credits || access)}
            />
          </div>
        )}
        {view === "research" && (
          <div className="research-view view-enter">
            <div className="page-intro">
              <div>
                <span className="eyebrow">02 / RESEARCH ROOM</span>
                <h1>
                  Curiosity, meet <em>evidence.</em>
                </h1>
              </div>
              <div className="retrieval-label">
                <span className="status-dot" /> Source-linked research
                <small>Ask a question · follow the evidence</small>
              </div>
            </div>
            <div className="research-pane-switch" aria-label="Research panels">
              <button
                aria-pressed={researchPane === "chat"}
                aria-controls="research-conversation"
                onClick={() => setResearchPane("chat")}
              >
                <MessageSquare size={15} /> Chat
              </button>
              <button
                aria-pressed={researchPane === "sources"}
                aria-controls="research-sources"
                onClick={() => setResearchPane("sources")}
              >
                <FileText size={15} /> Sources
                {!!sourceAnswer?.citations?.length && <span>{sourceAnswer.citations.length}</span>}
              </button>
            </div>
            <div className="research-layout" data-pane={researchPane}>
              <section
                id="research-conversation"
                className="chat-panel"
                aria-label="Research conversation"
              >
                <div className="chat-topline">
                  <span>
                    <MessageSquare size={17} /> Ask the archive
                  </span>
                  <button
                    className="subtle-link"
                    onClick={() => {
                      cancelResearch();
                      voice.reset();
                      setMessages([]);
                      setSourceSelection(null);
                      followLatest.current = true;
                      setContext(null);
                      setQuery("");
                    }}
                  >
                    New conversation <Plus size={15} />
                  </button>
                </div>
                <div className="research-language-bar">
                  <label htmlFor="research-language"><Globe2 size={14} /> Answer in</label>
                  <select id="research-language" value={answerLanguage} disabled={researchPending || voice.listening}
                    onChange={e => { voice.stop(); setAnswerLanguage(e.target.value); setAutoRead(false); }} title="Applies to new answers; sources stay in their original language">
                    {RESEARCH_LANGUAGES.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
                  </select>
                  <label className="auto-read-option" title={voice.canRead(language.locale) ? "Read new replies aloud" : `No ${language.name} reading voice available on this device`}>
                    <input type="checkbox" checked={autoRead} disabled={!voice.canRead(language.locale)} onChange={e => { setAutoRead(e.target.checked); if (!e.target.checked) voice.stop(); }} />
                    Read replies
                  </label>
                </div>
                {context && (
                  <div className="context-ribbon">
                    <Link2 size={14} />
                    <span>
                      Exploring {context.year}: {context.title}
                    </span>
                    <button
                      className="icon-button small"
                      aria-label="Remove event context"
                      onClick={() => setContext(null)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <div
                  className="chat-messages"
                  aria-live="polite"
                  aria-label="Conversation messages"
                  tabIndex={0}
                  ref={chatArea}
                  onScroll={(e) => {
                    const node = e.currentTarget;
                    followLatest.current = node.scrollHeight - node.scrollTop - node.clientHeight < 80;
                  }}
                >
                  {!messages.length ? (
                    <div className="chat-welcome">
                      <div className="archive-symbol">
                        <BookOpen size={34} strokeWidth={1} />
                      </div>
                      <span className="eyebrow">BEGIN WITH A QUESTION</span>
                      <h2>
                        What would you
                        <br />
                        like to discover?
                      </h2>
                      <p>
                        Explore Ambedkar’s life, writings and ideas. Follow
                        <br />
                        each answer back to its published sources.
                      </p>
                      <div className="suggestions">
                        {[
                          "What was the Mahad Satyagraha?",
                          "What did Ambedkar study at Columbia?",
                          "How did he connect equality and democracy?",
                        ].map((text) => (
                          <button
                            key={text}
                            disabled={researchPending}
                            onClick={() => ask(text)}
                          >
                            {text}
                            <ArrowUpRight size={16} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((message) =>
                      message.role === "user" ? (
                        <div className="user-message" key={message.id}>
                          <span>YOU</span>
                          <p lang={message.language}>{message.text}</p>
                        </div>
                      ) : message.mode === "web-research" ? (
                        <ResearchAnswer
                          key={message.id}
                          message={message}
                          reading={voice.speakingId === message.id}
                          onRead={() => voice.speakingId === message.id ? voice.stop() : voice.read(message, findResearchLanguage(message.language) || RESEARCH_LANGUAGES[0])}
                          onSource={(ref) => showReferences(message, ref.number)}
                          onReferences={() => showReferences(message)}
                          saved={saved.some((e) => e.id === message.id)}
                          onSave={() =>
                            saveRecord({
                              id: message.id,
                              title: message.query,
                              date: "Research note",
                              summary: message.answer,
                              references: message.citations,
                              sourceIds: [],
                            })
                          }
                        />
                      ) : (
                        <div className="archive-message" key={message.id}>
                          <div className="message-author">
                            <span className="mini-brand">अ</span> ABHILEKH{" "}
                            <span className="summary-label">
                              CURATED EXHIBIT RECORDS
                            </span>
                          </div>
                          <p className="answer-intro">{message.intro}</p>
                          {message.matches.map((match) => (
                            <article className="answer-record" key={match.id}>
                              <div className="answer-heading">
                                <span>{match.date}</span>
                                <button
                                  className="icon-button small"
                                  aria-label={`Save ${match.title}`}
                                  onClick={() => saveRecord(match)}
                                >
                                  {saved.some((e) => e.id === match.id) ? (
                                    <Check size={16} />
                                  ) : (
                                    <Bookmark size={16} />
                                  )}
                                </button>
                              </div>
                              <h3>{match.title}</h3>
                              <p>{match.summary}</p>
                              <div className="answer-citations">
                                {sourceButtons(match)}
                              </div>
                              {match.sourceIds
                                .filter((id) => sources[id].image)
                                .map((id) => (
                                  <button
                                    className="inline-document"
                                    key={id}
                                    onClick={() => setSource(sources[id])}
                                  >
                                    <img
                                      src={sources[id].image}
                                      alt="Preview of a published page from Ambedkar’s collected writings"
                                    />
                                    <span>
                                      <strong>
                                        Read a related original page
                                      </strong>
                                      <small>{sources[id].pageLabel}</small>
                                    </span>
                                    <ArrowUpRight size={18} />
                                  </button>
                                ))}
                            </article>
                          ))}
                        </div>
                      ),
                    )
                  )}
                  {researchPending && (
                    <div className="research-loading" role="status">
                      <span className="mini-brand">अ</span>
                      <div>
                        <strong>
                          Following the evidence
                          <span className="loading-dots">…</span>
                        </strong>
                        <small>
                          Reading published sources and gathering references.
                        </small>
                      </div>
                      <button className="subtle-link" onClick={cancelResearch}>
                        Stop
                      </button>
                    </div>
                  )}
                </div>
                <form
                  className="chat-input"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!voice.listening && !voice.transcribing) ask(query);
                  }}
                >
                  <label className="sr-only" htmlFor="archive-query">
                    Ask about Ambedkar’s life, ideas or writings
                  </label>
                  <input
                    id="archive-query"
                    value={query}
                    maxLength={1200}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={language.placeholder}
                    lang={answerLanguage}
                    dir="auto"
                    readOnly={voice.listening || voice.transcribing}
                    autoComplete="off"
                  />
                  <button type="button" className={`voice-input-button${voice.listening ? " is-listening" : ""}`}
                    disabled={researchPending || voice.transcribing || !voice.inputSupported}
                    aria-label={voice.listening ? "Finish dictation" : "Speak your question"}
                    aria-pressed={voice.listening}
                    title={voice.inputSupported ? "Dictate a question, review it, then send" : "Speech input is unavailable in this browser"}
                    onClick={() => voice.listening ? voice.finish() : voice.start(query)}>
                    {voice.listening ? <Square size={17} /> : <Mic size={19} />}
                  </button>
                  <button
                    className="send-button"
                    type="submit"
                    disabled={!query.trim() || researchPending || voice.listening || voice.transcribing}
                    aria-label="Search the archive"
                  >
                    <ArrowUpRight size={22} />
                  </button>
                </form>
                <div className="voice-status" role="status">
                  <span>{voice.notice || (!voice.inputSupported ? "Voice input unavailable here; you can type. " : "Tap the mic, speak, review, then send. ") + (!voice.canRead(language.locale) ? `${language.name} reading voice unavailable on this device.` : "")}</span>
                  {(voice.listening || voice.transcribing || voice.speakingId) && <button onClick={voice.stop}>Stop <Square size={11} /></button>}
                  <button className="voice-help" aria-label="About voice and languages" onClick={() => setNotice({ help: true, title: "Voice & languages", description: voice.cloud ? "Cloud voice is connected. Tap the microphone to record up to 25 seconds, then tap it again to transcribe. Your recording is sent through the archive server to our speech provider; this app does not save it. Review the text before sending. Answers and narration follow the selected language; source titles and links stay original. Microphone permission and an internet connection are required." : "Cloud voice is not connected yet. This mode uses your browser’s speech service and available device voices. A microphone icon does not guarantee that the browser has a working recognition service, especially inside an in-app browser. If recording fails, check microphone permissions or open the site in Chrome or Edge. Typed questions and supported reading voices remain available." })}><Info size={13} /></button>
                </div>
                <div className="chat-disclosure">
                  <ShieldCheck size={13} /> AI answers use published web
                  sources. Check the citations against the originals.
                </div>
              </section>
              <ResearchSources
                answers={researchAnswers}
                answer={sourceAnswer}
                selection={sourceSelection}
                onSelect={(answerId) => setSourceSelection({ answerId, number: null })}
                onSource={setSource}
                onNotes={() => setNotesOpen(true)}
                savedCount={saved.length}
                pending={researchPending}
                visible={researchPane === "sources"}
                reducedMotion={reduceMotion}
              />
            </div>
          </div>
        )}
        {view === "guide" && (
          <div className={`guide-view view-enter${guideMode === "avatar" ? " avatar-active" : ""}`}>
            <div className="page-intro">
              <div>
                <span className="eyebrow">03 / CONVERSATIONAL EXHIBIT</span>
                <h1>
                  A conversation with <em>history.</em>
                </h1>
              </div>
              <p>
                A virtual archive guide, built around
                <br />
                questions, context and original sources.
              </p>
            </div>
            <div className="guide-mode-switch" aria-label="AI guide mode">
              <button aria-pressed={guideMode === "voice"} onClick={() => setGuideMode("voice")}><Mic size={17} /><span>Voice conversation</span><small>LIVE</small></button>
              <button aria-pressed={guideMode === "avatar"} onClick={() => setGuideMode("avatar")}><Video size={17} /><span>AI Avatar</span><small>PREVIEW</small></button>
            </div>
            {guideMode === "voice" ? <VoiceGuide languageCode={answerLanguage} onLanguageChange={setAnswerLanguage} onSource={setSource} blocked={Boolean(welcomeOpen || source || notesOpen || notice || access || credits)} /> : <AvatarPreview onVoice={() => setGuideMode("voice")} reducedMotion={reduceMotion} blocked={Boolean(welcomeOpen || source || notesOpen || notice || access || credits)} />}
          </div>
        )}
        {view === "workspaces" && <Workspaces onPreview={setNotice} onResearch={() => navigate("research")} />}
      </main>
      <footer className="site-footer">
        <div className="footer-brand">
          अ <span>History, open to everyone.</span>
        </div>
        <div className="footer-links">
          <button onClick={() => setWelcomeOpen(true)}>About this prototype</button>
          <button onClick={() => setCredits(true)}>Sources & credits</button>
          <button onClick={() => setAccess(true)}>
            <Accessibility size={15} /> Accessibility
          </button>
          <button onClick={resetVisit}>
            <RotateCcw size={14} /> New visit
          </button>
        </div>
        <span className="prototype-label">
          SMART INDIA HACKATHON · PROTOTYPE
        </span>
      </footer>
      {welcomeOpen && (
        <Modal title="Welcome to Abhilekh — Smart India Hackathon prototype" onClose={() => setWelcomeOpen(false)} className="prototype-welcome">
          <PrototypeWelcome onEnter={() => setWelcomeOpen(false)} />
        </Modal>
      )}
      {eventModal && (
        <Modal
          title={eventModal.title}
          onClose={() => setEventModal(null)}
          className="event-modal"
        >
          <div className="event-modal-photo">
            <img
              src={photos[eventModal.photo].src}
              alt={photos[eventModal.photo].caption}
            />
            <span>{photos[eventModal.photo].caption}</span>
          </div>
          <div className="event-modal-copy">
            <span className="eyebrow">
              {eventModal.date} / {eventModal.eyebrow}
            </span>
            <h2>{eventModal.title}</h2>
            <div className="location-line">
              <MapPin size={14} />
              {eventModal.place}
            </div>
            <p>{eventModal.summary}</p>
            <span className="source-heading">
              EXHIBIT SUMMARY · READ THE EVIDENCE
            </span>
            <div className="modal-sources">{sourceButtons(eventModal)}</div>
            <div className="event-modal-actions">
              <button
                className="button primary"
                onClick={() => knowMore(eventModal)}
              >
                Know more <ArrowUpRight size={18} />
              </button>
              <button
                className="icon-button bordered"
                aria-label="Save this event"
                onClick={() => saveRecord(eventModal)}
              >
                {saved.some((e) => e.id === eventModal.id) ? (
                  <Check size={20} />
                ) : (
                  <Bookmark size={20} />
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {notice && (
        <Modal
          title={notice.title}
          onClose={() => setNotice(null)}
          className="notice-modal"
        >
          <div className="notice-icon">
            {notice.guide ? (
              <Mic size={30} strokeWidth={1.3} />
            ) : (
              <Layers size={30} strokeWidth={1.3} />
            )}
          </div>
          <span className="eyebrow">{notice.workspace ? "PLANNED WORKSPACE / SIH26096" : "SMART INDIA HACKATHON / MVP"}</span>
          <h2>{notice.title}</h2>
          <p>{notice.description}</p>
          {notice.workspace && <ol className="workspace-notice-steps">{notice.steps.map((step) => <li key={step}>{step}</li>)}</ol>}
          {!notice.guide && !notice.help && (
            <div className="notice-caption">
              {notice.workspace ? notice.limitation : "This feature is under development for Smart India Hackathon. This prototype focuses on the timeline and source-linked research experience, with voice conversation and an AI avatar preview."}
            </div>
          )}
          <div className={notice.workspace ? "workspace-notice-actions" : undefined}>
          <button
            className="button primary"
            onClick={() => {
              setNotice(null);
              navigate("research");
            }}
          >
            Explore the working prototype <ArrowRight size={17} />
          </button>
          {notice.workspace && <button onClick={() => setNotice(null)}>{view === "home" ? "Back to overview" : "Back to workspaces"}</button>}
          </div>
        </Modal>
      )}
      {source && (
        <Modal
          title={source.title}
          onClose={() => setSource(null)}
          className="source-modal"
        >
          <span className="eyebrow">SOURCE RECORD / {source.institution}</span>
          <h2>{source.title}</h2>
          <div className="source-metadata">
            <span>{source.type}</span>
            {source.date && <span>{source.date}</span>}
            {source.pageLabel && <span>{source.pageLabel}</span>}
          </div>
          {source.image && (
            <div className="original-document">
              <a
                href={source.image}
                target="_blank"
                rel="noreferrer"
                aria-label="View the original page at full size"
              >
                <img src={source.image} alt={source.imageCaption} />
              </a>
              <p>{source.imageCaption} Select the page to enlarge it.</p>
              {source.excerpt && <blockquote>{source.excerpt}</blockquote>}
            </div>
          )}
          <p>
            {source.isResearch
              ? "This reference was returned with the research answer. Open the publication to check the claim and its context."
              : "The exhibit provides a concise summary. Use the institutional publication to read the full account and its context."}
          </p>
          <a
            className="button primary"
            href={source.url}
            target="_blank"
            rel="noreferrer"
          >
            Open source <ExternalLink size={16} />
          </a>
          <p className="source-domain">{new URL(source.url).hostname}</p>
        </Modal>
      )}
      {credits && (
        <Modal
          title="Sources & image credits"
          onClose={() => setCredits(false)}
          className="credits-modal"
        >
          <span className="eyebrow">PROVENANCE MATTERS</span>
          <h2>Sources & image credits</h2>
          <p>
            Timeline entries are curated exhibit summaries. Citations lead to
            institutional accounts and published material. The sample is not a
            complete archive.
          </p>
          <div className="credits-list">
            {Object.values(sources).map((s) => (
              <a href={s.url} target="_blank" rel="noreferrer" key={s.id}>
                <span>
                  <strong>{s.institution}</strong>
                  <small>{s.title}</small>
                </span>
                <ArrowUpRight size={17} />
              </a>
            ))}
          </div>
          <h3>Historical photographs</h3>
          <p>
            The landing page and historical event panels use the credited
            archival photographs below.
          </p>
          <div className="photo-credits-list">
            {Object.values(photos).map((p) => (
              <a href={p.url} key={p.src} target="_blank" rel="noreferrer">
                <img src={p.src} alt="" />
                <span>
                  {p.caption}
                  <small>{p.credit}</small>
                </span>
                <ArrowUpRight size={16} />
              </a>
            ))}
          </div>
          <p className="notice-caption">
            The timeline’s seated scholar portrait and architectural miniatures
            are AI-created illustrations. The portrait is an artistic depiction
            of Dr. B. R. Ambedkar, not a photograph of a historical moment.
            The miniatures evoke themes and locations, not exact site reconstructions.
          </p>
          <p className="notice-caption">
            Siddharth’s introduction is a user-supplied, AI-generated concept video.
            It previews a planned archive guide and is not a live avatar session
            or a depiction of Dr. Ambedkar.
          </p>
          <p className="notice-caption">
            Independent Smart India Hackathon prototype. No institutional
            affiliation or endorsement is claimed. Photographs are historical
            images, not AI recreations.
          </p>
        </Modal>
      )}
      {access && (
        <Modal
          title="Make yourself comfortable"
          onClose={() => setAccess(false)}
          className="notice-modal"
        >
          <Accessibility size={32} />
          <span className="eyebrow">ACCESSIBILITY</span>
          <h2>Make yourself comfortable.</h2>
          <div className="settings-list">
            <label>
              <span>Larger text</span>
              <input
                type="checkbox"
                checked={largeText}
                onChange={(e) => setLargeText(e.target.checked)}
              />
            </label>
            <label>
              <span>Reduce motion</span>
              <input
                type="checkbox"
                checked={reduceMotion}
                onChange={(e) => {
                  setReduceMotion(e.target.checked);
                }}
              />
            </label>
          </div>
          <p className="notice-caption">
            Use Tab to move between controls and Escape to close a panel. Your
            device’s reduced-motion preference is also respected.
          </p>
        </Modal>
      )}
      {notesOpen && (
        <Modal
          title="Your visit, collected"
          onClose={() => setNotesOpen(false)}
          className="notes-modal"
        >
          <span className="eyebrow">PERSONAL RESEARCH / THIS VISIT ONLY</span>
          <h2>Your visit, collected.</h2>
          {saved.length ? (
            <>
              <p>
                {saved.length} saved {saved.length === 1 ? "record" : "records"}
                , with original references.
              </p>
              <div className="saved-list">
                {saved.map((e) => (
                  <div key={e.id}>
                    <span className="saved-year">{e.year}</span>
                    <div>
                      <h3>{e.title}</h3>
                      <small>
                        {(e.references || e.sourceIds.map((id) => sources[id]))
                          .map((s) => s.domain || s.institution)
                          .join(" · ")}
                      </small>
                    </div>
                    <button
                      className="icon-button"
                      onClick={() => saveRecord(e)}
                      aria-label={`Remove ${e.title}`}
                    >
                      <X size={17} />
                    </button>
                  </div>
                ))}
              </div>
              <button className="button primary" onClick={exportNotes}>
                Export notes & citations <Download size={17} />
              </button>
              {showNotesExport && (
                <div className="notes-export">
                  <label htmlFor="notes-export-text">
                    Your notes, ready to copy
                  </label>
                  <p>
                    If your browser does not download the file, copy the text
                    below.
                  </p>
                  <textarea
                    id="notes-export-text"
                    readOnly
                    value={notesText}
                    rows={9}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="empty-notes">
              <Bookmark size={36} strokeWidth={1} />
              <p>
                Something caught your attention?
                <br />
                Save a timeline event or a research result here.
              </p>
              <button
                className="button primary"
                onClick={() => {
                  setNotesOpen(false);
                  navigate("timeline");
                }}
              >
                Explore the timeline <ArrowRight size={17} />
              </button>
            </div>
          )}
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}

function ResearchAnswer({ message, onSource, onReferences, onSave, saved, reading, onRead }) {
  const refs = message.citations || [];
  const openReference = (ref) =>
    onSource({
      ...ref,
      institution: ref.domain,
      type: ref.kind,
      isResearch: true,
    });
  const markdown = message.answer.replace(/\[(\d+)\](?!\()/g, (mark, n) =>
    refs.some((r) => r.number === Number(n)) ? `[${n}](#citation-${n})` : mark,
  );
  return (
    <article className="archive-message live-research-answer">
      <div className="message-author">
        <span className="mini-brand">अ</span> ABHILEKH
        <span className="summary-label">RESEARCH ANSWER</span>
        <button
          className="icon-button small save-answer"
          aria-label={
            saved ? "Remove saved answer" : "Save answer and references"
          }
          onClick={onSave}
        >
          {saved ? <Check size={16} /> : <Bookmark size={16} />}
        </button>
      </div>
      <div className="research-prose" lang={message.language || "en"}>
        <ReactMarkdown
          skipHtml
          components={{
            img: () => null,
            a: ({ href, children }) => {
              const citation = href?.match(/^#citation-(\d+)$/);
              const ref = citation
                ? refs.find((r) => r.number === Number(citation[1]))
                : refs.find((r) => r.url === href);
              return ref ? (
                <button
                  className={citation ? "inline-citation" : "prose-source-link"}
                  onClick={() => openReference(ref)}
                  aria-label={`Open reference ${ref.number}: ${ref.title}`}
                >
                  {children}
                </button>
              ) : (
                <span>{children}</span>
              );
            },
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
      {message.truncated && (
        <p className="evidence-note">
          This answer reached the demo length limit. Ask a narrower follow-up to
          continue.
        </p>
      )}
      {message.evidence !== "cited" && (
        <p className="evidence-note">
          {message.evidence === "partial"
            ? "Some references could not be resolved. Check the sources before relying on this answer."
            : "Source support is limited for this answer. Treat it as unverified and check original material."}
        </p>
      )}
      <div className="answer-actions">
      <button className="answer-source-shortcut read-answer" onClick={onRead} aria-pressed={reading}>
        {reading ? <Square size={14} /> : <Volume2 size={15} />}{reading ? "Stop reading" : "Read aloud"}
      </button>
      {!!refs.length && (
        <button className="answer-source-shortcut" onClick={onReferences}>
          <FileText size={15} /> View {refs.length} sources
          <ArrowUpRight size={15} />
        </button>
      )}
      </div>
    </article>
  );
}

function Modal({ title, onClose, className = "", children }) {
  const ref = useRef(null);
  const previousFocus = useRef(document.activeElement);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = old;
      previousFocus.current?.focus?.();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={"modal " + className}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          const rect = ref.current.getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <button
        className="modal-close icon-button"
        aria-label="Close panel"
        onClick={onClose}
      >
        <X size={20} />
      </button>
      {children}
    </dialog>
  );
}
