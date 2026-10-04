import { useEffect, useRef, useState } from "react";
import { Search, Grid2X2, Folder, Globe, Settings } from "lucide-react";
import { apps } from "../lib/apps";
import { projects } from "../lib/content";
import { useOS } from "../state/os";
import { AppIcon } from "./Icon";
import { usePanelFocus } from "./usePanelFocus";
import { useFiles } from "../state/files";
import { basename, fileTitle } from "../lib/filesystem";
import { openFile } from "../lib/openFile";
export function Spotlight() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const os = useOS();
  const panelRef = usePanelFocus<HTMLElement>();
  useEffect(() => {
    input.current?.focus();
  }, []);
  const search = query.trim().toLowerCase();
  const rank = (name: string) => name.toLowerCase() === search ? 0 : name.toLowerCase().startsWith(search) ? 1 : name.toLowerCase().includes(search) ? 2 : 3;
  const result = apps.filter((a) => category !== "Files" && category !== "Web" && (category !== "Settings" || a.id === "settings")).filter((a) =>
    `${a.name} ${a.keywords}`.toLowerCase().includes(search),
  ).sort((a, b) => rank(a.name) - rank(b.name));
  const localFiles = useFiles(s => s.files).filter(f => (category === "All" || category === "Files") && !f.deleted && !!search && `${fileTitle(f)} ${f.path} ${f.content}`.toLowerCase().includes(query.toLowerCase())).slice(0, 6);
  const matchingProjects = projects.filter(p => (category === "All" || category === "Files") && !!search && p.title.toLowerCase().includes(query.toLowerCase()));
  const actions = [...result.map(a => () => os.openApp(a.id)), ...matchingProjects.map(p => () => { os.setSelectedProject(p.id); os.openApp("projects"); }), ...localFiles.map(f => () => openFile(f.path))];
  return (
    <section
      ref={panelRef}
      className="spotlight"
      role="dialog"
      aria-modal="true"
      aria-label="Spotlight search"
    >
      <div className="spotlight-search">
        <Search size={24} />
        <input
          ref={input}
          placeholder="Spotlight Search"
          aria-label="Search apps"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelected((s) => (s + 1) % Math.max(1, actions.length));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelected(
                (s) => (s - 1 + actions.length) % Math.max(1, actions.length),
              );
            }
            if (e.key === "Enter") { e.preventDefault(); actions[selected]?.(); }
          }}
        />
        <kbd>esc</kbd>
      </div>
      <nav className="spotlight-categories" aria-label="Search categories">{[{name:"Apps",icon:Grid2X2},{name:"Files",icon:Folder},{name:"Web",icon:Globe},{name:"Settings",icon:Settings}].map(({name,icon:Icon}) => <button key={name} aria-pressed={category === name} onClick={() => { setCategory(category === name ? "All" : name); setSelected(0); }}><Icon size={18}/>{name}</button>)}</nav>
      {(search || category !== "All") && <div className="spotlight-results">
        <span className="section-label">APPLICATIONS</span>
        {result.length ? (
          result.map((a, i) => (
            <button
              key={a.id}
              className={i === selected ? "current" : ""}
              onPointerEnter={() => setSelected(i)}
              onClick={() => os.openApp(a.id)}
            >
              <AppIcon id={a.id} size={32} />
              <span>{a.name}</span>
              <small>Application</small>
            </button>
          ))
        ) : (
          <><p>{category === "Web" ? "Open Safari to browse the web." : "No matching applications."}</p>{category === "Web" && <button onClick={() => os.openApp("safari")}>Open Safari</button>}</>
        )}
        {matchingProjects.map((p, i) => <button key={p.id} className={selected === result.length + i ? "current" : ""} onPointerEnter={() => setSelected(result.length + i)} onClick={() => actions[result.length + i]()}><AppIcon id="projects" size={32} /><span>{p.title}</span><small>Project</small></button>)}
        {localFiles.map((f, i) => <button key={f.path} className={selected === result.length + matchingProjects.length + i ? "current" : ""} onPointerEnter={() => setSelected(result.length + matchingProjects.length + i)} onClick={() => openFile(f.path)}><AppIcon id={f.path.includes("/Notes/") ? "notes" : "editor"} size={32} /><span dir="auto">{fileTitle(f)}</span><small>{basename(f.path)}</small></button>)}
      </div>}
      {search && <footer>
        ↑ ↓ to navigate <span>return to open</span>
      </footer>}
    </section>
  );
}
