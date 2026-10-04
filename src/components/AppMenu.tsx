import { useOS } from "../state/os";
import { useFiles } from "../state/files";
import { appById } from "../lib/apps";
import { profile } from "../lib/content";
import { usePanelFocus } from "./usePanelFocus";
type Menu = "file" | "edit" | "view" | "window" | "help";
export function AppMenu({ menu }: { menu: Menu }) {
  const os = useOS();
  const active = os.windows.filter((w) => !w.minimized).at(-1);
  const ref = usePanelFocus<HTMLDivElement>();
  const run = (action: () => void) => {
    os.setPanel(null);
    action();
  };
  const items: {
    label: string;
    shortcut?: string;
    disabled?: boolean;
    action: () => void;
  }[] =
    menu === "file"
      ? [
          {
            label: "New Note",
            shortcut: "⌘N",
            action: () => {
              os.setSelectedFile(useFiles.getState().createNote());
              os.openApp("notes");
            },
          },
          { label: "Open Projects…", action: () => os.openApp("projects") },
          { label: "Browse Files…", action: () => os.openApp("finder") },
          { label: "Open Résumé…", action: () => os.openApp("resume") },
          {
            label: "Close Window",
            shortcut: "⌘W",
            disabled: !active,
            action: () => active && os.closeApp(active.app),
          },
        ]
      : menu === "edit"
        ? [
            { label: "Open Notes", action: () => os.openApp("notes") },
            { label: "Edit Files in Code", action: () => os.openApp("editor") },
            {
              label: "Copy Contact Email",
              action: async () => {
                try {
                  await navigator.clipboard.writeText(profile.email);
                  os.notify("Email address copied.");
                } catch {
                  os.notify(profile.email);
                }
              },
            },
          ]
        : menu === "view"
          ? [
              {
                label: `Use ${os.theme === "light" ? "Dark" : "Light"} Appearance`,
                action: () =>
                  os.setTheme(os.theme === "light" ? "dark" : "light"),
              },
              {
                label: "Show Desktop",
                action: () => os.windows.forEach((w) => os.minimize(w.app)),
              },
              {
                label: "Toggle Full Screen",
                action: () => {
                  void (
                    document.fullscreenElement
                      ? document.exitFullscreen()
                      : document.documentElement.requestFullscreen?.()
                  )?.catch(() =>
                    os.notify("Full screen is unavailable in this browser."),
                  );
                },
              },
            ]
          : menu === "window"
            ? [
                {
                  label: active?.maximized ? "Restore Window" : "Zoom Window",
                  disabled: !active,
                  action: () => active && os.maximize(active.app),
                },
                {
                  label: "Minimize Window",
                  shortcut: "⌘M",
                  disabled: !active,
                  action: () => active && os.minimize(active.app),
                },
                ...os.windows.map((w) => ({
                  label: appById(w.app).name,
                  action: () => os.openApp(w.app),
                })),
              ]
            : [
                { label: "About Hamid", action: () => os.openApp("about") },
                {
                  label: "Terminal Commands",
                  action: () => {
                    os.openApp("terminal");
                    os.notify("Type help to see the available commands.");
                  },
                },
                {
                  label: "GitHub Profile",
                  action: () => {
                    window.open(
                      profile.github,
                      "_blank",
                      "noopener,noreferrer",
                    );
                  },
                },
              ];
  return (
    <div
      ref={ref}
      className={`app-menu menu-popover menu-${menu}`}
      role="menu"
      aria-label={`${menu} menu`}
    >
      {items.map((item) => (
        <button
          role="menuitem"
          disabled={item.disabled}
          key={item.label}
          onClick={() => run(item.action)}
        >
          {item.label}
          {item.shortcut && <kbd>{item.shortcut}</kbd>}
        </button>
      ))}
    </div>
  );
}
