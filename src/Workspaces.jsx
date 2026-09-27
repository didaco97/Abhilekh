import React, { useState } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, ChartNoAxesCombined, FileScan, Library, Monitor, Network, UserRound, Settings2, ShieldCheck, Workflow } from "lucide-react";
import { planned } from "./archive.js";
import "./workspaces.css";

const modules = [
  {
    id: "ocr", group: "institution", icon: FileScan, title: "OCR scanning", label: "From scan to searchable record",
    description: "Digitise printed pages while keeping each transcription connected to its original scan.",
    steps: ["Import a scan or capture a page at a scanning station.", "Extract text and flag uncertain words for staff review.", "Approve corrected text and metadata before publication."],
    limitation: "Scanning, uploads and OCR processing are not connected in this prototype. Difficult handwriting will need assisted transcription.",
  },
  {
    id: "researcher-login", group: "research", icon: UserRound, title: "Researcher login", label: "A personal space for your sources",
    description: "Return to saved reading lists, annotations and cited research across visits.",
    steps: ["Sign in to a personal researcher account.", "Organise documents, excerpts and citations into collections.", "Resume and export research from a persistent workspace."],
    limitation: "Account creation and sign-in are not active. Current visit notes are temporary and clear on reload or New visit.",
  },
  {
    id: "institution-login", group: "institution", icon: ShieldCheck, title: "Institutional login", label: "Access for the people behind the archive",
    description: "Give archivists, curators and administrators the access their work requires.",
    steps: ["Sign in with a staff role assigned by the institution.", "Review submissions, source permissions and metadata.", "Approve publication and retain an audit of changes."],
    limitation: "Staff authentication and role-based access are planned. This preview does not collect credentials or connect to an institution.",
  },
  {
    id: "dashboard", group: "research", icon: ChartNoAxesCombined, title: "Research dashboard", label: "Study connections. Compile evidence.",
    description: "Compare sources, follow themes and build a cited collection around a research question.",
    steps: ["Filter approved records by theme, date, language and format.", "Compare original pages, transcripts and source-linked summaries.", "Visualise connections and export a bibliography with excerpts."],
    limitation: "The full dashboard and cross-document analysis are planned. Source-linked questions and visit-note export already work in Research Room.",
  },
  {
    id: "kiosk-connect", group: "kiosk", icon: Network, title: "Kiosk connection", label: "One archive. Connected visitor spaces.",
    description: "Pair touch kiosks and exhibit displays with an institution’s archive server.",
    steps: ["Register a kiosk or display on the institutional network.", "Pair the device with the authorised archive service.", "Synchronise approved exhibit packages and report connection status."],
    limitation: "Device pairing, network discovery and display synchronisation are not active. No hardware is connected through this preview.",
  },
  {
    id: "kiosk-settings", group: "kiosk", icon: Settings2, title: "Kiosk settings", label: "An accessible visit, ready for everyone",
    description: "Configure language, audio, session behaviour and exhibit playback for each kiosk.",
    steps: ["Choose default language, text size and microphone/speaker devices.", "Set visitor-session reset and exhibit playback schedules.", "Monitor content versions and prepare local content packages."],
    limitation: "Managed device settings and offline packages are planned. Fullscreen, language selection and accessibility controls are already available in the visitor interface.",
  },
  ...planned.map((item) => ({
    ...item,
    group: item.id === "curator" || item.id === "multilingual" ? "institution" : "research",
    icon: ({ collections: Library, multilingual: BookOpen, curator: Workflow, maps: Network })[item.id],
    steps: ({
      collections: ["Catalogue books, manuscripts, photographs and AV records.", "Open full text or an original page alongside a summary.", "Search approved collections by source, format and language."],
      multilingual: ["Translate approved exhibit stories and captions.", "Review meaning and terminology before publishing.", "Store narration against the reviewed source version."],
      curator: ["Review extracted text and source metadata.", "Flag summaries and translations affected by corrections.", "Publish approved versions and check preservation backups."],
      maps: ["Connect people, ideas, writings and historical events.", "Attach supporting pages or timestamps to each relationship.", "Review suggested links before making them public."],
    })[item.id],
    limitation: "This institutional archive workflow is planned for a later phase. The current demo provides curated timeline records and source-linked research.",
  })),
];

