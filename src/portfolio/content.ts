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
    stack: ['React', 'TypeScript', 'Tailwind CSS', 'Zustand', 'dnd-kit', 'Vite'], repo: original('barg').repo,
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
    id: 'macfolio', title: 'Macfolio', category: 'Interactive desktop portfolio', status: 'PERSONAL PROJECT', accent: '#b9d4b9',
    headline: 'A portfolio you can work inside.',
    summary: 'A familiar desktop, reimagined for the web. Working apps, a shared file system and a separate mobile experience.',
    role: 'Design, architecture & front-end development',
    problem: 'A desktop-inspired portfolio needs meaningful interactions and usable mobile behavior behind its familiar visual shell.',
    contribution: 'I built the window manager, persistent virtual file system, app search, PDF viewer and touch-oriented mobile shell. This portfolio is also its Safari homepage.',
    decisions: ['Apps load on demand to keep the shell lightweight.', 'Shared browser-persisted state connects Finder, Notes, Code and Terminal.', 'Desktop windows and mobile full-screen apps use the same underlying app components.'],
    features: ['Drag, resize, minimize and maximize windows', 'Shared files, notes, code editor and terminal', 'PDF résumé viewer, search and chess', 'Persistent themes and mobile app navigation'],
    stack: ['React', 'TypeScript', 'Zustand', 'CodeMirror', 'PDF.js', 'Vite'], repo: 'https://github.com/hamidshaikhy/macfolio', live: asset(''),
    shots: [{ src: asset('assets/portfolio/macfolio.webp'), title: 'A personal workspace', caption: 'The actual Macfolio desktop, with working apps and familiar window controls.' }],
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
