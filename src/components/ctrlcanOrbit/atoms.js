import { atom } from 'jotai';

export const stepsAtom = atom([]);
export const optionsAtom = atom({
  storage: { key: 'ctrlcan:orbit:v1', userKey: undefined },
  backdrop: { blur: 6, opacity: 0.45 },
  resumeOnLoad: true,
  i18n: { locale: undefined, messages: undefined }, // NEW
  tooltip: { width: 360, placement: 'auto', labels: undefined }, // labels i18n’den beslenecek
  modal: { enabled: false } // genişleteceğiz
});
export const runtimeAtom = atom({ active: false, currentStepId: undefined, visited: [] });
export const currentIndexAtom = atom((get) => {
  const rt = get(runtimeAtom);
  const steps = get(stepsAtom);
  if (!rt.active) return -1;
  if (!rt.currentStepId) return 0;
  const i = steps.findIndex(s => s.id === rt.currentStepId);
  return i >= 0 ? i : 0;
});
