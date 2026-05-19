import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BusinessProcessPage from './BusinessProcessPage';
import type { E2EProcess, Phase } from '../types/domain';

// Mock useBpcTree
vi.mock('../hooks/useBpcTree', () => ({
  useBpcTree: () => ({
    getChildren: () => [],
    countDescendants: () => 0,
    getNode: () => null,
    loading: false,
    error: null,
  }),
}));

// Mock E2E service for scope toggle
vi.mock('../generated/services/Kzk_e2eprocessesService', () => ({
  Kzk_e2eprocessesService: {
    update: vi.fn().mockResolvedValue({}),
  },
}));

const baseProcesses: E2EProcess[] = [
  { id: 'e1', name: 'Order to Cash', bpcId: '60', areas: 'Sales', modules: 'AR, Sales', isInScope: true, projectId: 'p1' },
  { id: 'e2', name: 'Procure to Pay', bpcId: '70', areas: 'Procurement', modules: 'AP, Procurement', isInScope: false, projectId: 'p1' },
  { id: 'e3', name: 'Record to Report', bpcId: '80', areas: 'Finance', modules: 'GL, FA', isInScope: true, projectId: 'p1' },
  { id: 'e4', name: 'Hire to Retire', bpcId: '90', areas: 'HR', modules: 'HCM', isInScope: true, projectId: 'p1' },
];

const basePhases: Phase[] = [
  { id: 'ph1', name: 'Kick-off', description: '', order: 1, status: 'Completed', projectId: 'p1' },
  { id: 'ph2', name: 'Discover', description: '', order: 2, status: 'Active', projectId: 'p1' },
];

const defaultProps = {
  processes: baseProcesses,
  phases: basePhases,
  loading: false,
  onProcessesChange: vi.fn(),
};

function renderPage(overrides = {}) {
  return render(<BusinessProcessPage {...defaultProps} {...overrides} />);
}

