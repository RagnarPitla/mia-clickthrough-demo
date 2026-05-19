import { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  type Node,
  type Edge,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import type { Task } from '../types/domain';
import TaskNode, { type TaskNodeData } from './TaskNode';

const nodeTypes = { task: TaskNode };
// Keep the default fit at 100%+ so task nodes stay readable even on wide
// canvases. Users can still zoom out manually via the Controls panel.
const fitViewOpts = { padding: 0.15, minZoom: 1.0, maxZoom: 1.4 };
const proOpts = { hideAttribution: true };

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;

function layoutGraph(tasks: Task[]): { nodes: Node<TaskNodeData>[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 80 });

  for (const t of tasks) {
    g.setNode(t.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  const edges: Edge[] = [];
  for (const t of tasks) {
    for (const predId of t.predecessorIds) {
      const edgeId = `${predId}->${t.id}`;
      g.setEdge(predId, t.id);
      edges.push({
        id: edgeId,
        source: predId,
        target: t.id,
        animated: tasks.find(x => x.id === predId)?.status === 'InProgress',
        style: { stroke: 'var(--border-glass)', strokeWidth: 2 },
      });
    }
  }

  dagre.layout(g);

  const nodes: Node<TaskNodeData>[] = tasks.map(t => {
    const pos = g.node(t.id);
    return {
      id: t.id,
      type: 'task',
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: {
        label: t.name,
        status: t.status,
        skillName: t.skillName,
        attempt: t.attempt,
        outputSummary: t.outputSummary,
        awaitingUser: t.awaitingUser,
      },
    };
  });

  return { nodes, edges };
}

interface TaskGraphProps {
  tasks: Task[];
  onTaskClick?: (taskId: string) => void;
}

const miniMapNodeColor = (n: Node<TaskNodeData>) => {
  const status = n.data?.status;
  const map: Record<string, string> = {
    Completed: '#30D158', InProgress: '#007AFF', Ready: '#FF9F0A',
    Failed: '#FF3B30', Pending: '#8E8E93',
  };
  return map[status ?? ''] ?? '#8E8E93';
};

export default function TaskGraph({ tasks, onTaskClick }: TaskGraphProps) {
  const { nodes, edges } = useMemo(() => layoutGraph(tasks), [tasks]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onTaskClick?.(node.id);
    },
    [onTaskClick]
  );

  if (tasks.length === 0) {
    return <div data-testid="task-graph-empty" style={{ width: '100%', height: '100%' }} />;
  }

  return (
    <div data-testid="task-graph" style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={fitViewOpts}
        minZoom={0.2}
        maxZoom={4}
        zoomOnScroll
        zoomOnPinch
        panOnScroll={false}
        proOptions={proOpts}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--text-tertiary)" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={miniMapNodeColor}
          style={{ background: 'var(--bg-deep)' }}
        />
      </ReactFlow>
    </div>
  );
}
