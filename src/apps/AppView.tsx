import { Component, lazy, Suspense, memo, type ReactNode } from "react";
import type { AppId } from "../lib/apps";
const About = lazy(() => import("./About"));
const Projects = lazy(() => import("./Projects"));
const Safari = lazy(() => import("./Safari"));
const Settings = lazy(() => import("./Settings"));
const Terminal = lazy(() => import("./Terminal"));
const Preview = lazy(() => import("./Preview"));
const Chess = lazy(() => import("./Chess"));
const Finder = lazy(() => import("./Finder"));
const Calculator = lazy(() => import("./Calculator"));
const LinkedIn = lazy(() => import("./LinkedIn"));
const Notes = lazy(() => import("./Notes"));
const Editor = lazy(() =>
  import("./Editor"),
);
const Trash = lazy(() => import("./Files").then((m) => ({ default: m.Trash })));
const GitHub = lazy(() => import("./GitHub"));
const Calendar = lazy(() => import("./Calendar"));
const Contacts = lazy(() => import("./Contacts"));
const views = {
  github: GitHub, calendar: Calendar, contacts: Contacts,
  finder: Finder,
  calculator: Calculator,
  linkedin: LinkedIn,
  about: About,
  projects: Projects,
  safari: Safari,
  settings: Settings,
  terminal: Terminal,
  resume: Preview,
  chess: Chess,
  notes: Notes,
  editor: Editor,
  trash: Trash,
};
class AppErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="empty-state">
        <h2>Something went wrong.</h2>
        <button
          className="primary-button"
          onClick={() => this.setState({ failed: false })}
        >
          Try again
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export const AppView = memo(function AppView({ id }: { id: AppId }) {
  const View = views[id];
  return (
    <AppErrorBoundary key={id}>
      <Suspense
        fallback={
          <div className="app-loading">
            <span />
            Opening application…
          </div>
        }
      >
        <View />
      </Suspense>
    </AppErrorBoundary>
  );
});
