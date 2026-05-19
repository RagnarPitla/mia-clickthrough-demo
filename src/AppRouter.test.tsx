import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock the page components to isolate routing tests
vi.mock('./pages/WelcomePage', () => ({
  default: () => <div data-testid="welcome-page">Welcome</div>,
}));
vi.mock('./pages/SetupPage', () => ({
  default: () => <div data-testid="setup-page">Setup</div>,
}));
vi.mock('./pages/CreatingPage', () => ({
  default: () => <div data-testid="creating-page">Creating</div>,
}));
vi.mock('./components/DashboardContent', () => ({
  default: () => <div data-testid="dashboard-content">Dashboard</div>,
}));
vi.mock('./components/AppShell', () => {
  // Dynamic import to avoid `require` in TS
  return import('react-router-dom').then(({ Outlet }) => ({
    default: () => (
      <div data-testid="app-shell" data-theme="light">
        <Outlet />
      </div>
    ),
  }));
});

// Import route definitions after mocks
import { appRoutes } from './AppRouter';

// React Flow requires ResizeObserver
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = MockResizeObserver as any;

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        {appRoutes.map((route, i) => {
          if (route.children) {
            return (
              <Route key={i} element={route.element}>
                {route.children.map((child, j) => (
                  <Route
                    key={j}
                    index={child.index}
                    path={child.path}
                    element={child.element}
                  />
                ))}
              </Route>
            );
          }
          return <Route key={i} path={route.path} element={route.element} />;
        })}
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppRouter', () => {
  beforeEach(() => {
    if (typeof localStorage.clear === 'function') {
      localStorage.clear();
    }
  });

  it('renders WelcomePage at /', () => {
    renderRoute('/');
    expect(screen.getByTestId('welcome-page')).toBeInTheDocument();
  });

  it('renders SetupPage at /setup', () => {
    renderRoute('/setup');
    expect(screen.getByTestId('setup-page')).toBeInTheDocument();
  });

  it('renders CreatingPage at /creating', async () => {
    renderRoute('/creating');
    expect(await screen.findByTestId('creating-page')).toBeInTheDocument();
  });

  it('renders Dashboard at /dashboard', async () => {
    renderRoute('/dashboard');
    expect(await screen.findByTestId('dashboard-content')).toBeInTheDocument();
  });

  it('wraps new pages in AppShell', () => {
    renderRoute('/');
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });

  it('wraps dashboard in AppShell', () => {
    renderRoute('/dashboard');
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });
});
