import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { Sidebar } from './components/layout/Sidebar';
import { useUIStore } from './store';
import { clsx } from 'clsx';

// Pages
import { LoginPage, RegisterPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkspacesPage } from './pages/WorkspacesPage';
import { WorkspaceOverviewPage } from './pages/WorkspaceOverviewPage';
import { ProjectBoardPage } from './pages/ProjectBoardPage';
import { ProjectTasksPage } from './pages/ProjectTasksPage';
import { ProjectDocsPage } from './pages/ProjectDocsPage';
import { ProjectSnippetsPage } from './pages/ProjectSnippetsPage';
import { ProjectActivityPage } from './pages/ProjectActivityPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { PaymentsPage } from './pages/PaymentsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useUIStore();
  return (
    <div className="min-h-screen bg-[#0f172a] dark">
      <Sidebar />
      <main className={clsx(
        'transition-all duration-300 min-h-screen',
        sidebarOpen ? 'ml-64' : 'ml-16',
      )}>
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/workspaces" element={<ProtectedRoute><AppLayout><WorkspacesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><AppLayout><PaymentsPage /></AppLayout></ProtectedRoute>} />

        {/* Workspace routes */}
        <Route path="/workspace/:workspaceId/overview" element={<ProtectedRoute><AppLayout><WorkspaceOverviewPage /></AppLayout></ProtectedRoute>} />

        {/* Project routes */}
        <Route path="/workspace/:workspaceId/project/:projectId/board" element={<ProtectedRoute><AppLayout><ProjectBoardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/workspace/:workspaceId/project/:projectId/tasks" element={<ProtectedRoute><AppLayout><ProjectTasksPage /></AppLayout></ProtectedRoute>} />
        <Route path="/workspace/:workspaceId/project/:projectId/docs" element={<ProtectedRoute><AppLayout><ProjectDocsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/workspace/:workspaceId/project/:projectId/snippets" element={<ProtectedRoute><AppLayout><ProjectSnippetsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/workspace/:workspaceId/project/:projectId/activity" element={<ProtectedRoute><AppLayout><ProjectActivityPage /></AppLayout></ProtectedRoute>} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
