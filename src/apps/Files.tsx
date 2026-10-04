import { useState } from "react";
import { FileText, Trash2, RotateCcw } from "lucide-react";
import { useFiles } from "../state/files";
import { basename, dirname } from "../lib/filesystem";
export function Trash() {
  const deleted = useFiles(s => s.files).filter(f => f.deleted);
  const [confirm, setConfirm] = useState(false);
  return <div className="trash-app">
    <div className="app-toolbar"><span>{deleted.length} {deleted.length === 1 ? "item" : "items"}</span><button className="secondary-button" disabled={!deleted.length} onClick={() => setConfirm(true)}>Empty Trash</button></div>
    {confirm && <div className="inline-confirm" role="alertdialog" aria-modal="true" aria-label="Empty Trash confirmation"><p>Permanently delete {deleted.length} files from this browser?</p><button className="secondary-button" autoFocus onClick={() => setConfirm(false)}>Cancel</button><button className="danger-button" onClick={() => { useFiles.getState().emptyTrash(); setConfirm(false); }}>Delete files</button></div>}
    {deleted.length ? <div className="trash-list">{deleted.map((f, i) => <div key={f.trashId || `${f.path}-${i}`}><FileText size={30} /><span><strong dir="auto">{f.title || basename(f.path)}</strong><small>{dirname(f.path)}</small></span><button className="secondary-button" onClick={() => useFiles.getState().restore(f.trashId || f.path)}><RotateCcw size={16} /> Put Back</button></div>)}</div> : <div className="empty-state"><Trash2 size={50} /><h2>Trash is empty</h2><p>Deleted notes and files appear here.</p></div>}
  </div>;
}
