import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { preferenceStorage } from "../lib/storage";
import { basename, dirname, HOME, isWritable, resolvePath } from "../lib/filesystem";
export interface LocalFile {
  path: string;
  content: string;
  modified: string;
  deleted?: boolean;
  title?: string;
  trashId?: string;
  deletedAt?: string;
}
export const initialFiles: LocalFile[] = [
  {
    path: "/Users/hamid/README.md",
    modified: "2026-10-04",
    content:
      "# حمید شیخی\n\nتوسعه‌دهندهٔ فرانت‌اند در تهران.\n\nتمرکز من روی React، TypeScript و تجربهٔ کاربری است.\n\n## پروژه‌ها\n- Dika Asia — سایت رسمی شرکت\n- Financial Panel — داشبورد مالی و عملیات\n- Flow Studio — سازندهٔ جریان کاری\n\nGitHub: https://github.com/hamidshaikhy",
  },
  {
    path: "/Users/hamid/Notes/welcome.md",
    modified: "2026-10-04",
    content:
      "سلام!\n\nاینجا می‌توانید یک یادداشت بنویسید. تغییرات فقط در مرورگر همین دستگاه ذخیره می‌شوند.\n\nفایل‌ها بین Notes، Code و Terminal مشترک‌اند. برای دیدن فرمان‌ها در ترمینال help را بنویسید.",
  },
  {
    path: "/Users/hamid/Code/profile.ts",
    modified: "2026-10-04",
    content:
      "export const hamid = {\n  name: 'Hamid Shaikhy',\n  role: 'Front-End Developer',\n  location: 'Tehran, Iran',\n  stack: ['React', 'TypeScript', 'Next.js'],\n  github: 'https://github.com/hamidshaikhy',\n};\n",
  },
];
interface FileState {
  files: LocalFile[];
  save: (path: string, content: string) => void;
  remove: (path: string) => void;
  restore: (path: string) => void;
  emptyTrash: () => void;
  createNote: () => string;
  createFile: (folder?: string) => string;
  rename: (path: string, name: string) => string | null;
  setTitle: (path: string, title: string) => void;
}
export const useFiles = create<FileState>()(
  persist(
    (set, get) => ({
      files: initialFiles,
      save: (rawPath, content) => {
        const path = resolvePath(rawPath);
        if (!isWritable(path)) return;
        set((s) => ({
          files: s.files.some((f) => f.path === path && !f.deleted)
            ? s.files.map((f) =>
                f.path === path && !f.deleted
                  ? {
                      ...f,
                      content,
                      deleted: false,
                      modified: new Date().toISOString(),
                    }
                  : f,
              )
            : [
                ...s.files,
                { path, content, modified: new Date().toISOString() },
              ],
        }));
      },
      remove: (path) =>
        set((s) => ({
          files: s.files.map((f) =>
            f.path === path && !f.deleted ? { ...f, deleted: true, trashId: crypto.randomUUID(), deletedAt: new Date().toISOString() } : f,
          ),
        })),
      restore: (key) => {
        const target = get().files.find(f => f.deleted && (f.trashId === key || f.path === key));
        if (!target) return;
        let path = target.path;
        let index = 1;
        while (get().files.some(f => !f.deleted && f.path === path)) {
          const name = basename(target.path);
          const dot = name.lastIndexOf(".");
          path = `${dirname(target.path)}/${dot > 0 ? name.slice(0, dot) : name} (restored ${index++})${dot > 0 ? name.slice(dot) : ""}`;
        }
        set(s => ({ files: s.files.map(f => f === target ? { ...f, path, deleted: false, trashId: undefined, deletedAt: undefined } : f) }));
      },
      emptyTrash: () =>
        set((s) => ({ files: s.files.filter((f) => !f.deleted) })),
      createNote: () => {
        const path = `${HOME}/Notes/note-${crypto.randomUUID().slice(0, 8)}.md`;
        get().save(path, "");
        return path;
      },
      createFile: (folder = `${HOME}/Code`) => {
        const path = `${folder}/untitled-${crypto.randomUUID().slice(0, 8)}.ts`;
        get().save(path, "");
        return path;
      },
      rename: (path, rawName) => {
        const name = rawName.trim();
        const target = `${dirname(path)}/${name}`;
        if (!get().files.some(f => f.path === path && !f.deleted) || !name || name === "." || name === ".." || name.includes("/") || name.includes("\\") || !isWritable(target) || (target !== path && get().files.some(f => !f.deleted && f.path === target))) return null;
        set(s => ({ files: s.files.map(f => f.path === path && !f.deleted ? { ...f, path: target, modified: new Date().toISOString() } : f) }));
        return target;
      },
      setTitle: (path, title) => set(s => ({ files: s.files.map(f => f.path === path && !f.deleted ? { ...f, title, modified: new Date().toISOString() } : f) })),
    }),
    {
      name: "hamidos.files.v1",
      storage: createJSONStorage(() => preferenceStorage),
    },
  ),
);
