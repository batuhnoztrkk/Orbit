// tests/test-utils.js
import React from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * renderRQHook: React Query kullanan hook'ları sarmalayarak test eder.
 * Varsayılan olarak retry=false gelir ki testler deterministik olsun.
 */
export const renderRQHook = (hookFn, opts = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const rendered = renderHook(hookFn, { wrapper, ...opts });
  return { ...rendered, queryClient };
};
