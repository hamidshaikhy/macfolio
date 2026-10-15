import { useEffect, type ReactNode } from 'react';

const query = new URLSearchParams(location.search);
export const embedded = window.parent !== window && query.get('embed') === 'macfolio';
const appId = import.meta.env.BASE_URL.split('/').filter(Boolean).slice(-1)[0];
const instance = query.get('instance');
type BridgeMessage = { channel: 'macfolio-app-v1'; appId: string; instance: string; type: 'ready' | 'focus' | 'visibility'; visible?: boolean };

export function EmbeddedBridge({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!embedded || !appId || !instance) return;
    const send = (type: 'ready' | 'focus') => {
      const message: BridgeMessage = { channel: 'macfolio-app-v1', appId, instance, type };
      window.parent.postMessage(message, location.origin);
    };
    const focus = () => send('focus');
    const message = (event: MessageEvent) => {
      const data = event.data as Partial<BridgeMessage> | null;
      if (event.origin !== location.origin || event.source !== window.parent || !data || data.channel !== 'macfolio-app-v1' || data.appId !== appId || data.instance !== instance || data.type !== 'visibility' || typeof data.visible !== 'boolean') return;
      document.documentElement.dataset.macfolioHidden = String(!data.visible);
      document.dispatchEvent(new Event('macfolio-visibility'));
    };
    // Ready comes from a committed React UI, never the HTML load event.
    send('ready');
    document.addEventListener('pointerdown', focus, true);
    document.addEventListener('focusin', focus, true);
    window.addEventListener('message', message);
    const install = (event: Event) => event.preventDefault();
    window.addEventListener('beforeinstallprompt', install, true);
    return () => {
      document.removeEventListener('pointerdown', focus, true);
      document.removeEventListener('focusin', focus, true);
      window.removeEventListener('message', message);
      window.removeEventListener('beforeinstallprompt', install, true);
      delete document.documentElement.dataset.macfolioHidden;
    };
  }, []);
  return children;
}
