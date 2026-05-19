import { useState, useEffect, useRef, useCallback } from 'react';
import type { E2EProcess, Phase } from '../types/domain';
import { Kzk_e2eprocessesService } from '../generated/services/Kzk_e2eprocessesService';
import { useBpcTree } from '../hooks/useBpcTree';
import type { BpcTreeNode } from '../hooks/useBpcTree';

export type ApprovalState = 'Proposed' | 'UnderReview' | 'Approved' | 'Rejected';
export type FilterTab = 'all' | 'inScope' | 'needsReview' | 'rejected';

interface BusinessProcessPageProps {
  processes: E2EProcess[];
  phases: Phase[];
  loading: boolean;
  onProcessesChange?: (updated: E2EProcess[]) => void;
  readOnly?: boolean;
}

/* ── Visual hierarchy constants ── */
const LEVEL_INDENT = 28;

const glass = {
  background: '#fff',
  border: '1px solid rgba(0,0,0,0.08)',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

/* Elevated card for E2E rows */
const e2eCard: React.CSSProperties = {
  background: '#f9fafb',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 12,
  padding: '12px 16px',
  marginBottom: 2,
  transition: 'all 0.2s ease',
};

const e2eCardHover: React.CSSProperties = {
  background: '#f3f4f6',
  borderColor: 'rgba(0,0,0,0.12)',
  transform: 'translateY(-1px)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

/* Phase pill colors */
const PHASE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Completed: { bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.30)', text: '#15803d' },
  Active: { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)', text: '#b45309' },
  NotStarted: { bg: 'rgba(0,0,0,0.04)', border: 'rgba(0,0,0,0.10)', text: 'rgba(0,0,0,0.45)' },
};

/* Approval state badge colors */
const APPROVAL_COLORS: Record<ApprovalState, { bg: string; border: string; text: string }> = {
  Proposed: { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)', text: '#b45309' },
  UnderReview: { bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.30)', text: '#1d4ed8' },
  Approved: { bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.30)', text: '#15803d' },
  Rejected: { bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.30)', text: '#b91c1c' },
};

/* Level-specific styling */
const LEVEL_STYLES: Record<number, { fontSize: number; fontWeight: number; color: string; bulletSize: number; bulletColor: string }> = {
  2: { fontSize: 12, fontWeight: 600, color: '#4b5563', bulletSize: 0, bulletColor: '' },
  3: { fontSize: 11, fontWeight: 400, color: '#6b7280', bulletSize: 5, bulletColor: 'rgba(0,0,0,0.15)' },
  4: { fontSize: 10, fontWeight: 400, color: '#9ca3af', bulletSize: 4, bulletColor: 'rgba(0,0,0,0.10)' },
};

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'inScope', label: 'In Scope' },
  { id: 'needsReview', label: 'Needs Review' },
  { id: 'rejected', label: 'Rejected' },
];

