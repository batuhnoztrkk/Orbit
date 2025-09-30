import { useLayoutEffect, useRef, useState } from 'react';
import styles from './CtrlcanOrbit.module.css';

/**
 * Hedef(ler)i net bırakıp etrafı blur+dim yapan overlay.
 * Birden fazla "delik" destekler: target + extraTargets (örn: modal).
 */
export function Spotlight({
  target,
  extraTargets = [],           // ← yeni: ek delikler (Element[])
  padding = 12,
  borderRadius = 12,
  shape = 'rounded',            // 'rounded' | 'circle' (sadece target için)
  blur = 8,
  dimOpacity = 0.6,
  classNameBlur,
  classNameDim,
  extraPadding = 0,             // ← yeni: extraTargets için padding
  extraRadius = 12              // ← yeni: extraTargets için radius
}) {
  const [clip, setClip] = useState('');
  const rafRef = useRef(0);

  const compute = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const rects = [];

    const roundedRectPath = (x, y, w, h, rad) => {
      const rr = Math.max(0, Math.min(rad, Math.min(w, h) / 2));
      return [
        `M ${x + rr} ${y}`,
        `H ${x + w - rr}`,
        `A ${rr} ${rr} 0 0 1 ${x + w} ${y + rr}`,
        `V ${y + h - rr}`,
        `A ${rr} ${rr} 0 0 1 ${x + w - rr} ${y + h}`,
        `H ${x + rr}`,
        `A ${rr} ${rr} 0 0 1 ${x} ${y + h - rr}`,
        `V ${y + rr}`,
        `A ${rr} ${rr} 0 0 1 ${x + rr} ${y}`,
        'Z'
      ].join(' ');
    };

    const circlePath = (cx, cy, rad) => {
      const x0 = cx - rad, cy0 = cy;
      return [
        `M ${x0} ${cy0}`,
        `A ${rad} ${rad} 0 1 0 ${cx + rad} ${cy}`,
        `A ${rad} ${rad} 0 1 0 ${x0} ${cy0}`,
        'Z'
      ].join(' ');
    };

    // 1) Target deliği
    if (target) {
      const r = target.getBoundingClientRect();
      if (shape === 'circle') {
        rects.push(circlePath(r.left + r.width / 2, r.top + r.height / 2, Math.max(r.width, r.height) / 2 + padding));
      } else {
        const x = Math.max(0, r.left - padding);
        const y = Math.max(0, r.top - padding);
        const w = Math.min(vw - x, r.width + padding * 2);
        const h = Math.min(vh - y, r.height + padding * 2);
        rects.push(roundedRectPath(x, y, w, h, borderRadius));
      }
    }

    // 2) Ek deli̇kler (örn: modal)
    extraTargets.forEach((el) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = Math.max(0, r.left - extraPadding);
      const y = Math.max(0, r.top - extraPadding);
      const w = Math.min(vw - x, r.width + extraPadding * 2);
      const h = Math.min(vh - y, r.height + extraPadding * 2);
      rects.push(roundedRectPath(x, y, w, h, extraRadius));
    });

    if (rects.length === 0) { setClip(''); return; }

    const outer = `M0 0 H${vw} V${vh} H0 Z`;
    const inner = rects.join(' ');
    // evenodd: dış alan − (tüm delikler)
    const clipPath = `path("evenodd, ${outer} ${inner}")`;
    setClip(clipPath);
  };

  useLayoutEffect(() => {
    compute();
    const onScroll = () => { cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(compute); };
    const onResize = onScroll;
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    const obs = [];

    // hedef + extraTargets değiştikçe/yeniden ölçümlenince yeniden hesapla
    const all = [target, ...extraTargets].filter(Boolean);
    if ('ResizeObserver' in window && all.length) {
      const ro = new ResizeObserver(onScroll);
      all.forEach((el) => el && ro.observe(el));
      obs.push(ro);
    }

    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafRef.current);
      obs.forEach((ro) => ro.disconnect());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, extraTargets, padding, borderRadius, shape, extraPadding, extraRadius]);

  const blurStyle = {
    clipPath: clip, WebkitClipPath: clip,
    WebkitBackdropFilter: `blur(${blur}px)`,
    backdropFilter: `blur(${blur}px)`
  };
  const dimStyle  = {
    clipPath: clip, WebkitClipPath: clip,
    background: `rgba(0,0,0,${dimOpacity})`
  };

  return (
    <>
      <div
        className={[styles.spotlightBlur, classNameBlur].filter(Boolean).join(' ')}
        style={blurStyle}
        aria-hidden="true"
      />
      <div
        className={[styles.spotlightDim, classNameDim].filter(Boolean).join(' ')}
        style={dimStyle}
        aria-hidden="true"
      />
    </>
  );
}
