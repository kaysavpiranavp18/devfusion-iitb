import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { TopNavbar } from './components/layout/TopNavbar';

// Pages
import { LoginPage, RegisterPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkspacesPage } from './pages/WorkspacesPage';
import { WorkspaceOverviewPage } from './pages/WorkspaceOverviewPage';
import { ProjectBoardPage } from './pages/ProjectBoardPage';
import { ProjectTasksPage } from './pages/ProjectTasksPage';
import { ProjectDocsPage } from './pages/ProjectDocsPage';
import { ProjectSnippetsPage } from './pages/ProjectSnippetsPage';
import { ProjectActivityPage } from './pages/ProjectActivityPage';
import { ProjectEditorPage } from './pages/ProjectEditorPage';
import { ProfilePage } from './pages/ProfilePage';
import { PaymentsPage } from './pages/PaymentsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-canvas dark flex flex-col overflow-hidden">
      <TopNavbar />
      <main className="flex-1 flex flex-col min-h-0 bg-canvas overflow-hidden">
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
        <Route path="/onboarding" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <OnboardingPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/workspaces" element={<ProtectedRoute><AppLayout><WorkspacesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><AppLayout><PaymentsPage /></AppLayout></ProtectedRoute>} />

        {/* Workspace routes */}
        <Route path="/workspace/:workspaceId/overview" element={<ProtectedRoute><AppLayout><WorkspaceOverviewPage /></AppLayout></ProtectedRoute>} />

        {/* Project routes */}
        <Route path="/workspace/:workspaceId/project/:projectId/board" element={<ProtectedRoute><AppLayout><ProjectBoardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/workspace/:workspaceId/project/:projectId/tasks" element={<ProtectedRoute><AppLayout><ProjectTasksPage /></AppLayout></ProtectedRoute>} />
        <Route path="/workspace/:workspaceId/project/:projectId/docs" element={<ProtectedRoute><AppLayout><ProjectDocsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/workspace/:workspaceId/project/:projectId/snippets" element={<ProtectedRoute><AppLayout><ProjectSnippetsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/workspace/:workspaceId/project/:projectId/activity" element={<ProtectedRoute><AppLayout><ProjectActivityPage /></AppLayout></ProtectedRoute>} />
        <Route path="/workspace/:workspaceId/project/:projectId/editor" element={<ProtectedRoute><AppLayout><ProjectEditorPage /></AppLayout></ProtectedRoute>} />

        {/* Default redirect */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/onboarding" replace />} />
        <Route path="*" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/onboarding" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
