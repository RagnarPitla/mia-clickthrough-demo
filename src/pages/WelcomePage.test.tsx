import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { KzkPlaybook } from '../types/domain';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockUsePlaybooks = vi.fn();
vi.mock('../hooks/usePlaybooks', () => ({
  usePlaybooks: () => mockUsePlaybooks(),
}));

vi.mock('../services/dataverse', () => ({
  fetchProjects: () => Promise.resolve([]),
}));

import WelcomePage from './WelcomePage';

const samplePlaybooks: KzkPlaybook[] = [
  {
    id: 'pb-ms',
    name: 'ms-fa-document-driven',
    displayName: 'Document-Driven',
    description: 'Upload SOW and asset docs.',
    publisher: 'Microsoft',
    layer: 'Microsoft',
    iconEmoji: '📄',
    phases: ['Kick-off', 'Collect'],
    modulesCovered: 'Finance',
    scopeTrees: '10,90',
    waveCount: 15,
    taskCount: 105,
    sortOrder: 1,
  },
  {
    id: 'pb-partner',
    name: 'conversational',
    displayName: 'Conversational',
    description: 'Describe your processes.',
    publisher: 'Velocity Consulting',
    layer: 'Partner',
    iconEmoji: '💬',
    phases: ['Discover', 'Design'],
    modulesCovered: 'Finance',
    scopeTrees: '10',
    waveCount: 3,
    taskCount: 9,
    sortOrder: 2,
  },
  {
    id: 'pb-blank',
    name: 'blank',
    displayName: 'Blank Project',
    description: 'Start from scratch.',
    publisher: 'Blank',
    layer: 'Customer',
    iconEmoji: '✦',
    phases: [],
    modulesCovered: '',
    scopeTrees: '',
    waveCount: 0,
    taskCount: 0,
    sortOrder: 3,
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <WelcomePage />
    </MemoryRouter>,
  );
}

describe('WelcomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with data-testid', () => {
    mockUsePlaybooks.mockReturnValue({ playbooks: [], loading: false, error: null });
    renderPage();
    expect(screen.getByTestId('welcome-page')).toBeInTheDocument();
  });

  it('shows a welcome heading', () => {
    mockUsePlaybooks.mockReturnValue({ playbooks: [], loading: false, error: null });
    renderPage();
    expect(screen.getByText(/welcome to mia/i)).toBeInTheDocument();
  });

  it('shows a call-to-action to pick a playbook', () => {
    mockUsePlaybooks.mockReturnValue({ playbooks: [], loading: false, error: null });
    renderPage();
    expect(screen.getByText(/select a proven template to begin/i)).toBeInTheDocument();
  });

  it('shows Microsoft logo with float animation', () => {
    mockUsePlaybooks.mockReturnValue({ playbooks: [], loading: false, error: null });
    renderPage();
    const logo = screen.getByTestId('kazuki-logo');
    expect(logo).toHaveAttribute('aria-label', 'Microsoft');
    expect(logo.style.animation).toContain('float');
  });

  it('shows loading state', () => {
    mockUsePlaybooks.mockReturnValue({ playbooks: [], loading: true, error: null });
    renderPage();
    expect(screen.getByTestId('playbook-loading')).toHaveTextContent('Loading playbooks');
  });

  it('shows error state', () => {
    mockUsePlaybooks.mockReturnValue({ playbooks: [], loading: false, error: 'Network error' });
    renderPage();
    expect(screen.getByTestId('playbook-error')).toHaveTextContent('Network error');
  });

  it('shows empty state when no playbooks', () => {
    mockUsePlaybooks.mockReturnValue({ playbooks: [], loading: false, error: null });
    renderPage();
    expect(screen.getByTestId('playbook-empty')).toHaveTextContent('No playbooks available');
  });

  it('renders all playbook cards', () => {
    mockUsePlaybooks.mockReturnValue({ playbooks: samplePlaybooks, loading: false, error: null });
    renderPage();
    expect(screen.getByTestId('playbook-card-pb-ms')).toBeInTheDocument();
    expect(screen.getByTestId('playbook-card-pb-partner')).toBeInTheDocument();
    expect(screen.getByTestId('playbook-card-pb-blank')).toBeInTheDocument();
  });

  it('renders correct display names for cards', () => {
    mockUsePlaybooks.mockReturnValue({ playbooks: samplePlaybooks, loading: false, error: null });
    renderPage();
    expect(screen.getByText('Document-Driven')).toBeInTheDocument();
    expect(screen.getByText('Conversational')).toBeInTheDocument();
    // "Blank Project" appears from both sample data and the built-in blank card
    expect(screen.getAllByText('Blank Project').length).toBeGreaterThanOrEqual(1);
  });

  it('selects a card on first click', () => {
    mockUsePlaybooks.mockReturnValue({ playbooks: samplePlaybooks, loading: false, error: null });
    renderPage();
    fireEvent.click(screen.getByTestId('playbook-card-pb-ms'));
    const card = screen.getByTestId('playbook-card-pb-ms');
    expect(card.style.transform).toBe('translateY(-4px)');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to /setup on double-click (second click on selected card)', () => {
    mockUsePlaybooks.mockReturnValue({ playbooks: samplePlaybooks, loading: false, error: null });
    renderPage();
    fireEvent.click(screen.getByTestId('playbook-card-pb-ms'));
    fireEvent.click(screen.getByTestId('playbook-card-pb-ms'));
    expect(mockNavigate).toHaveBeenCalledWith('/setup', {
      state: { playbook: samplePlaybooks[0] },
    });
  });

  it('shows footer text about playbooks', () => {
    mockUsePlaybooks.mockReturnValue({ playbooks: samplePlaybooks, loading: false, error: null });
    renderPage();
    expect(screen.getByTestId('welcome-footer')).toHaveTextContent(
      /phases, tasks, and best practices/i,
    );
  });

  it('renders CTA labels per layer type', () => {
    mockUsePlaybooks.mockReturnValue({ playbooks: samplePlaybooks, loading: false, error: null });
    renderPage();
    const ctas = screen.getAllByTestId('playbook-cta');
    expect(ctas[0]).toHaveTextContent('Start with Documents');
    expect(ctas[1]).toHaveTextContent('Start Conversation');
    expect(ctas[2]).toHaveTextContent('Start your Journey');
  });
});
