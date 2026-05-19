import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ScopeTree from './ScopeTree';
import type { BpcTreeNode } from '../hooks/useBpcTree';

function makeE2E(code: string, name: string, children: BpcTreeNode[] = []): BpcTreeNode {
  return {
    id: `id-${code}`,
    name,
    catalogCode: code,
    parentCode: '',
    itemType: 'E2E',
    description: '',
    children,
  };
}

function makeArea(code: string, name: string, parentCode: string): BpcTreeNode {
  return {
    id: `id-${code}`,
    name,
    catalogCode: code,
    parentCode,
    itemType: 'ProcessArea',
    description: '',
    children: [],
  };
}

const sampleE2Es: BpcTreeNode[] = [
  makeE2E('10', 'Acquire to Dispose', [
    makeArea('10.1', 'Define asset strategy', '10'),
    makeArea('10.2', 'Acquire assets', '10'),
  ]),
  makeE2E('20', 'Case to Resolution'),
  makeE2E('40', 'Design to Retire'),
];

describe('ScopeTree', () => {
  it('renders with data-testid', () => {
    render(<ScopeTree e2es={sampleE2Es} selected={new Set()} onToggle={() => {}} />);
    expect(screen.getByTestId('scope-tree')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<ScopeTree e2es={[]} selected={new Set()} onToggle={() => {}} loading />);
    expect(screen.getByText(/loading scope/i)).toBeInTheDocument();
  });

  it('renders all E2E entries', () => {
    render(<ScopeTree e2es={sampleE2Es} selected={new Set()} onToggle={() => {}} />);
    expect(screen.getByTestId('scope-e2e-10')).toBeInTheDocument();
    expect(screen.getByTestId('scope-e2e-20')).toBeInTheDocument();
    expect(screen.getByTestId('scope-e2e-40')).toBeInTheDocument();
  });

  it('shows checkbox checked for selected E2Es', () => {
    render(<ScopeTree e2es={sampleE2Es} selected={new Set(['10'])} onToggle={() => {}} />);
    expect(screen.getByTestId('scope-toggle-10')).toBeChecked();
    expect(screen.getByTestId('scope-toggle-20')).not.toBeChecked();
  });

  it('calls onToggle when checkbox is clicked', () => {
    const onToggle = vi.fn();
    render(<ScopeTree e2es={sampleE2Es} selected={new Set()} onToggle={onToggle} />);
    fireEvent.click(screen.getByTestId('scope-toggle-20'));
    expect(onToggle).toHaveBeenCalledWith('20');
  });

  it('shows expand button for E2Es with children', () => {
    render(<ScopeTree e2es={sampleE2Es} selected={new Set()} onToggle={() => {}} />);
    expect(screen.getByTestId('scope-expand-10')).toBeInTheDocument();
    expect(screen.queryByTestId('scope-expand-20')).not.toBeInTheDocument();
  });

  it('expands to show process areas on click', () => {
    render(<ScopeTree e2es={sampleE2Es} selected={new Set()} onToggle={() => {}} />);
    expect(screen.queryByTestId('scope-children-10')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('scope-expand-10'));
    expect(screen.getByTestId('scope-children-10')).toBeInTheDocument();
    expect(screen.getByTestId('scope-area-10.1')).toBeInTheDocument();
    expect(screen.getByTestId('scope-area-10.2')).toBeInTheDocument();
  });

  it('collapses areas on second click', () => {
    render(<ScopeTree e2es={sampleE2Es} selected={new Set()} onToggle={() => {}} />);
    fireEvent.click(screen.getByTestId('scope-expand-10'));
    expect(screen.getByTestId('scope-children-10')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('scope-expand-10'));
    expect(screen.queryByTestId('scope-children-10')).not.toBeInTheDocument();
  });

  it('shows scope stats', () => {
    render(<ScopeTree e2es={sampleE2Es} selected={new Set(['10'])} onToggle={() => {}} />);
    const stats = screen.getByTestId('scope-stats');
    expect(stats.textContent).toContain('1/3 E2Es in scope');
    expect(stats.textContent).toContain('2/2 process areas');
  });

  it('updates stats when selection changes', () => {
    const { rerender } = render(
      <ScopeTree e2es={sampleE2Es} selected={new Set()} onToggle={() => {}} />,
    );
    expect(screen.getByTestId('scope-stats').textContent).toContain('0/3 E2Es in scope');
    rerender(<ScopeTree e2es={sampleE2Es} selected={new Set(['10', '20'])} onToggle={() => {}} />);
    expect(screen.getByTestId('scope-stats').textContent).toContain('2/3 E2Es in scope');
  });
});
