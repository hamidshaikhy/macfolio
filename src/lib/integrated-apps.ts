import { asset } from './assets';
export const integratedApps = [
  {id:'barg', title:'Barg', path:asset('apps/barg/'), icon:'assets/icons/barg.svg'},
  {id:'hamnava', title:'Hamnava', path:asset('apps/hamnava/'), icon:'assets/icons/hamnava.svg'},
  {id:'personal-finance', title:'Personal Finance', path:asset('apps/personal-finance/'), icon:'assets/icons/personal-finance.svg'},
  {id:'todo', title:'To Do List', path:asset('apps/todo/'), icon:'assets/icons/todo.svg'},
  {id:'koja-berim', title:'Koja Berim', path:asset('apps/koja-berim/'), icon:'assets/icons/koja-berim.svg'},
] as const;
export type IntegratedAppId = typeof integratedApps[number]['id'];
export const integratedApp = (id: string) => integratedApps.find(app=>app.id===id);
export const projectDemo = (id: string) => integratedApp(id === 'todo-list' ? 'todo' : id)?.path;
export type AppBridgeMessage = {channel:'macfolio-app-v1'; appId:IntegratedAppId; instance:string; type:'ready'|'focus'|'visibility'; visible?:boolean};
export function isChildMessage(data: unknown, id: IntegratedAppId, instance:string): data is AppBridgeMessage {
  if (!data || typeof data !== 'object') return false;
  const value = data as Partial<AppBridgeMessage>;
  return value.channel==='macfolio-app-v1' && value.appId===id && value.instance===instance && (value.type==='ready'||value.type==='focus');
}
