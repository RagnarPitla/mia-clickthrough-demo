import { useState } from 'react';
import type { NavPage, Project } from '../types/domain';

interface DashboardSidebarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  scopeBadge?: number;
  projects?: Project[];
  activeProjectId?: string | null;
  onSelectProject?: (id: string) => void;
  onNewProject?: () => void;
}

interface NavItem {
  id: NavPage;
  label: string;
  icon: string;
}

const UPPER_NAV: NavItem[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'process', label: 'Scope', icon: '📋' },
  { id: 'phases', label: 'Phases', icon: '📊' },
  { id: 'waves', label: 'Waves', icon: '🌊' },
  { id: 'tasks', label: 'Tasks', icon: '✅' },
  { id: 'customerData', label: 'Customer Data', icon: '📁' },
  { id: 'skills', label: 'Skills', icon: '🧰' },
];

const LOWER_NAV: NavItem[] = [
  { id: 'team', label: 'Team', icon: '👥' },
  { id: 'watchdog', label: 'WatchDog', icon: '🐕' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const activeStyle = {
  background: 'rgba(0,122,255,0.10)',
  color: '#007AFF',
  fontWeight: 700 as const,
};

const inactiveStyle = {
  background: 'transparent',
  color: '#1c1c1e',
  fontWeight: 500 as const,
};

function NavButton({ item, isActive, onNavigate, badge }: {
  item: NavItem;
  isActive: boolean;
  onNavigate: (page: NavPage) => void;
  badge?: number;
}) {
  const style = isActive ? activeStyle : inactiveStyle;
  return (
    <button
      data-testid={`sidebar-nav-${item.id}`}
      data-active={String(isActive)}
      onClick={() => onNavigate(item.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 10,
        border: 'none',
        cursor: 'pointer',
        fontSize: 13,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        transition: 'background 0.15s',
        width: '100%',
        textAlign: 'left',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.04)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = style.background;
      }}
    >
      <span style={{ fontSize: 16, lineHeight: 1 }}>{item.icon}</span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {badge != null && badge > 0 && (
        <span
          data-testid="scope-badge"
          style={{
            background: '#007AFF',
            color: '#fff',
            fontSize: 10,
            borderRadius: 10,
            padding: '1px 7px',
            fontWeight: 700,
            lineHeight: '16px',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export default function DashboardSidebar({
  activePage,
  onNavigate,
  scopeBadge,
  projects = [],
  activeProjectId,
  onSelectProject,
  onNewProject,
}: DashboardSidebarProps) {
  const [showPicker, setShowPicker] = useState(false);
  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <nav
      data-testid="dashboard-sidebar"
      className="glass"
      style={{
        width: 200,
        flexShrink: 0,
        borderRadius: 14,
        padding: '12px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        overflow: 'visible',
      }}
    >
      {/* Section label */}
      <div
        className="label"
        style={{
          padding: '6px 14px 8px',
          color: 'rgba(60,60,67,0.42)',
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 700,
        }}
      >
        Menu
      </div>

      {/* Upper nav: Home, Scope, Phases, Waves */}
      {UPPER_NAV.map((item) => (
        <NavButton
          key={item.id}
          item={item}
          isActive={activePage === item.id}
          onNavigate={onNavigate}
          badge={item.id === 'process' ? scopeBadge : undefined}
        />
      ))}

      {/* Divider */}
      <div
        data-testid="sidebar-divider"
        style={{
          height: 1,
          background: 'rgba(60,60,67,0.12)',
          margin: '8px 14px',
        }}
      />

      {/* Lower nav: Team, Settings */}
      {LOWER_NAV.map((item) => (
        <NavButton
          key={item.id}
          item={item}
          isActive={activePage === item.id}
          onNavigate={onNavigate}
        />
      ))}

      {/* Spacer to push project switcher to bottom */}
      <div style={{ flex: 1 }} />

      {/* Project Switcher — pinned to bottom */}
      {projects.length > 0 && onSelectProject && (
        <div style={{ padding: '4px 8px', position: 'relative' }}>
          <button
            data-testid="sidebar-project-switcher"
            onClick={() => setShowPicker(p => !p)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 10,
              background: 'rgba(0,0,0,0.03)',
              border: '1px solid rgba(0,0,0,0.06)',
              color: '#1c1c1e',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 500,
              width: '100%',
              textAlign: 'left',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#30D158', flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeProject?.customerName || activeProject?.name || 'Select Project'}
            </span>
            <span style={{ fontSize: 10, opacity: 0.5 }}>▾</span>
          </button>
          {showPicker && (
            <div
              data-testid="sidebar-project-dropdown"
              className="glass"
              style={{
                position: 'absolute',
                bottom: '100%',
                left: 8,
                right: 8,
                marginBottom: 4,
                borderRadius: 10,
                padding: 4,
                zIndex: 100,
                background: 'rgba(255,255,255,0.95)',
              }}
            >
              {projects.map(p => (
                <button
                  key={p.id}
                  data-testid={`sidebar-project-option-${p.id}`}
                  onClick={() => { onSelectProject(p.id); setShowPicker(false); }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 10px',
                    borderRadius: 6,
                    background: p.id === activeProjectId ? 'rgba(0,122,255,0.10)' : 'transparent',
                    border: 'none',
                    color: p.id === activeProjectId ? '#007AFF' : '#1c1c1e',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: p.id === activeProjectId ? 600 : 400,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  <span>{p.customerName || p.name}</span>
                  {p.customerName && <span style={{ fontSize: 9, color: 'rgba(60,60,67,0.42)' }}>{p.name}</span>}
                </button>
              ))}
              {/* New Project */}
              <div style={{ height: 1, background: 'rgba(60,60,67,0.12)', margin: '4px 6px' }} />
              <button
                data-testid="sidebar-new-project"
                onClick={() => {
                  setShowPicker(false);
                  if (onNewProject) {
                    onNewProject();
                  } else {
                    window.location.hash = '#/new';
                  }
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: 'transparent',
                  border: 'none',
                  color: '#007AFF',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 600,
                }}
              >
                + New Project
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
