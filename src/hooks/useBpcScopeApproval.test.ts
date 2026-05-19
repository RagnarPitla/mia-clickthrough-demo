import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useBpcScopeApproval, sortByScope } from './useBpcScopeApproval';
import type { BpcTreeNode } from './useBpcTree';

// Mock the E2E service
vi.mock('../generated/services/Kzk_e2eprocessesService', () => ({
  Kzk_e2eprocessesService: {
    update: vi.fn().mockResolvedValue({}),
  },
}));

/** Helper to build a tree node */
function makeNode(id: string, children: BpcTreeNode[] = []): BpcTreeNode {
  return {
    id,
    name: `Node ${id}`,
    catalogCode: id,
    parentCode: '',
    itemType: 'ProcessArea',
    description: '',
    children,
  };
}

describe('useBpcScopeApproval', () => {
  describe('getState', () => {
    it('returns default state for unknown node', () => {
      const { result } = renderHook(() => useBpcScopeApproval());
      const state = result.current.getState('unknown-id');
      expect(state).toEqual({
        isInScope: true,
        approvalState: 'Proposed',
        aiProposed: false,
      });
    });
  });

  describe('initFromProcesses', () => {
    it('initializes E2E process scope states', () => {
      const { result } = renderHook(() => useBpcScopeApproval());

      act(() => {
        result.current.initFromProcesses([
          { id: 'e2e-1', isInScope: true },
          { id: 'e2e-2', isInScope: false },
        ]);
      });

      expect(result.current.getState('e2e-1').isInScope).toBe(true);
      expect(result.current.getState('e2e-2').isInScope).toBe(false);
    });

    it('does not overwrite existing state on re-init', () => {
      const { result } = renderHook(() => useBpcScopeApproval());

      act(() => {
        result.current.initFromProcesses([{ id: 'e2e-1', isInScope: true }]);
      });
      act(() => {
        result.current.setApproval('e2e-1', 'Approved');
      });
      act(() => {
        result.current.initFromProcesses([{ id: 'e2e-1', isInScope: false }]);
      });

      // Should keep existing state, not overwrite
      expect(result.current.getState('e2e-1').approvalState).toBe('Approved');
    });
  });

  describe('toggleScope', () => {
    it('toggles a single node scope', () => {
      const { result } = renderHook(() => useBpcScopeApproval());
      const tree = [makeNode('n1')];

      act(() => {
        result.current.toggleScope('n1', tree);
      });

      // Default is in-scope, so toggle should set out-of-scope
      expect(result.current.getState('n1').isInScope).toBe(false);
    });

    it('cascades scope toggle to all descendants', () => {
      const { result } = renderHook(() => useBpcScopeApproval());
      const tree = [
        makeNode('parent', [
          makeNode('child1', [
            makeNode('grandchild1'),
            makeNode('grandchild2'),
          ]),
          makeNode('child2'),
        ]),
      ];

      act(() => {
        result.current.toggleScope('parent', tree);
      });

      // Parent and all descendants should be out-of-scope
      expect(result.current.getState('parent').isInScope).toBe(false);
      expect(result.current.getState('child1').isInScope).toBe(false);
      expect(result.current.getState('child2').isInScope).toBe(false);
      expect(result.current.getState('grandchild1').isInScope).toBe(false);
      expect(result.current.getState('grandchild2').isInScope).toBe(false);
    });

    it('toggles back to in-scope with cascade', () => {
      const { result } = renderHook(() => useBpcScopeApproval());
      const tree = [
        makeNode('parent', [makeNode('child1'), makeNode('child2')]),
      ];

      // Toggle off
      act(() => {
        result.current.toggleScope('parent', tree);
      });
      expect(result.current.getState('parent').isInScope).toBe(false);

      // Toggle on
      act(() => {
        result.current.toggleScope('parent', tree);
      });
      expect(result.current.getState('parent').isInScope).toBe(true);
      expect(result.current.getState('child1').isInScope).toBe(true);
      expect(result.current.getState('child2').isInScope).toBe(true);
    });

    it('child toggle does not affect parent', () => {
      const { result } = renderHook(() => useBpcScopeApproval());
      const tree = [
        makeNode('parent', [makeNode('child1'), makeNode('child2')]),
      ];

      act(() => {
        result.current.toggleScope('child1', tree);
      });

      expect(result.current.getState('parent').isInScope).toBe(true);
      expect(result.current.getState('child1').isInScope).toBe(false);
      expect(result.current.getState('child2').isInScope).toBe(true);
    });
  });

  describe('setApproval', () => {
    it('sets approval state on a node', () => {
      const { result } = renderHook(() => useBpcScopeApproval());

      act(() => {
        result.current.setApproval('n1', 'UnderReview');
      });

      expect(result.current.getState('n1').approvalState).toBe('UnderReview');
    });

    it('clears aiProposed when approval is Approved', () => {
      const { result } = renderHook(() => useBpcScopeApproval());

      act(() => {
        result.current.markAiProposed('n1');
      });
      expect(result.current.getState('n1').aiProposed).toBe(true);

      act(() => {
        result.current.setApproval('n1', 'Approved');
      });
      expect(result.current.getState('n1').aiProposed).toBe(false);
      expect(result.current.getState('n1').approvalState).toBe('Approved');
    });

    it('does NOT clear aiProposed on UnderReview', () => {
      const { result } = renderHook(() => useBpcScopeApproval());

      act(() => {
        result.current.markAiProposed('n1');
      });
      act(() => {
        result.current.setApproval('n1', 'UnderReview');
      });

      expect(result.current.getState('n1').aiProposed).toBe(true);
    });

    it('does NOT clear aiProposed on Rejected', () => {
      const { result } = renderHook(() => useBpcScopeApproval());

      act(() => {
        result.current.markAiProposed('n1');
      });
      act(() => {
        result.current.setApproval('n1', 'Rejected');
      });

      expect(result.current.getState('n1').aiProposed).toBe(true);
    });
  });

  describe('markAiProposed', () => {
    it('sets aiProposed, Proposed approval, and in-scope', () => {
      const { result } = renderHook(() => useBpcScopeApproval());

      act(() => {
        result.current.markAiProposed('n1');
      });

      const state = result.current.getState('n1');
      expect(state.aiProposed).toBe(true);
      expect(state.approvalState).toBe('Proposed');
      expect(state.isInScope).toBe(true);
    });
  });
});

