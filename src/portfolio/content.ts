import { projectDemo } from "../lib/integrated-apps";
import { asset } from '../lib/assets';
import { projects } from '../lib/content';
import { projectStudies } from '../lib/project-studies';

export const portfolioPath = asset('portfolio');
export const resumePath = asset('assets/portfolio/resume-Hamid-Shaikhy.pdf');
export const portraitPath = asset('assets/portfolio/portrait.webp');
export const portraitSmallPath = asset('assets/portfolio/portrait-small.webp');
export const sections = [
  { id: 'home', label: 'Home' }, { id: 'profile', label: 'Profile' },
  { id: 'stack', label: 'Stack' }, { id: 'work', label: 'Work' },
  { id: 'journey', label: 'Journey' }, { id: 'contact', label: 'Contact' },
] as const;
export type SectionId = typeof sections[number]['id'];
export const isSection = (id: string): id is SectionId => sections.some(section => section.id === id);

export type PortfolioProject = {
  id: string; title: string; category: string; status: string; accent: string;
  summary: string; headline: string; role: string; problem: string; contribution: string;
  decisions: string[]; features: string[]; stack: string[]; repo?: string; live?: string;
  shots: { src: string; title: string; caption: string }[];
};
const original = (id: string) => projects.find(project => project.id === id)!;
const shot = (id: string, index: number, title: string, caption: string) => ({
  src: asset(`assets/portfolio/work/${id}/${projectStudies[id].shots[index].file.replace('.png','.webp')}`), title, caption,
});
export const selectedWork: PortfolioProject[] = [
  {
    id: 'flow', title: 'Flow Studio', category: 'Visual workflow builder', status: 'PERSONAL PROJECT', accent: '#cfb9ef',
    headline: 'Make the logic visible.',
    summary: 'A canvas for connecting ideas, running data workflows and inspecting every step along the way.',
    role: 'Interface design & front-end development',
    problem: 'Connected steps and conditional branches become hard to follow when execution and editing live in separate places.',
    contribution: 'I built a graph editor and a UI-independent execution engine, bringing the canvas, validation, run controls and output inspection into one workspace.',
    decisions: ['React Flow handles the graph; the execution engine stays separate from the interface.', 'Zustand coordinates editing and execution state. Local persistence keeps workflows available between visits.', 'Step checkpoints, cycle detection and validation make interrupted or invalid runs understandable.'],
    features: ['Seven node types and conditional branches', 'Step-by-step execution, pause, resume and cancellation', 'Undo/redo, multi-select and workflow templates', 'Table, JSON and CSV results'],
    stack: ['React', 'TypeScript', 'React Flow', 'Zustand', 'Zod', 'IndexedDB'], repo: original('flow').repo,
    shots: [shot('flow', 0, 'A workspace for connected thinking', 'The node library, graph canvas and execution console share one interface.'), shot('flow', 1, 'Decisions you can trace', 'Conditional branches make the data path visible.'), shot('flow', 2, 'Inspect the output', 'Review individual results and export the data.')],
  },
  {
    id: 'barg', title: 'Barg', category: 'Persian & English résumé builder', status: 'PERSONAL PROJECT', accent: '#bde0b5',
    headline: 'A career, beautifully on paper.',
    summary: 'Write, refine and export a résumé with a live A4 preview. Everything runs in your browser.',
    role: 'Product design & front-end development',
    problem: 'Persian text, mixed writing directions and automatic page breaks need careful handling to produce a readable résumé.',
    contribution: 'I designed and built the editor, ten customizable templates, automatic A4 pagination and export flows for PDF, Word and JSON.',
    decisions: ['Pagination keeps section headings together with their content in one- and two-column layouts.', 'RTL and LTR templates handle both Persian and English résumés.', 'Browser autosave and account-free editing keep the workflow local.'],
    features: ['Ten templates with customizable typography and colors', 'Live preview and automatic A4 pagination', 'Mouse, touch and keyboard section reordering', 'Text PDF, image PDF, editable Word and JSON backup'],
    stack: ['React', 'TypeScript', 'Tailwind CSS', 'Zustand', 'dnd-kit', 'Vite'], repo: original('barg').repo, live: projectDemo('barg'),
    shots: [shot('barg', 1, 'Write. See. Refine.', 'Changes in the editor appear directly on the A4 preview.'), shot('barg', 2, 'Find your format', 'A collection of templates with adjustable fonts, spacing and color.'), shot('barg', 3, 'Ready to share', 'Several export formats serve different application workflows.')],
  },
  {
    id: 'tanpoosh', title: 'Tanpoosh', category: 'Menswear store & style studio', status: 'LOCAL DEMO', accent: '#e3c49d',
    headline: 'From a single piece to a complete look.',
    summary: 'A Persian menswear storefront, an interactive style studio and a dedicated store management interface.',
    role: 'Storefront, studio & management interface development',
    problem: 'Product, color, size and inventory choices must stay consistent across browsing, styling and the shopping cart.',
    contribution: 'I built the responsive storefront, account screens, outfit composition studio and management interface, with Django APIs supporting the local demo.',
    decisions: ['Shared product and variant choices connect the store, studio and cart.', 'The style preview composes prepared photographic layers with consistent geometry.', 'The local demo uses sample products and test payments.'],
    features: ['Product catalog, color and size selection', 'Compose outfits and add a complete set to the cart', 'Save, share and export a style as JPEG', 'Store management with roles and permissions'],
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Django'], repo: original('tanpoosh').repo,
    shots: [shot('tanpoosh', 1, 'Build a complete look', 'Select garments and inspect a layered photographic outfit preview.'), shot('tanpoosh', 0, 'A considered storefront', 'Collections, featured products and a clear entry into the studio.'), shot('tanpoosh', 4, 'Behind the storefront', 'A separate RTL interface for store operations. The figures are demo data.')],
  },
  {
    id: 'dika', title: 'Dika Asia', category: 'Corporate website', status: 'EMPLOYMENT CONTRIBUTION · LIVE', accent: '#b7d5dc',
    headline: 'Give the details another dimension.',
    summary: 'A multilingual corporate website with product stories, completed projects and interactive 3D structural details.',
    role: 'Front-End Developer · Dika Asia',
    problem: 'Technical products and architectural projects need a clear presentation that works in Persian, Kurdish Sorani and on mobile.',
    contribution: 'I developed reusable components, responsive RTL pages and Three.js product experiences, working with the back-end team to integrate dynamic content.',
    decisions: ['An extensible component structure supports product, project, article and gallery pages.', 'Persian and Kurdish Sorani interfaces share a responsive RTL foundation.', 'Interactive product views reveal structural details alongside conventional content.'],
    features: ['Multilingual product and project pages', 'Interactive Three.js structural presentation', 'Articles, image galleries and media', 'Content integrated through back-end APIs'],
    stack: ['React', 'Next.js', 'Tailwind CSS', 'Three.js', 'REST APIs'], live: original('dika').website,
    shots: [shot('dika', 0, 'Explore the structure', 'An exploded view introduces profiles, rails and glass.'), shot('dika', 1, 'Product details, clearly presented', 'Categorized product information and photography.'), shot('dika', 2, 'Built work in context', 'A gallery of the company’s completed architectural projects.')],
  },
  {
    id: 'finance', title: 'Financial Panel', category: 'Finance & operations interface', status: 'PUBLIC INTERFACE DEMO', accent: '#bac9f1',
    headline: 'Clarity in a complex workspace.',
    summary: 'Financial overviews, account details and project ledgers in a unified, responsive RTL workspace.',
    role: 'React interface & reusable data components',
    problem: 'Dense financial tables and multiple operational modules need clear navigation and consistent, readable interactions.',
    contribution: 'I built financial views, searchable data tables, charts, filters and browser-based Excel reporting. The public interface runs with sample data.',
    decisions: ['Reusable table and filter patterns keep the financial modules consistent.', 'Light and dark themes preserve readability across dense screens.', 'Demo data allows the public interface to run independently of a production back end.'],
    features: ['Bank accounts and searchable transactions', 'Project ledgers and account balances', 'Management reports and Excel export', 'Responsive RTL and light/dark appearance'],
    stack: ['React', 'Vite', 'Data tables', 'REST APIs', 'RTL'], repo: original('finance').repo,
    shots: [shot('finance', 0, 'The financial picture', 'A dashboard of financial indicators, cash flow and projects using sample data.'), shot('finance', 1, 'From account to transaction', 'Search and pagination support detailed account inspection.'), shot('finance', 3, 'Reports that travel', 'Review summaries and download a multi-sheet Excel report.')],
  },
  {
    id: 'todo-list', title: 'To Do List', category: 'Android app & daily planner PWA', status: 'ANDROID APK + PWA', accent: '#e5bba9',
    headline: 'A clearer day, on web and Android.',
    summary: 'A Persian daily planner with tasks, a Jalali calendar and focus timers. Available as a web PWA and a native Android app.',
    role: 'Product design, web & native app development',
    problem: 'Task and timer behavior must stay dependable across web and Android while each platform uses its own interface and local storage.',
    contribution: 'I built the React web app and a native React Native / Expo Android interface, sharing TypeScript task, date and timer logic between them.',
    decisions: ['IndexedDB stores web tasks; SQLite stores Android tasks. Both work locally without an account or server.', 'Timers recover from stored deadlines when the app resumes; background alarms are not guaranteed.', 'The installable web app caches its interface offline. A standalone Android demo APK bundles the app runtime.'],
    features: ['Task editing, notes, due dates and completion', 'Persian weekly calendar and overdue tasks', 'Customizable focus timer with pause and resume', 'Installable PWA, Android APK and web JSON backup'],
    stack: ['React Native', 'Expo', 'React', 'TypeScript', 'PWA', 'SQLite', 'IndexedDB'], repo: original('todo-list').repo, live: projectDemo('todo-list'),
    shots: [shot('todo-list', 0, 'Plan the day', 'The actual web app, with sample tasks, a Persian calendar, focus timer and Android APK download entry.'), shot('todo-list', 1, 'A quieter workspace', 'The web planner in dark mode, with the same task and timer controls.'), shot('todo-list', 2, 'The web app on your phone', 'Responsive PWA layout. This screenshot shows the web app, not the native Android interface.')],
  },
  {
    id: 'hamnava', title: 'Hamnava', category: 'Music streaming PWA', status: 'INSTALLABLE MUSIC PWA', accent: '#c5dd54',
    headline: 'Music that stays with you.',
    summary: 'A Persian music PWA with real Audius tracks, playlists and a personal library, in a charcoal-and-lime interface.',
    role: 'Product design & PWA development',
    problem: 'Playback must continue across pages while search, queues and saved collections stay coherent in a touch-friendly RTL interface.',
    contribution: 'I built the React and TypeScript interface, Audius integration, audio queue, Media Session controls and browser-local accounts and collections.',
    decisions: ['Audius track and playlist names, artwork and creator attribution are preserved.', 'IndexedDB keeps accounts and libraries on the device; there is no server login or cross-device sync.', 'The service worker caches the app shell. Streaming needs internet; tracks are not downloaded or cached.'],
    features: ['Track and artist search, public playlists', 'Continuous playback, queue, shuffle and repeat', 'Liked tracks and personal or saved playlists', 'Installable PWA and supported Media Session controls'],
    stack: ['React', 'TypeScript', 'PWA', 'Audius API', 'IndexedDB', 'Media Session'], repo: original('hamnava').repo, live: projectDemo('hamnava'),
    shots: [shot('hamnava', 0, 'A home for listening', 'Actual Audius music and artwork in the home view, with persistent playback controls.'), shot('hamnava', 1, 'Keep the playlist intact', 'Original playlist information, creator attribution, track list and save controls.'), shot('hamnava', 2, 'Your own collection', 'A demonstration library stored locally in the browser.'), shot('hamnava', 4, 'Listening on a smaller screen', 'Mobile navigation and playback controls in the installable PWA.')],
  },
  {
    id:'personal-finance',title:'Personal Finance',category:'Personal finance PWA',status:'LIVE INSTALLABLE PWA',accent:'#c9b079',
    headline:'Know where your money goes.',summary:'A Persian personal ledger with Jalali dates, budgets and cash-flow reports. Account data stays encrypted in your browser.',
    role:'Product design & PWA development',problem:'Financial data must remain private to each local user, with clear reports and reliable edits across windows and tabs.',
    contribution:'I built the React interface, encrypted account storage, transaction tools, budget views and responsive cash-flow charts.',
    decisions:['Independent local accounts use encrypted IndexedDB storage.','Revision checks reject stale writes from another tab instead of overwriting newer data.','The PWA shell works offline; encrypted backups support manual transfer between devices.'],
    features:['Income, expenses and account transfers','Jalali budgets, schedules and saving goals','Cash-flow charts and CSV reports','Encrypted local accounts and password-protected backups'],
    stack:['React','TypeScript','PWA','IndexedDB','Web Crypto'],repo:original('personal-finance').repo,live:projectDemo('personal-finance'),
    shots:[shot('personal-finance',0,'Your financial picture','The actual overview with local demonstration data.'),shot('personal-finance',1,'Follow the money','Monthly reports, categories and CSV export.'),shot('personal-finance',2,'A ledger in your pocket','The responsive transaction form with Jalali dates.')],
  },
  {
    id: 'macfolio' , title: 'Macfolio', category: 'Interactive desktop portfolio', status: 'PERSONAL PROJECT', accent: '#b9d4b9',
    headline: 'A portfolio you can work inside.',
    summary: 'A familiar desktop, reimagined for the web. Working apps, a shared file system and a separate mobile experience.',
    role: 'Design, architecture & front-end development',
    problem: 'A desktop-inspired portfolio needs meaningful interactions and usable mobile behavior behind its familiar visual shell.',
    contribution: 'I built the window manager, persistent virtual file system, app search, PDF viewer and touch-oriented mobile shell. This portfolio runs inside About and as a standalone page.',
    decisions: ['Apps load on demand to keep the shell lightweight.', 'Shared browser-persisted state connects Finder, Code and Terminal.', 'Desktop windows and mobile full-screen apps use the same underlying app components.'],
    features: ['Drag, resize, minimize and maximize windows', 'Shared files, notes, code editor and terminal', 'PDF résumé viewer, search and chess', 'Persistent themes and mobile app navigation'],
    stack: ['React', 'TypeScript', 'Zustand', 'CodeMirror', 'PDF.js', 'Vite'], repo: 'https://github.com/hamidshaikhy/macfolio', live: asset(''),
    shots: [{ src: asset('assets/portfolio/macfolio.webp'), title: 'A personal workspace', caption: 'The actual Macfolio desktop, with working apps and familiar window controls.' }],
  },
];

