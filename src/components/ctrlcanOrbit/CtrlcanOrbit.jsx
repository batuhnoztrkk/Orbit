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

// ---- Safe merge helpers ----
const REACT_ELEMENT = typeof Symbol === 'function' ? Symbol.for('react.element') : null;

// Sadece saf (plain) obje mi?
function isPlainObject(v) {
  if (!v || typeof v !== 'object') return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

// React element mi? (content, title vs.)
function isReactElement(v) {
  return !!(v && typeof v === 'object' && v.$$typeof && REACT_ELEMENT && v.$$typeof === REACT_ELEMENT);
}

// Derin birleştirme yapılacak, beyaz liste anahtarlar:
const DEEP_KEYS = new Set([
  'tooltip', 'spotlight', 'backdrop', 'controls',
  'modal', 'wait', 'navigation', 'classNames'
]);

// Sadece plain objelerde, döngüsüz derin birleştirme
function mergePlain(a = {}, b = {}) {
  const out = { ...a };
  for (const k of Object.keys(b)) {
    const bv = b[k];
    const av = out[k];
    if (isPlainObject(av) && isPlainObject(bv)) {
      out[k] = mergePlain(av, bv);
    } else {
      out[k] = bv;
    }
  }
  return out;
}

/**
 * options + step → config
 * - Sadece DEEP_KEYS için derin birleştir
 * - Diğer tüm alanları doğrudan override et
 * - React element, DOM node, function vb. asla derin birleştirme
 */
function mergeConfigs(options = {}, step = {}) {
  const out = { ...options };
  for (const k of Object.keys(step)) {
    const ov = out[k];
    const sv = step[k];

    if (DEEP_KEYS.has(k) && isPlainObject(ov) && isPlainObject(sv)) {
      out[k] = mergePlain(ov, sv);
    } else {
      out[k] = sv; // direkt override
    }
  }
  return out;
}
function OrbitInner({ steps: inSteps, options = {}, onFinish, onCancel }) {
  const [steps, setSteps] = useAtom(stepsAtom);
  const [rt, setRt] = useAtom(runtimeAtom);
  const idx = useAtomValue(currentIndexAtom);
  const router = useMemo(() => createRouterBridge(), []);
  const targetRef = useRef(null);
  const openerRef = useRef(null);
  const [path, setPath] = useState(router.getPath());
  const modalRef = useRef(null);

  // steps & route
  useEffect(() => setSteps(inSteps || []), [inSteps, setSteps]);
  useEffect(() => {
    const un = router.listen((p) => setPath(p));
    return () => un && un();
  }, [router]);

  // opener focus restore
  useEffect(() => {
    if (rt.active && !openerRef.current) openerRef.current = document.activeElement || null;
    if (!rt.active && openerRef.current) { try { openerRef.current.focus(); } catch {} openerRef.current = null; }
  }, [rt.active]);

  // persist resume (sadece örnek)
  useEffect(() => {
    const key = (options?.storage?.userKey ? `${options.storage.userKey}:` : '') + (options?.storage?.key ?? 'ctrlcan:orbit:v1');
    try {
      if (options?.resumeOnLoad) {
        const raw = localStorage.getItem(key);
        const saved = raw ? JSON.parse(raw) : null;
        if (saved?.currentStepId) setRt(s => ({ ...s, active: true, currentStepId: saved.currentStepId, visited: saved.visited || [] }));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const key = (options?.storage?.userKey ? `${options.storage.userKey}:` : '') + (options?.storage?.key ?? 'ctrlcan:orbit:v1');
    try { localStorage.setItem(key, JSON.stringify(rt)); } catch {}
  }, [rt, options?.storage?.userKey, options?.storage?.key]);

  // nav helpers
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

  // route ensure
  useEffect(() => {
    if (!rt.active) return;
    const step = steps[idx];
    if (!step) return;
    if (typeof step.route === 'string' && !isRouteMatch(step.route, router.getPath())) {
      router.push(step.route);
    }
  }, [rt.active, idx, steps, router]);

  // target resolve + advance.by
  useEffect(() => {
    let cancelled = false;
    let detach = null;

    (async () => {
      if (!rt.active) return;
      const step = steps[idx];
      if (!step) return;

      // adım-bazlı ayarları options ile birleştir
      const cfg = mergeConfigs(options, step);

      // route bekle
      if (typeof step.route === 'string' && !isRouteMatch(step.route, router.getPath())) {
        await new Promise((res) => {
          const un = router.listen((p) => {
            if (isRouteMatch(step.route, p)) { un(); res(); }
          });
          setTimeout(() => { try { un(); } catch {} res(); }, 3000);
        });
      }

      targetRef.current = null;
      let el = null;

      // highlightOnly ise hedef bulunabiliyorsa spotlight, UI yok
      const hasSelector = !!(step.selector || step.dataTour || step.className);
      if (cfg.highlightOnly === true && hasSelector) {
        el = await waitForTarget(step, { timeout: cfg?.wait?.timeoutMs ?? 8000, interval: cfg?.wait?.intervalMs ?? 120 });
        targetRef.current = el || null;
        return;
      }

      // Modal-only adım (hedefsiz)
      if (cfg?.modal?.enabled && !hasSelector) {
        targetRef.current = null;
      } else {
        el = await waitForTarget(step, { timeout: cfg?.wait?.timeoutMs ?? 8000, interval: cfg?.wait?.intervalMs ?? 120 });
        if (!el) {
          const beh = step?.onMissing?.behavior || 'skip';
          if (beh === 'fallbackSelector' && step?.onMissing?.fallbackSelector) {
            el = await waitForSelector(step.onMissing.fallbackSelector, { timeout: cfg?.wait?.timeoutMs ?? 8000, interval: cfg?.wait?.intervalMs ?? 120 });
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
          el?.scrollIntoView({ behavior: reduced ? 'auto' : (cfg?.wait?.scroll ?? 'smooth'), block: 'center', inline: 'center' });
        } catch {}

        if (el && step?.advance?.by === 'clickTarget') {
          const onClick = (e) => { e.preventDefault(); e.stopPropagation(); goNext(); };
          el.addEventListener('click', onClick, true);
          detach = () => el.removeEventListener('click', onClick, true);
        }
      }
    })();

    return () => { cancelled = true; if (detach) detach(); };
  }, [rt.active, idx, steps, options, goNext]);

  // dışarıyı tıklama engeli (UI ve hedef hariç)
  useEffect(() => {
    if (!rt.active) return;
    const onClickCapture = (e) => {
      const portal = document.getElementById('ctrlcan-orbit-portal');
      if (portal && portal.contains(e.target)) return;
      const target = targetRef.current;
      if (target && target.contains(e.target)) return;
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

  // adım-bazlı config (options + step override)
  const cfg = mergeConfigs(options, step);

  // buton yazıları (i18n yoksa düz bırak)
  const labels = {
    next: cfg?.tooltip?.labels?.next ?? 'Next',
    prev: cfg?.tooltip?.labels?.prev ?? 'Prev',
    close: cfg?.tooltip?.labels?.close ?? 'Close'
  };

  const total = steps.length;
  const liveMessage = `Tour: ${idx + 1}/${total}` + (step?.title ? ` — ${step.title}` : '');

  // Kontroller (adım-bazlı)
  const hidePrevOnFirst = cfg?.controls?.hidePrevOnFirst !== false;
  const showPrev = !(hidePrevOnFirst && idx === 0);
  const showClose = cfg?.controls?.showClose !== false;

  // classNames (global + step override)
  const cn = mergePlain(options?.classNames || {}, step?.classNames || {});
  // spotlight (highlightOnly dahil)
  const spotlightProps = {
    target: targetRef.current,
    padding: cfg?.spotlight?.padding ?? 12,
    borderRadius: cfg?.spotlight?.borderRadius ?? 12,
    shape: cfg?.spotlight?.shape ?? 'rounded',
    blur: cfg?.spotlight?.blur ?? 10,
    dimOpacity: cfg?.spotlight?.dimOpacity ?? 0.62,
    classNameBlur: cn.spotlightBlur,
    classNameDim: cn.spotlightDim
  };

  // highlightOnly → Sadece spotlight
  if (cfg.highlightOnly === true) {
    return (
      <PortalMount>
        <div className={cn.root || styles.uiRoot} aria-hidden="false">
          <LiveAnnouncer message={liveMessage} />
          <Spotlight {...spotlightProps} />
        </div>
      </PortalMount>
    );
  }
  
  const highlightProps = {
    target: targetRef.current,
    padding: cfg?.spotlight?.padding ?? 12,
    borderRadius: cfg?.spotlight?.borderRadius ?? 12,
    shape: cfg?.spotlight?.shape ?? 'rounded',
  };

  // === HighlightOnly ise (değişmedi) ===
  if (cfg.highlightOnly === true) {
    return (
      <PortalMount>
        <div className={cn.root || styles.uiRoot}>
          <LiveAnnouncer message={liveMessage} />
          <Spotlight
            {...highlightProps}
            // blur/dim: spotlight değerleri
            blur={cfg?.spotlight?.blur ?? 10}
            dimOpacity={cfg?.spotlight?.dimOpacity ?? 0.62}
            classNameBlur={cn.spotlightBlur}
            classNameDim={cn.spotlightDim}
          />
        </div>
      </PortalMount>
    );
  }

  const isModal = !!cfg?.modal?.enabled;

  const modalStyle = {
    ...(cfg?.modal?.style || {}),
    backgroundImage: cfg?.modal?.backgroundImage ? `url(${cfg.modal.backgroundImage})` : undefined,
    width: cfg?.modal?.width,
    height: cfg?.modal?.height
  };

  const modalEl = modalRef.current?.getEl?.() ?? modalRef.current;
  return (
    <PortalMount>
      <div className={cn.root || styles.uiRoot}>
        <LiveAnnouncer message={liveMessage} />

        {isModal ? (
          <>
            {/* Artık full-screen backdrop yerine Spotlight ile MASKE kullanıyoruz */}
            <Spotlight
              {...highlightProps}
              extraTargets={[modalEl].filter(Boolean)}
              blur={cfg?.backdrop?.blur ?? 10}
              dimOpacity={cfg?.backdrop?.opacity ?? 0.55}
              classNameBlur={cn.spotlightBlur}
              classNameDim={cn.spotlightDim}
              extraPadding={cfg?.modal?.maskPadding ?? 0}
              extraRadius={cfg?.modal?.maskRadius ?? 12}
            />

            <Tooltip
              ref={modalRef}             // ← modal elem ref
              mode="modal"
              target={null}
              labels={labels}
              title={cfg?.title}
              content={cfg?.content}
              footer={cfg?.footer}
              onNext={goNext}
              onPrev={goPrev}
              onClose={handleClose}
              showPrev={showPrev}
              showClose={showClose}
              stepIndex={idx}
              stepCount={total}
              modalStyle={modalStyle}
              modalClassName={cn.modal}
              classNames={{
                actions: cn.actions,
                btnPrev: cn.btnPrev,
                btnNext: cn.btnNext,
                btnClose: cn.btnClose
              }}
            />
          </>
        ) : (
          <>
            {/* Tooltip modunda: dış alan = hedef dışı blur */}
            <Spotlight
              {...highlightProps}
              blur={cfg?.spotlight?.blur ?? 10}
              dimOpacity={cfg?.spotlight?.dimOpacity ?? 0.62}
              classNameBlur={cn.spotlightBlur}
              classNameDim={cn.spotlightDim}
            />
            <Tooltip
              mode="tooltip"
              target={targetRef.current}
              width={cfg?.tooltip?.width ?? 360}
              placement={cfg?.tooltip?.placement ?? 'right'}
              offset={cfg?.tooltip?.offset ?? 16}
              labels={labels}
              title={cfg?.title}
              content={cfg?.content}
              footer={cfg?.footer}
              onNext={goNext}
              onPrev={goPrev}
              onClose={handleClose}
              showPrev={showPrev}
              showClose={showClose}
              stepIndex={idx}
              stepCount={total}
              tooltipClassName={cn.tooltip}
              classNames={{
                actions: cn.actions,
                btnPrev: cn.btnPrev,
                btnNext: cn.btnNext,
                btnClose: cn.btnClose
              }}
            />
          </>
        )}
      </div>
    </PortalMount>
  );
}

export function CtrlcanOrbit(props) {
  return <OrbitInner {...props} />;
}
