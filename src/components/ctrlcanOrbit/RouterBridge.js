/**
 * Summary: Basit router köprüsü. Gerekirse proje router'ına uyarlanır.
 */
export function createRouterBridge() {
  const getPath = () => (typeof window !== 'undefined' ? window.location.pathname : '/');
  const push = (path) => { if (typeof window !== 'undefined' && path && getPath() !== path) window.location.assign(path); };
  const listen = (cb) => {
    const handler = () => cb(getPath());
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  };
  return { getPath, push, listen };
}
