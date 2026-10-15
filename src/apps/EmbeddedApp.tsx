import { useMobile } from "../lib/hooks";
import { useEffect, useRef, useState } from 'react';
import { integratedApp, isChildMessage, type IntegratedAppId, type AppBridgeMessage } from '../lib/integrated-apps';
import { useOS } from '../state/os';
import './embedded-app.css';

export default function EmbeddedApp({id}:{id:IntegratedAppId}) {
  const app = integratedApp(id)!;
  const mobile = useMobile();
  const frame = useRef<HTMLIFrameElement>(null);
  const [instance,setInstance] = useState(()=>crypto.randomUUID());
  const [status,setStatus] = useState<'loading'|'ready'|'failed'>('loading');
  const visible = useOS(s=>!s.locked && (mobile ? s.mobileApp===id : s.windows.some(w=>w.app===id&&!w.minimized)));
  const visibleRef = useRef(visible); visibleRef.current=visible;
  function sendVisibility() {
    const message: AppBridgeMessage = {channel:'macfolio-app-v1',appId:id,instance,type:'visibility',visible:visibleRef.current&&!document.hidden};
    frame.current?.contentWindow?.postMessage(message,location.origin);
  }
  useEffect(()=>{
    let timeout:ReturnType<typeof setTimeout>;
    const message = (event:MessageEvent)=>{
      if (event.origin!==location.origin || event.source!==frame.current?.contentWindow || !isChildMessage(event.data,id,instance)) return;
      if (event.data.type==='ready') { clearTimeout(timeout); setStatus('ready'); sendVisibility(); }
      else useOS.getState().focusApp(id);
    };
    window.addEventListener('message',message);
    timeout=setTimeout(()=>setStatus('failed'),30000);
    return ()=>{clearTimeout(timeout);window.removeEventListener('message',message);};
  },[id,instance]);
  useEffect(()=>{sendVisibility();},[visible,status]);
  useEffect(()=>{document.addEventListener('visibilitychange',sendVisibility);return()=>document.removeEventListener('visibilitychange',sendVisibility);},[instance]);
  const src = `${app.path}?embed=macfolio&instance=${encodeURIComponent(instance)}`;
  return <div className="embedded-app" data-app-id={id} data-status={status}>
    <iframe ref={frame} key={instance} title={`${app.title} application`} src={src} allow="autoplay; fullscreen" onError={()=>setStatus('failed')} />
    {status!=='ready' && <div className="embedded-app-status" role={status==='failed'?'alert':'status'}>
      <strong>{status==='failed'?`${app.title} could not open`:`Opening ${app.title}…`}</strong>
      {status==='failed' && <><p>Your saved data is still on this device.</p><button className="primary-button" onClick={()=>{setStatus('loading');setInstance(crypto.randomUUID());}}>Try again</button><a href={app.path} target="_blank" rel="noopener noreferrer">Open full app</a></>}
    </div>}
  </div>;
}
