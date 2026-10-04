import { beforeEach, expect, it, vi } from "vitest";
import { useFiles, initialFiles } from "../state/files";
import { useOS } from "../state/os";
import { command } from "../lib/terminal";
import { openFile } from "../lib/openFile";
import { bundledFiles, HOME } from "../lib/filesystem";
beforeEach(() => { useFiles.setState({ files: structuredClone(initialFiles) }); useOS.setState({ windows: [], panel: null }); });
it("preserves deleted contents when a new file reuses its name", () => {
  const fs = useFiles.getState(); const path = `${HOME}/Notes/reused.md`;
  fs.save(path, "original"); fs.remove(path); fs.save(path, "replacement"); fs.restore(path);
  const files = useFiles.getState().files.filter(f => !f.deleted);
  expect(files.find(f => f.path === path)?.content).toBe("replacement");
  expect(files.find(f => f.content === "original")?.path).toContain("restored 1");
});
it("protects bundled files, rejects colliding names and normalizes writes", () => {
  const fs = useFiles.getState(); const asset = bundledFiles[0].path;
  fs.save(asset, "overwrite"); expect(useFiles.getState().files.some(f => f.path === asset)).toBe(false);
  fs.save(`${HOME}/Code/../Code/new.ts`, "hello");
  expect(useFiles.getState().files.find(f => f.path === `${HOME}/Code/new.ts`)?.content).toBe("hello");
  expect(fs.rename(`${HOME}/Code/new.ts`, "profile.ts")).toBeNull();
  expect(fs.rename(`${HOME}/Code/new.ts`, ".")).toBeNull();
  expect(fs.rename(`${HOME}/Code/new.ts`, "..")).toBeNull();
  expect(fs.rename(`${HOME}/Code/missing.ts`, "unused.ts")).toBeNull();
  expect(fs.rename(`${HOME}/Code/new.ts`, "renamed.ts")).toBe(`${HOME}/Code/renamed.ts`);
});
it("opens the correct file, project and music surfaces", () => {
  openFile(`${HOME}/Notes/welcome.md`); expect(useOS.getState().mobileApp).toBe("notes");
  expect(useOS.getState().selectedFile).toBe(`${HOME}/Notes/welcome.md`);
  openFile(`${HOME}/Projects/Flow Studio.project`); expect(useOS.getState().selectedProject).toBe("flow");
  openFile(bundledFiles[0].path); expect(useOS.getState().mobileApp).toBe("resume");
  openFile(`${HOME}/Music/Drowning in Vertigo.mp3`); expect(useOS.getState().panel).toBe("control");
});
it("terminal opens shared documents and protects the supplied music", () => {
  const fs = useFiles.getState(); const os = useOS.getState(); const ctx = { cwd: HOME, files: fs.files, save: fs.save, remove: fs.remove, open: os.openApp, openFile, theme: os.setTheme };
  expect(command('rm "Music/Drowning in Vertigo.mp3"', ctx).output).toContain("read-only");
  command("open Documents/Hamid-CV.pdf", ctx); expect(useOS.getState().mobileApp).toBe("resume");
  expect(command("ls Documents", ctx).output).toContain("Hamid-CV.pdf");
  expect(command("touch Missing/file.ts", ctx).output).toContain("inside /Users/hamid");
});
it("terminal handles quoted text, escapes and adjacent redirection without evaluating input", () => {
  const save = vi.fn(); const openDirectory = vi.fn();
  const ctx = { cwd: HOME, files: [], save, remove: vi.fn(), open: vi.fn(), theme: vi.fn(), openDirectory };
  command('echo "a > b" > "Notes/spaced name.md"', ctx);
  expect(save).toHaveBeenLastCalledWith(`${HOME}/Notes/spaced name.md`, "a > b");
  command('echo "$(whoami)" >Code/test.ts', ctx);
  expect(save).toHaveBeenLastCalledWith(`${HOME}/Code/test.ts`, "$(whoami)");
  command('echo "a\\"b" > Code/test.ts', ctx);
  expect(save).toHaveBeenLastCalledWith(`${HOME}/Code/test.ts`, 'a"b');
  expect(command('echo "unfinished > Code/test.ts', ctx).output).toContain("Parse error");
  expect(command('echo unsafe > ../../escape', ctx).output).toContain("inside /Users/hamid");
  expect(command('echo "a > b"', ctx).output).toBe("a > b");
  command("open Code/../Notes", ctx); expect(openDirectory).toHaveBeenCalledWith(`${HOME}/Notes`);
});