function getActivePhase(phases: Phase[]): Phase | null {
  const sorted = [...phases].sort((a, b) => a.order - b.order);
  const active = sorted.find(p => p.status === 'Active');
  if (active) return active;
  const completed = sorted.filter(p => p.status === 'Completed');
  if (completed.length > 0) return completed[completed.length - 1];
  return sorted[0] ?? null;
}

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function BusinessProcessPage({ processes, phases, loading, onProcessesChange, readOnly = false }: BusinessProcessPageProps) {
  const [toggling, setToggling] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { getChildren, countDescendants, loading: treeLoading } = useBpcTree(!readOnly);

  // BPC depth setting from localStorage (default: 3 = E2E + Area + Process)
  const [maxDepth, setMaxDepth] = useState(() => {
    try { return parseInt(localStorage.getItem('kazuki-bpc-depth') ?? '3', 10); } catch { return 3; }
  });
  useEffect(() => {
    const sync = () => { try { setMaxDepth(parseInt(localStorage.getItem('kazuki-bpc-depth') ?? '3', 10)); } catch {} };
    window.addEventListener('storage', sync);
    const interval = setInterval(sync, 1000);
    return () => { window.removeEventListener('storage', sync); clearInterval(interval); };
  }, []);

  // Review UX state
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [lastCheckedIndex, setLastCheckedIndex] = useState<number | null>(null);
  const [approvalStates, setApprovalStates] = useState<Map<string, ApprovalState>>(new Map());

  // Clear state when process list changes (project switch)
  const prevProcessIds = useRef<string>('');
  useEffect(() => {
    const ids = processes.map(p => p.id).sort().join(',');
    if (prevProcessIds.current && ids !== prevProcessIds.current) {
      setExpanded(new Set());
      setCheckedIds(new Set());
      setSelectedProcessId(null);
      setLastCheckedIndex(null);
      setApprovalStates(new Map());
      setSearchQuery('');
      setActiveFilter('all');
    }
    prevProcessIds.current = ids;
  }, [processes]);

  // Escape key closes detail panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedProcessId(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const getApproval = useCallback((id: string): ApprovalState => {
    return approvalStates.get(id) ?? 'Proposed';
  }, [approvalStates]);

  const setApproval = useCallback((ids: string[], state: ApprovalState) => {
    setApprovalStates(prev => {
      const next = new Map(prev);
      for (const id of ids) next.set(id, state);
      return next;
    });
  }, []);

  // Filtering
  const getFilterCount = useCallback((tab: FilterTab): number => {
    return processes.filter(p => {
      const approval = getApproval(p.id);
      if (tab === 'inScope') return p.isInScope;
      if (tab === 'needsReview') return approval === 'UnderReview';
      if (tab === 'rejected') return approval === 'Rejected';
      return true;
    }).length;
  }, [processes, getApproval]);

  const filteredProcesses = processes.filter(p => {
    const approval = getApproval(p.id);
    if (activeFilter === 'inScope' && !p.isInScope) return false;
    if (activeFilter === 'needsReview' && approval !== 'UnderReview') return false;
    if (activeFilter === 'rejected' && approval !== 'Rejected') return false;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.bpcId.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const inScopeCount = processes.filter(p => p.isInScope).length;
  const activePhase = getActivePhase(phases);
  const phaseStyle = activePhase
    ? PHASE_COLORS[activePhase.status] ?? PHASE_COLORS.NotStarted
    : PHASE_COLORS.NotStarted;

  const toggleExpand = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleToggleScope = async (proc: E2EProcess, e: React.MouseEvent) => {
    e.stopPropagation();
    setToggling(proc.id);
    try {
      if (readOnly) {
        onProcessesChange?.(processes.map(p => p.id === proc.id ? { ...p, isInScope: !p.isInScope } : p));
        return;
      }
      await Kzk_e2eprocessesService.update(proc.id, { kzk_isinscope: !proc.isInScope } as any);
      onProcessesChange?.(processes.map(p => p.id === proc.id ? { ...p, isInScope: !p.isInScope } : p));
    } catch {
      // silently fail for POC
    } finally {
      setToggling(null);
    }
  };

  const handleCheckbox = (procId: string, index: number, shiftKey: boolean) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (shiftKey && lastCheckedIndex !== null) {
        const start = Math.min(lastCheckedIndex, index);
        const end = Math.max(lastCheckedIndex, index);
        for (let i = start; i <= end; i++) {
          if (filteredProcesses[i]) next.add(filteredProcesses[i].id);
        }
      } else {
        if (next.has(procId)) next.delete(procId);
        else next.add(procId);
      }
      return next;
    });
    setLastCheckedIndex(index);
  };

  const handleBulkAction = (state: ApprovalState) => {
    setApproval(Array.from(checkedIds), state);
    setCheckedIds(new Set());
    setLastCheckedIndex(null);
  };

  const selectedProcess = selectedProcessId ? processes.find(p => p.id === selectedProcessId) ?? null : null;

  /* ── Recursive tree renderer ── */
  const renderTreeNodes = (nodes: BpcTreeNode[], depth: number, dimmed: boolean): React.JSX.Element[] => {
    const elements: React.JSX.Element[] = [];
    for (const node of nodes) {
      const key = `bpc:${node.catalogCode}`;
      const isExpanded = expanded.has(key);
      const hasKids = node.children.length > 0;
      const canExpand = hasKids && depth < maxDepth;
      const indent = LEVEL_INDENT * depth;
      const style = LEVEL_STYLES[Math.min(depth + 1, 4)] ?? LEVEL_STYLES[4];

      elements.push(
        <div
          key={node.id}
          data-testid={`bpc-row-${node.catalogCode}`}
          onClick={canExpand ? (e) => { e.stopPropagation(); toggleExpand(key); } : undefined}
          onMouseOver={e => { if (canExpand) (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0.02)'; }}
          onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: `5px 12px 5px ${indent + 20}px`,
            opacity: dimmed ? 0.3 : 1,
            transition: 'all 0.15s',
            cursor: canExpand ? 'pointer' : 'default',
            borderBottom: '1px solid rgba(0,0,0,0.04)',
          }}
        >
          {canExpand ? (
            <span style={{
              fontSize: 10,
              color: 'var(--text-tertiary)',
              transition: 'transform 0.2s',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
              display: 'inline-block',
              width: 12,
              flexShrink: 0,
            }}>▸</span>
          ) : (
            <span style={{
              width: style.bulletSize,
              height: style.bulletSize,
              borderRadius: '50%',
              background: style.bulletColor,
              flexShrink: 0,
              marginLeft: 3,
              marginRight: 4,
            }} />
          )}
          <span style={{ fontSize: style.fontSize, color: style.color, fontWeight: style.fontWeight }}>
            {node.name}
          </span>
          {node.catalogCode && (
            <span style={{
              fontSize: 9,
              color: 'rgba(0,0,0,0.35)',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {node.catalogCode}
            </span>
          )}
          {depth === 1 && node.children.length > 0 && (
            <span style={{
              fontSize: 9,
              color: 'rgba(0,0,0,0.40)',
              fontFamily: "'JetBrains Mono', monospace",
              marginLeft: 'auto',
            }}>
              {node.children.length}
            </span>
          )}
        </div>
      );

      if (isExpanded && canExpand) {
        elements.push(...renderTreeNodes(node.children, depth + 1, dimmed));
      }
    }
    return elements;
  };

  if ((loading || treeLoading) && processes.length === 0) {
    return (
      <div data-testid="process-page" style={{ padding: 24, borderRadius: 18, ...glass }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 600, marginBottom: 12, color: '#1a1a2e' }}>
          Business Process Scope
        </h2>
        <div style={{ fontSize: 13, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", animation: 'pulse 1.2s ease-in-out infinite' }}>
          Loading processes…
        </div>
      </div>
    );
  }

  return (
    <div data-testid="process-page" style={{ padding: 24, borderRadius: 18, position: 'relative', ...glass }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 600, margin: 0, color: '#1a1a2e' }}>
            Business Process Scope
          </h2>
          <div data-testid="scope-count" style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>
            {inScopeCount} of {processes.length} in scope
          </div>
        </div>
        {/* Search */}
        <input
          data-testid="bpc-search"
          type="text"
          placeholder="Search by name or BPC #…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: 240,
            padding: '7px 14px',
            borderRadius: 10,
            background: '#f3f4f6',
            border: '1px solid rgba(0,0,0,0.10)',
            color: '#1a1a2e',
            fontSize: 12,
            fontFamily: "'DM Sans', sans-serif",
            outline: 'none',
          }}
        />
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {FILTER_TABS.map(tab => {
          const count = getFilterCount(tab.id);
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              data-testid={`filter-${tab.id}`}
              onClick={() => { setActiveFilter(tab.id); setCheckedIds(new Set()); setLastCheckedIndex(null); }}
              style={{
                padding: '5px 14px',
                borderRadius: 10,
                background: isActive ? 'var(--accent-glow)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${isActive ? 'var(--accent-border)' : 'rgba(0,0,0,0.08)'}`,
                color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                fontFamily: "'DM Sans', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {tab.label}
              <span style={{
                fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
                opacity: 0.7,
                minWidth: 14,
                textAlign: 'center',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tree — card-based layout */}
      <div data-testid="process-tree" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filteredProcesses.map((proc, index) => {
          const dimmed = !proc.isInScope;
          const e2eKey = `e2e:${proc.bpcId}`;
          const isExpanded = expanded.has(e2eKey);
          const children = getChildren(proc.bpcId);
          const descendantCount = countDescendants(proc.bpcId);
          const isChecked = checkedIds.has(proc.id);
          const approval = getApproval(proc.id);
          const approvalStyle = APPROVAL_COLORS[approval];

          return (
            <div key={proc.id} data-testid={`process-card-${proc.id}`}>
              <div
                data-testid={`process-row-${proc.id}`}
                onMouseOver={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  Object.assign(el.style, {
                    background: e2eCardHover.background,
                    borderColor: (e2eCardHover as any).borderColor,
                    transform: e2eCardHover.transform,
                    boxShadow: e2eCardHover.boxShadow,
                  });
                }}
                onMouseOut={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  Object.assign(el.style, {
                    background: e2eCard.background,
                    borderColor: 'rgba(0,0,0,0.08)',
                    transform: 'none',
                    boxShadow: 'none',
                  });
                }}
                style={{ ...e2eCard, opacity: dimmed ? 0.4 : 1 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    data-testid={`checkbox-${proc.id}`}
                    checked={isChecked}
                    onClick={e => e.stopPropagation()}
                    onChange={e => {
                      e.stopPropagation();
                      handleCheckbox(proc.id, index, e.nativeEvent instanceof MouseEvent && e.nativeEvent.shiftKey);
                    }}
                    style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }}
                  />

                  {/* Expand chevron */}
                  <span
                    data-testid={`expand-chevron-${proc.id}`}
                    onClick={e => { e.stopPropagation(); toggleExpand(e2eKey); }}
                    style={{
                      fontSize: 12,
                      color: 'var(--text-tertiary)',
                      transition: 'transform 0.2s',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
                      display: 'inline-block',
                      width: 14,
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                  >▸</span>

                  {/* Name + modules — clickable to open detail panel */}
                  <div
                    data-testid={`process-name-${proc.id}`}
                    onClick={e => { e.stopPropagation(); setSelectedProcessId(proc.id); }}
                    style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontWeight: 700,
                        color: dimmed ? '#9ca3af' : '#1a1a2e',
                        fontSize: 14,
                        letterSpacing: '-0.01em',
                      }}>
                        {proc.name}
                      </span>
                      <span style={{
                        fontSize: 10,
                        color: 'var(--accent)',
                        fontFamily: "'JetBrains Mono', monospace",
                        opacity: 0.7,
                      }}>
                        {proc.bpcId}
                      </span>
                    </div>
                    {proc.modules && (
                      <div style={{
                        fontSize: 10,
                        color: 'var(--text-tertiary)',
                        fontFamily: "'JetBrains Mono', monospace",
                        marginTop: 2,
                      }}>
                        {proc.modules}
                      </div>
                    )}
                  </div>

                  {/* Approval badge */}
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    fontFamily: "'JetBrains Mono', monospace",
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: approvalStyle.bg,
                    border: `1px solid ${approvalStyle.border}`,
                    color: approvalStyle.text,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {approval}
                  </span>

                  {/* Phase pill */}
                  {activePhase && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                      padding: '3px 10px',
                      borderRadius: 20,
                      background: phaseStyle.bg,
                      border: `1px solid ${phaseStyle.border}`,
                      color: phaseStyle.text,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}>
                      {activePhase.name}
                    </span>
                  )}

                  {/* Descendant count */}
                  {descendantCount > 0 && (
                    <span style={{
                      fontSize: 10,
                      color: 'var(--text-tertiary)',
                      fontFamily: "'JetBrains Mono', monospace",
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}>
                      {descendantCount} items
                    </span>
                  )}

                  {/* Scope toggle */}
                  <span
                    data-testid={`scope-toggle-${proc.id}`}
                    onClick={(e) => handleToggleScope(proc, e)}
                    style={{
                      display: 'inline-block',
                      width: 36,
                      height: 18,
                      borderRadius: 9,
                      position: 'relative',
                      background: proc.isInScope ? 'rgba(61,154,255,0.3)' : 'rgba(0,0,0,0.06)',
                      border: `1px solid ${proc.isInScope ? 'rgba(61,154,255,0.5)' : 'rgba(0,0,0,0.12)'}`,
                      transition: 'all 0.2s',
                      opacity: toggling === proc.id ? 0.5 : 1,
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: 2,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      left: proc.isInScope ? 20 : 2,
                      background: proc.isInScope ? 'var(--accent)' : 'var(--text-tertiary)',
                      transition: 'left 0.2s',
                    }} />
                  </span>
                </div>
              </div>

              {/* Expanded children */}
              {isExpanded && (
                <div style={{
                  marginLeft: 8,
                  borderLeft: '2px solid rgba(0,0,0,0.06)',
                  marginTop: 2,
                  marginBottom: 4,
                }}>
                  {children.length === 0 && !treeLoading && (
                    <div style={{
                      padding: '8px 12px 8px 24px',
                      fontSize: 11,
                      color: 'var(--text-tertiary)',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontStyle: 'italic',
                    }}>
                      No catalog items for {proc.bpcId}
                    </div>
                  )}
                  {treeLoading && children.length === 0 && (
                    <div style={{
                      padding: '8px 12px 8px 24px',
                      fontSize: 11,
                      color: 'var(--accent)',
                      fontFamily: "'JetBrains Mono', monospace",
                      animation: 'pulse 1.2s ease-in-out infinite',
                    }}>
                      Loading catalog…
                    </div>
                  )}
                  {renderTreeNodes(children, 1, dimmed)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {processes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
          No business processes configured
        </div>
      )}

      {/* Bulk action bar */}
      {checkedIds.size > 0 && (
        <div
          data-testid="bulk-action-bar"
          style={{
            position: 'sticky',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 16px',
            marginTop: 12,
            borderRadius: 12,
            background: '#fff',
            border: '1px solid rgba(59,130,246,0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <span style={{ fontSize: 12, color: '#1a1a2e', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
            {checkedIds.size} selected
          </span>
          <span style={{ flex: 1 }} />
          <button
            data-testid="bulk-under-review"
            onClick={() => handleBulkAction('UnderReview')}
            style={{
              padding: '5px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600,
              background: APPROVAL_COLORS.UnderReview.bg,
              border: `1px solid ${APPROVAL_COLORS.UnderReview.border}`,
              color: APPROVAL_COLORS.UnderReview.text,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Mark Under Review
          </button>
          <button
            data-testid="bulk-approve"
            onClick={() => handleBulkAction('Approved')}
            style={{
              padding: '5px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600,
              background: APPROVAL_COLORS.Approved.bg,
              border: `1px solid ${APPROVAL_COLORS.Approved.border}`,
              color: APPROVAL_COLORS.Approved.text,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Approve Selected
          </button>
          <button
            data-testid="bulk-reject"
            onClick={() => handleBulkAction('Rejected')}
            style={{
              padding: '5px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600,
              background: APPROVAL_COLORS.Rejected.bg,
              border: `1px solid ${APPROVAL_COLORS.Rejected.border}`,
              color: APPROVAL_COLORS.Rejected.text,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Reject Selected
          </button>
        </div>
      )}

      {/* Slide-over detail panel */}
      {selectedProcess && (
        <div
          data-testid="detail-panel"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '40%',
            minWidth: 320,
            background: '#fff',
            backdropFilter: 'blur(28px)',
            borderLeft: '1px solid rgba(0,0,0,0.10)',
            borderRadius: '0 18px 18px 0',
            padding: 24,
            overflow: 'auto',
            zIndex: 10,
            boxShadow: '-4px 0 16px rgba(0,0,0,0.08)',
          }}
        >
          {/* Close button */}
          <button
            data-testid="detail-close"
            onClick={() => setSelectedProcessId(null)}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 28,
              height: 28,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.10)',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            ✕
          </button>

          {/* Title */}
          <h3
            data-testid="detail-panel-title"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 18,
              fontWeight: 600,
              color: '#1a1a2e',
              margin: '0 0 4px',
              paddingRight: 40,
            }}
          >
            {selectedProcess.name}
          </h3>
          <div style={{
            fontSize: 11,
            color: 'var(--accent)',
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 20,
            opacity: 0.7,
          }}>
            {selectedProcess.bpcId}
          </div>

          {/* Approval state */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Approval Status
            </div>
            <span
              data-testid="detail-approval-badge"
              style={{
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
                padding: '5px 14px',
                borderRadius: 20,
                background: APPROVAL_COLORS[getApproval(selectedProcess.id)].bg,
                border: `1px solid ${APPROVAL_COLORS[getApproval(selectedProcess.id)].border}`,
                color: APPROVAL_COLORS[getApproval(selectedProcess.id)].text,
              }}
            >
              {getApproval(selectedProcess.id)}
            </span>
          </div>

          {/* Approval actions */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {(['Proposed', 'UnderReview', 'Approved', 'Rejected'] as ApprovalState[]).map(state => {
              const isCurrent = getApproval(selectedProcess.id) === state;
              const style = APPROVAL_COLORS[state];
              return (
                <button
                  key={state}
                  data-testid={`detail-set-${state.toLowerCase()}`}
                  onClick={() => setApproval([selectedProcess.id], state)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: 10,
                    fontWeight: isCurrent ? 700 : 400,
                    background: isCurrent ? style.bg : 'rgba(0,0,0,0.03)',
                    border: `1px solid ${isCurrent ? style.border : 'rgba(0,0,0,0.08)'}`,
                    color: isCurrent ? style.text : '#6b7280',
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {state}
                </button>
              );
            })}
          </div>

          {/* Modules */}
          {selectedProcess.modules && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Modules
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {selectedProcess.modules}
              </div>
            </div>
          )}

          {/* Areas */}
          {selectedProcess.areas && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Why Mia selected it
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {selectedProcess.areas}
              </div>
            </div>
          )}

          {/* Scope toggle */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Scope
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                data-testid="detail-scope-toggle"
                onClick={(e) => handleToggleScope(selectedProcess, e)}
                style={{
                  display: 'inline-block',
                  width: 40,
                  height: 20,
                  borderRadius: 10,
                  position: 'relative',
                  background: selectedProcess.isInScope ? 'rgba(61,154,255,0.3)' : 'rgba(0,0,0,0.06)',
                  border: `1px solid ${selectedProcess.isInScope ? 'rgba(61,154,255,0.5)' : 'rgba(0,0,0,0.12)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: 3,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  left: selectedProcess.isInScope ? 22 : 3,
                  background: selectedProcess.isInScope ? 'var(--accent)' : 'var(--text-tertiary)',
                  transition: 'left 0.2s',
                }} />
              </span>
              <span style={{ fontSize: 12, color: selectedProcess.isInScope ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                {selectedProcess.isInScope ? 'In Scope' : 'Out of Scope'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
