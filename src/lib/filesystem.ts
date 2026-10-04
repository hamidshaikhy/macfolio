import type { AppId } from "./apps";
import { asset } from "./assets";
import { projects } from "./content";
export const HOME = "/Users/hamid";
export const folders = [HOME, `${HOME}/Projects`, `${HOME}/Documents`, `${HOME}/Notes`, `${HOME}/Code`, `${HOME}/Music`];
export function resolvePath(input: string, cwd = HOME) {
  const raw = input.startsWith("~") ? input.replace(/^~/, HOME) : input.startsWith("/") ? input : `${cwd}/${input}`;
  const parts: string[] = [];
  raw.split("/").forEach(part => { if (part === "..") parts.pop(); else if (part && part !== ".") parts.push(part); });
  return "/" + parts.join("/");
}
export const basename = (path: string) => path.split("/").at(-1) || "hamid";
export const dirname = (path: string) => path.slice(0, path.lastIndexOf("/")) || "/";
export interface BundledFile { path: string; app: AppId | "music"; kind: "pdf" | "project" | "audio"; project?: string; url?: string; }
export const bundledFiles: BundledFile[] = [
  { path: `${HOME}/Documents/Hamid-CV.pdf`, app: "resume", kind: "pdf", url: asset("assets/resume.pdf") },
  { path: `${HOME}/Music/Drowning in Vertigo.mp3`, app: "music", kind: "audio", url: asset("assets/audio/drowning-in-vertigo.mp3") },
  ...projects.map(p => ({ path: `${HOME}/Projects/${p.title}.project`, app: "projects" as const, kind: "project" as const, project: p.id })),
];
export function isWritable(path: string) {
  return path.startsWith(`${HOME}/`) && !folders.includes(path) && !bundledFiles.some(f => f.path === path) && !/[\u0000-\u001f]/.test(path);
}
export function fileTitle(file: { path: string; content: string; title?: string }) {
  return file.title || file.content.split("\n").find(line => line.trim())?.replace(/^#+\s*/, "").slice(0, 70) || basename(file.path);
}
