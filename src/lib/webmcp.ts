import { useOS } from "../state/os";
import { apps, type AppId } from "./apps";
interface Tool {
  name: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean };
  execute: (input: unknown) => unknown;
}
export function registerOSTools() {
  const context = (
    document as Document & {
      modelContext?: {
        registerTool: (
          tool: Tool,
          options: { signal: AbortSignal },
        ) => void | Promise<void>;
      };
    }
  ).modelContext;
  if (!context) return () => {};
  const controller = new AbortController();
  const tools: Tool[] = [
    {
      name: "read_desktop_state",
      description: "Read the current appearance and open HamidOS applications.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: () => {
        const s = useOS.getState();
        return {
          theme: s.theme,
          openApps: s.windows.map((w) => w.app),
          mobileApp: s.mobileApp,
        };
      },
    },
    {
      name: "open_portfolio_application",
      description: "Open a named application on the desktop or phone.",
      inputSchema: {
        type: "object",
        properties: { app: { type: "string", enum: apps.map((a) => a.id) } },
        required: ["app"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: (input) => {
        const app = (input as { app?: unknown })?.app;
        if (typeof app !== "string" || !apps.some((a) => a.id === app))
          throw new Error("Unknown application");
        useOS.getState().openApp(app as AppId);
        return { opened: app };
      },
    },
    {
      name: "set_desktop_appearance",
      description: "Set light or dark appearance, including the wallpaper.",
      inputSchema: {
        type: "object",
        properties: { theme: { type: "string", enum: ["light", "dark"] } },
        required: ["theme"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: (input) => {
        const theme = (input as { theme?: unknown })?.theme;
        if (theme !== "light" && theme !== "dark")
          throw new Error("Choose light or dark");
        useOS.getState().setTheme(theme);
        return { theme };
      },
    },
  ];
  tools.forEach((tool) => {
    try {
      void Promise.resolve(
        context.registerTool(tool, { signal: controller.signal }),
      ).catch(() => {});
    } catch {
      /* unsupported experimental API */
    }
  });
  return () => controller.abort();
}
