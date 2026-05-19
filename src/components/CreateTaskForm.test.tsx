import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CreateTaskForm from './CreateTaskForm';

describe('CreateTaskForm', () => {
  it('renders form with name and skill inputs', () => {
    render(<CreateTaskForm onSubmit={vi.fn()} onCancel={vi.fn()} availableTaskIds={[]} />);
    expect(screen.getByTestId('create-task-form')).toBeInTheDocument();
    expect(screen.getByTestId('input-name')).toBeInTheDocument();
    expect(screen.getByTestId('input-skill')).toBeInTheDocument();
  });

  it('submits with name, skill, and selected deps', () => {
    const onSubmit = vi.fn();
    const tasks = [
      { id: 't1', name: 'Task 1' },
      { id: 't2', name: 'Task 2' },
    ];
    render(<CreateTaskForm onSubmit={onSubmit} onCancel={vi.fn()} availableTaskIds={tasks} />);

    fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'New Task' } });
    fireEvent.change(screen.getByTestId('input-skill'), { target: { value: 'my-skill@1' } });
    fireEvent.click(screen.getByTestId('dep-t2'));
    fireEvent.submit(screen.getByTestId('create-task-form'));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'New Task',
      skillName: 'my-skill@1',
      predecessorIds: ['t2'],
    });
  });

  it('calls onCancel when cancel clicked', () => {
    const onCancel = vi.fn();
    render(<CreateTaskForm onSubmit={vi.fn()} onCancel={onCancel} availableTaskIds={[]} />);
    fireEvent.click(screen.getByTestId('btn-cancel-create'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('does not submit when name is empty', () => {
    const onSubmit = vi.fn();
    render(<CreateTaskForm onSubmit={onSubmit} onCancel={vi.fn()} availableTaskIds={[]} />);
    fireEvent.submit(screen.getByTestId('create-task-form'));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
