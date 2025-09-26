import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { OrbitProvider } from './TourContext.js';
import { Backdrop } from './Backdrop.jsx';
import { Spotlight } from './Spotlight.jsx';
import { Tooltip } from './Tooltip.jsx';
import { LiveAnnouncer } from './LiveAnnouncer.jsx';
import { PortalMount } from './PortalMount.jsx';
import styles from './CtrlcanOrbit.module.css';
import { stepsAtom, optionsAtom, runtimeAtom, currentIndexAtom } from './atoms.js';
import { waitForTarget, waitForSelector, isRouteMatch } from './useStepRegistry.js';
import { createRouterBridge } from './RouterBridge.js';
import { createI18n } from '../../i18n/index.js';

function OrbitInner({ steps: inSteps, options = {}, onFinish, onCancel }) {
  const [steps, setSteps] = useAtom(stepsAtom);
  const [rt, setRt] = useAtom(runtimeAtom);
  const setOpts = useSetAtom(optionsAtom);
  const idx = useAtomValue(currentIndexAtom);
  const router = useMemo(() => createRouterBridge(), []);
  const targetRef = useRef(null);
  const uiRootRef = useRef(null);
  const openerRef = useRef(null);              // NEW
  const [path, setPath] = useState(router.getPath()); // NEW

  useEffect(() => { setSteps(inSteps || []); }, [inSteps, setSteps]);
  useEffect(() => { setOpts(prev => ({ ...prev, ...options })); }, [options, setOpts]);
  const { t } = useMemo(() => createI18n(options?.i18n), [options?.i18n]);

  // track SPA navigation
  useEffect(() => {
    const un = router.listen((p) => setPath(p));
    return () => un && un();
  }, [router]);

  // opener focus: aktifleştiği an kaydet, kapanınca geri ver
  useEffect(() => {
    if (rt.active && !openerRef.current) openerRef.current = document.activeElement || null;
    if (!rt.active && openerRef.current) {
      const el = openerRef.current; openerRef.current = null;
      try { el?.focus && el.focus(); } catch {}
    }
  }, [rt.active]);

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

  // navigation helpers (memoized)
  const goTo = useCallback((id) => {
    setRt(s => ({ ...s, active: true, currentStepId: id, visited: Array.from(new Set([...(s.visited||[]), id])) }));
  }, [setRt]);

  const goNext = useCallback(() => {
    const next = steps[idx + 1];
    if (next) goTo(next.id);
    else { onFinish?.(); setRt(s => ({ ...s, active: false, currentStepId: undefined })); }
  }, [steps, idx, goTo, onFinish, setRt]);

  const goPrev = useCallback(() => {
    const prev = steps[idx - 1];
    if (prev) goTo(prev.id);
  }, [steps, idx, goTo]);

  const handleClose = useCallback(() => {
    onCancel?.(); setRt(s => ({ ...s, active: false, currentStepId: undefined }));
  }, [onCancel, setRt]);

  // ensure route for current step
  useEffect(() => {
    if (!rt.active) return;
    const step = steps[idx];
    if (!step) return;
    const cur = router.getPath();
    if (typeof step.route === 'string' && !isRouteMatch(step.route, cur)) router.push(step.route);
  }, [rt.active, idx, steps, router, path]);

  // resolve target & onMissing behavior & advance.by
  useEffect(() => {
    let cancelled = false;
    let detach = null;

    (async () => {
      if (!rt.active) return;
      const step = steps[idx];
      if (!step) return;

      // try primary target
      let el = await waitForTarget(step, { timeout: options?.wait?.timeoutMs ?? 8000, interval: options?.wait?.intervalMs ?? 120 });

      if (!el) {
        const beh = step?.onMissing?.behavior || 'skip';
        if (beh === 'fallbackSelector' && step?.onMissing?.fallbackSelector) {
          el = await waitForSelector(step.onMissing.fallbackSelector, { timeout: options?.wait?.timeoutMs ?? 8000, interval: options?.wait?.intervalMs ?? 120 });
        }
        if (!el) {
          if (beh === 'skip') { if (!cancelled) goNext(); return; }
          if (beh === 'halt') { targetRef.current = null; return; }
        }
      }

      if (cancelled) return;
      targetRef.current = el || null;

      // scroll into view
      try {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el?.scrollIntoView({ behavior: reduced ? 'auto' : (options?.wait?.scroll ?? 'smooth'), block: 'center', inline: 'center' });
      } catch {}

      // advance.by = clickTarget
      if (el && step?.advance?.by === 'clickTarget') {
        const onClick = (e) => { e.preventDefault(); e.stopPropagation(); goNext(); };
        el.addEventListener('click', onClick, true);
        detach = () => el.removeEventListener('click', onClick, true);
      }
    })();

    return () => { cancelled = true; if (detach) detach(); };
  }, [rt.active, idx, steps, options, goNext]);

  // click guard: sadece target veya UI portal tıklanabilir
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

  // keyboard
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
  }, [rt.active, goNext, goPrev, handleClose, options]);

  if (!rt.active) return null;
  const step = steps[idx];
  if (!step) return null;

  const isModal = step?.modal?.enabled === true;
  const labels = {
    next: step?.labels?.next ?? options?.tooltip?.labels?.next ?? t('next'),
    prev: step?.labels?.prev ?? options?.tooltip?.labels?.prev ?? t('prev'),
    close: step?.labels?.close ?? options?.tooltip?.labels?.close ?? t('close')
  };

  const liveMessage = `${step?.title ? step.title + ' — ' : ''}${typeof step?.content === 'string' ? step.content : ''}`;

  return (
    <PortalMount>
      <div ref={uiRootRef} className={styles.uiRoot} aria-hidden="false">
        <LiveAnnouncer message={liveMessage} />
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