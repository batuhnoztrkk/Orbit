import styles from './CtrlcanOrbit.module.css';

/**
 * Modal modunda arka planı karartan/blur'layan overlay.
 */
export function Backdrop({ blur = 8, opacity = 0.55, backgroundImage }) {
  const style = {
    '--orbit-dim-opacity': String(opacity),
    WebkitBackdropFilter: `blur(${blur}px)`,
    backdropFilter: `blur(${blur}px)`,
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
    backgroundSize: backgroundImage ? 'cover' : undefined,
    backgroundPosition: backgroundImage ? 'center' : undefined
  };
  return <div className={styles.backdrop} style={style} />;
}
