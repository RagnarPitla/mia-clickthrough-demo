import type { ReactNode } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/AppShell';
import IndexRedirect from './pages/IndexRedirect';
import WelcomePage from './pages/WelcomePage';
import SetupPage from './pages/SetupPage';
import CreatingPage from './pages/CreatingPage';
import DashboardContent from './components/DashboardContent';

interface RouteConfig {
  path?: string;
  index?: boolean;
  element: ReactNode;
  children?: RouteConfig[];
}

export const appRoutes: RouteConfig[] = [
  {
    element: <AppShell />,
    children: [
      { index: true, element: <IndexRedirect /> },
      { path: 'new', element: <WelcomePage /> },
      { path: 'setup', element: <SetupPage /> },
      { path: 'creating', element: <CreatingPage /> },
      { path: 'dashboard/*', element: <DashboardContent /> },
    ],
  },
];

export default function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        {appRoutes.map((route, i) => {
          if (route.children) {
            return (
              <Route key={i} element={route.element}>
                {route.children.map((child, j) => (
                  <Route
                    key={j}
                    index={child.index}
                    path={child.path}
                    element={child.element}
                  />
                ))}
              </Route>
            );
          }
          return <Route key={i} path={route.path} element={route.element} />;
        })}
      </Routes>
    </HashRouter>
  );
}
