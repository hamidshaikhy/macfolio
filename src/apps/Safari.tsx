import { useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Home, LockKeyhole, Search, ExternalLink, Globe, Github, FileText, Mail, UserRound, Compass } from 'lucide-react';
import { profile, projects } from '../lib/content';
import { useOS } from '../state/os';
import { AppIcon } from '../components/Icon';
import About from './About';
import Projects from './Projects';
import PortfolioExperience from '../portfolio/PortfolioExperience';
import { portfolioPath } from '../portfolio/content';

const internal = ['macfolio://start', 'macfolio://about', 'macfolio://projects', 'macfolio://resume'];
const homepage = internal[0];
const portfolioHome = new URL(portfolioPath, window.location.origin).href;
function portfolioAddress(address: string) {
  try { const url = new URL(address, window.location.origin); return url.origin === window.location.origin && url.pathname.replace(/\/$/,'') === portfolioPath; }
  catch { return false; }
}
export default function Safari() {
  const [history, setHistory] = useState([homepage]);
  const [index, setIndex] = useState(0);
  const [url, setUrl] = useState(homepage);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const current = history[index];
  const isPortfolio = portfolioAddress(current);
  function navigate(value: string) {
    setError('');
    let destination = value.trim() || homepage;
    if (portfolioAddress(destination) || destination === 'macfolio://portfolio') destination = new URL(destination === 'macfolio://portfolio' ? portfolioPath : destination, window.location.origin).href;
    else if (!internal.includes(destination)) {
      if (/^(?:javascript|data|file|blob|macfolio):/i.test(destination)) { setError('Enter a web address or a macfolio page.'); return; }
      if (!destination.includes('.') && !/^https?:\/\//.test(destination)) destination = `https://www.google.com/search?q=${encodeURIComponent(destination)}`;
      else if (!/^https?:\/\//.test(destination)) destination = `https://${destination}`;
      try { const address = new URL(destination); if (!['http:', 'https:'].includes(address.protocol) || !address.hostname.includes('.')) throw Error(); destination = address.href; }
      catch { setError('Enter a valid website address.'); return; }
    }
    if (destination === current) { setUrl(destination); return; }
    setHistory(h => [...h.slice(0,index+1),destination]); setIndex(index+1); setUrl(destination);
  }
  function travel(next: number) { setIndex(next); setUrl(history[next]); setError(''); }
  const isExternal = !isPortfolio && !internal.includes(current);
  return <div className="safari-app">
    <form className="safari-toolbar" onSubmit={event => { event.preventDefault(); navigate(url); }}>
      <div className="safari-nav"><button type="button" aria-label="Go back" disabled={index===0} onClick={()=>travel(index-1)}><ArrowLeft size={18}/></button><button type="button" aria-label="Go forward" disabled={index>=history.length-1} onClick={()=>travel(index+1)}><ArrowRight size={18}/></button><button type="button" aria-label="Safari homepage" onClick={()=>navigate(homepage)}><Home size={17}/></button></div>
      <div className="safari-address"><LockKeyhole size={13}/><input value={url} onChange={event=>setUrl(event.target.value)} placeholder="Search or enter website name" aria-label="Website address" onFocus={event=>event.target.select()}/><button aria-label="Navigate to address"><Search size={16}/></button><button type="button" aria-label="Reload page" onClick={()=>setReload(n=>n+1)}><RotateCw size={15}/></button></div>
    </form>
    <nav className="safari-bookmarks" aria-label="Safari bookmarks"><button onClick={()=>navigate(portfolioHome)}><Compass size={13}/>Portfolio</button><button onClick={()=>navigate(internal[0])}>Start Page</button><button onClick={()=>navigate(internal[1])}><UserRound size={13}/>About</button><button onClick={()=>navigate(internal[2])}>Projects</button><button onClick={()=>navigate(internal[3])}>Résumé</button><button onClick={()=>useOS.getState().openApp('github')}>GitHub</button><button onClick={()=>navigate(profile.linkedin)}>LinkedIn</button><a href={portfolioPath} target="_blank" rel="noopener noreferrer" aria-label="Open full portfolio"><ExternalLink size={12}/><span>Full portfolio</span></a></nav>
    {error && <div className="safari-error" role="alert">{error}</div>}
    <div className={`safari-content ${isPortfolio?'safari-portfolio-content':''}`}>
      {isPortfolio ? <PortfolioExperience key={`portfolio-${reload}`} mode="embedded" section={new URL(current).hash.slice(1)} onNavigate={section=>navigate(`${portfolioHome}#${section}`)}/>
      : <div key={`${current}-${reload}`} style={{height:'100%'}}>{current===internal[1] ? <About/>
      : current===internal[2] ? <Projects/>
      : current===internal[3] ? <div className="empty-state"><FileText size={48}/><h2>Hamid Shaikhy · Résumé</h2><p className="persian" dir="rtl">رزومهٔ اصلی را در Preview همین محیط بخوانید.</p><button className="primary-button" onClick={()=>useOS.getState().openApp('resume')}>Read in Preview</button></div>
      : isExternal ? <div className="safari-destination"><div className="destination-mark"><Globe size={42}/></div><small>WEBSITE</small><h2>{new URL(current).hostname.replace(/^www\./,'')}</h2><p dir="ltr">{current}</p><a className="primary-button" href={current} target="_blank" rel="noopener noreferrer"><ExternalLink size={17}/>Open Website</a><span>Continue in a browser tab. macfolio keeps this destination in your history.</span><button className="text-button" onClick={()=>navigate(internal[0])}>Return to Favorites</button></div>
      : <main className="safari-start"><h2>Favorites</h2><div className="safari-favorites">{[{id:'safari' as const,name:'Portfolio',dest:portfolioHome},{id:'about' as const,name:'About Hamid',dest:internal[1]},{id:'github' as const,name:'GitHub',dest:profile.github},{id:'linkedin' as const,name:'LinkedIn',dest:profile.linkedin}].map(item=><button key={item.id} onClick={()=>item.id==='github'?useOS.getState().openApp('github'):navigate(item.dest)}><AppIcon id={item.id} size={62}/><span>{item.name}</span></button>)}</div><h2>My projects</h2><div className="safari-projects">{projects.map(project=><button key={project.id} onClick={()=>{useOS.getState().setSelectedProject(project.id);navigate(internal[2]);}}><span style={{background:project.color}}>{project.monogram}</span><div><strong>{project.title}</strong><small className="persian" dir="rtl">{project.summary}</small></div>{project.id==='dika'?<Globe size={18}/>:<Github size={18}/>}</button>)}</div><div className="safari-contact"><Mail size={16}/><a href={`mailto:${profile.email}`}>{profile.email}</a></div><p className="safari-hint">Portfolio pages open here. External sites open with Open Website.</p></main>}</div>}
    </div>
  </div>;
}
