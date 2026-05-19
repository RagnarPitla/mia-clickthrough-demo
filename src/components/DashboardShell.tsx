import type { ReactNode } from 'react';

interface DashboardShellProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export default function DashboardShell({ sidebar, children }: DashboardShellProps) {
  return (
    <div
      data-testid="dashboard-shell"
      style={{
        display: 'flex',
        flex: 1,
        gap: 12,
        overflow: 'hidden',
      }}
    >
      {sidebar}
      <div
        data-testid="dashboard-content-area"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}
