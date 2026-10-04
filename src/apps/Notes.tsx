import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Heading2, List, Search, FileText, Plus, Trash2, Download, Code2, Eye, Pencil } from "lucide-react";
import Markdown from "react-markdown";
import { useFiles } from "../state/files";
import { useOS } from "../state/os";
import { basename, fileTitle, HOME } from "../lib/filesystem";
import { downloadText } from "../lib/download";
export default function Notes() {
  const files = useFiles(s => s.files);
  const selectedFile = useOS(s => s.selectedFile);
  const [query, setQuery] = useState(""); const [preview, setPreview] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);
  const notes = files.filter(file => !file.deleted && file.path.startsWith(`${HOME}/Notes/`));
  const current = notes.find(file => file.path === selectedFile) || notes[0];
  const matches = notes.filter(file => `${fileTitle(file)} ${file.content}`.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => { setQuery(""); setPreview(false); }, [selectedFile]);
  const create = () => { const path = useFiles.getState().createNote(); useOS.getState().setSelectedFile(path); setQuery(""); setPreview(false); requestAnimationFrame(() => field.current?.focus()); };
  function format(before: string, after = "") {
    const textarea = field.current; if (!current || !textarea) return;
    const start = textarea.selectionStart; const end = textarea.selectionEnd;
    const selected = current.content.slice(start, end);
    useFiles.getState().save(current.path, current.content.slice(0, start) + before + selected + after + current.content.slice(end));
    requestAnimationFrame(() => { textarea.focus(); textarea.setSelectionRange(start + before.length, end + before.length); });
  }
  return <div className="notes-app">
    <aside className="notes-sidebar"><div className="notes-toolbar"><strong>Notes</strong><button aria-label="New note" onClick={create}><Plus size={20} /></button></div><label className="app-search notes-search"><Search size={15} /><input placeholder="Search notes" aria-label="Search notes" value={query} onChange={e => setQuery(e.target.value)} /></label><div className="note-list">{matches.map(file => <button key={file.path} className={current?.path === file.path ? "selected" : ""} onClick={() => useOS.getState().setSelectedFile(file.path)}><strong dir="auto">{file.title || file.content.split("\n").find(line => line.trim())?.replace(/^#+\s*/, "") || "Untitled note"}</strong><small>{new Date(file.modified).toLocaleDateString("en-GB", { timeZone: "Asia/Tehran" })}<span dir="auto">{file.content.split("\n").filter(Boolean)[1]?.slice(0, 55) || "No additional text"}</span></small></button>)}{query && !matches.length && <p className="note-no-results">No matching notes</p>}</div><footer>{notes.length} notes · On this device</footer></aside>
    <div className="note-detail"><div className="app-toolbar note-actions"><div className="note-format"><button aria-label="Bold text" title="Bold (Markdown)" disabled={!current || preview} onClick={() => format("**", "**")}><Bold size={17} /></button><button aria-label="Italic text" title="Italic (Markdown)" disabled={!current || preview} onClick={() => format("*", "*")}><Italic size={17} /></button><button aria-label="Add heading" title="Heading (Markdown)" disabled={!current || preview} onClick={() => format("\n## ")}><Heading2 size={18} /></button><button aria-label="Add list" title="List (Markdown)" disabled={!current || preview} onClick={() => format("\n- ")}><List size={18} /></button></div><div><button aria-label={preview ? "Edit note" : "Preview formatted note"} disabled={!current} onClick={() => setPreview(v => !v)}>{preview ? <Pencil size={18} /> : <Eye size={18} />}</button><button aria-label="Open note in Code" disabled={!current} onClick={() => { useOS.getState().setSelectedFile(current!.path); useOS.getState().openApp("editor"); }}><Code2 size={18} /></button><button aria-label="Download note" disabled={!current} onClick={() => downloadText(current!.content, basename(current!.path))}><Download size={18} /></button><button aria-label="Move note to Trash" disabled={!current} onClick={() => useFiles.getState().remove(current!.path)}><Trash2 size={18} /></button></div></div>
      {current ? <><div className="note-metadata"><time>{new Date(current.modified).toLocaleString("en-GB", { timeZone: "Asia/Tehran", dateStyle: "medium", timeStyle: "short" })}</time><span>Saved locally</span></div><input className="note-title persian" aria-label="Note title" dir="auto" placeholder="Untitled note" value={current.title || ""} onChange={e => useFiles.getState().setTitle(current.path, e.target.value)} />{preview ? <article className="note-preview persian" dir="auto"><Markdown components={{ a: props => <a {...props} target="_blank" rel="noopener noreferrer" /> }}>{current.content || "*This note is empty.*"}</Markdown></article> : <textarea ref={field} aria-label="Note content" className="note-editor persian" dir="auto" value={current.content} onChange={e => useFiles.getState().save(current.path, e.target.value)} placeholder="یادداشت شما…" />}<footer className="note-footer">{current.content.length} characters · Markdown formatting</footer></> : <div className="empty-state"><FileText size={42} /><h2>No notes yet</h2><button className="primary-button" onClick={create}>Create a note</button></div>}
    </div>
  </div>;
}