export type JourneyEntry = {
  id: string; date: string; title: string; company: string; url?: string;
  kind: string; points: string[];
};
export const journeyEntries: JourneyEntry[] = [
  {
    id: 'apps', date: 'INDEPENDENT PROJECTS', title: 'App Developer', company: 'To Do List · Hamnava', kind: 'ANDROID & PWA DEVELOPMENT',
    points: ['Native React Native / Expo Android planner, delivered as an installable APK.', 'Installable PWAs for daily planning and Audius music streaming.', 'Local storage, offline app shells, shared task logic and media controls.'],
  },
  {
    id: 'experience', date: 'JUL 2026 — OCT 2026', title: 'Front-End Developer', company: 'Dika Asia · Tehran · Contract', url: 'https://dikaasia.com/', kind: 'PROFESSIONAL EXPERIENCE',
    points: ['Corporate websites and internal finance, project and operations interfaces.', 'Reusable React components, responsive layouts and RTL support.', 'Django REST API integration, data tables, filtering and Excel reporting.'],
  },
  {
    id: 'education', date: '2022 — 2026', title: 'B.Sc. in Computer Engineering', company: 'Islamic Azad University · Tabriz', kind: 'EDUCATION',
    points: ['Software Engineering', 'Learning through practical projects, from web interfaces to application architecture.'],
  },
  {
    id: 'independent', date: 'INDEPENDENT PROJECTS', title: 'Building Personal Products', company: 'Flow Studio · Barg · Macfolio', kind: 'PERSONAL PRODUCT DEVELOPMENT',
    points: ['A visual workflow editor with execution, validation and persistent state.', 'A Persian and English résumé builder with a live A4 preview.', 'An interactive desktop with working apps and a shared file system.'],
  },
];

