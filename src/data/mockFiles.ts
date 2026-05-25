export interface FileSystemNode {
  name: string;
  type: 'file' | 'directory';
  children?: FileSystemNode[];
  content?: string;
  badge?: string;
  badgeColor?: string;
}

export const mockFiles: Record<string, string> = {
  'App.tsx': `import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from './store';
import { supabase } from './lib/supabase';
import { TopNavbar } from './components/layout/TopNavbar';

// Pages
import { LoginPage, RegisterPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';

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
  
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={user ? <Navigate to="/dashboard" replace /> : <OnboardingPage />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/workspaces" element={<ProtectedRoute><AppLayout><WorkspacesPage /></AppLayout></ProtectedRoute>} />
        
        {/* Project routes */}
        <Route path="/workspace/:workspaceId/project/:projectId/board" element={<ProtectedRoute><AppLayout><ProjectBoardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/workspace/:workspaceId/project/:projectId/tasks" element={<ProtectedRoute><AppLayout><ProjectTasksPage /></AppLayout></ProtectedRoute>} />
        <Route path="/workspace/:workspaceId/project/:projectId/docs" element={<ProtectedRoute><AppLayout><ProjectDocsPage /></AppLayout></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}`,
  'index.css': `@import "tailwindcss";

@theme {
  /* ── Brand & Accent ───────────────────────────────────────────── */
  --color-primary: #ffffff;
  --color-m-blue-light: #0066b1;
  --color-m-blue-dark: #1c69d4;
  --color-m-red: #e22718;
  --color-electric-blue: #0653b6;

  /* ── Surface ladder ───────────────────────────────────────────── */
  --color-canvas: #000000;
  --color-surface-soft: #0d0d0d;
  --color-surface-card: #1a1a1a;
  --color-surface-elevated: #262626;
  --color-carbon-gray: #2b2b2b;

  /* ── Hairline borders ─────────────────────────────────────────── */
  --color-hairline: #3c3c3c;

  /* ── Text ─────────────────────────────────────────────────────── */
  --color-ink: #ffffff;
  --color-body: #bbbbbb;
  --color-body-strong: #e6e6e6;
  --color-muted: #7e7e7e;
}

body {
  margin: 0;
  font-family: var(--font-sans);
  color: var(--color-body);
  background: var(--color-canvas);
  -webkit-font-smoothing: antialiased;
}`,
  'package.json': `{
  "name": "devfusion-iitb",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@hello-pangea/dnd": "^18.0.1",
    "@tailwindcss/vite": "^4.3.0",
    "clsx": "^2.1.1",
    "date-fns": "^4.2.1",
    "lucide-react": "^1.16.0",
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "react-router-dom": "^7.15.1",
    "tailwindcss": "^4.3.0",
    "zustand": "^5.0.13"
  }
}`,
  'README.md': `# DevCollab — Real-time Project Collaboration Platform

DevCollab is an app designed to simplify real-time coordination, task boards, wiki editing, and shared code snippets for development teams.

## Tech Stack
- **Core**: React, TypeScript, React Router
- **Styling**: Tailwind CSS v4, Vanilla CSS variables
- **State**: Zustand stores

## Key Features
- **Kanban Board**: Drag-and-drop workspace cards categorized by progress columns.
- **Task List**: Full task tracking with assignee tags, status flags, and comment history.
- **Wiki Docs**: Rich Notion-like editor for workspace documentation.
- **AI Assistant**: Automate task lists, code reviews, and summaries directly in the workspace.
- **Code Snippets**: Shared library for reusable snippets.`,
  'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})`,
  'main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
};

export const fileTree: FileSystemNode[] = [
  {
    name: '.sixth',
    type: 'directory',
    children: [
      { name: 'config.json', type: 'file' },
      { name: 'session.db', type: 'file' }
    ]
  },
  {
    name: 'node_modules',
    type: 'directory',
    children: [
      { name: 'react', type: 'directory' },
      { name: 'vite', type: 'directory' }
    ]
  },
  {
    name: 'public',
    type: 'directory',
    children: [
      { name: 'vite.svg', type: 'file' },
      { name: 'logo.png', type: 'file' }
    ]
  },
  {
    name: 'src',
    type: 'directory',
    children: [
      {
        name: 'assets',
        type: 'directory',
        children: [
          { name: 'logo.svg', type: 'file' }
        ]
      },
      {
        name: 'components',
        type: 'directory',
        children: [
          { name: 'kanban', type: 'directory' },
          { name: 'layout', type: 'directory' },
          { name: 'ui', type: 'directory' }
        ]
      },
      {
        name: 'data',
        type: 'directory',
        children: [
          { name: 'mock.ts', type: 'file' }
        ]
      },
      {
        name: 'pages',
        type: 'directory',
        children: [
          { name: 'DashboardPage.tsx', type: 'file' },
          { name: 'LoginPage.tsx', type: 'file' }
        ]
      },
      {
        name: 'store',
        type: 'directory',
        children: [
          { name: 'index.ts', type: 'file' }
        ]
      },
      {
        name: 'types',
        type: 'directory',
        children: [
          { name: 'index.ts', type: 'file' }
        ]
      },
      { name: 'App.tsx', type: 'file', badge: 'M', badgeColor: 'text-amber-500' },
      { name: 'index.css', type: 'file' },
      { name: 'main.tsx', type: 'file' }
    ]
  },
  { name: '.gitignore', type: 'file' },
  { name: 'eslint.config.js', type: 'file' },
  { name: 'index.html', type: 'file' },
  { name: 'package-lock.json', type: 'file' },
  { name: 'package.json', type: 'file', badge: 'M', badgeColor: 'text-amber-500' },
  { name: 'README.md', type: 'file' },
  { name: 'tsconfig.app.json', type: 'file' },
  { name: 'tsconfig.json', type: 'file' },
  { name: 'tsconfig.node.json', type: 'file' },
  { name: 'vite.config.ts', type: 'file' }
];
