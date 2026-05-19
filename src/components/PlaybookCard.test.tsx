import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PlaybookCard from './PlaybookCard';
import type { KzkPlaybook } from '../types/domain';

function makePlaybook(overrides?: Partial<KzkPlaybook>): KzkPlaybook {
  return {
    id: 'pb-1',
    name: 'ms-fa-document-driven',
    displayName: 'Document-Driven',
    description: 'Upload SOW and asset docs.',
    publisher: 'Microsoft',
    layer: 'Microsoft',
    iconEmoji: '📄',
    phases: ['Kick-off', 'Collect', 'Configure'],
    modulesCovered: 'Finance',
    scopeTrees: '10,90',
    waveCount: 15,
    taskCount: 105,
    sortOrder: 1,
    ...overrides,
  };
}

describe('PlaybookCard', () => {
  it('renders display name', () => {
    render(<PlaybookCard playbook={makePlaybook()} onSelect={() => {}} />);
    expect(screen.getByText('Document-Driven')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<PlaybookCard playbook={makePlaybook()} onSelect={() => {}} />);
    expect(screen.getByText('Upload SOW and asset docs.')).toBeInTheDocument();
  });

  it('renders icon emoji', () => {
    render(<PlaybookCard playbook={makePlaybook()} onSelect={() => {}} />);
    expect(screen.getByText('📄')).toBeInTheDocument();
  });

  it('renders publisher badge', () => {
    render(<PlaybookCard playbook={makePlaybook()} onSelect={() => {}} />);
    expect(screen.getByTestId('publisher-badge')).toHaveTextContent('Microsoft');
  });

  it('renders phase tags', () => {
    render(<PlaybookCard playbook={makePlaybook()} onSelect={() => {}} />);
    expect(screen.getByText('Kick-off')).toBeInTheDocument();
    expect(screen.getByText('Collect')).toBeInTheDocument();
    expect(screen.getByText('Configure')).toBeInTheDocument();
  });

  it('renders Dataverse object-shaped phase entries as labels', () => {
    const playbook = makePlaybook({
      id: 'pb-object-phases',
      phases: [
        { id: 'initiate', name: 'Initiate' },
        { key: 'design', displayName: 'Design' },
      ] as unknown as string[],
      scopeTrees: '{"selectedL1":["Order to Cash","Record to Report"]}',
      waveCount: 2,
      taskCount: 4,
    });

    render(<PlaybookCard playbook={playbook} onSelect={vi.fn()} />);

    expect(screen.getByText('Initiate')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByTestId('stats-line')).toHaveTextContent('2 E2Es');
  });

  it('renders stats line with E2Es, waves, and tasks', () => {
    render(<PlaybookCard playbook={makePlaybook()} onSelect={() => {}} />);
    expect(screen.getByTestId('stats-line')).toHaveTextContent('2 E2Es · 15 waves · 105 tasks');
  });

  it('renders "No tasks yet" for blank playbook', () => {
    render(
      <PlaybookCard
        playbook={makePlaybook({ scopeTrees: '', waveCount: 0, taskCount: 0 })}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByTestId('stats-line')).toHaveTextContent('No tasks yet');
  });

  it('renders correct CTA for Microsoft layer', () => {
    render(<PlaybookCard playbook={makePlaybook({ layer: 'Microsoft' })} onSelect={() => {}} />);
    expect(screen.getByTestId('playbook-cta')).toHaveTextContent('Start with Documents');
  });

  it('renders correct CTA for Partner layer', () => {
    render(<PlaybookCard playbook={makePlaybook({ layer: 'Partner' })} onSelect={() => {}} />);
    expect(screen.getByTestId('playbook-cta')).toHaveTextContent('Start Conversation');
  });

  it('renders correct CTA for Customer layer', () => {
    render(<PlaybookCard playbook={makePlaybook({ layer: 'Customer' })} onSelect={() => {}} />);
    expect(screen.getByTestId('playbook-cta')).toHaveTextContent('Start your Journey');
  });

  it('calls onSelect when card is clicked', () => {
    const onSelect = vi.fn();
    const pb = makePlaybook();
    render(<PlaybookCard playbook={pb} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('playbook-card-pb-1'));
    expect(onSelect).toHaveBeenCalledWith(pb);
  });

  it('calls onSelect when CTA button is clicked', () => {
    const onSelect = vi.fn();
    const pb = makePlaybook();
    render(<PlaybookCard playbook={pb} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('playbook-cta'));
    expect(onSelect).toHaveBeenCalledWith(pb);
  });

  it('applies selected styling when selected', () => {
    render(<PlaybookCard playbook={makePlaybook()} selected onSelect={() => {}} />);
    const card = screen.getByTestId('playbook-card-pb-1');
    expect(card.style.transform).toBe('translateY(-4px)');
  });

  it('renders singular E2E label for single scope tree', () => {
    render(
      <PlaybookCard
        playbook={makePlaybook({ scopeTrees: '10' })}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByTestId('stats-line')).toHaveTextContent('1 E2E ·');
  });

  it('supports keyboard selection via Enter', () => {
    const onSelect = vi.fn();
    const pb = makePlaybook();
    render(<PlaybookCard playbook={pb} onSelect={onSelect} />);
    fireEvent.keyDown(screen.getByTestId('playbook-card-pb-1'), { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(pb);
  });
});
