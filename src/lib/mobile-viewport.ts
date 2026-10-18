export const mobileQuery = "(max-width: 767px), (pointer: coarse) and (max-width: 1024px) and (max-height: 500px)";

/** Safari's visible area also changes without a layout-viewport resize. */
export function trackMobileViewport(root: HTMLElement) {
  const query = matchMedia(mobileQuery);
  const appDisplay = matchMedia('(display-mode: standalone), (display-mode: fullscreen)');
  const viewport = window.visualViewport;
  let frame = 0;
  const clear = () => {
    root.style.removeProperty('--mobile-viewport-height');
    root.style.removeProperty('--mobile-viewport-top');
    delete root.dataset.mobileDisplay;
  };
  const update = () => {
    frame = 0;
    if (!query.matches) { clear(); return; }
    // Preserve browser zoom instead of shrinking/reflowing the page during a pinch.
    if (viewport && Math.abs(viewport.scale - 1) > .01) return;
    const standalone = appDisplay.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const layoutHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
    const visibleHeight = viewport?.height || layoutHeight;
    const focus = document.activeElement;
    const editing = focus?.matches('input, textarea, select, iframe') || (focus instanceof HTMLElement && focus.isContentEditable);
    const keyboard = editing && layoutHeight - visibleHeight > 120;
    // An installed iOS app can report a visual viewport that excludes native safe
    // areas. Keep its full layout canvas; only shrink it for an actual keyboard.
    const height = standalone && !keyboard ? layoutHeight : visibleHeight;
    if (height <= 0) return;
    root.style.setProperty('--mobile-viewport-height', `${height}px`);
    root.style.setProperty('--mobile-viewport-top', `${standalone && !keyboard ? 0 : Math.max(0, viewport?.offsetTop || 0)}px`);
    root.dataset.mobileDisplay = standalone ? 'standalone' : 'browser';
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  query.addEventListener('change', schedule);
  appDisplay.addEventListener('change', schedule);
  window.addEventListener('pageshow', schedule);
  window.addEventListener('focusin', schedule);
  window.addEventListener('focusout', schedule);
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  viewport?.addEventListener('resize', schedule);
  viewport?.addEventListener('scroll', schedule);
  update();
  return () => {
    cancelAnimationFrame(frame);
    query.removeEventListener('change', schedule);
    appDisplay.removeEventListener('change', schedule);
    window.removeEventListener('pageshow', schedule);
    window.removeEventListener('focusin', schedule);
    window.removeEventListener('focusout', schedule);
    window.removeEventListener('resize', schedule);
    window.removeEventListener('orientationchange', schedule);
    viewport?.removeEventListener('resize', schedule);
    viewport?.removeEventListener('scroll', schedule);
    clear();
  };
}
