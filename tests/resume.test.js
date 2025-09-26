import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { CtrlcanOrbit } from '../src/components/ctrlcanOrbit/CtrlcanOrbit.jsx';

const KEY = 'test:resume';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/');
});

test('resumes at step 2 and navigates to its route', async () => {
  localStorage.setItem(KEY, JSON.stringify({ active: true, currentStepId: 's2', visited: ['s1','s2'] }));

  render(
    <>
      <div data-tour="sales_metric">Dashboard Metric</div>
      <div data-tour="product_list">Products</div>
      <CtrlcanOrbit
        steps={[
          { id: 's1', route: '/dashboard', dataTour: 'sales_metric', content: 'S1' },
          { id: 's2', route: '/products', dataTour: 'product_list', content: 'S2' }
        ]}
        options={{ resumeOnLoad: true, storage: { key: KEY } }}
      />
    </>
  );

  await waitFor(() => expect(window.location.pathname).toBe('/products'));
  expect(await screen.findByText('S2')).toBeInTheDocument();
});
