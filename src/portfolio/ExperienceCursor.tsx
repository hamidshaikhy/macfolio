import {useEffect,useRef,type RefObject} from 'react';
import {createLiquidTrail} from './LiquidTrail';
export default function ExperienceCursor({surface,reducedMotion}:{surface:RefObject<HTMLDivElement|null>;reducedMotion:boolean}) {
  const cursor=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const host=surface.current,element=cursor.current,paint=canvas.current;
    if(!host||!element||!paint||!window.matchMedia('(hover: hover) and (pointer: fine)').matches)return;
    host.dataset.finePointer='true';
    const liquid=reducedMotion?null:createLiquidTrail(paint);
    const idleDelay=10000,sweepDuration=2000;
    let frame=0,timer:ReturnType<typeof setTimeout>|undefined,autoStart=0;
    let point={x:0,y:0},previous={x:0,y:0};let lastSample=0;
    const usable=()=>!document.hidden&&host.getClientRects().length>0&&host.clientWidth>0&&host.dataset.modal!=='true'&&(!host.closest('.os-window')||host.closest('.os-window')!.classList.contains('active'));
    const signal=(x:number,y:number,active:boolean)=>host.dispatchEvent(new CustomEvent('pf-ambient-inspect',{detail:{x,y,active}}));
    const arm=(delay=idleDelay)=>{clearTimeout(timer);if(!liquid||!usable()||host.dataset.scene!=='home')return;timer=setTimeout(()=>{if(!usable()||host.dataset.scene!=='home')return;autoStart=performance.now();paint.dataset.idleSweep='true';start();},delay);};
    const tick=(now:number)=>{
      frame=0;if(!usable()){autoStart=0;delete paint.dataset.idleSweep;liquid?.clear();signal(0,0,false);arm();return;}
      if(autoStart&&host.dataset.scene!=='home'){autoStart=0;delete paint.dataset.idleSweep;signal(0,0,false);}
      if(autoStart){
        const progress=Math.min(1,(now-autoStart)/sweepDuration),phase=progress*3;
        const x=host.clientWidth*(.5+.37*Math.cos(phase*Math.PI)),y=host.clientHeight*(.18+progress*.63);
        liquid?.add(x,y,now,true);
        if(host.dataset.scene==='home')signal(x,y,true);
        if(progress>=1){autoStart=0;delete paint.dataset.idleSweep;signal(0,0,false);arm(idleDelay-sweepDuration);}
      }
      const alive=liquid?.draw(now)||false;
      if(liquid)host.dispatchEvent(new CustomEvent('pf-liquid-field',{detail:{points:liquid.field(),active:alive}}));
      if(autoStart||alive)frame=requestAnimationFrame(tick);
    };
    const start=()=>{if(!frame)frame=requestAnimationFrame(tick);};
    const move=(event:PointerEvent)=>{
      if(event.pointerType==='touch')return;
      const box=host.getBoundingClientRect();point={x:event.clientX-box.left,y:event.clientY-box.top};
      const now=performance.now();
      if(autoStart){autoStart=0;delete paint.dataset.idleSweep;signal(0,0,false);}
      element.classList.add('is-visible');element.classList.toggle('is-project',!!(event.target as Element).closest('.pf-project-open'));
      element.classList.toggle('is-link',!!(event.target as Element).closest('a,button,.pf-portrait'));
      element.style.transform=`translate3d(${point.x}px,${point.y}px,0)`;
      if(now-lastSample>12){
        const distance=Math.hypot(point.x-previous.x,point.y-previous.y),steps=Math.min(6,Math.max(1,Math.ceil(distance/35)));
        for(let i=1;i<=steps;i++)liquid?.add(previous.x+(point.x-previous.x)*i/steps,previous.y+(point.y-previous.y)*i/steps,now);
        previous=point;lastSample=now;
      }
      start();arm();
    };
    const leave=()=>{element.classList.remove('is-visible');previous=point;};
    const reset=()=>{cancelAnimationFrame(frame);frame=0;autoStart=0;delete paint.dataset.idleSweep;clearTimeout(timer);signal(0,0,false);liquid?.clear();if(usable()){liquid?.resize(host.clientWidth,host.clientHeight);arm();}};
    const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(reset):null;observer?.observe(host);
    const sceneObserver=typeof MutationObserver!=='undefined'?new MutationObserver(reset):null;sceneObserver?.observe(host,{attributes:true,attributeFilter:['data-scene','data-modal']});
    const lost=(event:Event)=>{event.preventDefault();cancelAnimationFrame(frame);frame=0;clearTimeout(timer);autoStart=0;delete paint.dataset.idleSweep;signal(0,0,false);};
    paint.addEventListener('webglcontextlost',lost);host.addEventListener('pointermove',move);host.addEventListener('pointerleave',leave);document.addEventListener('visibilitychange',reset);reset();
    return()=>{delete host.dataset.finePointer;cancelAnimationFrame(frame);clearTimeout(timer);observer?.disconnect();sceneObserver?.disconnect();liquid?.destroy();host.removeEventListener('pointermove',move);host.removeEventListener('pointerleave',leave);document.removeEventListener('visibilitychange',reset);paint.removeEventListener('webglcontextlost',lost);};
  },[surface,reducedMotion]);
  return <><canvas className="pf-liquid-trail" ref={canvas} aria-hidden="true"/><div className="pf-cursor" ref={cursor} aria-hidden="true"><i/></div></>;
}
