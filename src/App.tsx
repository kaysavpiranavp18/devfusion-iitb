import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from './store';
import { supabase } from './lib/supabase';
import { TopNavbar } from './components/layout/TopNavbar';

// Pages
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
import { InviteAcceptPage } from './pages/InviteAcceptPage';
import { WorkspaceSettingsPage } from './pages/WorkspaceSettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  
  if (loading) {
    return (
      <div className="h-screen w-screen bg-canvas flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs text-muted font-medium uppercase tracking-wider">Loading your session...</p>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/onboarding" replace />;
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

function PostLoginRedirect() {
  const pendingToken = localStorage.getItem('pending_invite_token');
  if (pendingToken) {
    return <Navigate to={`/invite/accept?token=${pendingToken}`} replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { user, loading } = useAuthStore();

  useEffect(() => {
    const handleThemeChange = () => {
      const activeTheme = localStorage.getItem('themeAccent') || 'rose';
      const THEME_ACCENTS = [
        { id: 'indigo', primary: '#6366f1', blueDark: '#4f46e5' },
        { id: 'emerald', primary: '#10b981', blueDark: '#059669' },
        { id: 'rose', primary: '#f43f5e', blueDark: '#e11d48' },
        { id: 'amber', primary: '#f59e0b', blueDark: '#d97706' },
        { id: 'cyan', primary: '#06b6d4', blueDark: '#0891b2' }
      ];
      const accent = THEME_ACCENTS.find(a => a.id === activeTheme) || THEME_ACCENTS.find(a => a.id === 'rose')!;
      
      document.documentElement.style.setProperty('--color-primary', accent.primary);
      document.documentElement.style.setProperty('--color-m-blue-light', accent.primary);
      document.documentElement.style.setProperty('--color-m-blue-dark', accent.blueDark);
      document.documentElement.style.setProperty('--color-electric-blue', accent.primary);
      
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.href = `/favicons/${activeTheme}.png`;
      }
    };

    handleThemeChange();
    window.addEventListener('theme-changed', handleThemeChange);
    return () => {
      window.removeEventListener('theme-changed', handleThemeChange);
    };
  }, []);

  useEffect(() => {
    let active = true;
    let subscription: any = null;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;

        if (session?.user) {
          useAuthStore.setState({ user: session.user, isAuthenticated: true });
          await useAuthStore.getState().fetchProfile();
        } else {
          useAuthStore.setState({ user: null, profile: null, isAuthenticated: false });
        }
      } catch (err) {
        console.error('initAuth failed:', err);
      } finally {
        if (active) {
          useAuthStore.setState({ loading: false });
        }
      }

      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        const userObj = session?.user || null;
        const currentUser = useAuthStore.getState().user;

        try {
          if (userObj) {
            if (!currentUser || currentUser.id !== userObj.id) {
              useAuthStore.setState({ user: userObj, isAuthenticated: true, loading: true });
              await useAuthStore.getState().fetchProfile();
            }
          } else {
            useAuthStore.setState({ user: null, profile: null, isAuthenticated: false });
          }
        } catch (err) {
          console.error('onAuthStateChange failed:', err);
        } finally {
          useAuthStore.setState({ loading: false });
        }
      });
      subscription = data.subscription;
    };

    initAuth();

    return () => {
      active = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-canvas flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs text-muted font-medium uppercase tracking-wider">Loading your session...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/onboarding" element={user ? <PostLoginRedirect /> : <OnboardingPage />} />
        <Route path="/login" element={<Navigate to="/onboarding" replace />} />
        <Route path="/register" element={<Navigate to="/onboarding" replace />} />
        <Route path="/invite/accept" element={<InviteAcceptPage />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/workspaces" element={<ProtectedRoute><AppLayout><WorkspacesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><AppLayout><PaymentsPage /></AppLayout></ProtectedRoute>} />

        {/* Workspace routes */}
        <Route path="/workspace/:workspaceId/overview" element={<ProtectedRoute><AppLayout><WorkspaceOverviewPage /></AppLayout></ProtectedRoute>} />
        <Route path="/workspace/:workspaceId/settings" element={<ProtectedRoute><AppLayout><WorkspaceSettingsPage /></AppLayout></ProtectedRoute>} />

        {/* Project routes */}
        <Route path="/workspace/:workspaceId/project/:projectId/board" element={<ProtectedRoute><AppLayout><ProjectBoardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/workspace/:workspaceId/project/:projectId/tasks" element={<ProtectedRoute><AppLayout><ProjectTasksPage /></AppLayout></ProtectedRoute>} />
        <Route path="/workspace/:workspaceId/project/:projectId/docs" element={<ProtectedRoute><AppLayout><ProjectDocsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/workspace/:workspaceId/project/:projectId/snippets" element={<ProtectedRoute><AppLayout><ProjectSnippetsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/workspace/:workspaceId/project/:projectId/activity" element={<ProtectedRoute><AppLayout><ProjectActivityPage /></AppLayout></ProtectedRoute>} />
        <Route path="/workspace/:workspaceId/project/:projectId/editor" element={<ProtectedRoute><AppLayout><ProjectEditorPage /></AppLayout></ProtectedRoute>} />

        {/* Default redirect */}
        <Route path="/" element={user ? <PostLoginRedirect /> : <Navigate to="/onboarding" replace />} />
        <Route path="*" element={user ? <PostLoginRedirect /> : <Navigate to="/onboarding" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

