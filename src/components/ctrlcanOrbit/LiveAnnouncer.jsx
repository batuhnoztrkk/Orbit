/**
 * Summary: Ekran okuyucuya kibar duyuru yapar (aria-live="polite").
 * @param {{ message:string }} props
 */
export function LiveAnnouncer({ message }) {
  const style = {
    position: 'absolute',
    width: '1px',
    height: '1px',
    margin: '-1px',
    padding: 0,
    border: 0,
    clip: 'rect(0 0 0 0)',
    overflow: 'hidden',
    whiteSpace: 'nowrap'
  };
  return (
    <div role="status" aria-live="polite" aria-atomic="true" style={style}>
      {message || ''}
    </div>
  );
}
