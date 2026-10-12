import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, X, Github } from 'lucide-react';
import type { PortfolioProject } from './content';

export default function CaseStudy({ project, onClose }: { project: PortfolioProject; onClose: () => void }) {
  const [shot, setShot] = useState(0);
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    close.current?.focus({ preventScroll: true });
    return () => { if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, []);
  useEffect(() => {
    // WebKit can move focus to the document when a focused gallery control
    // leaves its scroll area. Escape and Tab must still stay with this dialog.
    const handle = (event: globalThis.KeyboardEvent) => {
      const element = dialog.current;
      const host = element?.closest('.os-window');
      if (!element?.getClientRects().length || (host && !host.classList.contains('active'))) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
      if (event.key === 'Tab' && !dialog.current?.contains(document.activeElement)) { event.preventDefault(); close.current?.focus({ preventScroll: true }); }
    };
    document.addEventListener('keydown',handle,true);
    return () => document.removeEventListener('keydown',handle,true);
  }, [onClose]);
  function keyDown(event: KeyboardEvent) {
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); onClose(); }
    if (event.key !== 'Tab') return;
    const items = dialog.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex="0"]');
    if (!items?.length) return;
    const first = items[0], last = items[items.length-1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  return <div className="pf-modal-backdrop" onPointerDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="pf-case" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialog} onKeyDown={keyDown} style={{ '--project-accent': project.accent } as React.CSSProperties}>
      <header className="pf-case-bar"><span>SELECTED WORK / {project.title.toUpperCase()}</span><button ref={close} onClick={onClose} aria-label="Close case study"><span>Close</span><X size={19} /></button></header>
      <div className="pf-case-scroll">
        <div className="pf-case-cover"><span className="pf-eyebrow">{project.status}</span><h2 id={titleId}>{project.title}<span>{project.headline}</span></h2><p>{project.summary}</p><div className="pf-tags">{project.stack.map(tag => <span key={tag}>{tag}</span>)}</div></div>
        <figure className="pf-case-figure"><img src={project.shots[shot].src} alt={project.shots[shot].title} width="1440" height="900" /><figcaption><div><strong>{project.shots[shot].title}</strong><p>{project.shots[shot].caption}</p></div>{project.shots.length > 1 && <div className="pf-shot-controls"><button aria-label="Previous screenshot" disabled={shot===0} onClick={() => setShot(shot-1)}><ChevronLeft size={20} /></button><span>{shot+1} / {project.shots.length}</span><button aria-label="Next screenshot" disabled={shot===project.shots.length-1} onClick={() => setShot(shot+1)}><ChevronRight size={20} /></button></div>}</figcaption></figure>
        <div className="pf-case-body"><div className="pf-case-intro"><span className="pf-eyebrow">01 / CONTEXT</span><h3>The problem</h3><p>{project.problem}</p><span className="pf-eyebrow">02 / MY CONTRIBUTION</span><h3>{project.role}</h3><p>{project.contribution}</p></div><div className="pf-case-decisions"><span className="pf-eyebrow">03 / ENGINEERING DECISIONS</span>{project.decisions.map((decision,i) => <article key={decision}><span>0{i+1}</span><p>{decision}</p></article>)}</div></div>
        <div className="pf-case-features"><span className="pf-eyebrow">04 / IN THE PRODUCT</span><h3>Details that make it work.</h3><ul>{project.features.map(feature => <li key={feature}><ArrowUpRight size={16} />{feature}</li>)}</ul></div>
        <footer className="pf-case-footer"><span>Explore the actual project.</span><div>{project.repo && <a href={project.repo} target="_blank" rel="noopener noreferrer"><Github size={17} /> GitHub <ArrowUpRight size={15} /></a>}{project.live && <a href={project.live} target="_blank" rel="noopener noreferrer">Live website <ArrowUpRight size={17} /></a>}<button onClick={onClose}>Back to selected work <ChevronLeft size={17} /></button></div></footer>
      </div>
    </div>
  </div>;
}
