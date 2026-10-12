import {useEffect,useRef,type RefObject} from 'react';
const systems=[['UI','REACT','COMPONENT SYSTEMS'],['TS','TYPESCRIPT','TYPED APPLICATIONS'],['WEB','NEXT.JS','WEB EXPERIENCES'],['API','INTEGRATION','CONNECTED DATA'],['UX','RESPONSIVE / RTL','EVERY SCREEN']];
export default function HeroSignals({surface,reducedMotion}:{surface:RefObject<HTMLDivElement|null>;reducedMotion:boolean}) {
  const group=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const element=group.current,host=surface.current,hero=element?.closest<HTMLElement>('.pf-hero');if(!element||!host||!hero)return;
    const rows=[...element.querySelectorAll<HTMLElement>('.pf-system')];
    let frame=0,point:{x:number;y:number}|null=null,source:'pointer'|'ambient'='pointer';
    const draw=()=>{
      frame=0;
      const weights=rows.map(row=>{
        if(!point)return .06;
        const box=row.getBoundingClientRect(),line=row.querySelector('svg')!.getBoundingClientRect();
        const endpoint=Math.hypot(point.x-(box.left+box.width/2),point.y-(box.top+box.height/2));
        const anchor=Math.hypot(point.x-line.left,point.y-(line.top+35));
        const radius=Math.max(125,host.clientHeight*.19);
        return .06+.94*Math.exp(-Math.pow(Math.min(endpoint,anchor)/radius,2));
      });
      rows.forEach((row,i)=>row.style.setProperty('--signal-visibility',String(weights[i])));
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(draw);};
    const move=(event:PointerEvent)=>{if(event.pointerType==='touch')return;source='pointer';point={x:event.clientX,y:event.clientY};schedule();};
    const leave=()=>{point=null;schedule();};
    const ambient=(event:Event)=>{const detail=(event as CustomEvent<{x:number;y:number;active:boolean}>).detail;if(detail.active){source='ambient';const box=host.getBoundingClientRect();point={x:box.left+detail.x,y:box.top+detail.y};schedule();}else if(source==='ambient')leave();};
    const pause=()=>{const visible=!document.hidden&&hero.getClientRects().length>0&&host.dataset.scene==='home'&&!host.inert;rows.forEach(row=>{const svg=row.querySelector('svg')!;if(typeof svg.pauseAnimations==='function'){if(visible&&!reducedMotion)svg.unpauseAnimations();else svg.pauseAnimations();}});};
    const observer=typeof MutationObserver!=='undefined'?new MutationObserver(pause):null;observer?.observe(host,{attributes:true,attributeFilter:['data-scene']});
    hero.addEventListener('pointermove',move,{passive:true});hero.addEventListener('pointerleave',leave);host.addEventListener('pf-ambient-inspect',ambient);document.addEventListener('visibilitychange',pause);pause();
    return()=>{cancelAnimationFrame(frame);observer?.disconnect();hero.removeEventListener('pointermove',move);hero.removeEventListener('pointerleave',leave);host.removeEventListener('pf-ambient-inspect',ambient);document.removeEventListener('visibilitychange',pause);};
  },[surface,reducedMotion]);
  return <div ref={group} className="pf-hero-systems" aria-label="Front-end specializations">{systems.map(([code,name,detail],i)=><div className="pf-system" key={code}><svg viewBox="0 0 280 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 35h75l90-25h115"/><circle cx="0" cy="35" r="1.7"/><circle className="pf-signal-particle" cx="0" cy="0" r="2.1">{!reducedMotion&&<animateMotion path="M0 35h75l90-25h115" dur={`${2.7+i*.49}s`} begin={`${-.4-i*.73}s`} repeatCount="indefinite"/>}</circle></svg><span>{code}</span><div><strong>{name}</strong><small>{detail}</small></div></div>)}</div>;
}
