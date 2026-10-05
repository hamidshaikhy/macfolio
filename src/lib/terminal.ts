import { apps, type AppId } from "./apps";
import { profile, projects } from "./content";
import type { LocalFile } from "../state/files";
import { bundledFiles, folders, dirname, isWritable, resolvePath } from "./filesystem";
export { resolvePath } from "./filesystem";
function tokenize(line: string) {
  const tokens: { value: string; redirect?: boolean }[] = [];
  let value = "", quote = "", active = false;
  const flush = () => { if (active) tokens.push({ value }); value = ""; active = false; };
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (char === "\\" && quote !== "'") {
      if (index + 1 === line.length) throw new Error("Unfinished escape");
      value += line[++index]; active = true;
    } else if (quote) {
      if (char === quote) quote = ""; else value += char;
    } else if (char === '"' || char === "'") { quote = char; active = true; }
    else if (/\s/.test(char)) flush();
    else if (char === ">") { flush(); tokens.push({ value: char, redirect: true }); }
    else { value += char; active = true; }
  }
  if (quote) throw new Error("Unclosed quote");
  flush(); return tokens;
}
interface Context {
  cwd: string;
  files: LocalFile[];
  save: (p: string, c: string) => void;
  remove: (p: string) => void;
  open: (a: AppId) => void;
  theme: (v: "light" | "dark") => void;
  openFile?: (path: string) => void;
  openDirectory?: (path: string) => void;
}
export function command(
  line: string,
  ctx: Context,
): { output: string; cwd?: string; clear?: boolean } {
  let tokens: ReturnType<typeof tokenize>;
  try { tokens = tokenize(line); } catch (error) { return { output: `Parse error: ${(error as Error).message}` }; }
  const args = tokens.map(token => token.value);
  const [cmd, ...rest] = args;
  const files = ctx.files.filter((f) => !f.deleted);
  const directories = new Set([
    "/",
    "/Users",
    "/Users/hamid",
    "/Users/hamid/Notes",
    "/Users/hamid/Code",
    ...folders,
    ...files.flatMap((f) => {
      const p = f.path.split("/");
      return p.slice(1, -1).map((_, i) => "/" + p.slice(1, i + 2).join("/"));
    }),
  ]);
  const path = resolvePath(rest[0] ?? "", ctx.cwd);
  const canWrite = (p: string) =>
    isWritable(p) && !directories.has(p) && directories.has(dirname(p));
  if (!cmd) return { output: "" };
  if (cmd === "help")
    return {
      output:
        "macfolio Terminal\n\nhelp       Show commands\nabout      About Hamid\nprojects   Selected projects\nls [path]  List local files\ncd [path]  Change directory\npwd        Current directory\ncat FILE   Read a file\ntouch FILE Create an empty file\necho TEXT > FILE  Write a file\nrm FILE    Move a file to Trash\nopen APP   Open an application\ntheme light|dark\ndate       Tehran time\nwhoami     Current user\nclear      Clear the screen\n\nThis shell operates on local portfolio files only.",
    };
  if (cmd === "clear") return { output: "", clear: true };
  if (cmd === "pwd") return { output: ctx.cwd };
  if (cmd === "whoami") return { output: "hamid" };
  if (cmd === "about")
    return {
      output: `${profile.name}\n${profile.title}\n${profile.location}\n${profile.email}\n${profile.github}`,
    };
  if (cmd === "projects")
    return {
      output: projects
        .map((p) => `${p.title}\n${"website" in p ? p.website : p.repo}`)
        .join("\n\n"),
    };
  if (cmd === "date")
    return {
      output:
        new Date().toLocaleString("en-GB", { timeZone: "Asia/Tehran" }) +
        " IRST",
    };
  if (cmd === "theme") {
    if (rest[0] !== "light" && rest[0] !== "dark")
      return { output: "Usage: theme light|dark" };
    ctx.theme(rest[0]);
    return { output: `Appearance: ${rest[0]}` };
  }
  if (cmd === "open") {
    if (!rest.length) return { output: "Usage: open APP|FILE|DIRECTORY" };
    const bundled = bundledFiles.find(f => f.path === path);
    const localFile = files.find(f => f.path === path);
    if (bundled || localFile) {
      if (ctx.openFile) ctx.openFile(path);
      else if (bundled && bundled.app !== "music") ctx.open(bundled.app);
      else if (localFile) ctx.open(path.includes("/Notes/") ? "notes" : "editor");
      return { output: `Opening ${rest.join(" ")}…` };
    }
    if (directories.has(path)) { if (ctx.openDirectory) ctx.openDirectory(path); else ctx.open("finder"); return { output: `Opening ${path} in Finder…` }; }
    const app = apps.find(
      (a) =>
        a.id === rest[0] ||
        a.name.toLowerCase() === rest.join(" ").toLowerCase(),
    );
    if (!app) return { output: `Apps: ${apps.map((a) => a.id).join(", ")}` };
    ctx.open(app.id);
    return { output: `Opening ${app.name}…` };
  }
  if (cmd === "cd") {
    const to = rest[0] ? path : "/Users/hamid";
    return directories.has(to)
      ? { output: "", cwd: to }
      : { output: `cd: no such directory: ${rest[0]}` };
  }
  if (cmd === "ls") {
    const dir = rest[0] ? path : ctx.cwd;
    if (!directories.has(dir))
      return { output: `ls: no such directory: ${dir}` };
    const children = [...files.map((f) => f.path), ...bundledFiles.map(f => f.path), ...directories]
      .filter((p) => p !== dir && p.startsWith(dir === "/" ? "/" : dir + "/"))
      .map((p) => p.slice(dir === "/" ? 1 : dir.length + 1).split("/")[0]);
    return { output: [...new Set(children)].sort().join("   ") || "(empty)" };
  }
  if (cmd === "cat") {
    if (bundledFiles.some(f => f.path === path)) return { output: "Bundled asset (read-only). Use open to view it in its application." };
    const file = files.find((f) => f.path === path);
    return {
      output: file ? file.content : `cat: no such file: ${rest[0] ?? ""}`,
    };
  }
  if (cmd === "touch") {
    if (!rest[0] || !canWrite(path))
      return { output: "touch: choose a file inside /Users/hamid" };
    if (!files.some((f) => f.path === path)) ctx.save(path, "");
    return { output: "" };
  }
  if (cmd === "rm") {
    if (bundledFiles.some(f => f.path === path)) return { output: "rm: bundled assets are read-only" };
    if (!files.some((f) => f.path === path))
      return { output: "rm: no such file" };
    ctx.remove(path);
    return { output: "Moved to Trash." };
  }
  if (cmd === "echo") {
    const arrow = tokens.slice(1).findIndex(token => token.redirect);
    if (arrow < 0) return { output: rest.join(" ") };
    if (arrow !== rest.length - 2 || tokens.at(-1)?.redirect)
      return { output: 'Usage: echo "text" > file' };
    const target = resolvePath(rest.at(-1)!, ctx.cwd);
    if (!canWrite(target))
      return { output: "echo: choose a file inside /Users/hamid" };
    ctx.save(target, rest.slice(0, arrow).join(" "));
    return { output: "" };
  }
  return { output: `${cmd}: command not found. Type help.` };
}
