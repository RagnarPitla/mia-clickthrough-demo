interface BusinessGoalListProps {
  goals: string[];
  onChange: (goals: string[]) => void;
}

export default function BusinessGoalList({ goals, onChange }: BusinessGoalListProps) {
  const handleChange = (index: number, value: string) => {
    const next = [...goals];
    next[index] = value;
    onChange(next);
  };

  const handleRemove = (index: number) => {
    if (goals.length <= 1) return;
    onChange(goals.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    onChange([...goals, '']);
  };

  return (
    <div data-testid="business-goal-list">
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          textTransform: 'uppercase' as const,
          letterSpacing: '0.06em',
          color: 'var(--text-secondary)',
          marginBottom: 8,
        }}
      >
        Business Goals
      </div>
      <p
        style={{
          fontSize: 12,
          color: 'var(--text-tertiary)',
          margin: '0 0 12px',
        }}
      >
        AI will use these for strategy advisory
      </p>
      {goals.map((goal, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <input
            data-testid={`goal-input-${i}`}
            type="text"
            value={goal}
            onChange={(e) => handleChange(i, e.target.value)}
            placeholder="Enter a business goal…"
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--glass-border)',
              background: 'rgba(255,255,255,0.5)',
              fontSize: 13,
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          />
          {goals.length > 1 && (
            <button
              data-testid={`goal-remove-${i}`}
              onClick={() => handleRemove(i)}
              aria-label="Remove goal"
              style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--glass-border)',
                background: 'transparent',
                color: 'var(--failed)',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        data-testid="goal-add"
        onClick={handleAdd}
        style={{
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
        + Add goal
      </button>
    </div>
  );
}
