import { useLayoutEffect, useRef, useState } from 'react';
import styles from './CtrlcanOrbit.module.css';

/**
 * Hedefi net bırakıp etrafı blur+dim yapan overlay.
 * İki katman kullanır: blur ve dim. Her ikisi de evenodd clip-path ile delik açar.
 */
export function Spotlight({
  target,
  padding = 12,
  borderRadius = 12,
  shape = 'rounded',           // 'rounded' | 'circle'
  blur = 8,
  dimOpacity = 0.6
}) {
  const [clip, setClip] = useState('none');
  const rafRef = useRef(0);

  const compute = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!target) { setClip('none'); return; } // hedefsiz: delik yok

    const r = target.getBoundingClientRect();
    const x = Math.max(0, r.left - padding);
    const y = Math.max(0, r.top - padding);
    const w = Math.min(vw - x, r.width + padding * 2);
    const h = Math.min(vh - y, r.height + padding * 2);

    const outer = `M0 0 H${vw} V${vh} H0 Z`;

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

    const inner =
      shape === 'circle'
        ? circlePath(r.left + r.width / 2, r.top + r.height / 2, Math.max(r.width, r.height) / 2 + padding)
        : roundedRectPath(x, y, w, h, borderRadius);

    // evenodd ile donut
    const clipPath = `path("${outer} ${inner}", "evenodd")`;
    setClip(clipPath);
  };

  useLayoutEffect(() => {
    compute();
    const onScroll = () => { cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(compute); };
    const onResize = onScroll;
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);

    let ro;
    if (target && 'ResizeObserver' in window) {
      ro = new ResizeObserver(onScroll);
      ro.observe(target);
    }
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafRef.current);
      if (ro) ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, padding, borderRadius, shape]);

  // iki katman: önce blur, sonra dim
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
      <div className={styles.spotlightBlur} style={blurStyle} aria-hidden="true" />
      <div className={styles.spotlightDim}  style={dimStyle}  aria-hidden="true" />
    </>
  );
}
