import { expect, beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom';
import { server } from '../src/mocks/server';

// Extend Vitest's expect engine with testing-library's custom DOM matchers
expect.extend(matchers);

// Boot up the MSW network interceptor sandbox layer before files process
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  cleanup(); // Unmounts React trees and resets the DOM after each test to prevent state leakage
  server.resetHandlers();
  
  // Safely wipes browser storage contexts so user login states don't leak between component tests
  window.localStorage.clear();
  window.sessionStorage.clear();
});

// Shut down the network interception layer cleanly after the entire test suite completes
afterAll(() => server.close());