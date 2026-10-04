import { useOS } from "../state/os";
import { bundledFiles } from "./filesystem";
export function openFile(path: string) {
  const os = useOS.getState();
  const bundled = bundledFiles.find(file => file.path === path);
  if (bundled) {
    if (bundled.app === "music") { os.setPanel("control"); return; }
    if (bundled.project) os.setSelectedProject(bundled.project);
    os.openApp(bundled.app); return;
  }
  os.setSelectedFile(path); os.openApp(path.includes("/Notes/") ? "notes" : "editor");
}
