import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { useOS } from "../state/os";
import { useFiles, initialFiles } from "../state/files";
import { useMusic } from "../state/music";
import ChessApp from "../apps/Chess";
import { Trash } from "../apps/Files";
import Notes from "../apps/Notes";
import Editor from "../apps/Editor";
beforeEach(() => {
  Object.defineProperty(window, "innerWidth", { writable: true, value: 1440 });
  Object.defineProperty(window, "innerHeight", { writable: true, value: 900 });
  localStorage.clear();
  useOS.setState({
    windows: [],
    mobileApp: null,
    locked: false,
    panel: null,
    theme: "light",
    brightness: 1,
    volume: 0.55,
    focusMode: false,
    reducedMotion: false,
    notification: null,
  });
  useFiles.setState({ files: structuredClone(initialFiles) });
  useMusic.setState({ playing: false, time: 0, error: null });
  vi.clearAllMocks();
});
describe("desktop shell", () => {
  it("creates and selects a fresh note from the File menu", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "File" }));
    await user.click(screen.getByRole("menuitem", { name: /New Note/ }));
    const note = await screen.findByRole("textbox", { name: "Note content" });
    expect(note).toHaveValue("");
    await user.type(note, "new note content");
    const selected = useOS.getState().selectedFile;
    expect(
      useFiles.getState().files.find((file) => file.path === selected)?.content,
    ).toBe("new note content");
  });
  it("starts light, changes the whole appearance and never autoplays music", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: /ایده‌های خوب/ });
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Control Center" }));
    await user.click(screen.getByRole("button", { name: "Toggle dark mode" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    await user.click(screen.getByRole("button", { name: "Toggle dark mode" }));
    expect(document.documentElement.dataset.theme).toBe("light");
    await user.click(screen.getByRole("button", { name: "Play music" }));
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    expect(useMusic.getState().playing).toBe(true);
  });
  it("opens, minimizes, restores and closes Projects with its widget and traffic lights", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: /ایده‌های خوب/ });
    await user.click(screen.getByRole("button", { name: /Selected work/ }));
    const project = await screen.findByRole("dialog", { name: "Projects" });
    expect(
      await within(project).findByText("Dika Asia", { selector: "h2" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Minimize Projects" }));
    expect(project).not.toBeVisible();
    await user.click(screen.getByRole("button", { name: /Selected work/ }));
    expect(project).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Close Projects" }));
    expect(screen.queryByRole("dialog", { name: "Projects" })).toBeNull();
  });
  it("supports Spotlight keyboard navigation and Escape", async () => {
    const user = userEvent.setup();
    render(<App />);
    fireEvent.keyDown(window, { code: "Space", key: " ", ctrlKey: true });
    await user.type(
      screen.getByRole("textbox", { name: "Search apps" }),
      "terminal",
    );
    await user.keyboard("{Enter}");
    await screen.findByRole("dialog", { name: "Terminal" });
    fireEvent.keyDown(window, { code: "Space", key: " ", ctrlKey: true });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(
      screen.queryByRole("dialog", { name: "Spotlight search" }),
    ).toBeNull();
  });
  it("drags and resizes a desktop window within bounds", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: /ایده‌های خوب/ });
    const title = document.querySelector(".window-titlebar")!;
    const before = { ...useOS.getState().windows[0].rect };
    fireEvent.pointerDown(title, { clientX: 500, clientY: 100, button: 0 });
    fireEvent.pointerMove(title, { clientX: 580, clientY: 160 });
    fireEvent.pointerUp(title);
    expect(useOS.getState().windows[0].rect.x).toBe(before.x + 80);
    expect(useOS.getState().windows[0].rect.y).toBe(before.y + 60);
    const resize = screen.getByRole("separator", { name: "Resize window" });
    fireEvent.pointerDown(resize, { clientX: 900, clientY: 500, button: 0 });
    fireEvent.pointerMove(resize, { clientX: 980, clientY: 560 });
    fireEvent.pointerUp(resize);
    expect(useOS.getState().windows[0].rect.w).toBe(before.w + 80);
  });
  it("prioritizes an exact app name in Spotlight and keeps it closed after Enter", async () => {
    const user = userEvent.setup(); render(<App />);
    await user.click(screen.getByRole("button", { name: "Spotlight" }));
    await user.type(screen.getByRole("textbox", { name: "Search apps" }), "LinkedIn");
    await user.keyboard("{Enter}");
    await screen.findByRole("dialog", { name: "LinkedIn" });
    expect(screen.queryByRole("dialog", { name: "Spotlight search" })).toBeNull();
    expect(useOS.getState().windows.at(-1)?.app).toBe("linkedin");
  });
});
describe("iPhone shell", () => {
  it("shows a home screen, opens a full app, returns home and unlocks", async () => {
    Object.defineProperty(window, "innerWidth", { value: 390, writable: true });
    const user = userEvent.setup();
    render(<App />);
    expect(document.querySelector(".ios-shell")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Dock" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Selected work" }));
    expect(
      screen.getByRole("button", { name: "Back to home" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(document.querySelector(".project-sidebar")).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "Back to home" }));
    expect(document.querySelector(".ios-home")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Lock screen" }));
    expect(screen.getByText("Tap to unlock")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Unlock" }));
    expect(document.querySelector(".ios-home")).toBeInTheDocument();
  });
  it("shares appearance and app actions through Control Center", async () => {
    Object.defineProperty(window, "innerWidth", { value: 390, writable: true });
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole("button", { name: "Open Control Center" }),
    );
    expect(screen.getByRole("dialog", { name: "Control Center" })).toHaveClass(
      "ios-control",
    );
    await user.click(screen.getByRole("button", { name: "Toggle dark mode" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    await user.click(screen.getByRole("button", { name: "Résumé" }));
    expect(useOS.getState().mobileApp).toBe("resume");
    expect(useOS.getState().panel).toBeNull();
  });
});
it("edits a note, reads it in Code and recovers it from Trash", async () => {
  const user = userEvent.setup();
  const notes = render(<Notes />);
  const field = screen.getByRole("textbox", { name: "Note content" });
  await user.clear(field);
  await user.type(field, "متن تست");
  const path = useFiles
    .getState()
    .files.find((f) => f.content === "متن تست")!.path;
  act(() => useOS.getState().setSelectedFile(path));
  notes.unmount();
  const editor = render(<Editor />);
  expect(await screen.findByRole("textbox", { name: "Code editor" })).toHaveTextContent(
    "متن تست",
  );
  editor.unmount();
  act(() => useFiles.getState().remove(path));
  render(<Trash />);
  await user.click(screen.getByRole("button", { name: "Put Back" }));
  expect(useFiles.getState().files.find((f) => f.path === path)?.deleted).toBe(
    false,
  );
  expect(screen.getByText("Trash is empty")).toBeInTheDocument();
});
describe("chess interaction", () => {
  beforeEach(() =>
    localStorage.setItem(
      "macfolio.chess.v1",
      JSON.stringify({ pgn: "", mode: "local" }),
    ),
  );
  it("rejects illegal moves, records legal moves and supports undo", async () => {
    const user = userEvent.setup();
    render(<ChessApp />);
    await user.click(screen.getByRole("button", { name: "e2 white pawn" }));
    expect(
      screen.getByRole("button", { name: "e4 legal move" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "e5" }));
    expect(
      screen.getByRole("button", { name: "e2 white pawn" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "e2 white pawn" }));
    await user.click(screen.getByRole("button", { name: "e4 legal move" }));
    expect(screen.getByRole("status")).toHaveTextContent("Black to move");
    expect(screen.getByText("e4", { selector: "strong" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Undo move" }));
    expect(screen.getByRole("status")).toHaveTextContent("White to move");
    expect(
      screen.getByRole("button", { name: "e2 white pawn" }),
    ).toBeInTheDocument();
  });
  it("asks for a promotion piece and persists the choice", async () => {
    localStorage.setItem(
      "macfolio.chess.v1",
      JSON.stringify({
        mode: "local",
        pgn: '[SetUp "1"]\n[FEN "7k/P7/6K1/8/8/8/8/8 w - - 0 1"]\n\n*',
      }),
    );
    const user = userEvent.setup();
    render(<ChessApp />);
    await user.click(screen.getByRole("button", { name: "a7 white pawn" }));
    await user.click(screen.getByRole("button", { name: "a8 legal move" }));
    expect(
      screen.getByRole("dialog", { name: "Choose promotion piece" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Promote to rook" }));
    expect(
      screen.getByRole("button", { name: "a8 white rook" }),
    ).toBeInTheDocument();
    expect(localStorage.getItem("macfolio.chess.v1")).toContain("a8=R");
  });
});

