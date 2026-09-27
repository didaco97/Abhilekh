import React from "react";
import { ArrowRight, BookOpen, Mic, Monitor, Route, Server, Video } from "lucide-react";
import "./prototype-welcome.css";

export const prototypeTeam = { name: "honeyBadger", id: "133270" };

const features = [
  { icon: Route, title: "Explore the 3D timeline", description: "Discover Ambedkar’s life through interactive milestones and original sources." },
  { icon: BookOpen, title: "Ask the research room", description: "Ask questions, follow citations and save references to your visit notes." },
  { icon: Mic, title: "Have a voice conversation", description: "Speak and listen in multiple languages with the AI guide." },
  { icon: Video, title: "Meet Siddharth", description: "Explore the experimental 3D guide and his recorded introduction.", badge: "LAB" },
];

export default function PrototypeWelcome({ onEnter }) {
  return (
    <>
      <header className="welcome-masthead">
        <span className="welcome-sih">SMART INDIA HACKATHON</span>
        <span className="welcome-status"><i aria-hidden="true" /> PROTOTYPE IN DEVELOPMENT</span>
      </header>
      <div className="welcome-content">
        <div className="welcome-intro">
          <span className="welcome-mark" lang="hi" aria-hidden="true">अ</span>
          <div>
            <h2>Welcome to <em>Abhilekh.</em></h2>
            <p>An interactive archive of Dr. B. R. Ambedkar’s life, works and ideas.</p>
          </div>
        </div>
        <dl className="welcome-identity">
          <div><dt>PROBLEM STATEMENT</dt><dd>SIH26096</dd></div>
          <div><dt>TEAM NAME</dt><dd>{prototypeTeam.name}</dd></div>
          <div><dt>TEAM ID</dt><dd>{prototypeTeam.id}</dd></div>
        </dl>
        <p className="welcome-problem">Digital Heritage Archive for Memorials, Manuscripts &amp; Ambedkar: AI-Powered Institutional Archive and Audio-Visual Knowledge Platform</p>
        <section className="welcome-features" aria-labelledby="welcome-features-title">
          <h3 id="welcome-features-title">Inside this early prototype</h3>
          <ul>
            {features.map(({ icon: Icon, title, description, badge }) => (
              <li key={title}>
                <span className="welcome-feature-icon"><Icon size={18} aria-hidden="true" /></span>
                <div><h4>{title}{badge && <span>{badge}</span>}</h4><p>{description}</p></div>
              </li>
            ))}
          </ul>
        </section>
        <section className="welcome-hardware" aria-labelledby="welcome-hardware-title">
          <div className="welcome-section-heading"><h3 id="welcome-hardware-title">Built towards an institutional kiosk</h3><span>PLANNED INTEGRATION</span></div>
          <div className="welcome-device-flow" aria-label="Planned integration: touch kiosk with microphone and speakers, connected to an institutional archive server and smart displays">
            <div><Monitor size={21} aria-hidden="true" /><span><strong>Touch kiosk</strong><small>Microphone + speakers</small></span></div>
            <span className="welcome-connector" aria-hidden="true">↔</span>
            <div><Server size={21} aria-hidden="true" /><span><strong>Archive server</strong><small>Institutional content</small></span></div>
            <span className="welcome-connector" aria-hidden="true">↔</span>
            <div><Monitor size={21} aria-hidden="true" /><span><strong>Smart displays</strong><small>Exhibit stories</small></span></div>
          </div>
          <p>The current demo runs on a laptop or browser with microphone and speaker support. Institutional deployment and display synchronisation are planned.</p>
        </section>
      </div>
      <footer className="welcome-footer">
        <p>An initial SIH demonstration, under active development.<br /><span>Live research and voice require an internet connection.</span></p>
        <button className="button primary welcome-enter" onClick={onEnter}>Explore the prototype <ArrowRight size={17} aria-hidden="true" /></button>
      </footer>
    </>
  );
}
