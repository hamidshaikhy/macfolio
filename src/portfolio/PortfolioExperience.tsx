import { lazy, Suspense, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Copy, Download, Github } from 'lucide-react';
import { profile } from '../lib/content';
import { asset } from '../lib/assets';
import { useReducedMotion } from '../lib/hooks';
import { isSection, portfolioPath, resumePath, sections, selectedWork, skills, type SectionId } from './content';
import Portrait, { naturalPortrait } from './Portrait';
import CountUp from './CountUp';
import ExperienceCursor from './ExperienceCursor';
import {FooterLogo,RollingText} from './FooterDetails';
import HeroSignals from './HeroSignals';
import './experience.css';
const CaseStudy = lazy(() => import('./CaseStudy'));
const number = (n:number) => String(n).padStart(2,'0');
const clamp = (n:number) => Math.max(0,Math.min(1,n));
const sceneColors = ['#dff9ee','#f3e8cb','#20204c','#eadbf4','#172e31','#e1f4ed'];
const darkScenes = [false,false,true,false,true,false];
const journeyCount=3;
type Props = { mode:'standalone'|'embedded'; section?:string; onNavigate?:(section:SectionId)=>void };

export default function PortfolioExperience({mode,section='',onNavigate}:Props) {
  const scroll=useRef<HTMLDivElement>(null);
  const surface=useRef<HTMLDivElement>(null);
  const work=useRef<HTMLElement>(null);
  const journey=useRef<HTMLElement>(null);
  const nav=useRef<HTMLElement>(null);
  const cinematic=useRef(false);
  const initiallyAligned=useRef(false);
  const [size,setSize]=useState({width:0,height:0});
  const [menuOpen,setMenuOpen]=useState(false);
  const menuId=useId();
  const menuButton=useRef<HTMLButtonElement>(null);
  const [activeSection,setActiveSection]=useState<SectionId>('home');
  const [activeSkill,setActiveSkill]=useState(0);
  const skillOverride=useRef(0);
  const [activeProject,setActiveProject]=useState(0);
  const projectOverride=useRef(0);
  const [activeJourney,setActiveJourney]=useState(0);
  const journeyOverride=useRef(0);
  const [study,setStudy]=useState<number|null>(null);
  const studyTrigger=useRef<HTMLButtonElement|null>(null);
  const studyPosition=useRef(0);
  const focusFrame=useRef(0);
  const [copied,setCopied]=useState(false);
  const [copyError,setCopyError]=useState(false);
  const copyTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const reducedMotion=useReducedMotion();
  const compact=size.width<=1100||size.height<520;
  const pinned=size.width>0&&!reducedMotion;
  cinematic.current=pinned;
  const current=selectedWork[activeProject];

  const goTo=useCallback((id:string,behavior:ScrollBehavior=reducedMotion?'instant':'smooth')=>{
    const port=scroll.current;
    if(!port||!isSection(id))return;
    projectOverride.current=0;journeyOverride.current=0;
    if(id==='home'){port.scrollTo({top:0,behavior});return;}
    const target=port.querySelector<HTMLElement>(`[data-section="${id}"]`);
    if(target){
      let top=target.getBoundingClientRect().top-port.getBoundingClientRect().top+port.scrollTop;
      if(id==='profile'&&cinematic.current&&port.clientWidth>1100&&port.clientHeight>=520)top+=(target.offsetHeight-port.clientHeight)*.42;
      port.scrollTo({top,behavior});
    }
  },[reducedMotion]);
  // Deep links must be aligned after the measured container enables sticky
  // sections. Cached fonts can resolve before that React commit in WebKit.
  useLayoutEffect(()=>{
    if(initiallyAligned.current||!size.width)return;
    initiallyAligned.current=true;
    goTo(mode==='embedded'?section||'home':window.location.hash.slice(1)||'home','instant');
  },[size.width,pinned,goTo,mode,section]);
  function navigate(event:MouseEvent<HTMLAnchorElement>,id:SectionId){
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;
    event.preventDefault();
    setMenuOpen(false);
    if(id==='contact'&&event.detail>0)event.currentTarget.blur();
    if(mode==='embedded'){if(onNavigate)onNavigate(id);else goTo(id);}
    else{window.history.pushState(null,'',`${portfolioPath}#${id}`);goTo(id);}
  }
  useEffect(()=>{if(mode==='embedded')goTo(section||'home');},[section,mode,goTo]);
  useEffect(()=>{
    if(!compact)setMenuOpen(false);
  },[compact]);
  useEffect(()=>{
    if(!menuOpen)return;
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){setMenuOpen(false);menuButton.current?.focus();}
      if(event.key==='Tab'){
        const items=[...nav.current!.querySelectorAll<HTMLElement>('a,button')].filter(el=>el.getClientRects().length>0);
        const first=items[0],last=items.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);
  },[menuOpen]);
  useEffect(()=>{
    if(mode!=='standalone')return;
    const followHistory=()=>goTo(window.location.hash.slice(1)||'home');
    let disposed=false;
    const id=requestAnimationFrame(()=>goTo(window.location.hash.slice(1)||'home','instant'));
    document.fonts?.ready.then(()=>{if(!disposed&&!scroll.current?.inert)goTo(window.location.hash.slice(1)||'home','instant');});
    window.addEventListener('popstate',followHistory);window.addEventListener('hashchange',followHistory);
    document.title='Hamid Shaikhy — Front-End Developer';
    const metadata:Record<string,string>={
      description:'Hamid Shaikhy — Front-End Developer in Tehran. Explore React, Next.js and TypeScript projects, case studies and experience.',
      'og:title':'Hamid Shaikhy — Front-End Developer','og:description':'Interfaces with intent. Explore the work and engineering of Hamid Shaikhy.',
      'og:image':new URL(asset('assets/portfolio/portrait.webp'),window.location.origin).href,
      'og:url':new URL(portfolioPath,window.location.origin).href,'og:type':'website','twitter:card':'summary_large_image',
    };
    for(const [name,content] of Object.entries(metadata)){
      const attribute=name.startsWith('og:')?'property':'name';
      let meta=document.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
      if(!meta){meta=document.createElement('meta');meta.setAttribute(attribute,name);document.head.appendChild(meta);}meta.content=content;
    }
    return()=>{disposed=true;cancelAnimationFrame(id);window.removeEventListener('popstate',followHistory);window.removeEventListener('hashchange',followHistory);};
  },[goTo,mode]);
  useEffect(()=>{
    const port=scroll.current;if(!port)return;
    const resize=()=>{
      if(!port.clientWidth||!port.clientHeight)return;
      setSize(previous=>previous.width===port.clientWidth&&previous.height===port.clientHeight?previous:{width:port.clientWidth,height:port.clientHeight});
      surface.current?.style.setProperty('--port-height',`${port.clientHeight}px`);
    };
    resize();const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;observer?.observe(port);
    window.addEventListener('resize',resize);return()=>{observer?.disconnect();window.removeEventListener('resize',resize);};
  },[]);
  useEffect(()=>{
    const port=scroll.current;if(!port)return;
    let frame=0;let disposed=false;
    const update=()=>{
      frame=0;if(!port.clientHeight||!port.getClientRects().length)return;
      const bounds=port.getBoundingClientRect(),height=port.clientHeight;
      const pageProgress=clamp(port.scrollTop/Math.max(1,port.scrollHeight-height));
      surface.current?.style.setProperty('--page-progress',`${pageProgress*100}%`);
      surface.current?.style.setProperty('--page-fraction',String(pageProgress));
      let active:SectionId='home';
      for(const item of sections){
        const element=port.querySelector<HTMLElement>(`[data-section="${item.id}"]`);if(!element)continue;
        const rect=element.getBoundingClientRect(),top=rect.top-bounds.top;
        if(top<=height*.35)active=item.id;
        const enter=clamp((height*.95-top)/(height*.55));
        const progress=clamp((96-top)/Math.max(1,rect.height-height+96));
        element.style.setProperty('--enter',String(reducedMotion?1:enter));
        element.style.setProperty('--scene-progress',String(progress));
        if(item.id==='home')element.style.setProperty('--hero-out',String(reducedMotion?0:clamp(-top/height)));
        // Start while the profile crosses the lower edge of the hero. The
        // eased arrival leaves no empty screen before the cards come into view.
        if(item.id==='profile'){
          const arrival=clamp((height*.98-top)/(height*.7));
          element.style.setProperty('--assemble',String(reducedMotion?1:1-Math.pow(1-arrival,3)));
          if(compact)element.querySelectorAll<HTMLElement>('.pf-assemble').forEach(card=>{
            const cardTop=card.getBoundingClientRect().top-bounds.top;
            const amount=clamp((height*.95-cardTop)/(height*.35));
            card.style.setProperty('--card-reveal',String(reducedMotion?1:1-Math.pow(1-amount,3)));
          });
        }
        const leaving=clamp((height*.95-(top+rect.height))/(height*.55));
        element.style.setProperty('--exit',String(reducedMotion?0:Math.max(leaving,item.id==='journey'&&pinned?clamp((progress-.85)/.15):0)));
        if(item.id==='stack'&&top<height&&top>-rect.height&&Date.now()>skillOverride.current&&study===null){
          const module=pinned?Math.floor(progress*skills.length):Math.floor((height-top)/(height+rect.height)*skills.length);
          setActiveSkill(Math.max(0,Math.min(skills.length-1,module)));
        }
        if(item.id==='work'&&pinned&&study===null&&Date.now()>projectOverride.current&&top<height&&top>-rect.height){
          const position=progress*selectedWork.length;
          setActiveProject(Math.min(selectedWork.length-1,Math.floor(position)));
          element.style.setProperty('--project-arrival',String(reducedMotion?1:clamp((position-Math.floor(position))/.24)));
        }
        if(item.id==='journey'&&pinned&&study===null&&Date.now()>journeyOverride.current&&top<height&&top>-rect.height)setActiveJourney(Math.min(journeyCount-1,Math.floor(progress*journeyCount)));
      }
      const signature=port.querySelector<HTMLImageElement>('.pf-signature');
      if(signature){const top=signature.getBoundingClientRect().top-bounds.top;surface.current?.style.setProperty('--signature-progress',String(reducedMotion?1:clamp((height*.9-top)/(height*.28))));}
      setActiveSection(active);
    };
    const schedule=()=>{if(!disposed&&!frame)frame=requestAnimationFrame(update);};
    const userScroll=()=>{projectOverride.current=0;journeyOverride.current=0;schedule();};
    const scrollbarScroll=(event:PointerEvent)=>{if(event.target===port)userScroll();};
    const keyScroll=(event:KeyboardEvent)=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))userScroll();};
    update();port.addEventListener('scroll',schedule,{passive:true});port.addEventListener('load',schedule,true);
    port.addEventListener('wheel',userScroll,{passive:true});port.addEventListener('touchstart',userScroll,{passive:true});port.addEventListener('keydown',keyScroll);port.addEventListener('pointerdown',scrollbarScroll);
    document.fonts?.ready.then(schedule);
    return()=>{disposed=true;port.removeEventListener('scroll',schedule);port.removeEventListener('load',schedule,true);port.removeEventListener('wheel',userScroll);port.removeEventListener('touchstart',userScroll);port.removeEventListener('keydown',keyScroll);port.removeEventListener('pointerdown',scrollbarScroll);cancelAnimationFrame(frame);};
  },[size,pinned,compact,reducedMotion,study]);
  useEffect(()=>()=>{clearTimeout(copyTimer.current);cancelAnimationFrame(focusFrame.current);},[]);
  function openStudy(event:MouseEvent<HTMLButtonElement>){
    studyTrigger.current=event.currentTarget;studyPosition.current=scroll.current?.scrollTop||0;
    scroll.current?.scrollTo({top:studyPosition.current,behavior:'instant'});setStudy(activeProject);
  }
  function closeStudy(){setStudy(null);focusFrame.current=requestAnimationFrame(()=>{scroll.current?.scrollTo({top:studyPosition.current,behavior:'instant'});studyTrigger.current?.focus({preventScroll:true});});}
  function chooseProject(index:number){
    const next=Math.max(0,Math.min(selectedWork.length-1,index));projectOverride.current=Date.now()+10000;setActiveProject(next);work.current?.style.setProperty('--project-arrival','1');
    if(pinned&&work.current&&scroll.current){const port=scroll.current,start=work.current.getBoundingClientRect().top-port.getBoundingClientRect().top+port.scrollTop-96,range=work.current.offsetHeight-port.clientHeight+96;port.scrollTo({top:start+(next+.3)/selectedWork.length*range,behavior:'instant'});}
  }
  function chooseJourney(index:number){
    const next=Math.max(0,Math.min(journeyCount-1,index));journeyOverride.current=Date.now()+10000;setActiveJourney(next);
    if(pinned&&journey.current&&scroll.current){const port=scroll.current,start=journey.current.getBoundingClientRect().top-port.getBoundingClientRect().top+port.scrollTop-96,range=journey.current.offsetHeight-port.clientHeight+96;port.scrollTo({top:start+(next+.2)/journeyCount*range,behavior:'instant'});}
  }
  async function copyEmail(){
    try{await navigator.clipboard.writeText(profile.email);setCopied(true);setCopyError(false);clearTimeout(copyTimer.current);copyTimer.current=setTimeout(()=>setCopied(false),3000);}
    catch{setCopyError(true);}
  }
  const link=(id:SectionId,label:React.ReactNode=id)=><a href={`${portfolioPath}#${id}`} onClick={event=>navigate(event,id)}>{label}</a>;
  const statCards=[
    {value:selectedWork.length,label:'projects',copy:'Workflow tools, websites and product interfaces. Real screenshots. Real decisions.'},
    {value:skills.length,label:'technologies',copy:'React, Next.js, TypeScript and a connected front-end toolkit.'},
    {value:2,label:'languages',copy:'Persian and English interfaces, with careful RTL and LTR support.'},
    {value:99,suffix:'%',label:'satisfaction',copy:'Quality-focused delivery, with care for the details and the people using the product.'},
  ];

  return <div ref={surface} className={`pf-experience pf-${mode} ${pinned?'pf-scenes':''} ${compact?'pf-compact':''} ${size.height<600&&size.width>=600?'pf-short':''} ${reducedMotion?'pf-reduced-motion':''}`} data-measured={size.width>0} data-theme="light" data-scene={activeSection} data-modal={study!==null||menuOpen} data-work-dark={darkScenes[activeProject]} data-testid="portfolio-experience" lang="en" dir="ltr">
    {menuOpen&&<button className="pf-menu-backdrop" aria-label="Close navigation overlay" onClick={()=>{setMenuOpen(false);menuButton.current?.focus();}}/>}
    <header className="pf-nav" ref={nav} inert={study!==null} data-menu-open={menuOpen}>
      <a className="pf-mark" href={`${portfolioPath}#home`} onClick={event=>navigate(event,'home')} aria-label="Hamid Shaikhy, home">HS<span>.</span></a>
      <nav id={menuId} aria-label="Portfolio sections" inert={compact&&!menuOpen}>{sections.map(item=><a key={item.id} aria-current={activeSection===item.id?'location':undefined} href={`${portfolioPath}#${item.id}`} onClick={event=>navigate(event,item.id)}>{item.label}</a>)}</nav>
      <div className="pf-nav-actions">{link('contact',<><span className="pf-status-dot"/><span className="pf-connect-label">LET'S CONNECT</span></>)}<a className="pf-macfolio-link" href={`${asset('')}?view=desktop`} target="_blank" rel="noopener noreferrer">EXPLORE MACFOLIO</a><button ref={menuButton} className="pf-menu-toggle" aria-label={menuOpen?'Close navigation':'Open navigation'} aria-expanded={menuOpen} aria-controls={menuId} onClick={()=>setMenuOpen(!menuOpen)}><i/><i/><i/></button></div>
      <div className="pf-page-progress" aria-hidden="true"/>
    </header>
    <div className="pf-scroll" ref={scroll} tabIndex={0} aria-label="Hamid's portfolio" inert={study!==null||menuOpen}>
      <a className="pf-skip" href={`${portfolioPath}#work`} onClick={event=>navigate(event,'work')}>Skip to selected work</a>
      <main>
        <section className="pf-hero pf-section" id="home" data-section="home">
          <div className="pf-hero-atmosphere" aria-hidden="true"><i/><i/></div>
          <div className="pf-hero-copy"><h1><span>HAMID</span><span className="pf-outline">SHAIKHY</span></h1><h2 className="pf-hero-role"><i/>Front-End Developer</h2><p className="pf-hero-tagline">YOU IMAGINE, <strong>I DELIVER.</strong></p></div>
          <Portrait reducedMotion={reducedMotion}/>
          <HeroSignals surface={surface} reducedMotion={reducedMotion}/>
        </section>

        <section className="pf-profile pf-section" id="profile" data-section="profile"><div className="pf-profile-stage pf-stage">
          <div className="pf-profile-intro"><span className="pf-eyebrow">02 / DEVELOPER PROFILE</span><h2>Built for the space<br/><span>between idea and interface.</span></h2></div>
          <div className="pf-profile-grid"><article className="pf-bio-card pf-assemble"><h3>I'm Hamid Shaikhy</h3><p>I'm a <strong>Front-End Developer</strong> building dependable interfaces with React, Next.js and TypeScript. I turn complex ideas into clear, responsive products.</p><p>My work spans workflow tools, résumé builders and data-driven panels. Based in Tehran, I bring design and engineering together.</p><a className="pf-download" href={resumePath} download="Hamid-Shaikhy-Resume.pdf" aria-label="Download résumé">Download résumé <Download size={19}/></a></article>
            {statCards.map((stat,i)=><article key={stat.label} className="pf-stat-card pf-assemble" style={{'--card-index':i} as CSSProperties}><div className="pf-stat-value"><strong><CountUp value={stat.value} root={scroll} reducedMotion={reducedMotion}/><small>{stat.suffix||'+'}</small></strong><span>{stat.label}</span></div><p>{stat.copy}</p></article>)}
          </div>
        </div></section>

        <section className="pf-stack pf-section" id="stack" data-section="stack"><div className="pf-stack-stage pf-stage"><div className="pf-stack-layout"><div className="pf-stack-copy"><span className="pf-eyebrow">03 / TECHNOLOGY ARSENAL</span><h2>Tools, aligned<br/><span className="pf-outline">around the<br/>interface.</span></h2><p>Scroll rotates the active technology system.<br/>Point at a module to inspect its role.</p><div className="pf-module-description" aria-live="polite"><span>ACTIVE MODULE / {number(activeSkill+1)}</span><h3>{skills[activeSkill].name}</h3><p>{skills[activeSkill].detail}</p></div></div>
            <div className="pf-matrix-perspective"><div className="pf-tech-grid" aria-label="Technology modules">{skills.map((skill,i)=><button key={skill.name} className={activeSkill===i?'is-active':''} aria-pressed={activeSkill===i} onPointerEnter={event=>{if(event.pointerType!=='touch'){skillOverride.current=Date.now()+10000;setActiveSkill(i);}}} onFocus={()=>{skillOverride.current=Date.now()+10000;setActiveSkill(i);}} onClick={()=>{skillOverride.current=Date.now()+10000;setActiveSkill(i);}}><span className="pf-tech-number">{number(i+1)}</span><strong>{skill.name}</strong><span className="pf-tech-category">{skill.category}</span>{skill.icon&&<img src={asset(`assets/toolkit/${skill.icon}.svg`)} alt="" width="28" height="28" loading="lazy"/>}</button>)}</div></div>
          </div></div></section>

        <section ref={work} className={`pf-work pf-section ${pinned?'pf-work-pinned':''}`} id="work" data-section="work" data-dark={darkScenes[activeProject]} style={{'--project-accent':current.accent,'--scene-color':sceneColors[activeProject],'--project-count':selectedWork.length} as CSSProperties}>
          <div className="pf-work-sticky pf-stage"><div className="pf-work-layout"><div className="pf-work-heading"><span className="pf-eyebrow">04 / PROJECT MATRIX</span><h2>Selected systems.<br/><span className="pf-outline">Real product territory.</span></h2><div className="pf-work-heading-foot"><span>PERSONAL WORK / PROFESSIONAL CONTRIBUTIONS</span><span>{number(selectedWork.length)} SELECTED PROJECTS</span></div></div>
            <div className="pf-work-showcase"><div className="pf-work-counter"><span>{number(activeProject+1)}</span><i/><span>{number(selectedWork.length)}</span></div>
              <div className="pf-project-scene" tabIndex={0} aria-label="Selected project. Use left and right arrows to change projects." onKeyDown={event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();chooseProject(activeProject+(event.key==='ArrowRight'?1:-1));}}}>
                <div className="pf-project-art"><span className="pf-project-art-label">P / {number(activeProject+1)}</span><div className="pf-screen-composition" key={`${current.id}-image`}>
                  {current.shots.length>1&&<div className="pf-screen pf-screen-back pf-screen-left"><img src={current.shots[1].src} alt="" width="1440" height="900" loading="lazy"/></div>}
                  <div className="pf-screen pf-screen-front"><div className="pf-preview-toolbar"><span/><span/><span/><i>{current.title}</i></div><img src={current.shots[0].src} alt={current.shots[0].title} width="1440" height="900" loading="lazy"/></div>
                  {current.shots.length>2&&<div className="pf-screen pf-screen-back pf-screen-right"><img src={current.shots[2].src} alt="" width="1440" height="900" loading="lazy"/></div>}
                </div><span className="pf-project-art-footer">{current.category.toUpperCase()}</span></div>
                <div className="pf-project-copy" key={`${current.id}-copy`}><span className="pf-eyebrow">{current.status}</span><h3>{current.title}</h3><p className="pf-project-summary">{current.summary}</p><div className="pf-tags">{current.stack.slice(0,3).map(tag=><span key={tag}>{tag}</span>)}</div><span className="pf-case-button" aria-hidden="true">Read case study</span><div className="pf-project-links">{current.repo&&<a href={current.repo} target="_blank" rel="noopener noreferrer"><Github size={12}/>GitHub <ArrowUpRight size={11}/></a>}{current.live&&<a href={current.live} target="_blank" rel="noopener noreferrer">Live website <ArrowUpRight size={12}/></a>}</div></div>
                <button className="pf-project-open" aria-label="Read case study" aria-haspopup="dialog" onClick={openStudy}/>
              </div>
              <div className="pf-project-controls"><div><button aria-label="Previous project" onClick={()=>chooseProject(activeProject-1)} disabled={activeProject===0}><ChevronLeft size={16}/></button><span>{pinned?'SCROLL TO ADVANCE':'CHOOSE A PROJECT'}</span><button aria-label="Next project" onClick={()=>chooseProject(activeProject+1)} disabled={activeProject===selectedWork.length-1}><ChevronRight size={16}/></button></div><nav aria-label="Select a project">{selectedWork.map((project,i)=><button key={project.id} aria-label={`Show ${project.title}`} aria-pressed={activeProject===i} onClick={()=>chooseProject(i)}>{number(i+1)}</button>)}</nav></div>
            </div>
          </div></div>
        </section>

        <section ref={journey} className="pf-journey pf-section" id="journey" data-section="journey"><div className="pf-journey-stage pf-stage"><div className="pf-journey-heading"><span className="pf-eyebrow">05 / CAREER CONSTELLATION</span><h2>Growth measured<br/><span className="pf-outline">in things built.</span></h2></div>
          <div className="pf-timeline" tabIndex={0} aria-label="Experience and education. Use up and down arrows to change entries." onKeyDown={event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();chooseJourney(activeJourney+(event.key==='ArrowDown'?1:-1));}}}>
            <div className="pf-timeline-line" aria-hidden="true"/><div className="pf-timeline-orbit" aria-hidden="true" key={`node-${activeJourney}`}><i className="pf-node-out"/><span className="pf-node-in">{number(activeJourney+1)}</span></div>
            <article className={`pf-experience-card pf-journey-card ${activeJourney===0?'is-active':''}`} style={{'--node-offset':-activeJourney} as CSSProperties} inert={pinned&&activeJourney!==0} aria-hidden={pinned&&activeJourney!==0?true:undefined}><time>JUL 2026 — OCT 2026</time><h3>Front-End Developer</h3><a className="pf-company" href="https://dikaasia.com/" target="_blank" rel="noopener noreferrer">Dika Asia · Tehran · Contract <ArrowUpRight size={13}/></a><ul><li>Corporate websites and internal finance, project and operations interfaces.</li><li>Reusable React components, responsive layouts and RTL support.</li><li>Django REST API integration, data tables, filtering and Excel reporting.</li></ul><span className="pf-journey-kind">PROFESSIONAL EXPERIENCE</span></article>
            <article className={`pf-education pf-journey-card ${activeJourney===1?'is-active':''}`} style={{'--node-offset':1-activeJourney} as CSSProperties} inert={pinned&&activeJourney!==1} aria-hidden={pinned&&activeJourney!==1?true:undefined}><time>2022 — 2026</time><h3>B.Sc. in Computer Engineering</h3><p className="pf-company">Islamic Azad University · Tabriz</p><ul><li>Software Engineering</li><li>Learning through practical projects, from web interfaces to application architecture.</li></ul><span className="pf-journey-kind">EDUCATION</span></article>
            <article className={`pf-independent pf-journey-card ${activeJourney===2?'is-active':''}`} style={{'--node-offset':2-activeJourney} as CSSProperties} inert={pinned&&activeJourney!==2} aria-hidden={pinned&&activeJourney!==2?true:undefined}><span className="pf-journey-date">INDEPENDENT PROJECTS</span><h3>Building Personal Products</h3><p className="pf-company">Flow Studio · Barg · Macfolio</p><ul><li>A visual workflow editor with execution, validation and persistent state.</li><li>A Persian and English résumé builder with a live A4 preview.</li><li>An interactive desktop with working apps and a shared file system.</li></ul><span className="pf-journey-kind">PERSONAL PRODUCT DEVELOPMENT</span></article>
          </div><div className="pf-journey-controls"><div><button aria-label="Previous journey entry" disabled={activeJourney===0} onClick={()=>chooseJourney(activeJourney-1)}>↑ PREVIOUS NODE</button><button aria-label="Next journey entry" disabled={activeJourney===journeyCount-1} onClick={()=>chooseJourney(activeJourney+1)}>NEXT NODE ↓</button></div><span>ACTIVE NODE <strong>{number(activeJourney+1)}</strong> / {number(journeyCount)}</span></div>
        </div></section>

        <section className="pf-contact pf-section" id="contact" data-section="contact"><div className="pf-contact-frame"><svg className="pf-contact-shape pf-contact-shape-wide" viewBox="0 0 1200 760" preserveAspectRatio="none" aria-hidden="true"><path d="M28 42H450C475 42 477 0 500 0H700C723 0 725 42 750 42H1172Q1192 42 1192 66V684Q1192 710 1166 710H1038C1013 710 1007 748 976 748H224C193 748 187 710 162 710H34Q8 710 8 684V68Q8 42 28 42Z"/></svg><svg className="pf-contact-shape pf-contact-shape-compact" viewBox="0 0 360 760" preserveAspectRatio="none" aria-hidden="true"><path d="M28 30H142C152 30 153 18 162 18H198C207 18 208 30 218 30H332Q346 30 346 44V696Q346 710 332 710H266C251 710 246 730 230 730H130C114 730 109 710 94 710H28Q14 710 14 696V44Q14 30 28 30Z"/></svg><svg className="pf-contact-contours" viewBox="0 0 1200 760" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="currentColor"><path d="M-100 60C170 260 260-160 500 80s270 110 400-10 280-60 400 30M-70 250C230 410 220 150 440 210s280 240 440 60 250 0 400 70M-50 510C170 710 340 320 570 500s380 30 670-90M-40 680C180 480 360 790 580 690s350-40 710 150"/></g></svg>
          <div className="pf-contact-top"><span className="pf-mark">HS<span>.</span></span><span className="pf-eyebrow">06 / FINAL TRANSMISSION</span><span><i className="pf-status-dot"/>OPEN TO CONVERSATIONS</span></div>
          <img className="pf-signature" src={asset('assets/portfolio/hamid-signature-v3.webp')} width="900" height="300" alt="Hamid's handwritten signature" loading="lazy"/>
          <h2>YOU IMAGINE,<br/><span>I DELIVER.</span></h2>
          <nav className="pf-contact-pages" aria-label="Footer sections"><span>PAGES</span>{sections.filter(item=>item.id!=='contact').map(item=><a key={item.id} aria-label={item.label} href={`${portfolioPath}#${item.id}`} onClick={event=>navigate(event,item.id)}><RollingText text={item.label}/></a>)}</nav>
          <div className="pf-contact-person"><img src={naturalPortrait} width="1024" height="1536" alt="Hamid Shaikhy" loading="lazy"/></div>
          <nav className="pf-contact-social" aria-label="Connect with Hamid"><span>CONNECT</span><a aria-label="Email" href={`mailto:${profile.email}`}><RollingText text="Email"/></a><a aria-label="LinkedIn" href={profile.linkedin} target="_blank" rel="noopener noreferrer"><RollingText text="LinkedIn"/></a><a aria-label="GitHub" href={profile.github} target="_blank" rel="noopener noreferrer"><RollingText text="GitHub"/></a><a aria-label="Telegram" href="https://t.me/hamid_2_sh" target="_blank" rel="noopener noreferrer"><RollingText text="Telegram"/></a><a aria-label="WhatsApp" href="https://wa.me/hamid_2_sh" target="_blank" rel="noopener noreferrer"><RollingText text="WhatsApp"/></a><button onClick={copyEmail} aria-label="Copy email address">{copied?<Check size={12}/>:<Copy size={12}/>}Copy email</button></nav>
          <div className="pf-contact-marquee" aria-hidden="true"><div>{[0,1,2,3].map(round=><div className="pf-marquee-set" key={round}>{skills.filter(skill=>skill.icon).map(skill=><span key={skill.name}><FooterLogo icon={skill.icon!}/>{skill.name}</span>)}</div>)}</div></div>
          <div className="pf-contact-action"><a className="pf-macfolio-link" href={`${asset('')}?view=desktop`} target="_blank" rel="noopener noreferrer">EXPLORE MACFOLIO</a><span className="pf-copy-feedback" role="status">{copied?'Email copied.':copyError?'Select the address below to copy, or use the email link.':''}</span></div>
          <footer className="pf-footer"><span>© {new Date().getFullYear()} Hamid Shaikhy</span><span>TEHRAN, IRAN / FRONT-END DEVELOPER</span><div>{mode==='embedded'&&<a href={portfolioPath} target="_blank" rel="noopener noreferrer">Open full portfolio <ArrowUpRight size={12}/></a>}{link('home',<>Back to top <ArrowUpRight size={12}/></>)}</div></footer>
        </div></section>
      </main>
    </div>
    <aside className="pf-section-rail" aria-label="Section progress" inert={study!==null}><span>SEQUENCE</span><i><b/></i>{sections.map((item,i)=><a key={item.id} href={`${portfolioPath}#${item.id}`} aria-label={`Go to ${item.label}`} aria-current={activeSection===item.id?'location':undefined} onClick={event=>navigate(event,item.id)}>{number(i+1)}</a>)}</aside>
    <div className="pf-hud" aria-hidden="true"><span>PORTFOLIO.OS <i>V / 2026</i></span><span>TEHRAN / FRONT-END ENGINEERING</span></div>
    <ExperienceCursor surface={surface} reducedMotion={reducedMotion}/>
    {study!==null&&<Suspense fallback={<div className="pf-modal-backdrop"><div className="pf-case-loading" role="status">Opening case study…<button onClick={closeStudy}>Close</button></div></div>}><CaseStudy project={selectedWork[study]} onClose={closeStudy}/></Suspense>}
  </div>;
}
