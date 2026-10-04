import { useEffect, useRef, useState } from "react";
import { command } from "../lib/terminal";
import { useOS } from "../state/os";
import { useFiles } from "../state/files";
import { openFile } from "../lib/openFile";
import { bundledFiles, folders } from "../lib/filesystem";
export default function Terminal() {
  const os = useOS.getState();
  const [cwd, setCwd] = useState("/Users/hamid");
  const [input, setInput] = useState("");
  const [lines, setLines] = useState([
    {
      prompt: "",
      out: "HamidOS shell · local workspace\nType help to explore.\n",
    },
  ]);
  const [history, setHistory] = useState<string[]>([]);
  const [index, setIndex] = useState(-1);
  const bottom = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [lines]);
  return (
    <div className="terminal-app" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-scroll">
        {lines.map((l, i) => (
          <div key={i}>
            {l.prompt && (
              <div>
                <span className="terminal-user">hamid@HamidOS</span>{" "}
                <span className="terminal-path">
                  {l.prompt.split(" $ ")[0]}
                </span>{" "}
                $ {l.prompt.split(" $ ").slice(1).join(" $ ")}
              </div>
            )}
            <pre dir="auto">{l.out}</pre>
          </div>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fs = useFiles.getState();
            const result = command(input, {
              cwd,
              files: fs.files,
              save: fs.save,
              remove: fs.remove,
              open: os.openApp,
              theme: os.setTheme,
              openFile,
              openDirectory: path => { os.setFinderPath(path); os.openApp("finder"); },
            });
            setLines((l) =>
              result.clear
                ? []
                : [
                    ...l.slice(-500),
                    {
                      prompt: `${cwd.replace("/Users/hamid", "~")} $ ${input}`,
                      out: result.output,
                    },
                  ],
            );
            if (result.cwd) setCwd(result.cwd);
            setHistory((h) => input.trim() ? [input, ...h].slice(0, 100) : h);
            setIndex(-1);
            setInput("");
          }}
        >
          <label htmlFor="terminal-input">
            <span className="terminal-user">hamid@HamidOS</span>{" "}
            <span className="terminal-path">
              {cwd.replace("/Users/hamid", "~")}
            </span>{" "}
            $
          </label>
          <input
            ref={inputRef}
            id="terminal-input"
            aria-label="Terminal command"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                e.preventDefault();
                const next = Math.min(index + 1, history.length - 1);
                if (next >= 0) {
                  setIndex(next);
                  setInput(history[next]);
                }
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                const next = Math.max(index - 1, -1);
                setIndex(next);
                setInput(next === -1 ? "" : history[next]);
              }
              if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                setLines([]);
              }
              if (e.key === "Tab") {
                e.preventDefault();
                const word = input.split(" ").at(-1) || "";
                const names = [...useFiles.getState().files.filter(f => !f.deleted).map(f => f.path), ...folders, ...bundledFiles.map(f => f.path)]
                  .filter(path => path.startsWith(cwd + "/"))
                  .map(path => path.slice(cwd.length + 1))
                  .filter((f) => f.startsWith(word));
                if (names.length === 1)
                  setInput(
                    input.slice(0, input.length - word.length) + names[0],
                  );
              }
            }}
          />
        </form>
        <div ref={bottom} />
      </div>
      <footer>zsh · virtual filesystem · UTF-8</footer>
    </div>
  );
}