const groups = [
  { id: "all", label: "All modules" },
  { id: "research", label: "Research" },
  { id: "institution", label: "Institution" },
  { id: "kiosk", label: "Kiosk" },
];

function WorkspaceCards({ items, onPreview }) {
  return <div className="workspace-grid">{items.map(({ icon: Icon, ...item }) => (
    <button className="workspace-card" key={item.id} onClick={() => onPreview({ ...item, workspace: true })} aria-label={`Preview ${item.title}`}>
      <div className="workspace-card-top"><span className="workspace-card-icon"><Icon size={23} strokeWidth={1.4} aria-hidden="true" /></span><span className="workspace-planned">PLANNED</span></div>
      <h2>{item.title}</h2><p className="workspace-card-label">{item.label}</p><p className="workspace-card-description">{item.description}</p>
      <span className="workspace-card-action">View planned workflow <ArrowUpRight size={17} aria-hidden="true" /></span>
    </button>
  ))}</div>;
}

export function WorkspacesPreview({ onPreview, onAll }) {
  return (
    <section className="home-workspaces" aria-labelledby="home-workspaces-title">
      <div className="home-workspaces-heading"><div><span className="eyebrow">THE ARCHIVE, TAKING SHAPE</span><h2 id="home-workspaces-title">More ways to <em>discover.</em></h2><p>From research desks to connected kiosks. Explore every planned module.</p></div><button className="workspaces-link" onClick={onAll}>Explore workspaces <ArrowUpRight size={17} aria-hidden="true" /></button></div>
      <div className="workspaces-status"><span><i aria-hidden="true" /> NEXT DEVELOPMENT PHASE</span><p>Feature previews for Smart India Hackathon. Sign-in, scanning and device integration are in development.</p></div>
      <WorkspaceCards items={modules} onPreview={onPreview} />
    </section>
  );
}

export default function Workspaces({ onPreview, onResearch }) {
  const [group, setGroup] = useState("all");
  const visible = modules.filter((item) => group === "all" || item.group === group);
  return (
    <div className="workspaces-view view-enter">
      <header className="workspaces-intro">
        <div><span className="eyebrow">04 / THE NEXT CHAPTER</span><h1>A place for every <em>perspective.</em></h1></div>
        <p>Planned tools for researchers, institutions and connected kiosks. Explore how the archive will grow.</p>
      </header>
      <div className="workspaces-status"><span><i aria-hidden="true" /> IN DEVELOPMENT</span><p>These are feature previews. Sign-in, scanning and device connections are not active yet.</p></div>
      <div className="workspace-filters" aria-label="Filter planned workspaces">
        {groups.map(({ id, label }) => <button key={id} onClick={() => setGroup(id)} aria-pressed={group === id} aria-controls="workspace-modules">{label}<span>{id === "all" ? modules.length : modules.filter((item) => item.group === id).length}</span></button>)}
      </div>
      <span className="sr-only" role="status">Showing {visible.length} planned {group === "all" ? "workspace" : group} modules</span>
      <div id="workspace-modules"><WorkspaceCards items={visible} onPreview={onPreview} /></div>
      <aside className="workspaces-working"><Monitor size={26} strokeWidth={1.3} aria-hidden="true" /><div><strong>Explore what already works.</strong><p>The timeline, cited research and multilingual voice guide are ready to try.</p></div><button className="button primary" onClick={onResearch}>Visit Research Room <ArrowRight size={16} aria-hidden="true" /></button></aside>
    </div>
  );
}
