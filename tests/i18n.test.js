import React from 'react';
import { render, screen } from '@testing-library/react';
import { CtrlcanOrbit } from '../src/components/ctrlcanOrbit/CtrlcanOrbit.jsx';

const KEY = 'test:i18n';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/');
});

test('i18n fallback to de labels', async () => {
  // resume ile direkt aktif başlat
  localStorage.setItem(`${KEY}`, JSON.stringify({ active: true, currentStepId: 's1', visited: [] }));

  render(
    <CtrlcanOrbit
      steps={[{ id: 's1', route: '/', content: 'Hallo' }]}
      options={{ i18n: { locale: 'de' }, resumeOnLoad: true, storage: { key: KEY } }}
    />
  );

  // buton metinleri Almanca
  expect(await screen.findByRole('button', { name: 'Weiter' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Zurück' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Schließen' })).toBeInTheDocument();
});
