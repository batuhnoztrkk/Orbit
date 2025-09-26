import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CtrlcanOrbit } from '../src/components/ctrlcanOrbit/CtrlcanOrbit.jsx';

const KEY = 'test:guard';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/');
});

test('click outside target/UI is prevented', async () => {
  localStorage.setItem(KEY, JSON.stringify({ active: true, currentStepId: 's1', visited: [] }));
  const outsideSpy = jest.fn();

  render(
    <>
      <div id="outside" onClick={outsideSpy}>Outside</div>
      <div data-tour="only">Inside</div>
      <CtrlcanOrbit
        steps={[{ id: 's1', route: '/', dataTour: 'only', content: 'S1' }]}
        options={{ resumeOnLoad: true, storage: { key: KEY } }}
      />
    </>
  );

  await screen.findByText('S1');

  fireEvent.click(document.getElementById('outside'));
  expect(outsideSpy).not.toHaveBeenCalled();
});