describe('sortByScope', () => {
  it('puts out-of-scope items at the bottom', () => {
    const stateMap = new Map([
      ['a', { isInScope: false, approvalState: 'Proposed' as const, aiProposed: false }],
      ['b', { isInScope: true, approvalState: 'Proposed' as const, aiProposed: false }],
      ['c', { isInScope: true, approvalState: 'Proposed' as const, aiProposed: false }],
    ]);

    const nodes = [makeNode('a'), makeNode('b'), makeNode('c')];
    const sorted = sortByScope(nodes, stateMap);

    expect(sorted[0].id).toBe('b');
    expect(sorted[1].id).toBe('c');
    expect(sorted[2].id).toBe('a');
  });

  it('preserves order within scope groups', () => {
    const stateMap = new Map([
      ['a', { isInScope: true, approvalState: 'Proposed' as const, aiProposed: false }],
      ['b', { isInScope: true, approvalState: 'Proposed' as const, aiProposed: false }],
    ]);

    const nodes = [makeNode('a'), makeNode('b')];
    const sorted = sortByScope(nodes, stateMap);

    expect(sorted[0].id).toBe('a');
    expect(sorted[1].id).toBe('b');
  });

  it('treats unknown nodes as in-scope (default)', () => {
    const stateMap = new Map<string, any>();
    const nodes = [makeNode('a'), makeNode('b')];
    const sorted = sortByScope(nodes, stateMap);

    expect(sorted[0].id).toBe('a');
    expect(sorted[1].id).toBe('b');
  });
});
