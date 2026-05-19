import type { PlaybookLayer } from '../types/domain';

const LAYER_COLORS: Record<PlaybookLayer, string> = {
  Microsoft: '#007AFF',
  Partner: '#30D158',
  Customer: '#8E8E93',
};

const LAYER_ICONS: Record<PlaybookLayer, string> = {
  Microsoft: '⬡',
  Partner: '◈',
  Customer: '◇',
};

interface PublisherBadgeProps {
  publisher: string;
  layer: PlaybookLayer;
}

export default function PublisherBadge({ publisher, layer }: PublisherBadgeProps) {
  const color = LAYER_COLORS[layer] ?? '#8E8E93';
  const icon = LAYER_ICONS[layer] ?? '◇';

  return (
    <span
      data-testid="publisher-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color,
        background: `${color}14`,
        border: `1px solid ${color}30`,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 12 }}>{icon}</span>
      {publisher}
    </span>
  );
}
