import { atom } from 'jotai';

/**
 * @typedef {{ id:string, route?:string|RegExp, selector?:string, dataTour?:string, className?:string, content?:any }} OrbitStep
 * @typedef {{ active:boolean, currentStepId?:string, visited:string[] }} OrbitRuntime
 * @typedef {{ key:string, userKey?:string }} StorageCfg
 * @typedef {{ blur:number, opacity:number }} BackdropCfg
 * @typedef {{ storage:StorageCfg, backdrop:BackdropCfg, resumeOnLoad:boolean }} OrbitOptions
 */

export const stepsAtom = atom(
  /** @type {OrbitStep[]} */([])
);

export const optionsAtom = atom(
  /** @type {OrbitOptions} */({
    storage: { key: 'ctrlcan:orbit:v1', userKey: undefined },
    backdrop: { blur: 6, opacity: 0.45 },
    resumeOnLoad: true
  })
);

export const runtimeAtom = atom(
  /** @type {OrbitRuntime} */({ active: false, currentStepId: undefined, visited: [] })
);

export const currentIndexAtom = atom((get) => {
  const rt = get(runtimeAtom);
  const steps = get(stepsAtom);
  if (!rt.active) return -1;
  if (!rt.currentStepId) return 0;
  const i = steps.findIndex(s => s.id === rt.currentStepId);
  return i >= 0 ? i : 0;
});
