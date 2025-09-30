import { useEffect, useLayoutEffect, useRef, useId, forwardRef, useImperativeHandle } from 'react';
import styles from './CtrlcanOrbit.module.css';

/**
 * @param {{
 *  mode?: 'tooltip'|'modal',
 *  target?: Element|null,
 *  width?: number|string,
 *  placement?: 'top'|'right'|'bottom'|'left'|'auto',
 *  offset?: number,
 *  labels?: { next?:string, prev?:string, close?:string },
 *  title?: any,
 *  content?: any,
 *  footer?: any,
 *  onNext: ()=>void,
 *  onPrev: ()=>void,
 *  onClose: ()=>void,
 *  showPrev?: boolean,
 *  showClose?: boolean,
 *  stepIndex?: number,
 *  stepCount?: number,
 *  modalStyle?: React.CSSProperties,
 *  modalClassName?: string,
 *  tooltipClassName?: string,
 *  classNames?: { actions?:string, btnPrev?:string, btnNext?:string, btnClose?:string }
 * }} props
 */
export const Tooltip = forwardRef(function TooltipFn(props, ref) {
  const {
    // Genel
    mode = 'tooltip',
    target = null,

    // Tooltip yerleşim
    width = 360,
    placement = 'auto',
    offset = 12,

    // İçerik/etiketler
    labels = {},
    title,
    content,
    footer,

    // Aksiyonlar
    onNext,
    onPrev,
    onClose,
    showPrev = true,
    showClose = true,

    // Bilgi
    stepIndex,
    stepCount,

    // Stil/override
    modalStyle,
    modalClassName,
    tooltipClassName,
    classNames = {}
  } = props;

  const containerRef = useRef(null);
  const prevFocusRef = useRef(null);
  const titleId = useId();
  const bodyId = useId();

  // Dışa ref API
  useImperativeHandle(ref, () => ({
    getEl: () => containerRef.current
  }), []);

  // Tooltip konumlandırma
  useLayoutEffect(() => {
    if (mode !== 'tooltip') return;
    if (!target || !containerRef.current) return;
    const el = containerRef.current;

    const place = (side) => {
      const r = target.getBoundingClientRect();
      const vw = window.innerWidth, vh = window.innerHeight;
      const w = el.offsetWidth || (typeof width === 'number' ? width : 360);
      const h = el.offsetHeight || 0;
      let top = 0, left = 0;
      if (side === 'bottom') { top = r.bottom + offset; left = r.left + r.width / 2 - w / 2; }
      else if (side === 'top') { top = r.top - h - offset; left = r.left + r.width / 2 - w / 2; }
      else if (side === 'right') { top = r.top + r.height / 2 - h / 2; left = r.right + offset; }
      else { top = r.top + r.height / 2 - h / 2; left = r.left - w - offset; }
      top = Math.max(10, Math.min(top, vh - h - 10));
      left = Math.max(10, Math.min(left, vw - w - 10));
      el.style.top = `${top}px`;
      el.style.left = `${left}px`;
    };

    const tryAuto = () => {
      const sides = ['right', 'bottom', 'top', 'left'];
      for (const s of sides) place(s);
    };

    const position = () => {
      if (!target || !containerRef.current) return;
      if (placement === 'auto') tryAuto();
      else place(placement);
    };

    position();
    const raf = requestAnimationFrame(position);
    const onScroll = () => position();
    const onResize = () => position();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);

    let ro;
    if ('ResizeObserver' in window && target) {
      ro = new ResizeObserver(position);
      ro.observe(target);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      if (ro) ro.disconnect();
    };
  }, [mode, target, placement, offset, width]);

  // Focus trap + restore
  useEffect(() => {
    const container = containerRef.current;
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
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    container.addEventListener('keydown', onKeyDown);
    return () => {
      container.removeEventListener('keydown', onKeyDown);
      const prev = prevFocusRef.current;
      if (prev && prev.focus) prev.focus();
    };
  }, []);

  const BodyShell = ({ children }) => (
    <>
      <div className={mode === 'modal' ? styles.modalHeader : styles.tooltipHeader}>
        {title ? (
          <div id={titleId} className={mode === 'modal' ? styles.modalTitle : styles.tooltipTitle}>
            {title}
          </div>
        ) : null}
        {mode === 'modal' && stepIndex != null && stepCount != null && (
          <div className={styles.stepCounter} aria-label="Step counter">
            {stepIndex + 1}/{stepCount}
          </div>
        )}
      </div>
      <div id={bodyId} className={mode === 'modal' ? styles.modalBody : styles.tooltipBody}>
        {children}
      </div>
      {footer ? (
        <div className={mode === 'modal' ? styles.modalFooter : styles.tooltipFooter}>
          {footer}
        </div>
      ) : null}
    </>
  );

  const Buttons = () => (
    <div className={classNames.actions || styles.tooltipActions}>
      {showPrev && (
        <button type="button" className={classNames.btnPrev || styles.btn} onClick={onPrev}>
          {labels.prev ?? 'Prev'}
        </button>
      )}
      <button type="button" className={classNames.btnNext || styles.btn} onClick={onNext}>
        {labels.next ?? 'Next'}
      </button>
      {showClose && (
        <button
          type="button"
          className={classNames.btnClose || styles.btnGhost}
          onClick={onClose}
          aria-label="Close"
        >
          {labels.close ?? 'Close'}
        </button>
      )}
    </div>
  );

  if (mode === 'modal') {
    return (
      <div
        className={styles.modalOverlay}
        aria-modal="true"
        role="dialog"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={bodyId}
      >
        <div ref={containerRef} className={`${styles.modal} ${modalClassName || ''}`} style={modalStyle}>
          <BodyShell>{content}</BodyShell>
          {!footer && <Buttons />}
        </div>
      </div>
    );
  }

  // string ise %/vw/vh destekli
  const styleWidth = typeof width === 'number' ? { width } : { width };
  return (
    <div
      ref={containerRef}
      role="tooltip"
      className={`${styles.tooltip} ${tooltipClassName || ''}`}
      style={styleWidth}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={bodyId}
      aria-live="polite"
    >
      <BodyShell>{content}</BodyShell>
      {!footer && <Buttons />}
    </div>
  );
});
