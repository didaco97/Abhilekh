import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Play,
  Pause,
  MoveHorizontal,
  BookOpen,
  Info,
} from "lucide-react";
import { events, eras } from "./archive.js";
import "./timeline-exhibit.css";

const previewIds = [
  "birth",
  "columbia",
  "rupee",
  "mahad",
  "annihilation",
  "drafting",
  "legacy",
];
const scenes = {
  birth: {
    asset: "beginnings",
    title: "Born in Mhow",
    detail: "The beginning of an extraordinary life.",
  },
  columbia: {
    asset: "columbia",
    title: "A world of new ideas",
    detail: "Graduate study at Columbia University.",
  },
  masters: {
    asset: "columbia",
    title: "Learning without limits",
    detail: "A master’s degree across disciplines.",
  },
  rupee: {
    asset: "london",
    title: "The economist’s lens",
    detail: "The Problem of the Rupee, published.",
  },
  sabha: {
    asset: "beginnings",
    title: "Organising for change",
    detail: "Education and social improvement.",
  },
  mahad: {
    asset: "mahad",
    title: "The pursuit of equality",
    detail: "Equal access to public water.",
  },
  roundtable: {
    asset: "london",
    title: "A seat at the table",
    detail: "Arguing for political representation.",
  },
  poona: {
    asset: "republic",
    title: "The question of rights",
    detail: "The Poona Pact and representation.",
  },
  annihilation: {
    asset: "legacy",
    title: "Words that challenge",
    detail: "Annihilation of Caste is published.",
  },
  labour: {
    asset: "republic",
    title: "Work and welfare",
    detail: "Public service and labour policy.",
  },
  drafting: {
    asset: "republic",
    title: "Drafting a republic",
    detail: "Chairing the Drafting Committee.",
  },
  democracy: {
    asset: "republic",
    title: "A vision of democracy",
    detail: "Liberty, equality and fraternity.",
  },
  conversion: {
    asset: "legacy",
    title: "A new chapter",
    detail: "Conviction, dignity and change.",
  },
  legacy: {
    asset: "legacy",
    title: "Ideas that live on",
    detail: "An enduring legacy of social justice.",
  },
};
const lifts = [0, 18, 36, 22, 6, 25, 43];

