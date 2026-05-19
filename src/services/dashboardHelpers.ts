import type { Task, KzkGate, ActivityFeedEntry } from '../types/domain';

/**
 * Derive a gate from the kick-off wave tasks.
 * Until the kzk_gate Dataverse table exists, we derive gate state from task completion.
 */
export function deriveKickoffGate(tasks: Task[], waveId: string, projectId: string): KzkGate | null {
  if (tasks.length === 0) return null;

  const requirements = tasks.map(t => ({
    label: t.name,
    met: t.status === 'Completed',
  }));

  const allMet = requirements.every(r => r.met);

  return {
    kzk_gateid: `derived-gate-${waveId}`,
    kzk_name: 'Kick-off Completion',
    kzk_waveid: waveId,
    kzk_projectid: projectId,
    kzk_outcome: allMet ? 'Pass' : 'Open',
    kzk_requiredjson: JSON.stringify(requirements),
    kzk_passedat: allMet ? new Date().toISOString() : undefined,
  };
}

const STATUS_ICONS: Record<string, ActivityFeedEntry['icon']> = {
  Completed: '✓',
  InProgress: '▶',
  Failed: '✗',
  Pending: '📋',
  Ready: '📋',
  WaitingOnChild: '📋',
  Cancelled: '✗',
};

/**
 * Derive activity feed entries from tasks.
 * Maps task status changes to icon-based feed entries.
 */
export function deriveActivityFromTasks(tasks: Task[]): ActivityFeedEntry[] {
  return tasks
    .filter(t => t.status !== 'Pending' && t.status !== 'Ready')
    .sort((a, b) => new Date(a.modifiedOn).getTime() - new Date(b.modifiedOn).getTime())
    .map(t => {
      const icon = STATUS_ICONS[t.status] ?? '📋';
      const messages: Record<string, string> = {
        Completed: t.outputSummary || `${t.name} completed`,
        InProgress: `${t.name} running…`,
        Failed: `${t.name} failed`,
        WaitingOnChild: `Waiting for ${t.name} dependencies`,
        Cancelled: `${t.name} cancelled`,
      };
      return {
        id: `activity-${t.id}`,
        icon,
        taskId: t.name.split(' ')[0] || t.id,
        message: messages[t.status] ?? t.name,
        timestamp: t.modifiedOn,
      };
    });
}
