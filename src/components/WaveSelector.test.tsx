import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WaveSelector from './WaveSelector';
import type { Wave } from '../types/domain';

const makeWave = (overrides: Partial<Wave> = {}): Wave => ({
  id: 'w1',
  name: 'Wave 1',
  description: 'Fixed Assets',
  status: 'Draft',
  projectId: 'p1',
  taskCount: 5,
  errorCount: 0,
  ...overrides,
});

describe('WaveSelector', () => {
  it('shows empty state', () => {
    render(<WaveSelector waves={[]} activeWaveId={null} onSelectWave={vi.fn()} />);
    expect(screen.getByTestId('wave-empty')).toBeInTheDocument();
  });

  it('renders wave cards', () => {
    const waves = [makeWave({ id: 'w1', name: 'Wave Alpha' }), makeWave({ id: 'w2', name: 'Wave Beta' })];
    render(<WaveSelector waves={waves} activeWaveId={null} onSelectWave={vi.fn()} />);
    expect(screen.getByTestId('wave-card-w1')).toBeInTheDocument();
    expect(screen.getByTestId('wave-card-w2')).toBeInTheDocument();
    expect(screen.getByText('Wave Alpha')).toBeInTheDocument();
  });

  it('calls onSelectWave on click', () => {
    const onSelect = vi.fn();
    const waves = [makeWave({ id: 'w1' })];
    render(<WaveSelector waves={waves} activeWaveId={null} onSelectWave={onSelect} />);
    fireEvent.click(screen.getByTestId('wave-card-w1'));
    expect(onSelect).toHaveBeenCalledWith('w1');
  });

  it('shows task count', () => {
    const waves = [makeWave({ id: 'w1', taskCount: 7 })];
    render(<WaveSelector waves={waves} activeWaveId={null} onSelectWave={vi.fn()} />);
    expect(screen.getByText('7 tasks')).toBeInTheDocument();
  });

  it('shows a human decision icon on the released Inventory to Deliver wave when SCM has an assigned decision', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => (key === 'mia-scm-pending-intervention' ? 'true' : null)),
    });
    const waves = [makeWave({ id: 'mia-wave-inventory-to-deliver', name: '3.4 Inventory to Deliver', status: 'Completed' })];
    render(<WaveSelector waves={waves} activeWaveId="mia-wave-inventory-to-deliver" onSelectWave={vi.fn()} />);
    expect(screen.getByTestId('wave-decision-icon-mia-wave-inventory-to-deliver')).toHaveAttribute(
      'href',
      '/SCM/decision?from=mia&task=warehouse&assigned=decision',
    );
  });

  it('calls onReleaseAllWaves when release all is clicked', () => {
    const onReleaseAll = vi.fn();
    const waves = [makeWave({ id: 'w1' })];
    render(
      <WaveSelector
        waves={waves}
        activeWaveId={null}
        onSelectWave={vi.fn()}
        onReleaseAllWaves={onReleaseAll}
        releaseAllCount={1}
      />,
    );
    fireEvent.click(screen.getByTestId('wave-release-all-btn'));
    expect(onReleaseAll).toHaveBeenCalled();
  });
});
