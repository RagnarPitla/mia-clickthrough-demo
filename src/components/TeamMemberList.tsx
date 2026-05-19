import type { TeamMemberDraft, MemberRole } from '../types/domain';

interface TeamMemberListProps {
  members: TeamMemberDraft[];
  onChange: (members: TeamMemberDraft[]) => void;
}

const ROLES: MemberRole[] = ['DA', 'Consultant', 'CustomerSME', 'CustomerSponsor', 'SME'];

let nextId = 1;
function genId() {
  return `tmp-${nextId++}`;
}

export { genId as _genId };

export default function TeamMemberList({ members, onChange }: TeamMemberListProps) {
  const handleFieldChange = (index: number, field: keyof TeamMemberDraft, value: string) => {
    const next = [...members];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const handleRemove = (index: number) => {
    if (members[index]?.isCurrentUser) return;
    onChange(members.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    onChange([
      ...members,
      { id: genId(), displayName: '', email: '', role: 'Consultant' as MemberRole },
    ]);
  };

  return (
    <div data-testid="team-member-list">
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          textTransform: 'uppercase' as const,
          letterSpacing: '0.06em',
          color: 'var(--text-secondary)',
          marginBottom: 12,
        }}
      >
        Team
      </div>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 13,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <thead>
          <tr style={{ color: 'var(--text-tertiary)', fontSize: 11, textAlign: 'left' }}>
            <th style={{ padding: '4px 8px', fontWeight: 600 }}>Name</th>
            <th style={{ padding: '4px 8px', fontWeight: 600 }}>Email</th>
            <th style={{ padding: '4px 8px', fontWeight: 600 }}>Role</th>
            <th style={{ padding: '4px 8px', width: 40 }}></th>
          </tr>
        </thead>
        <tbody>
          {members.map((member, i) => (
            <tr key={member.id} data-testid={`team-row-${i}`}>
              <td style={{ padding: '4px 8px' }}>
                <input
                  data-testid={`team-name-${i}`}
                  type="text"
                  value={member.displayName}
                  onChange={(e) => handleFieldChange(i, 'displayName', e.target.value)}
                  disabled={member.isCurrentUser}
                  placeholder="Name"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--glass-border)',
                    background: member.isCurrentUser ? 'var(--accent-light)' : 'rgba(255,255,255,0.5)',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
              </td>
              <td style={{ padding: '4px 8px' }}>
                <input
                  data-testid={`team-email-${i}`}
                  type="email"
                  value={member.email}
                  onChange={(e) => handleFieldChange(i, 'email', e.target.value)}
                  disabled={member.isCurrentUser}
                  placeholder="email@example.com"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--glass-border)',
                    background: member.isCurrentUser ? 'var(--accent-light)' : 'rgba(255,255,255,0.5)',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
              </td>
              <td style={{ padding: '4px 8px' }}>
                <select
                  data-testid={`team-role-${i}`}
                  value={member.role}
                  onChange={(e) => handleFieldChange(i, 'role', e.target.value)}
                  disabled={member.isCurrentUser}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--glass-border)',
                    background: member.isCurrentUser ? 'var(--accent-light)' : 'rgba(255,255,255,0.5)',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </td>
              <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                {!member.isCurrentUser && (
                  <button
                    data-testid={`team-remove-${i}`}
                    onClick={() => handleRemove(i)}
                    aria-label="Remove member"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--glass-border)',
                      background: 'transparent',
                      color: 'var(--failed)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    ×
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        data-testid="team-add"
        onClick={handleAdd}
        style={{
          marginTop: 8,
          padding: '6px 14px',
          borderRadius: 'var(--radius-xs)',
          border: '1px solid var(--accent-border)',
          background: 'var(--accent-light)',
          color: 'var(--accent)',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        + Add team member
      </button>
    </div>
  );
}
