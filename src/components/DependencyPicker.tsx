import { useState, useRef, useEffect, useCallback } from 'react';

interface DependencyPickerProps {
  availableTasks: { id: string; name: string; status: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  Pending: '#8E8E93',
  Ready: '#007AFF',
  InProgress: '#FF9500',
  Completed: '#30D158',
  Failed: '#FF3B30',
};

export default function DependencyPicker({
  availableTasks,
  selectedIds,
  onChange,
  disabled,
}: DependencyPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedTasks = availableTasks.filter((t) =>
    selectedIds.includes(t.id),
  );
  const unselectedTasks = availableTasks.filter(
    (t) => !selectedIds.includes(t.id),
  );

  const handleAdd = useCallback(
    (id: string) => {
      onChange([...selectedIds, id]);
    },
    [selectedIds, onChange],
  );

  const handleRemove = useCallback(
    (id: string) => {
      onChange(selectedIds.filter((x) => x !== id));
    },
    [selectedIds, onChange],
  );

  // Click-outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      data-testid="dependency-picker"
      style={{ position: 'relative' }}
      onKeyDown={handleKeyDown}
    >
      {/* Selected tags */}
      {selectedTasks.length > 0 && (
        <div
          data-testid="dependency-tags"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            marginBottom: 6,
          }}
        >
          {selectedTasks.map((task) => (
            <span
              key={task.id}
              data-testid={`dependency-tag-${task.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                background: 'rgba(0,122,255,0.08)',
                color: '#007AFF',
                border: '1px solid rgba(0,122,255,0.15)',
              }}
            >
              {task.name}
              {!disabled && (
                <span
                  data-testid={`dependency-remove-${task.id}`}
                  onClick={() => handleRemove(task.id)}
                  style={{
                    cursor: 'pointer',
                    marginLeft: 4,
                    color: 'rgba(0,122,255,0.5)',
                    fontWeight: 600,
                    lineHeight: 1,
                  }}
                >
                  ×
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Trigger */}
      <button
        data-testid="dependency-picker-trigger"
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid rgba(0,0,0,0.10)',
          borderRadius: 10,
          fontSize: 13,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: 'rgba(60,60,67,0.72)',
          background: disabled ? 'rgba(0,0,0,0.03)' : '#fff',
          cursor: disabled ? 'default' : 'pointer',
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>Add dependency…</span>
        <span style={{ fontSize: 10 }}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          data-testid="dependency-picker-dropdown"
          style={{
            position: 'absolute',
            zIndex: 50,
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'rgba(255,255,255,0.98)',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            maxHeight: 200,
            overflow: 'auto',
          }}
        >
          {unselectedTasks.length === 0 ? (
            <div
              data-testid="dependency-picker-empty"
              style={{
                padding: '12px',
                fontSize: 12,
                color: 'rgba(60,60,67,0.72)',
                textAlign: 'center',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              No other tasks in this wave
            </div>
          ) : (
            unselectedTasks.map((task) => (
              <div
                key={task.id}
                data-testid={`dependency-option-${task.id}`}
                onClick={() => handleAdd(task.id)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background =
                    'rgba(0,122,255,0.06)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background =
                    'transparent';
                }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'background 0.15s ease',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: STATUS_COLORS[task.status] ?? '#8E8E93',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    color: '#1c1c1e',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {task.name}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: 'rgba(60,60,67,0.72)',
                    fontFamily: "'JetBrains Mono', monospace",
                    marginLeft: 'auto',
                  }}
                >
                  {task.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
