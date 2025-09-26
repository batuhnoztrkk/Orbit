/**
 * Summary: pushState/replaceState/popstate yakalayıp 'locationchange' olayı yayar.
 * Side-effects: window.history metodlarını wrap'ler.
 */
export function patchHistoryOnce() {
  if (typeof window === 'undefined') return;
  if (window.__orbitHistoryPatched) return;
  window.__orbitHistoryPatched = true;

  const { pushState, replaceState } = window.history;
  const emit = (name) => window.dispatchEvent(new Event(name));

  window.history.pushState = function (...args) {
    const r = pushState.apply(this, args);
    emit('pushstate'); emit('locationchange');
    return r;
  };
  window.history.replaceState = function (...args) {
    const r = replaceState.apply(this, args);
    emit('replacestate'); emit('locationchange');
    return r;
  };
  window.addEventListener('popstate', () => emit('locationchange'));
}
