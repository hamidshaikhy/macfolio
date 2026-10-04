import { beforeEach, describe, expect, it, vi } from "vitest";
import { Chess } from "chess.js";
import { useOS } from "../state/os";
import { useFiles, initialFiles } from "../state/files";
import { clampRect } from "../lib/windows";
import { command, resolvePath } from "../lib/terminal";
import { findBestMove } from "../lib/chess-engine";
import { magnification } from "../lib/dock";
import { registerOSTools } from "../lib/webmcp";
beforeEach(() => {
  useOS.setState({ windows: [], theme: "light", mobileApp: null, panel: null });
  useFiles.setState({ files: structuredClone(initialFiles) });
});
describe("window lifecycle", () => {
  it("restores one existing window and maintains focus order", () => {
    const s = useOS.getState();
    s.openApp("about");
    s.openApp("notes");
    s.minimize("about");
    s.openApp("about");
    expect(useOS.getState().windows.map((w) => w.app)).toEqual([
      "notes",
      "about",
    ]);
    expect(useOS.getState().windows.at(-1)?.minimized).toBe(false);
    s.maximize("about");
    s.maximize("about");
    expect(useOS.getState().windows.at(-1)?.maximized).toBe(false);
    s.closeApp("notes");
    expect(useOS.getState().windows).toHaveLength(1);
  });
  it("keeps titlebars, content and resize limits inside the viewport", () => {
    const r = clampRect(
      { x: 9000, y: -9000, w: 2000, h: 2000 },
      { w: 1024, h: 768 },
    );
    expect(r.x + r.w).toBeLessThanOrEqual(1012);
    expect(r.y).toBe(40);
    expect(r.h).toBeLessThanOrEqual(638);
    expect(clampRect({ x: 0, y: 0, w: 20, h: 20 }, { w: 1440, h: 900 }).w).toBe(
      420,
    );
  });
});
describe("shared local filesystem", () => {
  function ctx(cwd = "/Users/hamid") {
    const fs = useFiles.getState();
    return {
      cwd,
      files: fs.files,
      save: fs.save,
      remove: fs.remove,
      open: useOS.getState().openApp,
      theme: useOS.getState().setTheme,
    };
  }
  it("writes in terminal, reads through shared state and restores deleted files", () => {
    command('echo "سلام حمید" > Notes/test.md', ctx());
    expect(command("cat Notes/test.md", ctx()).output).toBe("سلام حمید");
    command("rm Notes/test.md", ctx());
    expect(command("cat Notes/test.md", ctx()).output).toContain(
      "no such file",
    );
    useFiles.getState().restore("/Users/hamid/Notes/test.md");
    expect(command("cat Notes/test.md", ctx()).output).toBe("سلام حمید");
  });
  it("normalizes relative paths and prevents writes outside the workspace", () => {
    expect(resolvePath("../Code/profile.ts", "/Users/hamid/Notes")).toBe(
      "/Users/hamid/Code/profile.ts",
    );
    expect(command("touch ../../system.txt", ctx()).output).toContain(
      "inside /Users/hamid",
    );
    expect(command("cd Missing", ctx()).cwd).toBeUndefined();
    expect(command("ls /", ctx()).output).toBe("Users");
  });
  it("opens apps and applies appearance commands without evaluating shell text", () => {
    command("open chess", ctx());
    expect(useOS.getState().mobileApp).toBe("chess");
    command("theme dark", ctx());
    expect(useOS.getState().theme).toBe("dark");
    expect(command("$(whoami)", ctx()).output).toContain("command not found");
  });
});
describe("chess engine", () => {
  it("finds mate in one", () => {
    const game = new Chess("7k/5Q2/6K1/8/8/8/8/8 w - - 0 1");
    const result = findBestMove(game.fen(), 2, 4000);
    expect(result.san).toBeTruthy();
    game.move(result.san!);
    expect(game.isCheckmate()).toBe(true);
  });
  it("returns a legal move without changing the given position", () => {
    const game = new Chess();
    game.move("e4");
    const fen = game.fen();
    const move = findBestMove(fen, 2, 1000);
    expect(game.moves()).toContain(move.san);
    expect(game.fen()).toBe(fen);
    expect(move.nodes).toBeGreaterThan(0);
  });
  it("stops in terminal positions", () => {
    expect(findBestMove("7k/6Q1/6K1/8/8/8/8/8 b - - 0 1").san).toBeNull();
  });
});
it("magnifies adjacent dock items with a smooth falloff", () => {
  expect(magnification(0)).toBeCloseTo(1.6);
  expect(magnification(62)).toBeGreaterThan(1.2);
  expect(magnification(250)).toBeCloseTo(1, 3);
  expect(magnification(-62)).toBe(magnification(62));
});
it("registers optional WebMCP actions using the visible state and rejects invalid values", async () => {
  const registry: any[] = [];
  const register = vi.fn((t: any) => registry.push(t));
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value: { registerTool: register },
  });
  const dispose = registerOSTools();
  expect(registry.map((t) => t.name)).toEqual([
    "read_desktop_state",
    "open_portfolio_application",
    "set_desktop_appearance",
  ]);
  registry[1].execute({ app: "projects" });
  expect(useOS.getState().mobileApp).toBe("projects");
  registry[2].execute({ theme: "dark" });
  expect(registry[0].execute({}).theme).toBe("dark");
  expect(() => registry[1].execute({ app: "unknown" })).toThrow();
  expect(() => registry[2].execute({ theme: "broken" })).toThrow();
  expect(useOS.getState().theme).toBe("dark");
  dispose();
  delete (document as any).modelContext;
});
