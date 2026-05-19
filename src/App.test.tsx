import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DashboardContent from './components/DashboardContent';

// React Flow requires ResizeObserver
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = MockResizeObserver;

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardContent />
    </MemoryRouter>,
  );
}

// Mock the dataverse service at the boundary
vi.mock('./services/dataverse', () => ({
  fetchProjects: vi.fn().mockResolvedValue([
    { id: 'p1', name: 'Kazuki POC', description: '', customerName: 'Contoso Manufacturing', products: 'Finance, SCM' },
  ]),
  fetchWaves: vi.fn().mockResolvedValue([
    { id: 'w1', name: 'Wave 1', description: '', status: 'Released', projectId: 'p1', taskCount: 2, errorCount: 0 },
  ]),
  fetchTasks: vi.fn().mockResolvedValue([
    { id: 't1', name: 'Task A', status: 'Completed', skillName: 'skill@1', waveId: 'w1', waveName: '', attempt: 1, predecessorIds: [], outputSummary: 'Done', modifiedOn: '2026-01-01' },
    { id: 't2', name: 'Task B', status: 'Ready', skillName: 'skill@2', waveId: 'w1', waveName: '', attempt: 0, predecessorIds: ['t1'], modifiedOn: '2026-01-01' },
  ]),
  fetchProjectTasks: vi.fn().mockResolvedValue([
    { id: 't1', name: 'Task A', status: 'Completed', skillName: 'skill@1', waveId: 'w1', waveName: '', attempt: 1, predecessorIds: [], outputSummary: 'Done', modifiedOn: '2026-01-01' },
    { id: 't2', name: 'Task B', status: 'Ready', skillName: 'skill@2', waveId: 'w1', waveName: '', attempt: 0, predecessorIds: ['t1'], modifiedOn: '2026-01-01' },
  ]),
  fetchDependencies: vi.fn().mockResolvedValue([
    { taskId: 't2', predecessorId: 't1' },
  ]),
  fetchPhases: vi.fn().mockResolvedValue([
    { id: 'ph1', name: 'Kick-off', description: 'Alignment & setup', order: 1, status: 'Completed', projectId: 'p1' },
    { id: 'ph2', name: 'Discover', description: 'Scope & reqs', order: 2, status: 'Active', projectId: 'p1' },
  ]),
  fetchE2EProcesses: vi.fn().mockResolvedValue([
    { id: 'e1', name: 'Order to Cash', bpcId: 'BPC-001', areas: 'Sales', modules: 'AR, Sales', isInScope: true, projectId: 'p1' },
    { id: 'e2', name: 'Procure to Pay', bpcId: 'BPC-002', areas: 'Procurement', modules: 'AP, Procurement', isInScope: false, projectId: 'p1' },
  ]),
  fetchProjectMembers: vi.fn().mockResolvedValue([
    { id: 'm1', displayName: 'Jane Smith', email: 'jane@contoso.com', role: 'DA', projectId: 'p1' },
    { id: 'm2', displayName: 'Bob Jones', email: 'bob@contoso.com', role: 'Consultant', projectId: 'p1' },
  ]),
  fetchWatchdogSchedules: vi.fn().mockResolvedValue([]),
  fetchWatchdogActivity: vi.fn().mockResolvedValue([]),
  fetchSkills: vi.fn().mockResolvedValue([]),
  createWave: vi.fn().mockResolvedValue('w2'),
  createTask: vi.fn().mockResolvedValue('t3'),
  updateTask: vi.fn().mockResolvedValue(undefined),
  createDependency: vi.fn().mockResolvedValue('d1'),
  releaseWave: vi.fn().mockResolvedValue(undefined),
  releaseAllDraftWaves: vi.fn().mockResolvedValue(0),
  completeHumanApprovalTask: vi.fn().mockResolvedValue(undefined),
}));

describe('DashboardContent', () => {
  beforeEach(() => {
    if (typeof localStorage.clear === 'function') {
      localStorage.clear();
    }
  });

  it('renders the dashboard shell', () => {
    renderDashboard();
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument();
  });

  it('renders the sidebar with nav items', () => {
    renderDashboard();
    expect(screen.getByTestId('dashboard-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-nav-home')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-nav-process')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-nav-phases')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-nav-waves')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-nav-team')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-nav-settings')).toBeInTheDocument();
  });

  it('renders project switcher in sidebar', async () => {
    renderDashboard();
    expect(await screen.findByTestId('sidebar-project-switcher')).toBeInTheDocument();
  });

  it('starts on Home page with project home', () => {
    renderDashboard();
    expect(screen.getByTestId('project-home')).toBeInTheDocument();
  });

  it('navigates to waves page via sidebar', () => {
    renderDashboard();
    fireEvent.click(screen.getByTestId('sidebar-nav-waves'));
    expect(screen.getByTestId('view-graph')).toBeInTheDocument();
  });

  it('navigates to settings page via sidebar', () => {
    renderDashboard();
    fireEvent.click(screen.getByTestId('sidebar-nav-settings'));
    expect(screen.getByTestId('settings-page')).toBeInTheDocument();
  });

  it('navigates to phases page via sidebar', async () => {
    renderDashboard();
    fireEvent.click(screen.getByTestId('sidebar-nav-phases'));
    const phasesPage = await screen.findByTestId('phases-page');
    expect(phasesPage).toBeInTheDocument();
  });

  it('navigates to process page via sidebar', async () => {
    renderDashboard();
    fireEvent.click(screen.getByTestId('sidebar-nav-process'));
    const processPage = await screen.findByTestId('process-page');
    expect(processPage).toBeInTheDocument();
  });

  it('navigates to team page via sidebar', async () => {
    renderDashboard();
    fireEvent.click(screen.getByTestId('sidebar-nav-team'));
    const teamPage = await screen.findByTestId('team-page');
    expect(teamPage).toBeInTheDocument();
  });
});
