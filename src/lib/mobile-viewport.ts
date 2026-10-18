export const mobileQuery = "(max-width: 767px), (pointer: coarse) and (max-width: 1024px) and (max-height: 500px)";

/** Safari's visible area also changes without a layout-viewport resize. */
export function trackMobileViewport(root: HTMLElement) {
  const query = matchMedia(mobileQuery);
  const viewport = window.visualViewport;
  let frame = 0;
  const clear = () => {
    root.style.removeProperty('--mobile-viewport-height');
    root.style.removeProperty('--mobile-viewport-top');
  };
  const update = () => {
    frame = 0;
    if (!query.matches) { clear(); return; }
    // Preserve browser zoom instead of shrinking/reflowing the page during a pinch.
    if (viewport && Math.abs(viewport.scale - 1) > .01) return;
    const height = viewport?.height || window.innerHeight;
    if (height <= 0) return;
    root.style.setProperty('--mobile-viewport-height', `${height}px`);
    root.style.setProperty('--mobile-viewport-top', `${Math.max(0, viewport?.offsetTop || 0)}px`);
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  query.addEventListener('change', schedule);
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  viewport?.addEventListener('resize', schedule);
  viewport?.addEventListener('scroll', schedule);
  update();
  return () => {
    cancelAnimationFrame(frame);
    query.removeEventListener('change', schedule);
    window.removeEventListener('resize', schedule);
    window.removeEventListener('orientationchange', schedule);
    viewport?.removeEventListener('resize', schedule);
    viewport?.removeEventListener('scroll', schedule);
    clear();
  };
}
