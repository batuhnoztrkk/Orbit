import { patchHistoryOnce } from './history.js';

export function createRouterBridge() {
  patchHistoryOnce();
  const getPath = () => (typeof window !== 'undefined' ? window.location.pathname : '/');
  const push = (path) => {
    if (typeof window === 'undefined') return;
    if (!path) return;
    if (getPath() !== path) window.history.pushState({}, '', path);
  };
  const listen = (cb) => {
    const h = () => cb(getPath());
    window.addEventListener('locationchange', h);
    return () => window.removeEventListener('locationchange', h);
  };
  return { getPath, push, listen };
}