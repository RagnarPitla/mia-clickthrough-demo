import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DashboardShell from './DashboardShell';

describe('DashboardShell', () => {
  it('renders the sidebar slot', () => {
    render(
      <DashboardShell sidebar={<div data-testid="test-sidebar">Sidebar</div>}>
        <div>Content</div>
      </DashboardShell>,
    );
    expect(screen.getByTestId('test-sidebar')).toBeInTheDocument();
  });

  it('renders the content area', () => {
    render(
      <DashboardShell sidebar={<div>Sidebar</div>}>
        <div data-testid="test-content">Content</div>
      </DashboardShell>,
    );
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('renders the shell container with data-testid', () => {
    render(
      <DashboardShell sidebar={<div>Sidebar</div>}>
        <div>Content</div>
      </DashboardShell>,
    );
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument();
  });

  it('uses flex layout for sidebar + content', () => {
    render(
      <DashboardShell sidebar={<div>Sidebar</div>}>
        <div>Content</div>
      </DashboardShell>,
    );
    const shell = screen.getByTestId('dashboard-shell');
    expect(shell.style.display).toBe('flex');
  });
});
