import { beforeEach, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import EmbeddedApp from '../apps/EmbeddedApp';
import { apps, dockApps } from '../lib/apps';
import { integratedApps } from '../lib/integrated-apps';
import { useOS } from '../state/os';
beforeEach(()=>{useOS.setState({windows:[],mobileApp:null,locked:false});});
it('registers every child consistently and excludes removed internal apps',()=>{
  expect(apps.some(a=>(a.id as string)==='notes'||(a.id as string)==='linkedin')).toBe(false);
  expect(new Set(apps.map(a=>a.id)).size).toBe(apps.length);
  expect(dockApps.slice(dockApps.findIndex(a=>a.id==='github')+1,dockApps.findIndex(a=>a.id==='contacts')).map(a=>a.id)).toEqual(integratedApps.map(a=>a.id));
});
it('requires the exact iframe source, origin, app and instance before accepting ready or focus',()=>{
  useOS.getState().openApp('todo');useOS.getState().openApp('barg');
  render(<EmbeddedApp id="todo"/>);
  const frame=screen.getByTitle('To Do List application') as HTMLIFrameElement;
  const instance=new URL(frame.src).searchParams.get('instance');
  const data={channel:'macfolio-app-v1',appId:'todo',instance,type:'ready'};
  const deliver=(value:unknown,origin=location.origin,source:Window|null=frame.contentWindow)=>act(()=>window.dispatchEvent(new MessageEvent('message',{data:value,origin,source})));
  deliver(data,'https://other.example');deliver(data,location.origin,window);deliver({...data,appId:'barg'});deliver({...data,instance:'forged'});deliver({...data,type:'open',url:'javascript:bad'});
  expect(document.querySelector('.embedded-app')).toHaveAttribute('data-status','loading');
  deliver(data);expect(document.querySelector('.embedded-app')).toHaveAttribute('data-status','ready');
  deliver({...data,type:'focus'});expect(useOS.getState().windows.at(-1)?.app).toBe('todo');
});
