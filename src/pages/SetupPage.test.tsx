import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SetupPage from './SetupPage';
import type { KzkPlaybook } from '../types/domain';

// Mock useBpcTree
vi.mock('../hooks/useBpcTree', () => ({
  useBpcTree: () => ({
    roots: [
      {
        id: 'id-10',
        name: 'Acquire to Dispose',
        catalogCode: '10',
        parentCode: '',
        itemType: 'E2E',
        description: '',
        children: [
          { id: 'id-10.1', name: 'Define asset strategy', catalogCode: '10.1', parentCode: '10', itemType: 'ProcessArea', description: '', children: [] },
        ],
      },
      {
        id: 'id-20',
        name: 'Case to Resolution',
        catalogCode: '20',
        parentCode: '',
        itemType: 'E2E',
        description: '',
        children: [],
      },
    ],
    getChildren: () => [],
    countDescendants: () => 0,
    loading: false,
    error: null,
  }),
}));

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockPlaybook: KzkPlaybook = {
  id: 'pb-1',
  name: 'ms-fa-document-driven',
  displayName: 'Document-Driven',
  description: 'Upload SOW and asset docs',
  publisher: 'Microsoft',
  layer: 'Microsoft',
  iconEmoji: '📄',
  phases: ['Kick-off', 'Collect'],
  modulesCovered: 'Finance',
  scopeTrees: '10',
  waveCount: 6,
  taskCount: 15,
  sortOrder: 1,
};

function renderWithPlaybook(playbook: KzkPlaybook | null = mockPlaybook) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/setup', state: { playbook } }]}>
      <SetupPage />
    </MemoryRouter>,
  );
}

describe('SetupPage', () => {
  it('renders with data-testid', () => {
    renderWithPlaybook();
    expect(screen.getByTestId('setup-page')).toBeInTheDocument();
  });

  it('shows back to playbooks link', () => {
    renderWithPlaybook();
    expect(screen.getByTestId('back-to-playbooks')).toBeInTheDocument();
  });

  it('shows playbook badge', () => {
    renderWithPlaybook();
    const badge = screen.getByTestId('playbook-badge');
    expect(badge.textContent).toContain('Document-Driven');
    expect(badge.textContent).toContain('📄');
  });

  it('shows redirect when no playbook', () => {
    renderWithPlaybook(null);
    expect(screen.getByText(/no playbook selected/i)).toBeInTheDocument();
    expect(screen.getByTestId('back-to-playbooks')).toBeInTheDocument();
  });

  it('shows project details form inputs', () => {
    renderWithPlaybook();
    expect(screen.getByTestId('input-project-name')).toBeInTheDocument();
    expect(screen.getByTestId('input-customer-name')).toBeInTheDocument();
    expect(screen.getByTestId('input-products')).toBeInTheDocument();
    expect(screen.getByTestId('input-target-golive')).toBeInTheDocument();
    expect(screen.getByTestId('input-fo-sandbox')).toBeInTheDocument();
  });

  it('shows business goals section', () => {
    renderWithPlaybook();
    expect(screen.getByTestId('business-goal-list')).toBeInTheDocument();
  });

  it('shows team section with DA auto-added', () => {
    renderWithPlaybook();
    expect(screen.getByTestId('team-member-list')).toBeInTheDocument();
    expect(screen.getByTestId('team-name-0')).toHaveValue('Current User');
    expect(screen.getByTestId('team-role-0')).toHaveValue('DA');
  });

  it('shows scope tree', () => {
    renderWithPlaybook();
    expect(screen.getByTestId('scope-tree')).toBeInTheDocument();
  });

  it('pre-selects E2Es from playbook scope_trees', () => {
    renderWithPlaybook();
    expect(screen.getByTestId('scope-toggle-10')).toBeChecked();
    expect(screen.getByTestId('scope-toggle-20')).not.toBeChecked();
  });

  it('shows wave preview', () => {
    renderWithPlaybook();
    expect(screen.getByTestId('wave-preview')).toBeInTheDocument();
  });

  it('shows create project button', () => {
    renderWithPlaybook();
    expect(screen.getByTestId('create-project-btn')).toBeInTheDocument();
  });

  it('create button is disabled when required fields are empty', () => {
    renderWithPlaybook();
    const btn = screen.getByTestId('create-project-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('create button is enabled when required fields are filled', () => {
    renderWithPlaybook();
    fireEvent.change(screen.getByTestId('input-project-name'), { target: { value: 'My Project' } });
    fireEvent.change(screen.getByTestId('input-customer-name'), { target: { value: 'Contoso' } });
    const btn = screen.getByTestId('create-project-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('navigates to /creating with form data on submit', () => {
    renderWithPlaybook();
    fireEvent.change(screen.getByTestId('input-project-name'), { target: { value: 'My Project' } });
    fireEvent.change(screen.getByTestId('input-customer-name'), { target: { value: 'Contoso' } });
    fireEvent.click(screen.getByTestId('create-project-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('/creating', expect.objectContaining({
      state: expect.objectContaining({
        projectName: 'My Project',
        customerName: 'Contoso',
      }),
    }));
  });

  it('shows footer stats', () => {
    renderWithPlaybook();
    const stats = screen.getByTestId('footer-stats');
    expect(stats.textContent).toContain('E2Es in scope');
    expect(stats.textContent).toContain('Wave 0: 3 tasks');
  });
});

