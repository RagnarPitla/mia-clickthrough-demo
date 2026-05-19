import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BusinessGoalList from './BusinessGoalList';

describe('BusinessGoalList', () => {
  it('renders with data-testid', () => {
    render(<BusinessGoalList goals={['']} onChange={() => {}} />);
    expect(screen.getByTestId('business-goal-list')).toBeInTheDocument();
  });

  it('renders input for each goal', () => {
    render(<BusinessGoalList goals={['Goal A', 'Goal B']} onChange={() => {}} />);
    expect(screen.getByTestId('goal-input-0')).toHaveValue('Goal A');
    expect(screen.getByTestId('goal-input-1')).toHaveValue('Goal B');
  });

  it('calls onChange when goal text changes', () => {
    const onChange = vi.fn();
    render(<BusinessGoalList goals={['Old']} onChange={onChange} />);
    fireEvent.change(screen.getByTestId('goal-input-0'), { target: { value: 'New' } });
    expect(onChange).toHaveBeenCalledWith(['New']);
  });

  it('adds a new empty goal on click', () => {
    const onChange = vi.fn();
    render(<BusinessGoalList goals={['Existing']} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('goal-add'));
    expect(onChange).toHaveBeenCalledWith(['Existing', '']);
  });

  it('removes a goal when remove is clicked', () => {
    const onChange = vi.fn();
    render(<BusinessGoalList goals={['A', 'B']} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('goal-remove-0'));
    expect(onChange).toHaveBeenCalledWith(['B']);
  });

  it('does not show remove button when only one goal', () => {
    render(<BusinessGoalList goals={['Only']} onChange={() => {}} />);
    expect(screen.queryByTestId('goal-remove-0')).not.toBeInTheDocument();
  });

  it('shows remove buttons when multiple goals exist', () => {
    render(<BusinessGoalList goals={['A', 'B']} onChange={() => {}} />);
    expect(screen.getByTestId('goal-remove-0')).toBeInTheDocument();
    expect(screen.getByTestId('goal-remove-1')).toBeInTheDocument();
  });
});
