import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Folder, FileText, Code2, Music2, LayoutGrid, List, Search, Plus, Trash2, ExternalLink, Download, Home, RotateCcw, Pencil, HardDrive, Check } from "lucide-react";
import { useFiles } from "../state/files";
import { useOS } from "../state/os";
import { bundledFiles, folders, HOME, basename, dirname, fileTitle } from "../lib/filesystem";
import { openFile } from "../lib/openFile";
import { downloadText } from "../lib/download";
interface Entry { path: string; name: string; kind: string; readonly: boolean; modified?: string; content?: string; }
export default function Finder() {
  const files = useFiles(s => s.files);
  const folder = useOS(s => s.finderPath);
  const selectedFile = useOS(s => s.selectedFile);
  const [history, setHistory] = useState([folder]); const [index, setIndex] = useState(0);
  const [query, setQuery] = useState(""); const [view, setView] = useState<"icons" | "list">("icons");
  const [sort, setSort] = useState("name"); const [selected, setSelected] = useState(selectedFile);
  const [context, setContext] = useState<{ x: number; y: number; entry: Entry } | null>(null);
  const [renaming, setRenaming] = useState(false); const [name, setName] = useState(""); const [error, setError] = useState("");
  const all = useMemo<Entry[]>(() => {
    const dirs = new Set(["/", "/Users", ...folders, ...files.filter(f => !f.deleted).flatMap(f => { const parts = f.path.split("/"); return parts.slice(3, -1).map((_, i) => parts.slice(0, i + 4).join("/")); })]);
    return [...Array.from(dirs).map(path => ({ path, name: basename(path), kind: "Folder", readonly: true })), ...bundledFiles.map(f => ({ path: f.path, name: basename(f.path), kind: f.kind === "pdf" ? "PDF document" : f.kind === "audio" ? "Audio" : "Project", readonly: true })), ...files.filter(f => !f.deleted).map(f => ({ ...f, name: f.path.includes("/Notes/") ? fileTitle(f) : basename(f.path), kind: f.path.endsWith(".md") ? "Markdown" : "Source file", readonly: false }))];
  }, [files]);
  const entries = all.filter(f => query ? `${f.name} ${f.path} ${f.content || ""}`.toLowerCase().includes(query.toLowerCase()) && f.path !== HOME : f.path !== folder && dirname(f.path) === folder).sort((a, b) => sort === "kind" ? a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name) : sort === "modified" ? (b.modified || "").localeCompare(a.modified || "") : a.name.localeCompare(b.name));
  useEffect(() => {
    if (history[index] !== folder) { setHistory(h => [...h.slice(0, index + 1), folder]); setIndex(i => i + 1); }
    setQuery(""); setContext(null); setRenaming(false);
  }, [folder]);
  function navigate(path: string) { useOS.getState().setFinderPath(path); setSelected(""); }
  function travel(next: number) { setIndex(next); useOS.getState().setFinderPath(history[next]); }
  function open(entry: Entry) { entry.kind === "Folder" ? navigate(entry.path) : openFile(entry.path); }
  function rename() {
    const result = useFiles.getState().rename(selected, name);
    if (!result) { setError("Choose a unique file name without slashes."); return; }
    useOS.getState().setSelectedFile(result); setSelected(result); setRenaming(false); setError("");
  }
  const current = all.find(f => f.path === selected);
  const canCreate = folder === HOME || folder.startsWith(HOME + "/");
  const icon = (entry: Entry, size = 40) => entry.kind === "Folder" ? <Folder size={size} fill="#77c4f1" color="#379cd5" /> : entry.kind === "Audio" ? <Music2 size={size} /> : entry.kind === "Source file" ? <Code2 size={size} /> : <FileText size={size} />;
  function download(entry: Entry) { const bundled = bundledFiles.find(f => f.path === entry.path); if (bundled?.url) { const a = document.createElement("a"); a.href = bundled.url; a.download = basename(entry.path); a.click(); } else if (entry.content !== undefined) downloadText(entry.content, basename(entry.path)); }
  return <div className="finder-app" onClick={() => setContext(null)}>
    <aside className="finder-sidebar"><div className="sidebar-heading">Favorites</div>{folders.map(path => <button key={path} className={folder === path ? "selected" : ""} onClick={() => navigate(path)}>{path === HOME ? <Home size={17} /> : path.endsWith("Code") ? <Code2 size={17} /> : path.endsWith("Music") ? <Music2 size={17} /> : path.endsWith("Documents") ? <FileText size={17} /> : <Folder size={17} />}<span>{path === HOME ? "Hamid" : basename(path)}</span></button>)}<div className="sidebar-heading">Locations</div><span className="finder-device"><HardDrive size={17} /> On this device</span><button onClick={() => useOS.getState().openApp("trash")}><Trash2 size={17} /> Trash <small>{files.filter(f => f.deleted).length}</small></button></aside>
    <div className="finder-main"><div className="finder-toolbar app-toolbar"><div><button aria-label="Back" disabled={index === 0} onClick={() => travel(index - 1)}><ChevronLeft size={20} /></button><button aria-label="Forward" disabled={index === history.length - 1} onClick={() => travel(index + 1)}><ChevronRight size={20} /></button><strong>{query ? "Search results" : folder === HOME ? "Hamid" : basename(folder)}</strong></div><div><button aria-label="Icon view" aria-pressed={view === "icons"} onClick={() => setView("icons")}><LayoutGrid size={18} /></button><button aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")}><List size={18} /></button><select aria-label="Sort files" value={sort} onChange={e => setSort(e.target.value)}><option value="name">Name</option><option value="kind">Kind</option><option value="modified">Modified</option></select></div></div>
      <div className="finder-actionbar"><label className="app-search"><Search size={15} /><input aria-label="Search files" placeholder="Search workspace" value={query} onChange={e => setQuery(e.target.value)} /></label><button className="secondary-button" disabled={!canCreate} title={!canCreate ? "Create files inside the Hamid workspace" : undefined} onClick={() => { const path = folder.endsWith("Notes") ? useFiles.getState().createNote() : useFiles.getState().createFile(folder); setSelected(path); openFile(path); }}><Plus size={16} /> New {folder.endsWith("Notes") ? "Note" : "File"}</button><button className="icon-button" aria-label="Open selected file" disabled={!current} onClick={() => current && open(current)}><ExternalLink size={17} /></button><button className="icon-button" aria-label="Rename selected file" disabled={!current || current.readonly} onClick={() => { setName(basename(selected)); setRenaming(true); }}><Pencil size={17} /></button><button className="icon-button" aria-label="Move selected file to Trash" disabled={!current || current.readonly} title={current?.readonly ? "Bundled assets are read-only" : "Move to Trash"} onClick={() => useFiles.getState().remove(selected)}><Trash2 size={17} /></button></div>
      {renaming && <form className="finder-rename" onSubmit={e => { e.preventDefault(); rename(); }}><input autoFocus aria-label="File name" value={name} onChange={e => setName(e.target.value)} /><button className="primary-button"><Check size={16} /> Rename</button><button type="button" className="secondary-button" onClick={() => setRenaming(false)}>Cancel</button>{error && <span role="alert">{error}</span>}</form>}
      <div className={`finder-files ${view}`} role="listbox" aria-label="Files" tabIndex={0} onKeyDown={e => {
        if (e.key === "Enter" && current) { e.preventDefault(); open(current); }
        if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) { e.preventDefault(); const n = entries.findIndex(f => f.path === selected); setSelected(entries[Math.max(0, Math.min(entries.length - 1, n + (e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1)))]?.path || ""); }
        if (e.key === "Delete" && current && !current.readonly) useFiles.getState().remove(current.path);
      }}>{entries.length ? entries.map(entry => <button key={entry.path} role="option" aria-selected={selected === entry.path} className={selected === entry.path ? "selected" : ""} onClick={() => setSelected(entry.path)} onDoubleClick={() => open(entry)} onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setSelected(entry.path); setContext({ x: Math.min(e.clientX, window.innerWidth - 210), y: Math.min(e.clientY, window.innerHeight - 200), entry }); }} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); open(entry); } }} title={entry.path}>{icon(entry, view === "icons" ? 46 : 20)}<span dir="auto">{entry.name}</span>{view === "list" && <><small>{entry.kind}</small><small>{entry.readonly ? "Read-only" : new Date(entry.modified!).toLocaleDateString("en-GB", { timeZone: "Asia/Tehran" })}</small></>}</button>) : <div className="empty-state"><Search size={35} /><h2>{query ? "No matching files" : "This folder is empty"}</h2><p>{query ? "Try a different name or phrase." : "New local files appear here."}</p></div>}</div>
      <footer className="finder-path"><div><button onClick={() => navigate(HOME)}><HardDrive size={13} /> Hamid</button>{folder.replace(HOME, "").split("/").filter(Boolean).map((part, i, parts) => <span key={i}><ChevronRight size={13} /><button onClick={() => navigate(`${HOME}/${parts.slice(0, i + 1).join("/")}`)}>{part}</button></span>)}</div><span>{entries.length} items</span></footer>
    </div>
    {context && <div className="finder-context menu-popover" role="menu" style={{ left: context.x, top: context.y }}><button role="menuitem" onClick={() => open(context.entry)}>Open</button><button role="menuitem" disabled={context.entry.kind === "Folder" || context.entry.kind === "Project"} onClick={() => download(context.entry)}><Download size={15} /> Download</button><hr /><button role="menuitem" disabled={context.entry.readonly} onClick={() => { setName(basename(context.entry.path)); setRenaming(true); }}>Rename…</button><button role="menuitem" disabled={context.entry.readonly} title={context.entry.readonly ? "Bundled assets are read-only" : undefined} onClick={() => useFiles.getState().remove(context.entry.path)}><Trash2 size={15} /> Move to Trash</button><button role="menuitem" onClick={() => useOS.getState().openApp("trash")}><RotateCcw size={15} /> Open Trash</button></div>}
  </div>;
}

