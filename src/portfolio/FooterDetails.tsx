import {asset} from '../lib/assets';
export function RollingText({text}:{text:string}) {
  return <span className="pf-roll-text" aria-hidden="true">{[...text.toUpperCase()].map((letter,i)=><span className="pf-roll-letter" key={i} style={{transitionDelay:`${i*14}ms`}}><span data-letter={letter}>{letter===' '?' ':letter}</span></span>)}</span>;
}
export function FooterLogo({icon}:{icon:string}) {
  if(icon==='javascript'||icon==='typescript')return <svg viewBox="0 0 64 64" aria-hidden="true"><rect x="3" y="3" width="58" height="58" rx="1" fill="currentColor"/><text x="57" y="53" textAnchor="end" fill="#1b2415" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="32">{icon==='javascript'?'JS':'TS'}</text></svg>;
  if(icon==='nextjs')return <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="currentColor"/><path d="M19 46V19h6l23 33-6 3-17-25v16zm23-27h5v24l-5-7z" fill="#1b2415"/></svg>;
  return <img src={asset(`assets/toolkit/${icon}.svg`)} alt="" width="64" height="64"/>;
}
