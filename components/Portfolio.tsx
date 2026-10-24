"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, Check, Copy, Github, Headphones, Linkedin, Map, Minus, Pause, Play, Plus, Volume2, VolumeX, X } from "lucide-react";
import { AmbientAudio } from "@/lib/audio";
import { arsenalGroups, profile, projects, resumeLinks, skillGroups, type Project } from "@/lib/content";
import { advanceTravel, ARSENAL_STOP, clampTravel, LAST_STOP, nearestStop, projectIndexForStop, stopForProjectIndex, type TravelState } from "@/lib/world";
import WorldPoster from "./WorldPoster";
import type { WorldProps } from "./CinematicWorld";

function UnavailableWorld({ onUnavailable }: WorldProps) {
  useEffect(onUnavailable, [onUnavailable]);
  return null;
}

const CinematicWorld = dynamic(() => import("./CinematicWorld").catch(error => {
  console.error("The 3D world could not load:", error);
  return { default: UnavailableWorld };
}), { ssr: false });
type Sheet = "atlas" | "about" | "contact" | "project" | "arsenal" | null;

function projectAtStop(index: number) {
  const projectIndex = projectIndexForStop(index);
  return projectIndex === null ? null : projects[projectIndex];
}

function stopName(index: number) {
  if (index === 0) return "Arrival";
  if (index === ARSENAL_STOP) return "Arsenal";
  if (index === LAST_STOP) return "Contact";
  return projectAtStop(index)?.title ?? "Destination";
}

function ArsenalDossier() {
  return <div className="arsenal-dossier">
    <p className="eyebrow">THE WORKBENCH / TOOLS OF THE TRADE</p>
    <h2>My technical<br /><em>arsenal.</em></h2>
    <p className="arsenal-intro">Code for the system, analysis for the signal, and engineering for the handoff between them.</p>
    <div className="arsenal-groups">{arsenalGroups.map((group, index) => <section key={group.title}>
      <div className="arsenal-group-title"><span aria-hidden="true">{group.symbol}</span><div><small>0{index + 1}</small><h3>{group.title}</h3></div></div>
      <p>{group.description}</p><div className="arsenal-skills">{group.items.map(item => <span key={item}>{item}</span>)}</div>
    </section>)}</div>
  </div>;
}

function Emblem() {
  return <svg viewBox="0 0 50 50" fill="none" aria-hidden="true"><path d="m25 4 20 36H5L25 4Z" stroke="currentColor" strokeWidth=".7" /><path d="M25 15 39 40H11l14-25Z" stroke="currentColor" strokeWidth=".55" /><ellipse cx="25" cy="27" rx="24" ry="8" transform="rotate(-32 25 27)" stroke="currentColor" strokeWidth=".65" /><circle cx="42" cy="13" r="1.7" fill="currentColor" /></svg>;
}

