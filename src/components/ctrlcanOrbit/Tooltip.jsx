import { useEffect, useLayoutEffect, useRef } from 'react';
import styles from './CtrlcanOrbit.module.css';

/**
 * Summary: Hedefe tutunan tooltip ya da merkezde modal.
 * @param {{
 *  mode: 'tooltip'|'modal',
 *  target: Element|null,
 *  width?: number,
 *  placement?: 'top'|'right'|'bottom'|'left'|'auto',
 *  labels?: { next:string, prev:string, close:string },
 *  content: any,
 *  onNext: ()=>void,
 *  onPrev: ()=>void,
 *  onClose: ()=>void
 * }} props
 */
export function Tooltip({
  mode = 'tooltip',
  target,
  width = 360,
  placement = 'auto',
  labels = { next: 'Next', prev: 'Back', close: 'Close' },
  content,
  onNext,
  onPrev,
  onClose
}) {
  const ref = useRef(null);
  const prevFocusRef = useRef(null);

  // position tooltip
  useLayoutEffect(() => {
    if (mode !== 'tooltip') return;
    if (!target || !ref.current) return;

    const r = target.getBoundingClientRect();
    const el = ref.current;
    const gap = 10;
    const vw = window.innerWidth, vh = window.innerHeight;

    const place = (side) => {
      let top = 0, left = 0;
      if (side === 'bottom') {
        top = r.bottom + gap;
        left = r.left + r.width / 2 - el.offsetWidth / 2;
      } else if (side === 'top') {
        top = r.top - el.offsetHeight - gap;
        left = r.left + r.width / 2 - el.offsetWidth / 2;
      } else if (side === 'right') {
        top = r.top + r.height / 2 - el.offsetHeight / 2;
        left = r.right + gap;
      } else {
        top = r.top + r.height / 2 - el.offsetHeight / 2;
        left = r.left - el.offsetWidth - gap;
      }
      // clamp
      top = Math.max(10, Math.min(top, vh - el.offsetHeight - 10));
      left = Math.max(10, Math.min(left, vw - el.offsetWidth - 10));
      el.style.top = `${top}px`;
      el.style.left = `${left}px`;
    };

    const tryAuto = () => {
      // basit auto: öncelik bottom→top→right→left
      const sides = ['bottom', 'top', 'right', 'left'];
      for (const s of sides) {
        place(s);
        const { top, left } = el.getBoundingClientRect();
        if (top >= 0 && left >= 0) return;
      }
    };

    if (placement === 'auto') tryAuto();
    else place(placement);
  }, [mode, target, placement]);

  // focus trap (modal/tooltip UI içinde)
  useEffect(() => {
    const container = mode === 'modal' ? ref.current : ref.current;
    if (!container) return;

    prevFocusRef.current = document.activeElement;
    container.setAttribute('tabindex', '-1');
    container.focus();

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const focusables = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const list = Array.from(focusables);
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };

    container.addEventListener('keydown', onKeyDown);
    return () => {
      container.removeEventListener('keydown', onKeyDown);
      const prev = prevFocusRef.current;
      if (prev && prev.focus) prev.focus();
    };
  }, [mode]);

  if (mode === 'modal') {
    return (
      <div className={styles.modalOverlay} aria-modal="true" role="dialog" aria-label="Tour dialog">
        <div ref={ref} className={styles.modal}>
          <div>{content}</div>
          <div className={styles.tooltipActions}>
            <button type="button" className={styles.btn} onClick={onPrev}>{labels.prev}</button>
            <button type="button" className={styles.btn} onClick={onNext}>{labels.next}</button>
            <button type="button" className={styles.btnGhost} onClick={onClose} aria-label="Close">{labels.close}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role="tooltip"
      className={styles.tooltip}
      style={{ width }}
      aria-live="polite"
    >
      <div>{content}</div>
      <div className={styles.tooltipActions}>
        <button type="button" className={styles.btn} onClick={onPrev}>{labels.prev}</button>
        <button type="button" className={styles.btn} onClick={onNext}>{labels.next}</button>
        <button type="button" className={styles.btnGhost} onClick={onClose} aria-label="Close">{labels.close}</button>
      </div>
    </div>
  );
}
