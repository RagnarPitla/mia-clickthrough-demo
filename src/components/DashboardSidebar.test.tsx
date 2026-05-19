import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DashboardSidebar from './DashboardSidebar';
import type { NavPage, Project } from '../types/domain';

const PROJECTS: Project[] = [
  { id: 'p1', name: 'Contoso FA', description: '', customerName: 'Contoso' },
  { id: 'p2', name: 'Fabrikam GL', description: '', customerName: 'Fabrikam' },
];

describe('DashboardSidebar', () => {
  const defaultProps = {
    activePage: 'home' as NavPage,
    onNavigate: vi.fn(),
  };

  it('renders all nav items', () => {
    render(<DashboardSidebar {...defaultProps} />);
    expect(screen.getByTestId('sidebar-nav-home')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-nav-process')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-nav-phases')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-nav-waves')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-nav-tasks')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-nav-customerData')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-nav-team')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-nav-watchdog')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-nav-settings')).toBeInTheDocument();
  });

  it('renders Team and Settings below the divider', () => {
    render(<DashboardSidebar {...defaultProps} />);
    const divider = screen.getByTestId('sidebar-divider');
    const teamBtn = screen.getByTestId('sidebar-nav-team');
    const watchdogBtn = screen.getByTestId('sidebar-nav-watchdog');
    const settingsBtn = screen.getByTestId('sidebar-nav-settings');
    // Divider should precede Team, WatchDog, and Settings in DOM
    expect(divider.compareDocumentPosition(teamBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(divider.compareDocumentPosition(watchdogBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(divider.compareDocumentPosition(settingsBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('does not render Perf or Refresh buttons', () => {
    render(<DashboardSidebar {...defaultProps} />);
    expect(screen.queryByTestId('sidebar-perf')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sidebar-refresh')).not.toBeInTheDocument();
  });

  it('highlights the active page', () => {
    render(<DashboardSidebar {...defaultProps} activePage="waves" />);
    const wavesBtn = screen.getByTestId('sidebar-nav-waves');
    expect(wavesBtn).toHaveAttribute('data-active', 'true');
    const homeBtn = screen.getByTestId('sidebar-nav-home');
    expect(homeBtn).toHaveAttribute('data-active', 'false');
  });

  it('calls onNavigate when a nav item is clicked', () => {
    const onNavigate = vi.fn();
    render(<DashboardSidebar {...defaultProps} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByTestId('sidebar-nav-phases'));
    expect(onNavigate).toHaveBeenCalledWith('phases');
  });

  it('shows scope badge when scopeBadge prop is provided', () => {
    render(<DashboardSidebar {...defaultProps} scopeBadge={3} />);
    expect(screen.getByTestId('scope-badge')).toHaveTextContent('3');
  });

  it('does not show scope badge when scopeBadge is undefined', () => {
    render(<DashboardSidebar {...defaultProps} />);
    expect(screen.queryByTestId('scope-badge')).not.toBeInTheDocument();
  });

  it('renders with glass className for light theme styling', () => {
    render(<DashboardSidebar {...defaultProps} />);
    const sidebar = screen.getByTestId('dashboard-sidebar');
    expect(sidebar.className).toContain('glass');
  });

  it('always renders divider between upper and lower nav', () => {
    render(<DashboardSidebar {...defaultProps} />);
    expect(screen.getByTestId('sidebar-divider')).toBeInTheDocument();
  });

  it('renders project switcher when projects are provided', () => {
    render(<DashboardSidebar {...defaultProps} projects={PROJECTS} activeProjectId="p1" onSelectProject={vi.fn()} />);
    expect(screen.getByTestId('sidebar-project-switcher')).toBeInTheDocument();
    expect(screen.getByText('Contoso')).toBeInTheDocument();
  });

  it('opens project dropdown on switcher click', () => {
    render(<DashboardSidebar {...defaultProps} projects={PROJECTS} activeProjectId="p1" onSelectProject={vi.fn()} />);
    fireEvent.click(screen.getByTestId('sidebar-project-switcher'));
    expect(screen.getByTestId('sidebar-project-dropdown')).toBeInTheDocument();
  });

  it('calls onSelectProject when a project is selected', () => {
    const onSelect = vi.fn();
    render(<DashboardSidebar {...defaultProps} projects={PROJECTS} activeProjectId="p1" onSelectProject={onSelect} />);
    fireEvent.click(screen.getByTestId('sidebar-project-switcher'));
    fireEvent.click(screen.getByTestId('sidebar-project-option-p2'));
    expect(onSelect).toHaveBeenCalledWith('p2');
  });

  it('does not render project switcher when no projects', () => {
    render(<DashboardSidebar {...defaultProps} projects={[]} onSelectProject={vi.fn()} />);
    expect(screen.queryByTestId('sidebar-project-switcher')).not.toBeInTheDocument();
  });
});
