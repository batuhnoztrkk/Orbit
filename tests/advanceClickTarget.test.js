import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CtrlcanOrbit } from '../src/components/ctrlcanOrbit/CtrlcanOrbit.jsx';

const KEY = 'test:advance';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/');
});

test('clicking target advances when advance.by=clickTarget', async () => {
  localStorage.setItem(KEY, JSON.stringify({ active: true, currentStepId: 's1', visited: [] }));

  render(
    <>
      <button data-tour="clickme">Click me</button>
      <div data-tour="second">Two</div>
      <CtrlcanOrbit
        steps={[
          { id: 's1', route: '/', dataTour: 'clickme', content: 'First', advance: { by: 'clickTarget' } },
          { id: 's2', route: '/', dataTour: 'second', content: 'Second' }
        ]}
        options={{ resumeOnLoad: true, storage: { key: KEY } }}
      />
    </>
  );

  expect(await screen.findByText('First')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Click me'));
  expect(await screen.findByText('Second')).toBeInTheDocument();
});
