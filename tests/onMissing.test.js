import React from 'react';
import { render, screen } from '@testing-library/react';
import { CtrlcanOrbit } from '../src/components/ctrlcanOrbit/CtrlcanOrbit.jsx';

const KEY = 'test:onmissing';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/');
});

test('onMissing=skip jumps to next step', async () => {
  localStorage.setItem(KEY, JSON.stringify({ active: true, currentStepId: 's1', visited: [] }));

  render(
    <>
      <div data-tour="exists">OK</div>
      <CtrlcanOrbit
        steps={[
          { id: 's1', route: '/', dataTour: 'does_not_exist', content: 'S1', onMissing: { behavior: 'skip' } },
          { id: 's2', route: '/', dataTour: 'exists', content: 'S2' }
        ]}
        options={{ resumeOnLoad: true, storage: { key: KEY } }}
      />
    </>
  );

  expect(await screen.findByText('S2')).toBeInTheDocument();
});

test('onMissing=fallbackSelector uses fallback', async () => {
  localStorage.setItem(KEY, JSON.stringify({ active: true, currentStepId: 's1', visited: [] }));

  render(
    <>
      <div className="fallback-target">Fallback here</div>
      <CtrlcanOrbit
        steps={[
          {
            id: 's1',
            route: '/',
            dataTour: 'nope',
            content: 'S1',
            onMissing: { behavior: 'fallbackSelector', fallbackSelector: '.fallback-target' }
          }
        ]}
        options={{ resumeOnLoad: true, storage: { key: KEY } }}
      />
    </>
  );

  expect(await screen.findByText('S1')).toBeInTheDocument();
});
