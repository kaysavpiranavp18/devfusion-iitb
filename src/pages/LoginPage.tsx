import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, GitPullRequest, Mail } from 'lucide-react';
import { useAuthStore } from '../store';
import { Button } from '../components/ui/Button';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password);
    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-ink mb-4">
            <Code2 size={32} className="text-canvas" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Welcome to DevCollab</h1>
          <p className="text-sm text-muted mt-1">Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="bg-surface-card border border-hairline p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="block w-full border border-hairline bg-surface-card text-ink placeholder:text-muted px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="block w-full border border-hairline bg-surface-card text-ink placeholder:text-muted px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white"
              />
            </div>
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign In
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-hairline" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-surface-card px-2 text-muted">or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-hairline text-sm font-medium text-body hover:bg-surface-card transition-colors">
              <GitPullRequest size={18} /> GitHub
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-hairline text-sm font-medium text-body hover:bg-surface-card transition-colors">
              <Mail size={18} /> Google
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-muted mt-6">
          Don't have an account?{' '}
          <button onClick={() => navigate('/register')} className="text-ink font-bold hover:text-body">
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-ink mb-4">
            <Code2 size={32} className="text-canvas" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Create Account</h1>
          <p className="text-sm text-muted mt-1">Join DevCollab and start collaborating</p>
        </div>

        <div className="bg-surface-card border border-hairline p-8">
          <form onSubmit={(e) => { e.preventDefault(); navigate('/dashboard'); }} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="block w-full border border-hairline bg-surface-card text-ink placeholder:text-muted px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="block w-full border border-hairline bg-surface-card text-ink placeholder:text-muted px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink">Password</label>
              <input type="password" placeholder="Create a password" className="block w-full border border-hairline bg-surface-card text-ink placeholder:text-muted px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white" />
            </div>
            <Button type="submit" className="w-full" size="lg">Create Account</Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="text-ink font-bold hover:text-body">Sign in</button>
        </p>
      </div>
    </div>
  );
}
