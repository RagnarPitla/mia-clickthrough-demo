import { useState } from 'react';
import type { BpcTreeNode } from '../hooks/useBpcTree';

interface ScopeTreeProps {
  e2es: BpcTreeNode[];
  selected: Set<string>;
  onToggle: (catalogCode: string) => void;
  loading?: boolean;
}

export default function ScopeTree({ e2es, selected, onToggle, loading }: ScopeTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (code: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  if (loading) {
    return (
      <div data-testid="scope-tree" style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: 12 }}>
        Loading scope…
      </div>
    );
  }

  const totalAreas = e2es.reduce((sum, e) => sum + e.children.length, 0);
  const selectedAreaCount = e2es
    .filter((e) => selected.has(e.catalogCode))
    .reduce((sum, e) => sum + e.children.length, 0);

  return (
    <div data-testid="scope-tree">
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
        Scope (from playbook)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {e2es.map((e2e) => {
          const isSelected = selected.has(e2e.catalogCode);
          const isExpanded = expanded.has(e2e.catalogCode);
          const hasChildren = e2e.children.length > 0;

          return (
            <div key={e2e.catalogCode}>
              <div
                data-testid={`scope-e2e-${e2e.catalogCode}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-xs)',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--accent-light)' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                {hasChildren && (
                  <button
                    data-testid={`scope-expand-${e2e.catalogCode}`}
                    onClick={() => toggleExpand(e2e.catalogCode)}
                    style={{
                      width: 20,
                      height: 20,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: 11,
                      color: 'var(--text-tertiary)',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                )}
                {!hasChildren && <span style={{ width: 20 }} />}

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flex: 1,
                    cursor: 'pointer',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  <input
                    data-testid={`scope-toggle-${e2e.catalogCode}`}
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(e2e.catalogCode)}
                    style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
                  />
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      color: 'var(--text-tertiary)',
                      minWidth: 24,
                    }}
                  >
                    {e2e.catalogCode}
                  </span>
                  {e2e.name}
                </label>
              </div>

              {isExpanded && hasChildren && (
                <div
                  data-testid={`scope-children-${e2e.catalogCode}`}
                  style={{ paddingLeft: 48, display: 'flex', flexDirection: 'column', gap: 1 }}
                >
                  {e2e.children.map((area) => (
                    <div
                      key={area.catalogCode}
                      data-testid={`scope-area-${area.catalogCode}`}
                      style={{
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        padding: '3px 4px',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 10,
                          color: 'var(--text-tertiary)',
                          marginRight: 6,
                        }}
                      >
                        {area.catalogCode}
                      </span>
                      {area.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        data-testid="scope-stats"
        style={{
          marginTop: 12,
          fontSize: 12,
          color: 'var(--text-tertiary)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {selected.size}/{e2es.length} E2Es in scope · {selectedAreaCount}/{totalAreas} process areas
      </div>
    </div>
  );
}