export const skills = [
  { name: 'React', icon: 'react', category: 'INTERFACE CORE', detail: 'Reusable components and predictable state for interfaces that grow with a product.' },
  { name: 'Next.js', icon: 'nextjs', category: 'WEB FRAMEWORK', detail: 'Routing and application structure for corporate websites and storefronts.' },
  { name: 'TypeScript', icon: 'typescript', category: 'TYPE SYSTEM', detail: 'Clear contracts between components, data and the logic underneath an interface.' },
  { name: 'JavaScript', icon: 'javascript', category: 'LANGUAGE', detail: 'The interaction layer: browser APIs, execution engines and everyday problem solving.' },
  { name: 'HTML / CSS', icon: 'html-css', category: 'WEB FOUNDATION', detail: 'Semantic structure, responsive layouts and careful handling of RTL and LTR content.' },
  { name: 'Tailwind CSS', icon: 'tailwindcss', category: 'STYLING', detail: 'Consistent design tokens and responsive styling across reusable UI components.' },
  { name: 'Vite', icon: 'vite', category: 'BUILD TOOLING', detail: 'A focused development workflow and optimized production builds for React projects.' },
  { name: 'Git', icon: 'git', category: 'VERSION CONTROL', detail: 'Readable changes and a dependable history for collaboration and iteration.' },
  { name: 'Figma', icon: 'figma', category: 'DESIGN', detail: 'Turning interface ideas into coherent layouts, components and working products.' },
  { name: 'Three.js', icon: 'threejs', category: 'INTERACTIVE 3D', detail: 'Interactive product and structural views, as used on the Dika Asia website.' },
  { name: 'REST APIs', icon: 'rest-api', category: 'INTEGRATION', detail: 'Connecting data-driven React interfaces to Django back-end APIs.' },
  { name: 'Vitest', icon: 'vitest', category: 'VERIFICATION', detail: 'Unit tests for application logic, alongside browser tests for complete user flows.' },
];
