import { Provider as JotaiProvider } from 'jotai';

/**
 * Summary: Orbit bileşen ağacı için Jotai Provider sarmalayıcısı.
 * Preconditions: React 18+, Jotai peer kurulu.
 * Postconditions: Alt bileşenler jotai atomlarına erişebilir.
 * Side-effects: Yok.
 * @param {{ children:any }} props
 * @returns {JSX.Element}
 * @example
 * <OrbitProvider><App/></OrbitProvider>
 */
export function OrbitProvider({ children }) {
  return <JotaiProvider>{children}</JotaiProvider>;
}