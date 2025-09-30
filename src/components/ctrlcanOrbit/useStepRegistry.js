/**
 * Summary: Step için selector oluşturur ve DOM'da hedefi bekler.
 * Preconditions: Tarayıcı ortamı (document) mevcut.
 * Postconditions: Element bulunursa döner, yoksa null.
 * Side-effects: setTimeout ile bekleme döngüsü.
 * @param {import('./atoms.js').OrbitStep} step
 * @param {{ timeout?:number, interval?:number }} cfg
 * @returns {Promise<Element|null>}
 */
export async function waitForTarget(step, cfg = {}) {
  console.log('[resolve] start', {
  id: step?.id,
  route: step?.route,
  selector: step?.selector,
  dataTour: step?.dataTour,
  className: step?.className,
  fallback: step?.onMissing?.fallbackSelector
});
  console.log('[resolve] start', {
    id: step?.id, route: step?.route,
    selector: step?.selector, dataTour: step?.dataTour,
    className: step?.className, fallback: step?.onMissing?.fallbackSelector
  });
  
  const timeout = cfg.timeout ?? 15000;
  const interval = cfg.interval ?? 120;

  const sels = [];
  if (step?.selector) sels.push(step.selector);
  if (step?.dataTour) {
    const k = step.dataTour;
    sels.push(
      `[data-tour="${k}"]`,
      `[data-datatour="${k}"]`,
      `[data-tutorial="${k}"]`,
      `#${CSS.escape(k)}`,
      `.${CSS.escape(k)}`
    );
  }
  if (step?.className) sels.push(`.${step.className}`);
  if (step?.onMissing === 'fallbackSelector' && step?.fallbackSelector) {
    sels.push(step.fallbackSelector);
  }
  console.log('[resolve] selectors', sels);
  if (!sels.length) return null;

  const find = () => {
    for (const s of sels) { const el = document.querySelector(s); if (el) return el; }
    return null;
  };

  const ensureInView = (el) => {
    const r = el.getBoundingClientRect();
    const inView = r.width>0 && r.height>0 && r.top>=0 && r.left>=0 &&
      r.bottom <= (window.innerHeight||document.documentElement.clientHeight) &&
      r.right  <= (window.innerWidth ||document.documentElement.clientWidth);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (!inView) el.scrollIntoView({ block:'center', inline:'center', behavior: reduced ? 'auto' : 'smooth' });
  };

  // Hızlı yol
  let el = find();
  if (el) { ensureInView(el); return el; }

  // Observer + polling birlikte
  let resolved = null;
  const p = new Promise((res) => {
    const mo = new MutationObserver(() => {
      if (!resolved) {
        const e = find();
        if (e) { resolved = e; mo.disconnect(); res(e); }
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    const t0 = Date.now();
    (async function poll(){
      while (!resolved && Date.now()-t0 < timeout) {
        const e = find();
        if (e) { resolved = e; mo.disconnect(); res(e); return; }
        await new Promise(r => setTimeout(r, interval));
      }
      if (!resolved) { mo.disconnect(); res(null); }
    })();
  });

  el = await p;
  if (el) ensureInView(el);
  return el;
}

/**
 * Step'ten selector üretir; öncelik:
 * 1) step.selector
 * 2) step.dataTour -> [data-tour="..."]
 * 3) step.className -> .className
 */
export function selectorFromStep(step) {
  if (step?.selector) return step.selector;
  if (step?.dataTour) return `[data-tour="${step.dataTour}"]`;
  if (step?.className) return `.${step.className}`;
  return null;
}

/** Basit route eşleştirme (string exact veya RegExp) */
export function isRouteMatch(stepRoute, currentPath) {
  if (!stepRoute) return true;
  if (stepRoute instanceof RegExp) return stepRoute.test(currentPath);
  return String(stepRoute) === String(currentPath);
}

export async function waitForSelector(selector, cfg = {}) {
  const timeout = cfg.timeout ?? 8000;
  const interval = cfg.interval ?? 120;
  const t0 = Date.now();
  while (Date.now() - t0 <= timeout) {
    const el = document.querySelector(selector);
    if (el) return el;
    // eslint-disable-next-line no-await-in-loop
    await new Promise(r => setTimeout(r, interval));
  }
  return null;
}