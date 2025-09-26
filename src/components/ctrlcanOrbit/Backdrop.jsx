import styles from './CtrlcanOrbit.module.css';

/**
 * Summary: Blur + koyulaştırma katmanı.
 * @param {{ blur?:number, opacity?:number }} props
 */
export function Backdrop({ blur = 6, opacity = 0.45 }) {
  const style = {
    backdropFilter: `blur(${blur}px)`,
    opacity
  };
  return <div className={styles.backdrop} style={style} aria-hidden="true" />;
}
