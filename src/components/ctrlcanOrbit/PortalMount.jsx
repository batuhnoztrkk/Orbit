import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// === DEBUG HEADER ===
const DBG = (...a) => { if (window.__ORBIT_DEBUG) console.log('[orbit]', ...a); };
// =====================

/**
 * Summary: Overlay UI için portal kökü oluşturur/kullanır.
 */
export function PortalMount({ children }) {
  const [node, setNode] = useState(null);

  useEffect(() => {
    let mount = document.getElementById('ctrlcan-orbit-portal');
    if (!mount) {
      mount = document.createElement('div');
      mount.id = 'ctrlcan-orbit-portal';
      document.body.appendChild(mount);
    }
    setNode(mount);
    return () => {};
  }, []);

  return node ? createPortal(children, node) : null;
}
