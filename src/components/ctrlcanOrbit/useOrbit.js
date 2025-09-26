import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { runtimeAtom, stepsAtom } from './atoms.js';

/**
 * Summary: Programatik kontrol API'si.
 * @returns {{ start:(id?:string)=>void, stop:()=>void, next:()=>void, prev:()=>void, goTo:(id:string)=>void, getState:()=>any }}
 */
export function useOrbit() {
  const [rt, setRt] = useAtom(runtimeAtom);
  const steps = useAtomValue(stepsAtom);

  const start = (id) => setRt(s => ({ ...s, active: true, currentStepId: id ?? (steps[0]?.id) }));
  const stop  = () => setRt(s => ({ ...s, active: false, currentStepId: undefined }));
  const goTo  = (id) => setRt(s => ({ ...s, active: true, currentStepId: id, visited: Array.from(new Set([...(s.visited||[]), id])) }));

  const next = () => {
    if (!rt.active) return;
    const idx = steps.findIndex(s => s.id === rt.currentStepId);
    const nextStep = steps[idx + 1];
    if (nextStep) goTo(nextStep.id);
    else stop();
  };

  const prev = () => {
    if (!rt.active) return;
    const idx = steps.findIndex(s => s.id === rt.currentStepId);
    const prevStep = steps[idx - 1];
    if (prevStep) goTo(prevStep.id);
  };

  const getState = () => rt;

  return { start, stop, next, prev, goTo, getState };
}
