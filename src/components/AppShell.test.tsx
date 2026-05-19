import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AppShell from './AppShell';

function renderShell(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<div data-testid="child-content">child</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppShell', () => {
  it('renders with data-testid', () => {
    renderShell();
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });

  it('renders the Mia logo', () => {
    renderShell();
    expect(screen.getByTestId('shell-logo')).toBeInTheDocument();
    expect(screen.getByText(/mia console/i)).toBeInTheDocument();
  });

  it('renders the project name area', () => {
    renderShell();
    expect(screen.getByTestId('shell-project-name')).toBeInTheDocument();
  });

  it('renders the user avatar area', () => {
    renderShell();
    expect(screen.getByTestId('shell-avatar')).toBeInTheDocument();
  });

  it('renders child route content via Outlet', () => {
    renderShell();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('applies light theme data attribute', () => {
    renderShell();
    const shell = screen.getByTestId('app-shell');
    expect(shell).toHaveAttribute('data-theme', 'light');
  });
});
