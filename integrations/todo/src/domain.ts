export type Timer = { durationMs: number; remainingMs: number; endAt: number | null; state: 'idle' | 'running' | 'paused' };
export type Task = { id: string; title: string; note: string; day: string; createdAt: number; completedAt: number | null; timer: Timer | null; sample?: boolean };
export const localDay = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const dayDate = (day: string) => new Date(`${day}T12:00:00`);
export const shiftDay = (day: string, amount: number) => { const d = dayDate(day); d.setDate(d.getDate()+amount); return localDay(d); };
export const remaining = (task: Task, now: number) => task.timer ? Math.max(0,task.timer.endAt === null ? task.timer.remainingMs : task.timer.endAt-now) : 0;
export function reconcile(tasks: Task[], now: number): Task[] {
  let changed=false;
  const next=tasks.map(task=>{
    if(!task.completedAt && task.timer?.state==='running' && task.timer.endAt!==null && task.timer.endAt<=now){changed=true;return {...task,completedAt:task.timer.endAt,timer:{...task.timer,remainingMs:0,endAt:null,state:'idle' as const}};}
    return task;
  });
  return changed?next:tasks;
}
export function complete(task: Task, now: number): Task {
  if(task.completedAt) return {...task,completedAt:null,timer:task.timer?{...task.timer,remainingMs:task.timer.durationMs,endAt:null,state:'idle'}:null};
  return {...task,completedAt:now,timer:task.timer?{...task.timer,remainingMs:remaining(task,now),endAt:null,state:'paused'}:null};
}
export function timerAction(task: Task, action: 'start'|'pause'|'stop', now: number): Task {
  if(!task.timer || task.completedAt)return task;
  const t=task.timer;
  if(action==='start')return {...task,timer:{...t,endAt:now+(t.remainingMs||t.durationMs),state:'running'}};
  if(action==='pause')return {...task,timer:{...t,remainingMs:remaining(task,now),endAt:null,state:'paused'}};
  return {...task,timer:{...t,remainingMs:t.durationMs,endAt:null,state:'idle'}};
}
export const isOverdue = (task: Task, today: string) => !task.completedAt && task.day<today;
export function validateTasks(value: unknown): Task[] {
  if(!Array.isArray(value)||value.length>10000)throw new Error('فایل پشتیبان معتبر نیست.');
  const ids=new Set<string>();
  return value.map((v: unknown)=>{
    if(!v||typeof v!=='object')throw new Error('ساختار تسک معتبر نیست.');
    const t=v as Task;
    if(typeof t.id!=='string'||ids.has(t.id)||typeof t.title!=='string'||!t.title.trim()||t.title.length>180||typeof t.note!=='string'||t.note.length>2000||typeof t.day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(t.day)||localDay(dayDate(t.day))!==t.day||!Number.isFinite(t.createdAt)||(t.completedAt!==null&&!Number.isFinite(t.completedAt)))throw new Error('اطلاعات تسک معتبر نیست.');
    ids.add(t.id);
    if(t.timer && (!Number.isFinite(t.timer.durationMs)||t.timer.durationMs<=0||t.timer.durationMs>86400000||!Number.isFinite(t.timer.remainingMs)||t.timer.remainingMs<0||t.timer.remainingMs>t.timer.durationMs||!['idle','paused','running'].includes(t.timer.state)||(t.timer.state==='running' && !Number.isFinite(t.timer.endAt))||(t.timer.state!=='running'&&t.timer.endAt!==null)))throw new Error('اطلاعات تایمر معتبر نیست.');
    return {id:t.id,title:t.title.trim(),note:t.note,day:t.day,createdAt:t.createdAt,completedAt:t.completedAt,timer:t.timer,sample:!!t.sample};
  });
}
export function sampleTasks(): Task[] {
  const now=Date.now(),day=localDay();
  return [
    {id:'sample-study',title:'یک قدم برای یادگیری',note:'۹۰ دقیقه مطالعه، با تمرکز و بدون عجله',day,createdAt:now,completedAt:null,timer:{durationMs:5400000,remainingMs:5400000,endAt:null,state:'idle'},sample:true},
    {id:'sample-walk',title:'کمی پیاده‌روی',note:'هوای تازه، ذهن آرام‌تر',day,createdAt:now+1,completedAt:null,timer:null,sample:true},
    {id:'sample-plan',title:'برنامه‌ریزی امروز',note:'از همین‌جا شروع کردی.',day,createdAt:now+2,completedAt:now,timer:null,sample:true}
  ];
}
