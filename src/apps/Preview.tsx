import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Download, PanelLeft, ZoomIn, ZoomOut, Maximize, ArrowLeftRight, RotateCw } from "lucide-react";
import { getDocument, GlobalWorkerOptions, TextLayer, type PDFDocumentProxy, type RenderTask } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import "../pdf-text-layer.css";
import { asset } from "../lib/assets";
GlobalWorkerOptions.workerSrc = workerUrl;

function PDFPage({ pdf, number, scale, thumbnail = false, onError }: { pdf: PDFDocumentProxy; number: number; scale: number; thumbnail?: boolean; onError: (message: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let render: RenderTask | undefined;
    let text: TextLayer | undefined;
    const container = ref.current!;
    setReady(false);
    async function draw() {
      const page = await pdf.getPage(number);
      if (cancelled) return;
      const viewport = page.getViewport({ scale: thumbnail ? 100 / page.getViewport({ scale: 1 }).width : scale });
      setSize({ width: viewport.width, height: viewport.height });
      const canvas = document.createElement("canvas");
      const ratio = thumbnail ? 1.5 : Math.min(3, window.devicePixelRatio || 1);
      canvas.width = Math.floor(viewport.width * ratio); canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${viewport.width}px`; canvas.style.height = `${viewport.height}px`;
      canvas.setAttribute("aria-label", `Résumé page ${number}`);
      container.replaceChildren(canvas);
      render = page.render({ canvas, viewport, transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0] });
      await render.promise;
      if (cancelled) return;
      if (!thumbnail) {
        const layer = document.createElement("div"); layer.className = "textLayer";
        layer.style.setProperty("--scale-factor", String(viewport.scale));
        layer.style.setProperty("--total-scale-factor", String(viewport.scale));
        layer.style.setProperty("--user-unit", String(viewport.userUnit));
        container.append(layer);
        text = new TextLayer({ textContentSource: page.streamTextContent(), container: layer, viewport });
        await text.render();
      }
      if (!cancelled) setReady(true);
    }
    draw().catch(error => { if (!cancelled && error?.name !== "RenderingCancelledException" && error?.name !== "AbortException") onError("This page could not be rendered. Use Retry to reload the document."); });
    return () => { cancelled = true; render?.cancel(); text?.cancel(); container.replaceChildren(); };
  }, [pdf, number, scale, thumbnail, onError]);
  return <div className={`pdf-page ${thumbnail ? "pdf-thumbnail" : ""}`} ref={ref} style={{ ...size, "--scale-factor": scale, "--total-scale-factor": scale, "--user-unit": 1 } as CSSProperties} data-page={number} data-rendered={ready} />;
}

export default function Preview() {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState(""); const [attempt, setAttempt] = useState(0);
  const [current, setCurrent] = useState(1); const [zoom, setZoom] = useState(1);
  const [fit, setFit] = useState<"width" | "page" | null>("width");
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 600, height: 700 });
  const [pageSize, setPageSize] = useState({ width: 595, height: 842 });
  const workspace = useRef<HTMLDivElement>(null);
  const reportError = useRef((message: string) => setError(message)).current;
  useEffect(() => {
    let cancelled = false; setPdf(null); setError("");
    // Identical original PDF bytes, served as data so download interceptors
    // cannot take over in-app reading. Download still uses resume.pdf.
    const task = getDocument({ url: asset("assets/resume-data.txt") });
    task.promise.then(async doc => {
      const first = await doc.getPage(1);
      if (cancelled) return;
      const viewport = first.getViewport({ scale: 1 });
      setPageSize({ width: viewport.width, height: viewport.height }); setPdf(doc); setCurrent(1);
    }).catch(() => { if (!cancelled) setError("The résumé could not be loaded. Check your connection and retry."); });
    return () => { cancelled = true; void task.destroy().catch(() => {}); };
  }, [attempt]);
  useEffect(() => {
    const element = workspace.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element); return () => observer.disconnect();
  }, []);
  const scale = fit === "width" ? Math.max(.15, (dimensions.width - 40) / pageSize.width) : fit === "page" ? Math.max(.15, Math.min((dimensions.width - 40) / pageSize.width, (dimensions.height - 40) / pageSize.height)) : zoom;
  function go(number: number) {
    const page = Math.max(1, Math.min(pdf?.numPages || 1, number)); setCurrent(page);
    workspace.current?.querySelector<HTMLElement>(`.pdf-sheet[data-number="${page}"]`)?.scrollIntoView({ block: "start", behavior: "auto" });
  }
  function magnify(amount: number) { setZoom(Math.min(3, Math.max(.25, scale + amount))); setFit(null); }
  return <div className="preview-app">
    <div className="pdf-toolbar app-toolbar">
      <div className="pdf-tools"><button aria-label="Toggle thumbnails" aria-pressed={showThumbnails} onClick={() => setShowThumbnails(v => !v)}><PanelLeft size={18} /></button><span className="pdf-filename">Hamid-CV.pdf</span></div>
      <div className="pdf-tools"><button aria-label="Previous page" disabled={!pdf || current === 1} onClick={() => go(current - 1)}><ChevronLeft size={19} /></button><span className="pdf-page-count" aria-live="polite">{current} / {pdf?.numPages || "…"}</span><button aria-label="Next page" disabled={!pdf || current === pdf.numPages} onClick={() => go(current + 1)}><ChevronRight size={19} /></button></div>
      <div className="pdf-tools"><button aria-label="Zoom out" disabled={!pdf || scale <= .25} onClick={() => magnify(-.15)}><ZoomOut size={18} /></button><span className="pdf-zoom">{Math.round(scale * 100)}%</span><button aria-label="Zoom in" disabled={!pdf || scale >= 3} onClick={() => magnify(.15)}><ZoomIn size={18} /></button><button aria-label="Fit width" title="Fit width" aria-pressed={fit === "width"} onClick={() => setFit("width")}><ArrowLeftRight size={18} /></button><button aria-label="Fit page" title="Fit page" aria-pressed={fit === "page"} onClick={() => setFit("page")}><Maximize size={17} /></button></div>
      <a className="pdf-download secondary-button" href={asset("assets/resume.pdf")} download="Hamid-Shaikhy-CV.pdf" aria-label="Download original PDF"><Download size={17} /><span>Download</span></a>
    </div>
    <div className="pdf-body">
      {pdf && showThumbnails && <aside className="pdf-thumbnails" aria-label="PDF thumbnails">{Array.from({ length: pdf.numPages }, (_, index) => <button key={index} className={current === index + 1 ? "selected" : ""} aria-label={`Go to page ${index + 1}`} onClick={() => go(index + 1)}><PDFPage pdf={pdf} number={index + 1} scale={1} thumbnail onError={reportError} /><span>{index + 1}</span></button>)}</aside>}
      <div className="pdf-workspace" ref={workspace} onScroll={() => {
        const el = workspace.current; if (!el) return;
        const sheets = Array.from(el.querySelectorAll<HTMLElement>(".pdf-sheet")); const bounds = el.getBoundingClientRect();
        const visible = (sheet: HTMLElement) => { const rect = sheet.getBoundingClientRect(); return Math.max(0, Math.min(rect.bottom, bounds.bottom) - Math.max(rect.top, bounds.top)); };
        const closest = sheets.reduce<HTMLElement | null>((best, sheet) => !best || visible(sheet) > visible(best) ? sheet : best, null);
        if (closest) setCurrent(Number(closest.dataset.number));
      }}>
        {error ? <div className="empty-state" role="alert"><h2>Unable to display résumé</h2><p>{error}</p><button className="primary-button" onClick={() => setAttempt(a => a + 1)}><RotateCw size={16} /> Retry</button></div> : pdf ? Array.from({ length: pdf.numPages }, (_, index) => <div className="pdf-sheet" data-number={index + 1} key={index}><PDFPage pdf={pdf} number={index + 1} scale={scale} onError={reportError} /><span className="pdf-sheet-label">Page {index + 1} of {pdf.numPages}</span></div>) : <div className="app-loading" role="status"><span />Loading résumé…</div>}
      </div>
    </div>
  </div>;
}
