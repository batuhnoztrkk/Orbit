import { useEffect, useMemo, useRef } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { OrbitProvider } from './TourContext.js';
import { Backdrop } from './Backdrop.jsx';
import styles from './CtrlcanOrbit.module.css';
import { stepsAtom, optionsAtom, runtimeAtom, currentIndexAtom } from './atoms.js';
import { selectorFromStep, waitForTarget, isRouteMatch } from './useStepRegistry.js';
import { createRouterBridge } from './RouterBridge.js';

/**
 * @param {{ steps: import('./atoms.js').OrbitStep[], options?: Partial<import('./atoms.js').OrbitOptions> }} props
 */
function OrbitInner({ steps: inSteps, options = {} }) {
  const [steps, setSteps] = useAtom(stepsAtom);
  const [rt, setRt] = useAtom(runtimeAtom);
  const setOpts = useSetAtom(optionsAtom);
  const idx = useAtomValue(currentIndexAtom);
  const router = useMemo(() => createRouterBridge(), []);
  const targetRef = useRef(/** @type {Element|null} */(null));

  // init steps & options
  useEffect(() => { setSteps(inSteps || []); }, [inSteps, setSteps]);
  useEffect(() => {
    setOpts(prev => ({ ...prev, ...options }));
  }, [options, setOpts]);

  // load persisted & resume
  useEffect(() => {
    const key = (options?.storage?.userKey ? `${options.storage.userKey}:` : '') + (options?.storage?.key ?? 'ctrlcan:orbit:v1');
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (options?.resumeOnLoad && saved?.currentStepId) {
        setRt(s => ({ ...s, active: true, currentStepId: saved.currentStepId, visited: saved.visited || [] }));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist on change
  useEffect(() => {
    const key = (options?.storage?.userKey ? `${options.storage.userKey}:` : '') + (options?.storage?.key ?? 'ctrlcan:orbit:v1');
    try {
      localStorage.setItem(key, JSON.stringify(rt));
    } catch {}
  }, [rt, options]);

  // ensure route for current step
  useEffect(() => {
    if (!rt.active) return;
    const step = steps[idx];
    if (!step) return;
    const path = router.getPath();
    if (typeof step.route === 'string' && !isRouteMatch(step.route, path)) {
      router.push(step.route);
    }
  }, [rt.active, idx, steps, router]);

  // resolve target for current step (data-tour / class / selector)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!rt.active) return;
      const step = steps[idx];
      if (!step) return;
      // modal olmadığı varsayımla hedef bekle
      const el = await waitForTarget(step, { timeout: 8000, interval: 120 });
      if (cancelled) return;
      targetRef.current = el;
    })();
    return () => { cancelled = true; };
  }, [rt.active, idx, steps]);

  // click guard: hedef dışı tüm tıklamaları engelle
  useEffect(() => {
    if (!rt.active) return;

    const onClickCapture = (e) => {
      const target = targetRef.current;
      if (!target) {
        e.preventDefault(); e.stopPropagation();
        return;
      }
      if (!target.contains(e.target)) {
        e.preventDefault(); e.stopPropagation();
      }
    };

    document.addEventListener('click', onClickCapture, true);
    document.addEventListener('mousedown', onClickCapture, true);
    document.addEventListener('pointerdown', onClickCapture, true);

    return () => {
      document.removeEventListener('click', onClickCapture, true);
      document.removeEventListener('mousedown', onClickCapture, true);
      document.removeEventListener('pointerdown', onClickCapture, true);
    };
  }, [rt.active]);

  if (!rt.active) return null;

  // Basit backdrop (blur+darken). Spotlight/Tooltip sonraki adımda.
  return (
    <>
      <div className={styles.blocker} aria-hidden="true" />
      <Backdrop blur={options?.backdrop?.blur ?? 6} opacity={options?.backdrop?.opacity ?? 0.45} />
    </>
  );
}

/** Public component */
export function CtrlcanOrbit(props) {
  return (
    <OrbitProvider>
      <OrbitInner {...props} />
    </OrbitProvider>
  );
}
