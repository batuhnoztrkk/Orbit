import { patchHistoryOnce } from './history.js';

/**
 * Minimal router köprüsü.
 * type: 'auto' | 'none' | 'custom'
 * customBridge: { getPath():string; push(path:string):void; listen(cb:(path)=>void):()=>void }
 */
export function createRouterBridge(type = 'auto', customBridge) {
  if (type === 'custom' && customBridge) {
    return customBridge;
  }
  if (type === 'none') {
    const getPath = () => (typeof window !== 'undefined' ? window.location.pathname : '/');
    const push = () => {};
    const listen = () => () => {};
    return { getPath, push, listen };
  }

  // 'auto'
  patchHistoryOnce();
  const getPath = () => (typeof window !== 'undefined' ? window.location.pathname : '/');
  const push = (path) => {
    if (typeof window === 'undefined' || !path) return;
    if (getPath() !== path) window.history.pushState({}, '', path);
  };
  const listen = (cb) => {
    const h = () => cb(getPath());
    window.addEventListener('locationchange', h);
    return () => window.removeEventListener('locationchange', h);
  };
  return { getPath, push, listen };
}
