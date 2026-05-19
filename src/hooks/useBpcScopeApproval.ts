import { useState, useCallback, useRef } from 'react';
import type { BpcTreeNode } from './useBpcTree';
import { Kzk_e2eprocessesService } from '../generated/services/Kzk_e2eprocessesService';

export type ApprovalState = 'Proposed' | 'UnderReview' | 'Approved' | 'Rejected';

export interface ScopeApprovalState {
  isInScope: boolean;
  approvalState: ApprovalState;
  aiProposed: boolean;
}

const DEFAULT_STATE: ScopeApprovalState = {
  isInScope: true,
  approvalState: 'Proposed',
  aiProposed: false,
};

/** Collect all descendant node IDs from a tree node recursively */
function collectDescendantIds(node: BpcTreeNode): string[] {
  const ids: string[] = [];
  const walk = (n: BpcTreeNode) => {
    for (const child of n.children) {
      ids.push(child.id);
      walk(child);
    }
  };
  walk(node);
  return ids;
}

/** Find a node by id in a tree */
function findNode(nodes: BpcTreeNode[], id: string): BpcTreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children, id);
    if (found) return found;
  }
  return null;
}

/**
 * Sort children so out-of-scope items go to bottom, preserving catalog order within each group.
 */
export function sortByScope(
  nodes: BpcTreeNode[],
  stateMap: Map<string, ScopeApprovalState>,
): BpcTreeNode[] {
  return [...nodes].sort((a, b) => {
    const aScope = (stateMap.get(a.id) ?? DEFAULT_STATE).isInScope;
    const bScope = (stateMap.get(b.id) ?? DEFAULT_STATE).isInScope;
    if (aScope !== bScope) return aScope ? -1 : 1;
    return 0; // preserve existing catalog order within scope groups
  });
}

/**
 * Manages scope and approval state for BPC tree nodes.
 * E2E-level scope persists to Dataverse; child-level scope is in-memory for POC.
 */
export function useBpcScopeApproval() {
  const [stateMap, setStateMap] = useState<Map<string, ScopeApprovalState>>(new Map());
  const pendingUpdates = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  /** Get the scope/approval state for a node, defaulting to in-scope/Proposed */
  const getState = useCallback((nodeId: string): ScopeApprovalState => {
    return stateMap.get(nodeId) ?? { ...DEFAULT_STATE };
  }, [stateMap]);

  /** Set state for one node */
  const setNodeState = useCallback((nodeId: string, patch: Partial<ScopeApprovalState>) => {
    setStateMap(prev => {
      const next = new Map(prev);
      const current = prev.get(nodeId) ?? { ...DEFAULT_STATE };
      next.set(nodeId, { ...current, ...patch });
      return next;
    });
  }, []);

  /**
   * Toggle scope for a node and cascade to all descendants.
   * If toggling off: all descendants go out of scope.
   * If toggling on: all descendants restored to in-scope.
   */
  const toggleScope = useCallback((
    nodeId: string,
    allTreeRoots: BpcTreeNode[],
    e2eProcessId?: string,
  ) => {
    const current = stateMap.get(nodeId) ?? { ...DEFAULT_STATE };
    const newScope = !current.isInScope;

    setStateMap(prev => {
      const next = new Map(prev);
      // Update the target node
      const existing = prev.get(nodeId) ?? { ...DEFAULT_STATE };
      next.set(nodeId, { ...existing, isInScope: newScope });

      // Find the node in tree to get descendants
      const node = findNode(allTreeRoots, nodeId);
      if (node) {
        const descendantIds = collectDescendantIds(node);
        for (const did of descendantIds) {
          const dState = prev.get(did) ?? { ...DEFAULT_STATE };
          next.set(did, { ...dState, isInScope: newScope });
        }
      }

      return next;
    });

    // Persist E2E-level scope to Dataverse (optimistic — already updated UI)
    if (e2eProcessId) {
      // Clear any pending debounce for this E2E
      const pending = pendingUpdates.current.get(e2eProcessId);
      if (pending) clearTimeout(pending);

      const timer = setTimeout(() => {
        Kzk_e2eprocessesService.update(e2eProcessId, {
          kzk_isinscope: newScope,
        } as any).catch(() => {
          // Silent fail for POC — could add rollback here
        });
        pendingUpdates.current.delete(e2eProcessId);
      }, 100);
      pendingUpdates.current.set(e2eProcessId, timer);
    }
  }, [stateMap]);

  /**
   * Set approval state for a node.
   * If approved and aiProposed, clears the AI chip.
   */
  const setApproval = useCallback((nodeId: string, approval: ApprovalState) => {
    setStateMap(prev => {
      const next = new Map(prev);
      const current = prev.get(nodeId) ?? { ...DEFAULT_STATE };
      const updated: ScopeApprovalState = { ...current, approvalState: approval };
      // Clear AI-proposed chip on human approval
      if (approval === 'Approved' && current.aiProposed) {
        updated.aiProposed = false;
      }
      next.set(nodeId, updated);
      return next;
    });
  }, []);

  /**
   * Mark a node as AI-proposed (sets aiProposed flag + Proposed approval state).
   */
  const markAiProposed = useCallback((nodeId: string) => {
    setNodeState(nodeId, { aiProposed: true, approvalState: 'Proposed', isInScope: true });
  }, [setNodeState]);

  /**
   * Initialize E2E process scope states from the loaded process data.
   */
  const initFromProcesses = useCallback((processes: Array<{ id: string; isInScope: boolean }>) => {
    setStateMap(prev => {
      const next = new Map(prev);
      for (const p of processes) {
        if (!next.has(p.id)) {
          next.set(p.id, {
            isInScope: p.isInScope,
            approvalState: 'Proposed',
            aiProposed: false,
          });
        }
      }
      return next;
    });
  }, []);

  return {
    getState,
    toggleScope,
    setApproval,
    markAiProposed,
    initFromProcesses,
    stateMap,
    sortByScope: (nodes: BpcTreeNode[]) => sortByScope(nodes, stateMap),
  };
}
