import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PlaybooksPage, { type Playbook } from './PlaybooksPage';

const DEMO_PLAYBOOKS: Playbook[] = [
  {
    id: 'pb-fa',
    name: 'Fixed Assets Setup',
    description: 'Depreciation, books, groups, posting, sample assets',
    tasks: [
      { name: 'Depreciation Profile', skillName: 'fo-dep-profile@1', dependsOn: [] },
      { name: 'Depreciation Book', skillName: 'fo-dep-book@1', dependsOn: ['Depreciation Profile'] },
      { name: 'Asset Groups', skillName: 'fo-asset-group@1', dependsOn: ['Depreciation Book'] },
      { name: 'Posting Profiles', skillName: 'fo-posting@1', dependsOn: ['Depreciation Book'] },
      { name: 'Sample Assets', skillName: 'fo-asset@1', dependsOn: ['Asset Groups', 'Posting Profiles'] },
    ],
  },
  {
    id: 'pb-cg',
    name: 'Customer Groups',
    description: 'Basic customer group configuration',
    tasks: [
      { name: 'Create Customer Group', skillName: 'fo-cust-group@1', dependsOn: [] },
    ],
  },
];

describe('PlaybooksPage', () => {
  it('shows empty state', () => {
    render(<PlaybooksPage playbooks={[]} />);
    expect(screen.getByTestId('playbooks-empty')).toBeInTheDocument();
  });

  it('renders playbook cards', () => {
    render(<PlaybooksPage playbooks={DEMO_PLAYBOOKS} />);
    expect(screen.getByTestId('playbook-card-pb-fa')).toBeInTheDocument();
    expect(screen.getByTestId('playbook-card-pb-cg')).toBeInTheDocument();
    expect(screen.getByText('Fixed Assets Setup')).toBeInTheDocument();
  });

  it('shows task count on cards', () => {
    render(<PlaybooksPage playbooks={DEMO_PLAYBOOKS} />);
    expect(screen.getByTestId('playbook-card-pb-fa').textContent).toContain('5 tasks');
  });

  it('shows mini DAG preview', () => {
    render(<PlaybooksPage playbooks={DEMO_PLAYBOOKS} />);
    expect(screen.getByTestId('task-preview-pb-fa-4').textContent).toContain('Asset Groups, Posting Profiles → Sample Assets');
  });

  it('fires onComposeWave with playbook id', () => {
    const onCompose = vi.fn();
    render(<PlaybooksPage playbooks={DEMO_PLAYBOOKS} onComposeWave={onCompose} />);
    fireEvent.click(screen.getByTestId('compose-pb-cg'));
    expect(onCompose).toHaveBeenCalledWith('pb-cg');
  });
});
