import { validateTasks, type Task } from './domain';
const open = () => new Promise<IDBDatabase>((resolve,reject)=>{
  const request=indexedDB.open('rooz-planner',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('app');
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
  request.onblocked=()=>reject(new Error('لطفاً تب دیگر برنامه را ببند.'));
});
export async function loadTasks(): Promise<Task[]|null>{
  const db=await open();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('app','readonly'),req=tx.objectStore('app').get('tasks');
    req.onsuccess=()=>{try{resolve(req.result===undefined?null:validateTasks(req.result));}catch(e){reject(e);}};
    tx.oncomplete=()=>db.close();tx.onerror=()=>{db.close();reject(tx.error);};
  });
}
export async function saveTasks(tasks: Task[]): Promise<void>{
  const db=await open();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('app','readwrite');tx.objectStore('app').put(tasks,'tasks');
    tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};tx.onabort=()=>{db.close();reject(tx.error);};
  });
}
