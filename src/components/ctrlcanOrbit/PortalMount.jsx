import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

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
