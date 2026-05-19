import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TeamMemberList from './TeamMemberList';
import type { TeamMemberDraft } from '../types/domain';

function daUser(): TeamMemberDraft {
  return { id: 'da-1', displayName: 'Prav', email: 'prav@test.com', role: 'DA', isCurrentUser: true };
}

describe('TeamMemberList', () => {
  it('renders with data-testid', () => {
    render(<TeamMemberList members={[daUser()]} onChange={() => {}} />);
    expect(screen.getByTestId('team-member-list')).toBeInTheDocument();
  });

  it('renders DA as first row', () => {
    render(<TeamMemberList members={[daUser()]} onChange={() => {}} />);
    expect(screen.getByTestId('team-name-0')).toHaveValue('Prav');
    expect(screen.getByTestId('team-role-0')).toHaveValue('DA');
  });

  it('does not show remove button for current user (DA)', () => {
    render(<TeamMemberList members={[daUser()]} onChange={() => {}} />);
    expect(screen.queryByTestId('team-remove-0')).not.toBeInTheDocument();
  });

  it('DA fields are disabled', () => {
    render(<TeamMemberList members={[daUser()]} onChange={() => {}} />);
    expect(screen.getByTestId('team-name-0')).toBeDisabled();
    expect(screen.getByTestId('team-email-0')).toBeDisabled();
    expect(screen.getByTestId('team-role-0')).toBeDisabled();
  });

  it('adds a new team member on click', () => {
    const onChange = vi.fn();
    render(<TeamMemberList members={[daUser()]} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('team-add'));
    const called = onChange.mock.calls[0][0] as TeamMemberDraft[];
    expect(called).toHaveLength(2);
    expect(called[1].role).toBe('Consultant');
    expect(called[1].displayName).toBe('');
  });

  it('removes a non-DA member', () => {
    const members: TeamMemberDraft[] = [
      daUser(),
      { id: 'c-1', displayName: 'Sarah', email: 'sarah@test.com', role: 'Consultant' },
    ];
    const onChange = vi.fn();
    render(<TeamMemberList members={members} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('team-remove-1'));
    expect(onChange).toHaveBeenCalledWith([daUser()]);
  });

  it('updates member name on change', () => {
    const members: TeamMemberDraft[] = [
      daUser(),
      { id: 'c-2', displayName: 'Old', email: 'old@test.com', role: 'Consultant' },
    ];
    const onChange = vi.fn();
    render(<TeamMemberList members={members} onChange={onChange} />);
    fireEvent.change(screen.getByTestId('team-name-1'), { target: { value: 'New' } });
    const result = onChange.mock.calls[0][0] as TeamMemberDraft[];
    expect(result[1].displayName).toBe('New');
  });
});
