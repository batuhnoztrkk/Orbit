import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import styles from './CtrlcanOrbit.module.css';

/**
 * Summary: Hedef elementi vurgulayan spotlight maskesi.
 * Preconditions: target mevcutsa rect hesaplanır.
 * Postconditions: Hedef çevresine padding uygulanır; şekil ayarlanır.
 * Side-effects: resize/scroll event dinleyicileri ekler.
 * @param {{ target: Element|null, shape?: 'rounded'|'circle'|'pill', padding?: number, borderRadius?: number }} props
 */
export function Spotlight({ target, shape = 'rounded', padding = 10, borderRadius = 12 }) {
  const [rect, setRect] = useState(null);
  const rafRef = useRef(0);

  const compute = () => {
    if (!target) { setRect(null); return; }
    const r = target.getBoundingClientRect();
    const x = Math.max(0, r.x - padding);
    const y = Math.max(0, r.y - padding);
    const w = r.width + padding * 2;
    const h = r.height + padding * 2;

    let radius = borderRadius;
    if (shape === 'circle') {
      const d = Math.max(w, h);
      setRect({ x: x + (w - d) / 2, y: y + (h - d) / 2, w: d, h: d, radius: d / 2 });
      return;
    }
    if (shape === 'pill') {
      radius = Math.min(w, h) / 2;
    }
    setRect({ x, y, w, h, radius });
  };

  useLayoutEffect(() => { compute(); /* initial */ }, [target, padding, borderRadius, shape]);

  useEffect(() => {
    const onScrollOrResize = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(compute);
    };
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!rect) return null;

  const style = {
    top: `${rect.y}px`,
    left: `${rect.x}px`,
    width: `${rect.w}px`,
    height: `${rect.h}px`,
    borderRadius: `${rect.radius}px`
  };

  return <div className={styles.spotlight} style={style} aria-hidden="true" />;
}
