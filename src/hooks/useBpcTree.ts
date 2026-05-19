import { useState, useEffect, useRef } from 'react';
import { Kzk_bpccatalogsService } from '../generated/services/Kzk_bpccatalogsService';
import { timed } from './usePerfLog';

export interface BpcTreeNode {
  id: string;
  name: string;
  catalogCode: string;
  parentCode: string;
  itemType: string;
  description: string;
  children: BpcTreeNode[];
}

/**
 * Pre-fetches all BPC catalog items and builds a parentCode→children map.
 * Returns a function to get the tree under any root code instantly.
 */
export function useBpcTree(enabled = true) {
  const [childrenMap, setChildrenMap] = useState<Map<string, BpcTreeNode[]>>(new Map());
  const [roots, setRoots] = useState<BpcTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (!enabled) {
      fetched.current = false;
      setChildrenMap(new Map());
      setRoots([]);
      setLoading(false);
      setError(null);
      return;
    }
    if (fetched.current) return;
    fetched.current = true;

    (async () => {
      try {
        const items = await timed('fetchAllBpcCatalog', async () => {
          const allItems: BpcTreeNode[] = [];
          let hasMore = true;
          let skipToken: string | undefined;

          while (hasMore) {
            const result = await Kzk_bpccatalogsService.getAll({
              select: [
                'kzk_bpccatalogid', 'kzk_name', 'kzk_catalogcode',
                'kzk_itemtype', 'kzk_parentcode', 'kzk_itemdescription',
              ],
              orderBy: ['kzk_catalogcode asc'],
              maxPageSize: 500,
              ...(skipToken ? { skipToken } : {}),
            });

            for (const r of result.data ?? []) {
              allItems.push({
                id: r.kzk_bpccatalogid,
                name: r.kzk_name,
                catalogCode: r.kzk_catalogcode ?? '',
                parentCode: r.kzk_parentcode ?? '',
                itemType: r.kzk_itemtype ?? '',
                description: r.kzk_itemdescription ?? '',
                children: [],
              });
            }

            // Check for pagination
            const nextLink = (result as any).nextLink;
            if (nextLink && (result.data?.length ?? 0) > 0) {
              // Extract skipToken from nextLink if available
              const url = new URL(nextLink, 'https://placeholder');
              skipToken = url.searchParams.get('$skiptoken') ?? undefined;
              hasMore = !!skipToken;
            } else {
              hasMore = false;
            }
          }
          return allItems;
        });

        // Build parentCode → children map
        const map = new Map<string, BpcTreeNode[]>();
        for (const item of items) {
          const key = item.parentCode;
          if (!key) continue;
          const list = map.get(key) ?? [];
          list.push(item);
          map.set(key, list);
        }

        // Sort each group by numeric catalog code segments
        for (const [, children] of map) {
          children.sort((a, b) => compareCatalogCodes(a.catalogCode, b.catalogCode));
        }

        // Attach children recursively
        const attachChildren = (node: BpcTreeNode): BpcTreeNode => {
          const kids = map.get(node.catalogCode) ?? [];
          return { ...node, children: kids.map(attachChildren) };
        };

        // Rebuild map with full tree attached
        const fullMap = new Map<string, BpcTreeNode[]>();
        for (const [parentCode, children] of map) {
          fullMap.set(parentCode, children.map(attachChildren));
        }

        // Collect root E2E items (no parent code)
        const rootItems = items
          .filter(item => !item.parentCode || item.itemType === 'E2E')
          .filter((item, _idx, arr) => {
            // Deduplicate: prefer itemType='E2E', fallback to no parentCode
            if (item.itemType === 'E2E') return true;
            return !arr.some(other => other.id === item.id && other.itemType === 'E2E');
          })
          .map(attachChildren)
          .sort((a, b) => compareCatalogCodes(a.catalogCode, b.catalogCode));

        setRoots(rootItems);
        setChildrenMap(fullMap);
        setError(null);
      } catch (e: any) {
        setError(e.message ?? 'Failed to load BPC catalog');
      } finally {
        setLoading(false);
      }
    })();
  }, [enabled]);

  /** Get children for a given parent catalog code (e.g., E2E bpcId) */
  const getChildren = (parentCode: string): BpcTreeNode[] => {
    return childrenMap.get(parentCode) ?? [];
  };

  /** Count all descendants under a parent code */
  const countDescendants = (parentCode: string): number => {
    const children = childrenMap.get(parentCode) ?? [];
    let count = 0;
    const walk = (nodes: BpcTreeNode[]) => {
      for (const n of nodes) {
        count++;
        walk(n.children);
      }
    };
    walk(children);
    return count;
  };

  return { roots, getChildren, countDescendants, loading, error };
}

/** Sort catalog codes numerically (60.2 before 60.10) */
function compareCatalogCodes(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na !== nb) return na - nb;
  }
  return 0;
}