function SheetFrame({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element?.showModal();
    return () => { element?.close(); focused?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={dialog} data-sheet className={"world-sheet " + (wide ? "sheet-wide" : "")}
    aria-labelledby="sheet-title" onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="sheet-surface">
      <header className="sheet-header"><span id="sheet-title">{title}</span><button onClick={onClose} className="round-button" aria-label="Close panel"><X size={19} /></button></header>
      {children}
    </div>
  </dialog>;
}

function ProjectDossier({ project, onVisit }: { project: Project; onVisit: () => void }) {
  return <div className="dossier">
    <div className="dossier-art"><Image src={project.image} alt={"Illustrated system overview of " + project.title} width={1200} height={720} /><span>SYSTEM ILLUSTRATION · {project.number}</span></div>
    <div className="dossier-body">
      <p className="eyebrow">{project.category}</p><h2>{project.title}</h2><p className="dossier-summary">{project.summary}</p>
      <div className="dossier-links">{project.github && <a href={project.github} target="_blank" rel="noreferrer"><Github size={15} />Source code<ArrowUpRight size={13} /></a>}{project.demo && <a href={project.demo} target="_blank" rel="noreferrer">Live demo<ArrowUpRight size={13} /></a>}<button onClick={onVisit}>Return to landmark<ArrowRight size={15} /></button></div>
      <section><h3>The question</h3><p>{project.problem}</p></section>
      <section><h3>The work</h3><p>{project.contribution}</p></section>
      <section><h3>Field notes</h3><ul>{project.outcomes.map(outcome => <li key={outcome}>{outcome}</li>)}</ul></section>
      <section><h3>Built with</h3><div className="tech-list">{project.stack.map(item => <span key={item}>{item}</span>)}</div></section>
    </div>
  </div>;
}

export default function Portfolio() {
  const travel = useRef<TravelState>({ current: 0, target: 0, playing: false, paused: false, reduced: false, pointerX: 0, pointerY: 0 });
  const markerElements = useRef<(HTMLButtonElement | null)[]>([]);
  const audio = useRef<AmbientAudio | null>(null);
  const readyRef = useRef(false);
  const pushedProject = useRef(false);
  const drag = useRef<{ x: number; target: number; moved: boolean; pointer: number } | null>(null);
  const pointerSample = useRef({ x: 0, y: 0, time: 0 });
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [mountWorld, setMountWorld] = useState(false);
  const [loadDelayed, setLoadDelayed] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [sound, setSound] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [selectedProject, setSelectedProject] = useState<Project>(projects[0]);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const currentStop = nearestStop(progress);
  const activeProject = projectAtStop(currentStop);
  const arrival = currentStop === 0;
  const destination = currentStop === LAST_STOP;
  const arsenal = currentStop === ARSENAL_STOP;
  const distance = Math.abs(progress - currentStop);
  const captionOpacity = reduced ? 1 : Math.max(0, Math.min(1, (0.47 - distance) * 5));

  const frame = useCallback((value: number) => {
    setProgress(value);
    if (!travel.current.playing) setPlaying(false);
  }, []);
  const worldReady = useCallback(() => { readyRef.current = true; setReady(true); }, []);
  const worldUnavailable = useCallback(() => { setUnavailable(true); setReady(true); readyRef.current = true; }, []);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const bootstrap = requestAnimationFrame(() => {
      travel.current.reduced = preference.matches;
      setReduced(preference.matches);
      const url = new URL(window.location.href);
      const initial = projects.find(project => project.id === url.searchParams.get("project"));
      if (initial) {
        const index = stopForProjectIndex(projects.indexOf(initial));
        travel.current.current = travel.current.target = index;
        travel.current.paused = true;
        setProgress(index);
        setSelectedProject(initial);
        setSheet("project");
      }
      setMountWorld(true);
    });
    const motionChange = (event: MediaQueryListEvent) => {
      travel.current.reduced = event.matches;
      if (event.matches) { travel.current.playing = false; setPlaying(false); }
      setReduced(event.matches);
    };
    const pop = () => {
      const id = new URL(window.location.href).searchParams.get("project");
      const project = projects.find(item => item.id === id);
      travel.current.paused = !!project;
      if (project) {
        const index = stopForProjectIndex(projects.indexOf(project));
        travel.current.current = travel.current.target = index;
        setProgress(index);
        setSelectedProject(project);
        setSheet("project");
      }
      else setSheet(null);
    };
    const timeout = setTimeout(() => { if (!readyRef.current) setLoadDelayed(true); }, 8000);
    preference.addEventListener("change", motionChange);
    window.addEventListener("popstate", pop);
    return () => {
      cancelAnimationFrame(bootstrap);
      clearTimeout(timeout);
      preference.removeEventListener("change", motionChange);
      window.removeEventListener("popstate", pop);
      audio.current?.dispose();
    };
  }, [worldUnavailable]);

  useEffect(() => {
    if (ready && !unavailable) return;
    let last = performance.now();
    let id = 0;
    function tick(now: number) {
      frame(advanceTravel(travel.current, (now - last) / 1000));
      last = now;
      id = requestAnimationFrame(tick);
    }
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [frame, ready, unavailable]);

  useEffect(() => {
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.target instanceof Element && event.target.closest("[data-sheet]")) return;
      event.preventDefault();
      if (travel.current.paused) return;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      travel.current.playing = false;
      setPlaying(false);
      travel.current.target = clampTravel(travel.current.target + Math.max(-180, Math.min(180, delta * unit)) / 1150);
    };
    const key = (event: KeyboardEvent) => {
      if (travel.current.paused || event.target instanceof Element && event.target.closest("input,textarea,summary,[contenteditable=true]")) return;
      if (event.key === " " && event.target instanceof Element && event.target.closest("button,a")) return;
      if (["ArrowRight", "ArrowDown", "PageDown", "ArrowLeft", "ArrowUp", "PageUp", "Home", "End", " "].includes(event.key)) event.preventDefault();
      const target = travel.current.target;
      if (["ArrowRight", "ArrowDown", "PageDown"].includes(event.key)) travel.current.target = clampTravel(Math.floor(target + .08) + 1);
      else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) travel.current.target = clampTravel(Math.ceil(target - .08) - 1);
      else if (event.key === "Home") travel.current.target = 0;
      else if (event.key === "End") travel.current.target = LAST_STOP;
      else if (event.key === " ") {
        if (travel.current.reduced) return;
        travel.current.playing = !travel.current.playing;
        setPlaying(travel.current.playing);
      } else return;
      if (event.key !== " ") { travel.current.playing = false; setPlaying(false); }
    };
    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("wheel", wheel); window.removeEventListener("keydown", key); };
  }, []);

  function goTo(stop: number) {
    travel.current.target = clampTravel(stop);
    travel.current.playing = false;
    setPlaying(false);
    audio.current?.playSelect();
  }

  function showSheet(next: Exclude<Sheet, null>) {
    travel.current.paused = true;
    travel.current.playing = false;
    setPlaying(false);
    setSheet(next);
  }

  function openProject(project: Project) {
    setSelectedProject(project);
    const url = new URL(window.location.href);
    url.searchParams.set("project", project.id);
    window.history.pushState({}, "", url);
    pushedProject.current = true;
    showSheet("project");
    audio.current?.playSelect();
  }

  function closeSheet() {
    setSheet(null);
    travel.current.paused = false;
    if (new URL(window.location.href).searchParams.has("project")) {
      if (pushedProject.current) { pushedProject.current = false; window.history.back(); }
      else {
        const url = new URL(window.location.href);
        url.searchParams.delete("project");
        window.history.replaceState({}, "", url);
      }
    }
  }

  function visitProject(project: Project) {
    closeSheet();
    goTo(stopForProjectIndex(projects.indexOf(project)));
  }

  async function toggleSound() {
    if (!audio.current) audio.current = new AmbientAudio();
    const actual = await audio.current.setEnabled(!sound);
    setSound(actual);
    if (!actual && !sound) setNotice("Audio is unavailable here. The journey continues silently.");
  }

  async function copyEmail() {
    try { await navigator.clipboard.writeText(profile.email); setCopied(true); }
    catch { setNotice("Email me at " + profile.email); }
  }

  function togglePlay() {
    if (reduced) {
      travel.current.reduced = false;
      setReduced(false);
    }
    if (travel.current.target > LAST_STOP - .02) travel.current.target = travel.current.current = 0;
    travel.current.playing = !travel.current.playing;
    setPlaying(travel.current.playing);
  }

  function markerClick(index: number) {
    if (drag.current?.moved) return;
    if (index === 0) showSheet("about");
    else if (index === ARSENAL_STOP) showSheet("arsenal");
    else if (index === LAST_STOP) showSheet("contact");
    else {
      const project = projectAtStop(index);
      if (project) openProject(project);
    }
  }

  return <main className={"expedition " + (reduced ? "reduced-motion " : "") + (isDragging ? "is-dragging" : "")}
    onPointerDown={event => {
      if (event.target instanceof Element && event.target.closest("button,a,dialog,input,summary") || sheet) return;
      drag.current = { x: event.clientX, target: travel.current.target, moved: false, pointer: event.pointerId };
      event.currentTarget.setPointerCapture(event.pointerId);
    }}
    onPointerMove={event => {
      travel.current.pointerX = event.clientX / window.innerWidth - .5;
      travel.current.pointerY = event.clientY / window.innerHeight - .5;
      const previous = pointerSample.current;
      const elapsed = Math.max(16, event.timeStamp - previous.time);
      const speed = previous.time ? Math.min(1, Math.hypot(event.clientX - previous.x, event.clientY - previous.y) / elapsed * .45) : 0;
      audio.current?.updatePointer(travel.current.pointerX * 2, travel.current.pointerY * 2, speed);
      pointerSample.current = { x: event.clientX, y: event.clientY, time: event.timeStamp };
      if (!drag.current || drag.current.pointer !== event.pointerId) return;
      const delta = drag.current.x - event.clientX;
      if (Math.abs(delta) > 5) {
        drag.current.moved = true;
        setIsDragging(true);
        travel.current.playing = false;
        setPlaying(false);
        travel.current.target = clampTravel(drag.current.target + delta / Math.max(350, window.innerWidth * .48));
      }
    }}
    onPointerUp={event => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      drag.current = null;
      setIsDragging(false);
    }}
    onPointerCancel={() => { drag.current = null; setIsDragging(false); }}>
    <a className="skip-world" href="#field-guide" onClick={() => showSheet("atlas")}>Open accessible project guide</a>
    <div className="world-canvas" aria-hidden="true" data-state={unavailable ? "fallback" : ready ? "ready" : "loading"}>
      <WorldPoster hidden={ready && !unavailable} />
      {mountWorld && !unavailable && <CinematicWorld travel={travel} markerElements={markerElements} onProgress={frame} onReady={worldReady} onUnavailable={worldUnavailable} />}
    </div>
    <div className="world-shade" aria-hidden="true" /><div className="film-grain" aria-hidden="true" />

    <header className="world-header">
      <button className="world-brand" onClick={() => goTo(0)} aria-label="Return to the arrival"><Emblem /><span>SRIVISNU A.<small>THE PERSONAL ATLAS</small></span></button>
      <nav aria-label="World navigation"><button onClick={() => showSheet("atlas")}><Map size={16} />The atlas</button><button onClick={() => goTo(ARSENAL_STOP)}>Arsenal</button><button onClick={() => showSheet("about")}>The explorer</button><button onClick={() => { goTo(LAST_STOP); }}>Make contact<ArrowUpRight size={15} /></button></nav>
      <button className="world-sound" onClick={() => void toggleSound()} aria-label={sound ? "Mute sound" : "Enable ambient sound"} aria-pressed={sound}>{sound ? <Volume2 size={16} /> : <VolumeX size={16} />}<span>SOUND {sound ? "ON" : "OFF"}</span></button>
    </header>

    <div className="world-coordinates" aria-hidden="true"><span className="coordinate-cross">+</span> CHENNAI, EARTH <i /> {String(currentStop).padStart(2, "0")}° / {(progress / LAST_STOP * 360).toFixed(1)}′ E</div>

    <div className="world-caption" style={{ opacity: captionOpacity, transform: "translate3d(" + (-distance * 22) + "px,0,0)" }} key={currentStop}>
      <p className="eyebrow"><span />{arrival ? "PROLOGUE / A WORLD OF POSSIBILITIES" : destination ? "EPILOGUE / THE NEXT CHAPTER" : arsenal ? "01 / TOOLS OF THE TRADE" : String(currentStop).padStart(2, "0") + " / " + activeProject?.category.split(" / ")[0]}</p>
      {arrival ? <><h1>Curiosity, <br /><em>in motion.</em></h1><p className="caption-lede">I’m Srivisnu. I build systems, uncover <br />patterns, and teach machines to see.</p><p className="caption-sub">A journey through software, intelligence, and data.</p><button className="world-cta" onClick={() => goTo(1)}><span>BEGIN THE EXPEDITION</span><ArrowRight size={17} /></button></>
        : destination ? <><h1>What’s beyond <br /><em>the horizon?</em></h1><p className="caption-lede">A conversation. A collaboration. <br />Something we haven’t imagined yet.</p><button className="world-cta" onClick={() => showSheet("contact")}><span>LET’S FIND OUT</span><ArrowUpRight size={17} /></button></>
          : arsenal ? <><h1>The<br /><em>Arsenal.</em></h1><p className="caption-lede">A workshop for turning<br />curiosity into capability.</p><p className="caption-sub">Engineering · Analytics · Machine Learning</p><button className="world-cta" onClick={() => showSheet("arsenal")}><span>EXPLORE MY TECH STACK</span><Plus size={18} /></button></>
          : <><h1 className="project-heading">{activeProject?.title}</h1><p className="caption-lede project-lede">{activeProject?.summary}</p><p className="caption-sub">{activeProject?.stack.slice(0, 3).join(" · ")}</p><button className="world-cta" onClick={() => activeProject && openProject(activeProject)}><span>EXPLORE THIS PROJECT</span><Plus size={17} /></button></>}
    </div>

    <div className="world-markers">
      {Array.from({ length: LAST_STOP + 1 }, (_, index) => <button key={index} ref={element => { markerElements.current[index] = element; }} className="landmark-marker" tabIndex={-1} onClick={() => markerClick(index)}
        aria-label={index === 0 ? "Meet the explorer" : index === LAST_STOP ? "Make contact" : index === ARSENAL_STOP ? "Explore the Arsenal" : "Explore " + stopName(index)}>
        <span className="marker-caption">{index === 0 ? "THE OBSERVATORY" : index === LAST_STOP ? "THE SIGNAL STATION" : index === ARSENAL_STOP ? "THE ARSENAL" : projectAtStop(index)?.shortTitle.toUpperCase()}</span><span className="marker-stem" /><span className="marker-ring"><Plus size={16} /></span>
      </button>)}
    </div>

    <div className="world-note" aria-hidden="true"><span>✧</span><div>{arrival ? "ALL GREAT THINGS BEGIN\nWITH A LITTLE CURIOSITY." : destination ? "THE BEST IDEAS\nARE STILL AHEAD." : "AN IDEA MADE REAL.\nA LANDMARK IN THE MAKING."}</div></div>

    <footer className="journey-hud">
      <div className="journey-topline">
        <button className={"tour-control " + (playing ? "is-playing" : "")} onClick={togglePlay} aria-label={playing ? "Pause cinematic journey" : "Play cinematic journey"} aria-pressed={playing}>{playing ? <Pause size={12} /> : <Play size={12} />}<span>{playing ? "PAUSE JOURNEY" : "PLAY THE JOURNEY"}</span></button>
        <div className="journey-instruction">{!ready ? <><span className="loading-star" />{loadDelayed ? "EXPLORE WHILE THE WORLD ARRIVES" : "ASSEMBLING THE WORLD"}</> : unavailable ? "SCENE UNAVAILABLE · USE THE ATLAS TO EXPLORE" : <><span className="mouse-symbol" /><span className="desktop-travel-hint">SCROLL OR DRAG TO TRAVEL</span><span className="touch-travel-hint">SWIPE TO EXPLORE</span><span className="instruction-separator">/</span><span className="key-hint">←</span><span className="key-hint">→</span></>}</div>
        <span className="chapter-counter"><b>{String(currentStop).padStart(2, "0")}</b><span>/ {String(LAST_STOP).padStart(2, "0")}</span></span>
      </div>
      <div className="journey-track" role="group" aria-label="Journey chapters">
        <div className="track-line" /><div className="track-completed" style={{ width: (progress / LAST_STOP * 100) + "%" }} />
        <div className="travel-vessel" style={{ left: (progress / LAST_STOP * 100) + "%" }}><span /></div>
        {Array.from({ length: LAST_STOP + 1 }, (_, index) => <button key={index} onClick={() => goTo(index)} style={{ left: (index / LAST_STOP * 100) + "%" }} className={"track-stop " + (currentStop === index ? "active" : "")} aria-current={currentStop === index ? "step" : undefined} aria-label={stopName(index)}><i /><span>{String(index).padStart(2, "0")}</span></button>)}
      </div>
      <div className="journey-bottomline"><span>AN INDEPENDENT EXPLORATION BY SRIVISNU A.</span><div><button onClick={() => goTo(Math.max(0, currentStop - 1))} disabled={currentStop === 0} aria-label="Previous landmark"><ArrowLeft size={14} /></button><span>FOLLOW THE LIGHT</span><button onClick={() => goTo(Math.min(LAST_STOP, currentStop + 1))} disabled={currentStop === LAST_STOP} aria-label="Next landmark"><ArrowRight size={14} /></button></div><button onClick={() => { const next = !reduced; setReduced(next); travel.current.reduced = next; if (next) { travel.current.playing = false; setPlaying(false); } }} aria-pressed={reduced}>{reduced ? "REDUCED MOTION" : "FULL MOTION"}<Minus size={10} /></button></div>
    </footer>

    {((loadDelayed && !ready) || unavailable) && <div className="scene-help" role="status"><span>{unavailable ? "Every destination is in the atlas." : "The world is on its way. Start exploring now."}</span><button onClick={() => showSheet("atlas")}>Open the atlas<ArrowRight size={15} /></button></div>}

    {sheet === "project" && <SheetFrame title={"FIELD NOTES / PROJECT " + selectedProject.number} onClose={closeSheet}><ProjectDossier project={selectedProject} onVisit={() => visitProject(selectedProject)} /></SheetFrame>}
    {sheet === "atlas" && <SheetFrame title="THE ATLAS / SELECT A DESTINATION" onClose={closeSheet} wide>
      <div id="field-guide" className="atlas-guide">
        <p className="eyebrow">SEVEN IDEAS. THREE DISCIPLINES. ONE WORLD.</p>
        <h2>Choose your<br /><em>own expedition.</em></h2>
        <div className="atlas-projects">
          <div><span className="atlas-num">01</span><button onClick={() => { closeSheet(); goTo(ARSENAL_STOP); }}><span>The Arsenal</span><small>Tech stack · Tools · Platforms</small></button><button className="atlas-notes" onClick={() => showSheet("arsenal")} aria-label="Read about the Arsenal"><Plus size={16} /></button></div>
          {projects.map((project, index) => <div key={project.id}><span className="atlas-num">{String(stopForProjectIndex(index)).padStart(2, "0")}</span><button onClick={() => visitProject(project)}><span>{project.title}</span><small>{project.category}</small></button><button className="atlas-notes" onClick={() => openProject(project)} aria-label={"Read about " + project.title}><Plus size={16} /></button></div>)}
        </div>
        <p className="guide-hint">Select a title to travel there. Select + to open its field notes.</p>
      </div>
    </SheetFrame>}
    {sheet === "arsenal" && <SheetFrame title="THE ARSENAL / TECH STACK & TOOLS" onClose={closeSheet} wide><ArsenalDossier /></SheetFrame>}
    {sheet === "about" && <SheetFrame title="THE EXPLORER / SRIVISNU A." onClose={closeSheet}><div className="about-dossier"><p className="eyebrow">SOFTWARE · INTELLIGENCE · DATA</p><h2>Following<br /><em>the questions.</em></h2><p>I’m Srivisnu, a Computer Science graduate from Chennai. I’m interested in what happens when software engineering, machine learning, and data come together to solve a real problem.</p><p>That curiosity has taken me from real-time transit payments to explainable vision models, sales automations, and the stories hidden in customer data.</p><div className="explorer-timeline"><div><span>2022 — 2026</span><h3>B.E. Computer Science & Engineering</h3><p>Data Science · Sathyabama Institute of Science and Technology<br />CGPA 7.44 / 10</p></div><div><span>SEP — OCT 2025</span><h3>Python Developer Intern</h3><p>O Clock Software, Chennai<br />Data processing, Python automation, validation, and collaborative development.</p></div><div><span>APRIL 2026</span><h3>FaceFare patent application published</h3><p>Co-inventor · Indian Application 202641031039 A<br />Filed 15 March · Published 3 April 2026</p></div></div><div className="explorer-toolkit">{skillGroups.map(group => <section key={group.title}><h3>{group.title}</h3><p>{group.items.join(" · ")}</p></section>)}</div><div className="explorer-certifications">NSIC · AI Model Development using MLOps<br />AWS · Advantage Pro Certification</div><div className="resume-links"><h3>TAKE A RÉSUMÉ WITH YOU</h3>{resumeLinks.map(link => <a href={link.href} key={link.href} download>{link.label}<ArrowDownToLine size={15} /></a>)}</div></div></SheetFrame>}
    {sheet === "contact" && <SheetFrame title="THE SIGNAL STATION / MAKE CONTACT" onClose={closeSheet}><div className="contact-dossier"><Headphones className="contact-symbol" size={32} strokeWidth={.7} /><p className="eyebrow">A SIGNAL WORTH SENDING</p><h2>The next chapter<br /><em>starts with hello.</em></h2><p>A role, a collaboration, or a wonderfully ambitious idea. I’d love to hear about it.</p><a className="contact-address" href={"mailto:" + profile.email}>{profile.email}<ArrowUpRight size={20} /></a><button className="copy-address" onClick={() => void copyEmail()}>{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "ADDRESS COPIED" : "COPY ADDRESS"}</button><div className="contact-profiles"><a href={profile.github} target="_blank" rel="noreferrer"><Github size={17} />GitHub<ArrowUpRight size={13} /></a><a href={profile.linkedin} target="_blank" rel="noreferrer"><Linkedin size={17} />LinkedIn<ArrowUpRight size={13} /></a></div><p className="opportunity"><span />OPEN TO SOFTWARE, AI & DATA OPPORTUNITIES</p></div></SheetFrame>}
    {notice && <div className="world-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notice"><X size={14} /></button></div>}
    <p className="screen-reader-status" aria-live="polite">{playing ? "" : "Current destination: " + stopName(currentStop)}</p>
    <noscript><div className="no-script-world"><h1>Srivisnu A</h1><p>Software Engineering · AI & Machine Learning · Data Analytics</p><p>Enable JavaScript to explore the 3D world, or visit my projects directly.</p>{projects.map(project => <p key={project.id}>{project.github ? <a href={project.github}>{project.title}</a> : project.title} — {project.summary}</p>)}<a href={"mailto:" + profile.email}>{profile.email}</a></div></noscript>
  </main>;
}