describe('BusinessProcessPage Review UX', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ── Header bar ── */
  describe('Header bar', () => {
    it('shows N of M in scope count', () => {
      renderPage();
      expect(screen.getByTestId('scope-count')).toHaveTextContent('3 of 4 in scope');
    });

    it('updates count when processes change', () => {
      const { rerender } = render(<BusinessProcessPage {...defaultProps} />);
      expect(screen.getByTestId('scope-count')).toHaveTextContent('3 of 4 in scope');

      const updatedProcesses = baseProcesses.map(p =>
        p.id === 'e2' ? { ...p, isInScope: true } : p
      );
      rerender(<BusinessProcessPage {...defaultProps} processes={updatedProcesses} />);
      expect(screen.getByTestId('scope-count')).toHaveTextContent('4 of 4 in scope');
    });
  });

  /* ── Filter tabs ── */
  describe('Filter tabs', () => {
    it('renders All, In Scope, Needs Review, Rejected tabs', () => {
      renderPage();
      expect(screen.getByTestId('filter-all')).toBeInTheDocument();
      expect(screen.getByTestId('filter-inScope')).toBeInTheDocument();
      expect(screen.getByTestId('filter-needsReview')).toBeInTheDocument();
      expect(screen.getByTestId('filter-rejected')).toBeInTheDocument();
    });

    it('shows counts on each tab', () => {
      renderPage();
      expect(screen.getByTestId('filter-all')).toHaveTextContent('All4');
      expect(screen.getByTestId('filter-inScope')).toHaveTextContent('In Scope3');
    });

    it('defaults to All tab showing all processes', () => {
      renderPage();
      // All 4 processes visible
      expect(screen.getByTestId('process-card-e1')).toBeInTheDocument();
      expect(screen.getByTestId('process-card-e2')).toBeInTheDocument();
      expect(screen.getByTestId('process-card-e3')).toBeInTheDocument();
      expect(screen.getByTestId('process-card-e4')).toBeInTheDocument();
    });

    it('filters to only in-scope processes when In Scope tab clicked', () => {
      renderPage();
      fireEvent.click(screen.getByTestId('filter-inScope'));
      expect(screen.getByTestId('process-card-e1')).toBeInTheDocument();
      expect(screen.queryByTestId('process-card-e2')).not.toBeInTheDocument();
      expect(screen.getByTestId('process-card-e3')).toBeInTheDocument();
      expect(screen.getByTestId('process-card-e4')).toBeInTheDocument();
    });

    it('filters to rejected processes when Rejected tab clicked', () => {
      renderPage();
      // By default none are rejected, so tab shows empty
      fireEvent.click(screen.getByTestId('filter-rejected'));
      expect(screen.queryByTestId('process-card-e1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('process-card-e2')).not.toBeInTheDocument();
    });
  });

  /* ── Search ── */
  describe('Search', () => {
    it('renders search input', () => {
      renderPage();
      expect(screen.getByTestId('bpc-search')).toBeInTheDocument();
    });

    it('filters processes by name', async () => {
      vi.useFakeTimers();
      renderPage();
      const input = screen.getByTestId('bpc-search');
      fireEvent.change(input, { target: { value: 'Order' } });

      // Advance past debounce
      act(() => { vi.advanceTimersByTime(300); });

      expect(screen.getByTestId('process-card-e1')).toBeInTheDocument();
      expect(screen.queryByTestId('process-card-e2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('process-card-e3')).not.toBeInTheDocument();
      vi.useRealTimers();
    });

    it('filters by BPC number', async () => {
      vi.useFakeTimers();
      renderPage();
      const input = screen.getByTestId('bpc-search');
      fireEvent.change(input, { target: { value: '70' } });

      act(() => { vi.advanceTimersByTime(300); });

      expect(screen.queryByTestId('process-card-e1')).not.toBeInTheDocument();
      expect(screen.getByTestId('process-card-e2')).toBeInTheDocument();
      vi.useRealTimers();
    });

    it('clears search restores all processes', async () => {
      vi.useFakeTimers();
      renderPage();
      const input = screen.getByTestId('bpc-search');
      fireEvent.change(input, { target: { value: 'Order' } });
      act(() => { vi.advanceTimersByTime(300); });
      expect(screen.queryByTestId('process-card-e2')).not.toBeInTheDocument();

      fireEvent.change(input, { target: { value: '' } });
      act(() => { vi.advanceTimersByTime(300); });
      expect(screen.getByTestId('process-card-e1')).toBeInTheDocument();
      expect(screen.getByTestId('process-card-e2')).toBeInTheDocument();
      vi.useRealTimers();
    });
  });

  /* ── Slide-over detail panel ── */
  describe('Slide-over detail panel', () => {
    it('does not show panel by default', () => {
      renderPage();
      expect(screen.queryByTestId('detail-panel')).not.toBeInTheDocument();
    });

    it('opens on process name click', () => {
      renderPage();
      fireEvent.click(screen.getByTestId('process-name-e1'));
      expect(screen.getByTestId('detail-panel')).toBeInTheDocument();
    });

    it('shows process name and modules in panel', () => {
      renderPage();
      fireEvent.click(screen.getByTestId('process-name-e1'));
      expect(screen.getByTestId('detail-panel-title')).toHaveTextContent('Order to Cash');
      expect(screen.getByTestId('detail-panel')).toHaveTextContent('AR, Sales');
    });

    it('shows approval state badge in panel', () => {
      renderPage();
      fireEvent.click(screen.getByTestId('process-name-e1'));
      expect(screen.getByTestId('detail-approval-badge')).toHaveTextContent('Proposed');
    });

    it('has scope toggle in panel', () => {
      renderPage();
      fireEvent.click(screen.getByTestId('process-name-e1'));
      expect(screen.getByTestId('detail-scope-toggle')).toBeInTheDocument();
    });

    it('closes on close button click', () => {
      renderPage();
      fireEvent.click(screen.getByTestId('process-name-e1'));
      expect(screen.getByTestId('detail-panel')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('detail-close'));
      expect(screen.queryByTestId('detail-panel')).not.toBeInTheDocument();
    });

    it('closes on Escape key', () => {
      renderPage();
      fireEvent.click(screen.getByTestId('process-name-e1'));
      expect(screen.getByTestId('detail-panel')).toBeInTheDocument();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByTestId('detail-panel')).not.toBeInTheDocument();
    });
  });

  /* ── Bulk selection ── */
  describe('Bulk selection', () => {
    it('shows checkboxes on each process row', () => {
      renderPage();
      expect(screen.getByTestId('checkbox-e1')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-e2')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-e3')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-e4')).toBeInTheDocument();
    });

    it('selects process on checkbox click', () => {
      renderPage();
      fireEvent.click(screen.getByTestId('checkbox-e1'));
      expect(screen.getByTestId('checkbox-e1')).toBeChecked();
    });

    it('shows action bar when items are selected', () => {
      renderPage();
      expect(screen.queryByTestId('bulk-action-bar')).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('checkbox-e1'));
      expect(screen.getByTestId('bulk-action-bar')).toBeInTheDocument();
    });

    it('action bar shows selected count', () => {
      renderPage();
      fireEvent.click(screen.getByTestId('checkbox-e1'));
      fireEvent.click(screen.getByTestId('checkbox-e3'));
      expect(screen.getByTestId('bulk-action-bar')).toHaveTextContent('2 selected');
    });

    it('action bar has Approve, Reject, and Under Review buttons', () => {
      renderPage();
      fireEvent.click(screen.getByTestId('checkbox-e1'));
      expect(screen.getByTestId('bulk-approve')).toBeInTheDocument();
      expect(screen.getByTestId('bulk-reject')).toBeInTheDocument();
      expect(screen.getByTestId('bulk-under-review')).toBeInTheDocument();
    });

    it('bulk approve sets selected items to Approved', () => {
      renderPage();
      fireEvent.click(screen.getByTestId('checkbox-e1'));
      fireEvent.click(screen.getByTestId('bulk-approve'));
      // Open panel to verify state
      fireEvent.click(screen.getByTestId('process-name-e1'));
      expect(screen.getByTestId('detail-approval-badge')).toHaveTextContent('Approved');
    });

    it('bulk reject sets selected items to Rejected', () => {
      renderPage();
      fireEvent.click(screen.getByTestId('checkbox-e3'));
      fireEvent.click(screen.getByTestId('bulk-reject'));
      fireEvent.click(screen.getByTestId('process-name-e3'));
      expect(screen.getByTestId('detail-approval-badge')).toHaveTextContent('Rejected');
    });

    it('clears selection after bulk action', () => {
      renderPage();
      fireEvent.click(screen.getByTestId('checkbox-e1'));
      expect(screen.getByTestId('bulk-action-bar')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('bulk-approve'));
      expect(screen.queryByTestId('bulk-action-bar')).not.toBeInTheDocument();
    });

    it('supports shift-click for range selection', () => {
      renderPage();
      // Click first checkbox
      fireEvent.click(screen.getByTestId('checkbox-e1'));
      // Shift-click third checkbox
      fireEvent.click(screen.getByTestId('checkbox-e3'), { shiftKey: true });
      // e1, e2, e3 should be checked
      expect(screen.getByTestId('checkbox-e1')).toBeChecked();
      expect(screen.getByTestId('checkbox-e2')).toBeChecked();
      expect(screen.getByTestId('checkbox-e3')).toBeChecked();
      expect(screen.getByTestId('checkbox-e4')).not.toBeChecked();
    });
  });

  /* ── Interaction isolation ── */
  describe('Interaction isolation', () => {
    it('checkbox click does not open detail panel', () => {
      renderPage();
      fireEvent.click(screen.getByTestId('checkbox-e1'));
      expect(screen.queryByTestId('detail-panel')).not.toBeInTheDocument();
    });

    it('scope toggle click does not open detail panel', () => {
      renderPage();
      fireEvent.click(screen.getByTestId('scope-toggle-e1'));
      expect(screen.queryByTestId('detail-panel')).not.toBeInTheDocument();
    });

    it('chevron click expands without opening panel', () => {
      renderPage();
      fireEvent.click(screen.getByTestId('expand-chevron-e1'));
      expect(screen.queryByTestId('detail-panel')).not.toBeInTheDocument();
    });
  });
});
