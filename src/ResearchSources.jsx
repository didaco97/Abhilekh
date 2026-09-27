import React, { useEffect, useRef } from "react";
import { ArrowUpRight, Bookmark, BookOpen, FileText } from "lucide-react";
import { sources } from "./archive.js";

export default function ResearchSources({
  answers, answer, selection, onSelect, onSource, onNotes,
  savedCount, pending, visible, reducedMotion,
}) {
  const scrollArea = useRef(null);
  useEffect(() => {
    const area = scrollArea.current;
    if (!area || !area.clientHeight) return;
    const card = selection?.number == null ? null
      : area.querySelector(`[data-reference="${selection.number}"]`);
    area.scrollTo({
      top: card
        ? card.getBoundingClientRect().top - area.getBoundingClientRect().top + area.scrollTop - 12
        : 0,
      behavior: reducedMotion ? "instant" : "smooth",
    });
    // Inline citation activation moves keyboard focus into its source card.
    if (card) card.focus({ preventScroll: true });
  }, [answer?.id, selection, visible, reducedMotion]);

  const references = answer?.citations || [];
  return (
    <aside id="research-sources" className="source-desk" aria-label="Source references">
      <div className="desk-title">
        <span><FileText size={17} /> Sources & originals</span>
        <span className="source-count">{references.length ? `${references.length} references` : "SOURCE DESK"}</span>
      </div>
      {answers.length > 1 && (
        <label className="source-answer-select">
          Sources for
          <select value={answer.id} onChange={(e) => onSelect(e.target.value)}>
            {answers.map((item, index) => (
              <option key={item.id} value={item.id}>{index + 1}. {item.query}</option>
            ))}
          </select>
        </label>
      )}
      <div className="source-desk-scroll" ref={scrollArea} tabIndex={0} aria-label="Source reference list">
        {answer ? (
          <>
            <div className="source-answer-heading">
              <span className="eyebrow">EVIDENCE FOR THIS ANSWER</span>
              <h2>{answer.query}</h2>
              <p>Select a reference to read the publication and check its context.</p>
              {pending && <small>Gathering sources for your next question…</small>}
            </div>
            {references.length ? (
              <div className="source-reference-list">
                {references.map((ref) => (
                  <button
                    key={ref.number}
                    data-reference={ref.number}
                    className={`research-reference${selection?.number === ref.number ? " selected-reference" : ""}`}
                    aria-label={`Open source ${ref.number}: ${ref.title}`}
                    onClick={() => onSource({ ...ref, institution: ref.domain, type: ref.kind, isResearch: true })}
                  >
                    <span className="reference-number">{ref.number}</span>
                    <span><strong>{ref.title}</strong><small>{ref.domain} · {ref.kind}</small></span>
                    <ArrowUpRight size={16} />
                  </button>
                ))}
              </div>
            ) : <p className="source-empty-note">No verified references were returned for this answer. Check original material before relying on it.</p>}
          </>
        ) : (
          <div className="source-desk-welcome">
            <div className="desk-illustration">
              <img src="/images/drafting-committee.jpg" alt="Members of the Drafting Committee in 1947" />
              <span>THE CONSTITUTIONAL ARCHIVE</span>
            </div>
            <h2>Every answer.<br /><em>A way to the source.</em></h2>
            <p>{pending ? "Gathering published sources. References will appear here when the answer is ready." : "Ask a question. Its numbered references will appear here, beside your conversation."}</p>
          </div>
        )}
        <details className="source-collections" open={!answer}>
          <summary>Explore original collections <BookOpen size={15} /></summary>
          <p>Curated exhibit material, separate from the answer’s references.</p>
          <button className="desk-source" onClick={() => onSource(sources.democracyText)}>
            <FileText size={21} /><span><strong>Democracy & equality</strong><small>Original page · Selected Works</small></span><ArrowUpRight size={16} />
          </button>
          <button className="desk-source" onClick={() => onSource(sources.caste)}>
            <BookOpen size={21} /><span><strong>Writings & ideas</strong><small>Collection guide · Columbia University</small></span><ArrowUpRight size={16} />
          </button>
        </details>
      </div>
      <div className="source-desk-footer">
        <Bookmark size={16} />
        <button onClick={onNotes}>Your visit notes <span>{savedCount}</span><ArrowUpRight size={15} /></button>
      </div>
    </aside>
  );
}
