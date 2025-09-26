import { useEffect, useMemo, useRef } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { OrbitProvider } from './TourContext.js';
import { Backdrop } from './Backdrop.jsx';
import { Spotlight } from './Spotlight.jsx';
import { Tooltip } from './Tooltip.jsx';
import { PortalMount } from './PortalMount.jsx';
import styles from './CtrlcanOrbit.module.css';
import { stepsAtom, optionsAtom, runtimeAtom, currentIndexAtom } from './atoms.js';
import { waitForTarget, isRouteMatch } from './useStepRegistry.js';
import { createRouterBridge } from './RouterBridge.js';
import { createI18n } from '../../i18n/index.js'; // NEW

function OrbitInner({ steps: inSteps, options = {}, onFinish, onCancel }) {
  const [steps, setSteps] = useAtom(stepsAtom);
  const [rt, setRt] = useAtom(runtimeAtom);
  const setOpts = useSetAtom(optionsAtom);
  const idx = useAtomValue(currentIndexAtom);
  const router = useMemo(() => createRouterBridge(), []);
  const targetRef = useRef(null);
  const uiRootRef = useRef(null);

  useEffect(() => { setSteps(inSteps || []); }, [inSteps, setSteps]);
  useEffect(() => { setOpts(prev => ({ ...prev, ...options })); }, [options, setOpts]);

  // i18n instance
  const { t } = useMemo(() => createI18n(options?.i18n), [options?.i18n]);

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
  }, []); // eslint-disable-line

  useEffect(() => {
    const key = (options?.storage?.userKey ? `${options.storage.userKey}:` : '') + (options?.storage?.key ?? 'ctrlcan:orbit:v1');
    try { localStorage.setItem(key, JSON.stringify(rt)); } catch {}
  }, [rt, options]);

  useEffect(() => {
    if (!rt.active) return;
    const step = steps[idx];
    if (!step) return;
    const path = router.getPath();
    if (typeof step.route === 'string' && !isRouteMatch(step.route, path)) router.push(step.route);
  }, [rt.active, idx, steps, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!rt.active) return;
      const step = steps[idx];
      if (!step) return;
      const el = await waitForTarget(step, { timeout: 8000, interval: 120 });
      if (cancelled) return;
      targetRef.current = el;
      try {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el?.scrollIntoView({ behavior: reduced ? 'auto' : (options?.wait?.scroll ?? 'smooth'), block: 'center', inline: 'center' });
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [rt.active, idx, steps, options]);

  useEffect(() => {
    if (!rt.active) return;
    const onClickCapture = (e) => {
      const target = targetRef.current;
      const uiRoot = uiRootRef.current;
      const insideUI = uiRoot && uiRoot.contains(e.target);
      const insideTarget = target && target.contains(e.target);
      if (!insideUI && !insideTarget) { e.preventDefault(); e.stopPropagation(); }
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

  useEffect(() => {
    if (!rt.active) return;
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || '';
      const editable = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target?.isContentEditable);
      if (editable) return;
      const nextKey = options?.navigation?.keybinds?.next ?? 'ArrowRight';
      const prevKey = options?.navigation?.keybinds?.prev ?? 'ArrowLeft';
      if (e.key === nextKey) { e.preventDefault(); goNext(); }
      else if (e.key === prevKey) { e.preventDefault(); goPrev(); }
      else if (options?.navigation?.escToClose !== false && e.key === 'Escape') { e.preventDefault(); handleClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rt.active, idx, steps, options]); // eslint-disable-line

  const goTo = (id) => setRt(s => ({ ...s, active: true, currentStepId: id, visited: Array.from(new Set([...(s.visited||[]), id])) }));
  const goNext = () => {
    const next = steps[idx + 1];
    if (next) goTo(next.id);
    else { onFinish?.(); setRt(s => ({ ...s, active: false, currentStepId: undefined })); }
  };
  const goPrev = () => { const prev = steps[idx - 1]; if (prev) goTo(prev.id); };
  const handleClose = () => { onCancel?.(); setRt(s => ({ ...s, active: false, currentStepId: undefined })); };

  if (!rt.active) return null;
  const step = steps[idx];
  if (!step) return null;

  const isModal = step?.modal?.enabled === true;
  const labels = {
    next: step?.labels?.next ?? options?.tooltip?.labels?.next ?? t('next'),
    prev: step?.labels?.prev ?? options?.tooltip?.labels?.prev ?? t('prev'),
    close: step?.labels?.close ?? options?.tooltip?.labels?.close ?? t('close')
  };

  return (
    <PortalMount>
      <div ref={uiRootRef} className={styles.uiRoot} aria-hidden="false">
        <Backdrop blur={options?.backdrop?.blur ?? 6} opacity={options?.backdrop?.opacity ?? 0.45} />
        {!isModal && (
          <Spotlight
            target={targetRef.current}
            padding={options?.spotlight?.padding ?? 10}
            borderRadius={options?.spotlight?.borderRadius ?? 12}
            shape={options?.spotlight?.shape ?? 'rounded'}
          />
        )}
        <Tooltip
          mode={isModal ? 'modal' : 'tooltip'}
          target={targetRef.current}
          width={options?.tooltip?.width ?? 360}
          placement={options?.tooltip?.placement ?? 'auto'}
          labels={labels}
          title={step?.title ?? options?.modal?.title ?? undefined}
          content={step.content}
          footer={step?.footer ?? options?.modal?.footer ?? undefined}
          onNext={goNext}
          onPrev={goPrev}
          onClose={handleClose}
        />
      </div>
    </PortalMount>
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
