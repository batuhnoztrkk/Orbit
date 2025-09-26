import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { Backdrop } from './Backdrop.jsx';
import { Spotlight } from './Spotlight.jsx';
import { Tooltip } from './Tooltip.jsx';
import { LiveAnnouncer } from './LiveAnnouncer.jsx';
import { PortalMount } from './PortalMount.jsx';
import styles from './CtrlcanOrbit.module.css';
import { stepsAtom, runtimeAtom, currentIndexAtom } from './atoms.js';
import { waitForTarget, waitForSelector, isRouteMatch } from './useStepRegistry.js';
import { createRouterBridge } from './RouterBridge.js';
import { createI18n } from '../../i18n/index.js';

function stepsSignature(arr) {
  const safe = (arr || []).map(s => ({
    id: s.id,
    route: s.route ?? null,
    selector: s.selector ?? null,
    dataTour: s.dataTour ?? null,
    className: s.className ?? null,
    modal: !!(s.modal && s.modal.enabled)
  }));
  return JSON.stringify(safe);
}

function OrbitInner({ steps: inSteps, options = {}, onFinish, onCancel }) {
  const [steps, setSteps] = useAtom(stepsAtom);
  const [rt, setRt] = useAtom(runtimeAtom);
  const idx = useAtomValue(currentIndexAtom);
  const router = useMemo(() => createRouterBridge(), []);
  const opts = useMemo(() => options, [JSON.stringify(options || {})]);

  const targetRef = useRef(null);
  const lastStepsSigRef = useRef('');
  const openerRef = useRef(null);
  const [path, setPath] = useState(router.getPath());

  const { t } = useMemo(() => createI18n(opts?.i18n), [opts?.i18n]);

  // steps set (yalnızca değiştiyse)
  useEffect(() => {
    const sig = stepsSignature(inSteps);
    if (sig !== lastStepsSigRef.current) {
      lastStepsSigRef.current = sig;
      setSteps(inSteps || []);
    }
  }, [inSteps, setSteps]);

  // route dinle
  useEffect(() => {
    const un = router.listen((p) => setPath(p));
    return () => un && un();
  }, [router]);

  // opener focus restore
  useEffect(() => {
    if (rt.active && !openerRef.current) openerRef.current = document.activeElement || null;
    if (!rt.active && openerRef.current) { try { openerRef.current.focus(); } catch {} openerRef.current = null; }
  }, [rt.active]);

  // resume
  useEffect(() => {
    const key = (opts?.storage?.userKey ? `${opts.storage.userKey}:` : '') + (opts?.storage?.key ?? 'ctrlcan:orbit:v1');
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (opts?.resumeOnLoad && saved?.currentStepId) {
        setRt(s => ({ ...s, active: true, currentStepId: saved.currentStepId, visited: saved.visited || [] }));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist
  useEffect(() => {
    const key = (opts?.storage?.userKey ? `${opts.storage.userKey}:` : '') + (opts?.storage?.key ?? 'ctrlcan:orbit:v1');
    try { localStorage.setItem(key, JSON.stringify(rt)); } catch {}
  }, [rt, opts?.storage?.userKey, opts?.storage?.key]);

  // helpers
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

  // ensure route before resolving target
  useEffect(() => {
    if (!rt.active) return;
    const step = steps[idx];
    if (!step) return;

    if (typeof step.route === 'string' && !isRouteMatch(step.route, router.getPath())) {
      // route'a git ve bekle
      router.push(step.route);
    }
  }, [rt.active, idx, steps, router]);

  // resolve target & onMissing behavior & advance.by
  useEffect(() => {
    let cancelled = false;
    let detach = null;

    (async () => {
      if (!rt.active) return;
      const step = steps[idx];
      if (!step) return;

      // route eşleşmesini bekle
      if (typeof step.route === 'string' && !isRouteMatch(step.route, router.getPath())) {
        await new Promise((res) => {
          const un = router.listen((p) => {
            if (isRouteMatch(step.route, p)) { un(); res(); }
          });
          // güvenlik: hard timeout
          setTimeout(() => { try { un(); } catch {} res(); }, 3000);
        });
      }

      targetRef.current = null;
      let el = null;

      // Modal-only step (hedefsiz)
      const hasSelector = !!(step.selector || step.dataTour || step.className);
      if (step?.modal?.enabled && !hasSelector) {
        // spotlight olmayacak; sadece modal görünsün
        targetRef.current = null;
      } else {
        // hedefi bekle
        el = await waitForTarget(step, { timeout: opts?.wait?.timeoutMs ?? 8000, interval: opts?.wait?.intervalMs ?? 120 });

        if (!el) {
          const beh = step?.onMissing?.behavior || 'skip';
          if (beh === 'fallbackSelector' && step?.onMissing?.fallbackSelector) {
            el = await waitForSelector(step.onMissing.fallbackSelector, { timeout: opts?.wait?.timeoutMs ?? 8000, interval: opts?.wait?.intervalMs ?? 120 });
          }
          if (!el) {
            if (beh === 'skip') { targetRef.current = null; if (!cancelled) goNext(); return; }
            if (beh === 'halt') { targetRef.current = null; return; }
          }
        }

        if (cancelled) return;
        targetRef.current = el || null;

        try {
          const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          el?.scrollIntoView({ behavior: reduced ? 'auto' : (opts?.wait?.scroll ?? 'smooth'), block: 'center', inline: 'center' });
        } catch {}

        // advance.by = clickTarget
        if (el && step?.advance?.by === 'clickTarget') {
          const onClick = (e) => { e.preventDefault(); e.stopPropagation(); goNext(); };
          el.addEventListener('click', onClick, true);
          detach = () => el.removeEventListener('click', onClick, true);
        }
      }
    })();

    return () => { cancelled = true; if (detach) detach(); };
  }, [rt.active, idx, steps, opts, goNext]);

  // click guard
  useEffect(() => {
    if (!rt.active) return;

    const onClickCapture = (e) => {
      // 1) Portal içindeki UI (tooltip/modal) serbest
      const portal = document.getElementById('ctrlcan-orbit-portal');
      if (portal && portal.contains(e.target)) return;
      // 2) Hedefin içinde serbest
      const target = targetRef.current;
      if (target && target.contains(e.target)) return;
      // 3) Dışarısı blok
      e.preventDefault(); e.stopPropagation();
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
  const step = steps[idx];
  if (!step) return null;

  const isModal = step?.modal?.enabled === true;
  const labels = {
    next: step?.labels?.next ?? opts?.tooltip?.labels?.next ?? t('next'),
    prev: step?.labels?.prev ?? opts?.tooltip?.labels?.prev ?? t('prev'),
    close: step?.labels?.close ?? opts?.tooltip?.labels?.close ?? t('close')
  };

  const total = steps.length;
  const stepNum = idx + 1;
  const liveMessage = `${t('title', 'Tour')}: ${stepNum}/${total}` + (step?.title ? ` — ${step.title}` : '');

  // Kontroller
  const hidePrevOnFirst = step?.controls?.showPrev ?? (opts?.controls?.hidePrevOnFirst !== false);
  const showPrev = !(hidePrevOnFirst && idx === 0);
  const showClose = step?.controls?.showClose ?? (opts?.controls?.showClose !== false ? true : false);

  // Modal görsel özelleştirme
  const modalStyle = {
    ...(opts?.modal?.style || {}),
    ...(step?.modal?.style || {}),
    backgroundImage: step?.modal?.backgroundImage
      ? `url(${step.modal.backgroundImage})`
      : (opts?.modal?.backgroundImage ? `url(${opts.modal.backgroundImage})` : undefined),
    width: step?.modal?.width ?? opts?.modal?.width,
    height: step?.modal?.height ?? opts?.modal?.height
  };
  const modalClassName = step?.modal?.className || opts?.modal?.className;

  return (
    <PortalMount>
      <div className={styles.uiRoot} aria-hidden="false">
        <LiveAnnouncer message={liveMessage} />
        {isModal
          ? (
            // Modal: arka plan blur+dim Backdrop, spotlight yok
            <>
              <div
                className={styles.backdrop}
                style={{
                  '--orbit-dim-opacity': String(opts?.backdrop?.opacity ?? 0.55),
                  WebkitBackdropFilter: `blur(${opts?.backdrop?.blur ?? 8}px)`,
                  backdropFilter: `blur(${opts?.backdrop?.blur ?? 8}px)`
                }}
              />
              <Tooltip
                mode="modal"
                target={null}
                labels={labels}
                title={step?.title ?? opts?.modal?.title ?? undefined}
                content={step.content}
                footer={step?.footer ?? opts?.modal?.footer ?? undefined}
                onNext={goNext}
                onPrev={goPrev}
                onClose={handleClose}
                showPrev={showPrev}
                showClose={showClose}
                stepIndex={idx}
                stepCount={total}
                modalStyle={modalStyle}
                modalClassName={modalClassName}
              />
            </>
          ) : (
            // Tooltip: spotlight blur+dim (delik), tooltip hedefe göre konumlanır
            <>
              {targetRef.current && (
                <Spotlight
                  target={targetRef.current}
                  padding={opts?.spotlight?.padding ?? 12}
                  borderRadius={opts?.spotlight?.borderRadius ?? 12}
                  shape={opts?.spotlight?.shape ?? 'rounded'}
                  blur={opts?.spotlight?.blur ?? 10}
                  dimOpacity={opts?.spotlight?.dimOpacity ?? 0.62}
                />
              )}
              {targetRef.current && (
                <Tooltip
                   mode="tooltip"
                   target={targetRef.current}
                   width={opts?.tooltip?.width ?? 360}
                   placement={opts?.tooltip?.placement ?? 'right'}
                   offset={opts?.tooltip?.offset ?? 16}
                />
              )}
            </>
          )
        }
      </div>
    </PortalMount>
  );
}

/** Public component */
export function CtrlcanOrbit(props) {
  return <OrbitInner {...props} />;
}
