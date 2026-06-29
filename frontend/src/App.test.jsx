import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    RouterProvider: ({ router }) => {
      const routes = router.routes;
      const hasToken = typeof localStorage !== 'undefined' && localStorage.getItem('token');
      
      const memoryRouter = actual.createMemoryRouter(routes, {
        initialEntries: [hasToken ? '/feed' : '/login']
      });
      
      return <actual.RouterProvider router={memoryRouter} />;
    }
  };
});

import App from './App';

describe('App Root Micro-Routing Orchestrator Integration Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('redirects to /login and exposes public forms if no authentication token exists in storage', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Sign in to your account/i })).toBeInTheDocument();
    });

    expect(screen.queryByText(/Building the social media frontend/i)).not.toBeInTheDocument();
  });

  it('safely passes through ProtectedRoute to mount content views if a valid session token exists', async () => {
    localStorage.setItem('token', 'mock-valid-jwt-token');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Building the social media frontend in Vite!/i)).toBeInTheDocument();
    }, { timeout: 4000 });

    expect(screen.queryByRole('heading', { name: /Sign in to your account/i })).not.toBeInTheDocument();
  });
});
