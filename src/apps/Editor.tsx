import { useEffect, useMemo, useState } from "react";
import CodeMirror, { EditorView, type ViewUpdate } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { markdown } from "@codemirror/lang-markdown";
import { indentWithTab } from "@codemirror/commands";
import { keymap } from "@codemirror/view";
import { Code2, FileText, Folder, Plus, X, Download, PanelLeft } from "lucide-react";
import { useFiles } from "../state/files";
import { useOS } from "../state/os";
import { basename } from "../lib/filesystem";
import { downloadText } from "../lib/download";
const editorTheme = EditorView.theme({ "&": { height: "100%", fontSize: "13px", backgroundColor: "var(--surface)" }, ".cm-scroller": { fontFamily: "Consolas, 'SFMono-Regular', monospace", lineHeight: "1.7", overflow: "auto" }, ".cm-content": { padding: "12px 0", minHeight: "100%" }, ".cm-line": { padding: "0 14px" }, ".cm-gutters": { backgroundColor: "var(--surface-soft)", borderRight: "1px solid var(--border)", color: "var(--muted)" }, ".cm-activeLine": { backgroundColor: "var(--hover)" }, ".cm-activeLineGutter": { backgroundColor: "var(--hover)" } });
export default function Editor() {
  const files = useFiles(s => s.files).filter(f => !f.deleted);
  const selectedFile = useOS(s => s.selectedFile); const theme = useOS(s => s.theme);
  const selected = files.find(f => f.path === selectedFile) || files.find(f => f.path.includes("/Code/")) || files[0];
  const [tabs, setTabs] = useState<string[]>(selected ? [selected.path] : []);
  const [position, setPosition] = useState({ line: 1, column: 1 }); const [explorer, setExplorer] = useState(true);
  const language = selected?.path.match(/\.[jt]sx?$/) ? "TypeScript" : selected?.path.endsWith(".md") ? "Markdown" : "Plain text";
  const extensions = useMemo(() => [editorTheme, keymap.of([indentWithTab]), EditorView.contentAttributes.of({ "aria-label": "Code editor" }), ...(language === "TypeScript" ? [javascript({ typescript: true, jsx: true })] : language === "Markdown" ? [markdown()] : [])], [language]);
  useEffect(() => { if (selected) setTabs(t => t.includes(selected.path) ? t : [...t, selected.path]); }, [selected?.path]);
  function onUpdate(update: ViewUpdate) { if (update.selectionSet || update.docChanged) { const pos = update.state.selection.main.head; const line = update.state.doc.lineAt(pos); setPosition({ line: line.number, column: pos - line.from + 1 }); } }
  return <div className={`editor-app ${explorer ? "" : "hide-explorer"}`}>
    {explorer && <aside className="editor-sidebar"><span className="sidebar-heading">EXPLORER</span><strong><Folder size={14} /> HAMID / WORKSPACE</strong>{files.map(file => <button key={file.path} className={selected?.path === file.path ? "selected" : ""} onClick={() => useOS.getState().setSelectedFile(file.path)}>{file.path.endsWith(".ts") ? <Code2 size={15} /> : <FileText size={15} />}<span>{basename(file.path)}</span></button>)}<button onClick={() => useOS.getState().setSelectedFile(useFiles.getState().createFile())}><Plus size={16} /> New file</button></aside>}
    <div className="editor-main"><div className="editor-tabs"><button aria-label="Toggle file explorer" className="editor-toggle" onClick={() => setExplorer(v => !v)}><PanelLeft size={17} /></button>{tabs.filter(path => files.some(f => f.path === path)).map(path => <div className={`editor-tab ${selected?.path === path ? "active" : ""}`} key={path}><button onClick={() => useOS.getState().setSelectedFile(path)}><Code2 size={14} />{basename(path)}</button><button aria-label={`Close tab ${basename(path)}`} onClick={() => { const next = tabs.filter(t => t !== path); setTabs(next); if (selected?.path === path && next.length) useOS.getState().setSelectedFile(next.at(-1)!); }} disabled={tabs.filter(t => files.some(f => f.path === t)).length <= 1}><X size={13} /></button></div>)}<button className="editor-export" aria-label="Download code file" disabled={!selected} onClick={() => selected && downloadText(selected.content, basename(selected.path))}><Download size={17} /></button></div>
    {selected ? <><div className="editor-breadcrumb">{selected.path.replace("/Users/hamid/", "hamid/").split("/").join(" › ")}</div><div className="codemirror-host"><CodeMirror key={selected.path} value={selected.content} theme={theme} extensions={extensions} height="100%" basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true, autocompletion: true, bracketMatching: true }} onChange={value => useFiles.getState().save(selected.path, value)} onUpdate={onUpdate} /></div><footer className="editor-status"><span>✓ Saved locally</span><span>Ln {position.line}, Col {position.column} · UTF-8 · {language}</span></footer></> : <div className="empty-state"><Code2 size={40} /><h2>No local files</h2><button className="primary-button" onClick={() => useOS.getState().setSelectedFile(useFiles.getState().createFile())}>New file</button></div>}</div>
  </div>;
}
