import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CreatingPage from './CreatingPage';

const STEP_INTERVAL = 300;
const DWELL_MS = 600;
const STEP_COUNT = 6; // hardcoded steps in CreatingPage

function DashboardStub() {
  return <div data-testid="dashboard-page">Dashboard</div>;
}

function renderCreatingPage() {
  return render(
    <MemoryRouter initialEntries={['/creating']}>
      <Routes>
        <Route path="/creating" element={<CreatingPage />} />
        <Route path="/dashboard" element={<DashboardStub />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CreatingPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with data-testid', () => {
    renderCreatingPage();
    expect(screen.getByTestId('creating-page')).toBeInTheDocument();
  });

  it('shows the creating overlay with project name', () => {
    renderCreatingPage();
    expect(
      screen.getByText(/Creating Contoso FA Implementation/),
    ).toBeInTheDocument();
  });

  it('shows the playbook name', () => {
    renderCreatingPage();
    expect(screen.getByText(/Document-Driven v1.0/)).toBeInTheDocument();
  });

  it('renders all checklist steps', () => {
    renderCreatingPage();
    expect(screen.getByText('Project created')).toBeInTheDocument();
    expect(screen.getByText('Wave 0 composed — 3 tasks')).toBeInTheDocument();
    expect(screen.getByText('Starting kick-off tasks…')).toBeInTheDocument();
  });

  it('navigates to /dashboard after animation completes', () => {
    renderCreatingPage();
    const totalTime = (STEP_COUNT + 1) * STEP_INTERVAL + DWELL_MS;
    act(() => {
      vi.advanceTimersByTime(totalTime);
    });
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });
});