export default function TimelineExhibit({
  compact = false,
  onOpen,
  onAsk,
  onAll,
  onCredits,
  reducedMotion = false,
  paused = false,
}) {
  const [era, setEra] = useState("all");
  const [selected, setSelected] = useState("birth");
  const [playing, setPlaying] = useState(false);
  const [systemReduced, setSystemReduced] = useState(false);
  const [progress, setProgress] = useState(0);
  const rail = useRef(null),
    stage = useRef(null),
    drag = useRef(null),
    frame = useRef(null);
  const still = reducedMotion || systemReduced;
  const milestones = events.filter((e) =>
    compact ? previewIds.includes(e.id) : era === "all" || e.era === era,
  );
  const selectedIndex = Math.max(
    0,
    milestones.findIndex((e) => e.id === selected),
  );
  const active = milestones[selectedIndex];
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (still || paused) setPlaying(false);
  }, [still, paused]);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () =>
        setSelected(
          (id) =>
            milestones[
              (milestones.findIndex((e) => e.id === id) + 1) % milestones.length
            ].id,
        ),
      4800,
    );
    return () => clearInterval(timer);
  }, [playing, era, compact]);
  useEffect(() => {
    const el = rail.current?.querySelector(`[data-milestone="${selected}"]`);
    if (el && rail.current)
      rail.current.scrollTo({
        left: Math.max(
          0,
          el.offsetLeft - (rail.current.clientWidth - el.clientWidth) / 2,
        ),
        behavior: still ? "instant" : "smooth",
      });
  }, [selected, era, still]);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  function chapter(id) {
    setPlaying(false);
    setEra(id);
    setSelected(events.find((e) => id === "all" || e.era === id).id);
  }
  function step(direction) {
    setPlaying(false);
    setSelected(
      milestones[
        Math.max(0, Math.min(milestones.length - 1, selectedIndex + direction))
      ].id,
    );
  }
  function open(event) {
    setPlaying(false);
    setSelected(event.id);
    onOpen(event);
  }
  function parallax(event) {
    if (still || event.pointerType !== "mouse") return;
    const bounds = stage.current.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() =>
      stage.current?.style.setProperty("--parallax", `${x * 16}px`),
    );
  }
  function startDrag(event) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    drag.current = {
      start: event.clientX,
      scroll: rail.current.scrollLeft,
      moved: false,
    };
  }
  function moveDrag(event) {
    if (!drag.current || event.buttons !== 1) return;
    const delta = event.clientX - drag.current.start;
    if (Math.abs(delta) > 7) {
      drag.current.moved = true;
      rail.current.style.scrollSnapType = "none";
      rail.current.scrollLeft = drag.current.scroll - delta;
      setPlaying(false);
    }
  }
  function stopDrag() {
    if (rail.current) rail.current.style.scrollSnapType = "";
  }
  return (
    <section
      className={`timeline-exhibit ${compact ? "exhibit-preview" : "exhibit-full"} ${still ? "exhibit-still" : ""}`}
      ref={stage}
      onPointerMove={parallax}
      onPointerLeave={() =>
        stage.current?.style.setProperty("--parallax", "0px")
      }
      aria-label={
        compact
          ? "Explore the three-dimensional timeline"
          : "Dr. Ambedkar’s life timeline"
      }
    >
      <div className="exhibit-atmosphere" aria-hidden="true">
        <span className="exhibit-sun" />
        <img
          className="exhibit-architecture"
          src="/images/timeline/republic.webp"
          alt=""
        />
        <span className="exhibit-horizon" />
      </div>
      <div className="exhibit-portrait" aria-hidden="true">
        <img src="/images/timeline/ambedkar-scholar.webp" alt="" />
      </div>
      <div className="exhibit-heading">
        <span className="eyebrow">
          {compact ? "FOLLOW THE THREAD" : "01 / AN INTERACTIVE LIFE JOURNEY"}
        </span>
        {compact ? (
          <h2>
            Every moment
            <br />
            holds a <em>story.</em>
          </h2>
        ) : (
          <h1>
            Dr. B. R.
            <br />
            <em>Ambedkar</em>
          </h1>
        )}
        <div className="exhibit-subtitle">A LIFE THAT SHAPED A NATION</div>
        <p>
          From the pursuit of knowledge to the promise of equality. Step into
          the moments that shaped an extraordinary life.
        </p>
        <div className="exhibit-hero-actions">
          <button
            className="button primary"
            onClick={() => {
              setSelected(milestones[0].id);
              rail.current?.scrollTo({
                left: 0,
                behavior: still ? "instant" : "smooth",
              });
              rail.current?.focus({ preventScroll: true });
            }}
          >
            Begin the journey <ArrowUpRight size={17} />
          </button>
          <button
            className="exhibit-play"
            onClick={() => setPlaying((p) => !p)}
            aria-pressed={playing}
          >
            <span>{playing ? <Pause size={13} /> : <Play size={13} />}</span>
            {playing ? "Pause journey" : "Play journey"}
          </button>
        </div>
      </div>
      <aside className="exhibit-margin-note">
        <span>
          THE SCHOLAR
          <br />
          THE REFORMER
          <br />
          THE NATION-BUILDER
        </span>
        <i>1891 — 1956</i>
        <button onClick={onCredits} aria-label="About the illustrated portrait">
          <Info size={14} /> Illustration credits
        </button>
      </aside>
      <div className="exhibit-floor">
        <div
          className="exhibit-rail"
          ref={rail}
          tabIndex={0}
          aria-label="Milestones. Swipe or use arrow keys to explore."
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault();
              step(e.key === "ArrowRight" ? 1 : -1);
            }
          }}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={stopDrag}
          onPointerLeave={stopDrag}
          onClickCapture={(e) => {
            if (drag.current?.moved && e.detail !== 0) {
              e.preventDefault();
              e.stopPropagation();
            }
            drag.current = null;
          }}
          onScroll={() => {
            const el = rail.current;
            setProgress(
              el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth),
            );
          }}
        >
          <div className="exhibit-track">
            {milestones.map((event, index) => {
              const scene = scenes[event.id] || scenes.drafting;
              return (
                <div
                  className={`exhibit-milestone ${active.id === event.id ? "is-selected" : ""}`}
                  data-milestone={event.id}
                  key={event.id}
                  style={{
                    "--lift": `${lifts[index % lifts.length]}px`,
                    "--order": index,
                  }}
                >
                  <div className="exhibit-platform" aria-hidden="true">
                    <span />
                  </div>
                  <button
                    className="diorama-button"
                    onClick={() => open(event)}
                    aria-label={`${event.date}: ${event.title}`}
                    aria-pressed={active.id === event.id}
                  >
                    <span className="diorama-image">
                      <img
                        src={`/images/timeline/${scene.asset}.webp`}
                        alt=""
                        draggable="false"
                        loading="lazy"
                      />
                    </span>
                    <span className="milestone-plinth">
                      <span className="milestone-face">
                        <span className="milestone-year">{event.year}</span>
                        <strong>{scene.title}</strong>
                        <span className="milestone-detail">{scene.detail}</span>
                      </span>
                    </span>
                    <span className="milestone-marker">
                      <Plus size={16} />
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <button
          className="exhibit-arrow exhibit-previous"
          aria-label="Previous milestone"
          disabled={selectedIndex === 0}
          onClick={() => step(-1)}
        >
          <ChevronLeft size={21} />
        </button>
        <button
          className="exhibit-arrow exhibit-next"
          aria-label="Next milestone"
          disabled={selectedIndex === milestones.length - 1}
          onClick={() => step(1)}
        >
          <ChevronRight size={21} />
        </button>
      </div>
      <div className="exhibit-bottom">
        <span className="exhibit-gesture">
          <MoveHorizontal size={17} /> Drag to explore · tap a moment
        </span>
        <div className="exhibit-position">
          <span>
            {String(selectedIndex + 1).padStart(2, "0")}{" "}
            <i>/ {String(milestones.length).padStart(2, "0")}</i>
          </span>
          <div>
            <span style={{ transform: `translateX(${progress * 100}%)` }} />
          </div>
        </div>
        {compact ? (
          <button className="subtle-link" onClick={onAll}>
            Explore all 14 milestones <ArrowRight size={18} />
          </button>
        ) : (
          <button
            className="subtle-link"
            onClick={() => {
              setPlaying(false);
              onAsk(active);
            }}
          >
            Ask about this moment <ArrowUpRight size={17} />
          </button>
        )}
      </div>
      {!compact && (
        <div
          className="exhibit-chapters"
          role="group"
          aria-label="Timeline chapters"
        >
          {eras.map((item) => (
            <button
              key={item.id}
              onClick={() => chapter(item.id)}
              aria-pressed={era === item.id}
              className={era === item.id ? "selected" : ""}
            >
              {item.label}
              <small>{item.range}</small>
            </button>
          ))}
        </div>
      )}
      {!compact && (
        <div className="exhibit-current" aria-live="polite">
          <span className="eyebrow">IN FOCUS / {active.date}</span>
          <strong>{active.title}</strong>
          <span>{active.place}</span>
          <button onClick={() => open(active)}>
            Read the story <ArrowUpRight size={15} />
          </button>
        </div>
      )}
      <p className="exhibit-provenance">
        <BookOpen size={12} /> Portrait and miniature scenes are artistic illustrations.
        Event details link to historical sources.
      </p>
    </section>
  );
}
