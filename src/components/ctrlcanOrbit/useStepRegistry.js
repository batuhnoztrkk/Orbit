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
  const timeout = cfg.timeout ?? 8000;
  const interval = cfg.interval ?? 120;

  const selector = selectorFromStep(step);
  if (!selector) return null;

  const t0 = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const el = document.querySelector(selector);
    if (el) return el;
    if (Date.now() - t0 > timeout) return null;
    // eslint-disable-next-line no-await-in-loop
    await new Promise(r => setTimeout(r, interval));
  }
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