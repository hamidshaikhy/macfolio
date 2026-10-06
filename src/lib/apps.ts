export type AppId =
  | "github"
  | "calendar"
  | "contacts"
  | "finder"
  | "calculator"
  | "linkedin"
  | "about"
  | "projects"
  | "notes"
  | "safari"
  | "editor"
  | "terminal"
  | "resume"
  | "chess"
  | "settings"
  | "trash";
export const apps: {
  id: AppId;
  name: string;
  icon: string;
  keywords: string;
}[] = [
  { id: "github", name: "GitHub", icon: "github", keywords: "git repositories code گیت هاب گیتهاب" },
  { id: "calendar", name: "Calendar", icon: "calendar", keywords: "events dates تقویم رویداد" },
  { id: "contacts", name: "Contacts", icon: "contacts", keywords: "contact email phone مخاطبین تماس" },
  { id: "finder", name: "Finder", icon: "finder", keywords: "files folders documents music browse فایل پوشه" },
  {
    id: "about",
    name: "About Hamid",
    icon: "about",
    keywords: "profile contact حمید درباره",
  },
  {
    id: "projects",
    name: "Projects",
    icon: "folder",
    keywords: "dika asia finance flow studio barg resume builder رزومه پروژه",
  },
  { id: "notes", name: "Notes", icon: "notes", keywords: "write یادداشت" },
  {
    id: "safari",
    name: "Safari",
    icon: "safari",
    keywords: "browser web internet",
  },
  { id: "editor", name: "Code", icon: "vscode", keywords: "editor files" },
  {
    id: "terminal",
    name: "Terminal",
    icon: "terminal",
    keywords: "shell commands",
  },
  {
    id: "resume",
    name: "Preview",
    icon: "document",
    keywords: "cv resume رزومه pdf",
  },
  { id: "chess", name: "Chess", icon: "chess", keywords: "game شطرنج" },
  {
    id: "settings",
    name: "Settings",
    icon: "settings",
    keywords: "appearance wallpaper theme تنظیمات",
  },
  { id: "trash", name: "Trash", icon: "trash", keywords: "deleted files" },
  { id: "calculator", name: "Calculator", icon: "calculator", keywords: "math calculate ماشین حساب" },
  { id: "linkedin", name: "LinkedIn", icon: "linkedin", keywords: "professional profile contact حمید" },
];
export const appById = (id: AppId) => apps.find((a) => a.id === id)!;
export const dockApps = ["finder", "terminal", "editor", "notes", "calendar", "safari", "github", "linkedin", "contacts", "chess", "calculator", "settings"].map(id => apps.find(a => a.id === id)!);

const appOrder = ["finder", "terminal", "editor", "projects", "notes", "calendar", "safari", "github", "linkedin", "contacts", "about", "resume", "chess", "calculator", "settings", "trash"];
apps.sort((a,b) => appOrder.indexOf(a.id) - appOrder.indexOf(b.id));
