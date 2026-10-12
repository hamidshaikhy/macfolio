import {useEffect,useRef,type RefObject} from 'react';
export default function CountUp({value,root,reducedMotion}:{value:number;root:RefObject<HTMLDivElement|null>;reducedMotion:boolean}) {
  const label=useRef<HTMLSpanElement>(null);
  useEffect(()=>{
    const element=label.current,port=root.current;if(!element||!port)return;
    if(reducedMotion||typeof IntersectionObserver==='undefined'){element.textContent=String(value);return;}
    let frame=0,started=false,disposed=false;let observer:IntersectionObserver|null=null;
    element.textContent='0';
    const tryStart=()=>{
      if(started)return;
      // Flying cards can cross the hero geometrically. Count only when the
      // number is actually inside the visible profile stage and scrollport.
      const box=element.getBoundingClientRect(),bounds=port.getBoundingClientRect(),stage=element.closest('.pf-stage')?.getBoundingClientRect();
      const top=Math.max(bounds.top,stage?.top??bounds.top),bottom=Math.min(bounds.bottom,stage?.bottom??bounds.bottom);
      const visibleHeight=Math.max(0,Math.min(box.bottom,bottom)-Math.max(box.top,top));
      if(!box.height||visibleHeight/box.height<.6||box.right<bounds.left||box.left>bounds.right)return;
      started=true;observer?.disconnect();port.removeEventListener('scroll',tryStart);const start=performance.now();
      const tick=(now:number)=>{if(disposed)return;const progress=Math.min(1,(now-start)/1150);element.textContent=String(Math.round(value*(1-Math.pow(1-progress,3))));if(progress<1&&!document.hidden)frame=requestAnimationFrame(tick);else element.textContent=String(value);};
      frame=requestAnimationFrame(tick);
    };
    observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))tryStart();},{root:port,threshold:.6});
    observer.observe(element);port.addEventListener('scroll',tryStart,{passive:true});
    return()=>{disposed=true;observer?.disconnect();port.removeEventListener('scroll',tryStart);cancelAnimationFrame(frame);};
  },[value,root,reducedMotion]);
  return <span ref={label} data-counter-target={value} aria-label={String(value)}>{reducedMotion?value:0}</span>;
}
