import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Mail, CheckCircle2, AlertTriangle, LogOut, ArrowRight, Shield } from 'lucide-react';
import { useAuthStore, useWorkspaceStore } from '../store';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { backendJson } from '../lib/api';
import { supabase } from '../lib/supabase';

interface DecodedToken {
  email: string;
  workspaceId: string;
  workspaceName: string;
  role: string;
  invitedBy: string;
  expiresAt: number;
}

export function InviteAcceptPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const { user, profile } = useAuthStore();
  const { fetchWorkspaces } = useWorkspaceStore();

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<DecodedToken | null>(null);
  const [success, setSuccess] = useState(false);

  // Decode token on mount
  useEffect(() => {
    if (!token) {
      setError('Missing invitation token.');
      setLoading(false);
      return;
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 2) {
        setError('Invalid invitation token format.');
        setLoading(false);
        return;
      }

      const payloadBase64 = parts[0];
      const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const payload = JSON.parse(jsonPayload) as DecodedToken;
      
      if (Date.now() > payload.expiresAt) {
        setError('This invitation token has expired.');
      } else {
        setDecoded(payload);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to parse invitation token.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Handle invitation acceptance
  const handleAcceptInvite = async () => {
    if (!token || !decoded) return;
    setAccepting(true);
    setError(null);

    try {
      await backendJson('/workspaces/invite/accept', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });

      setSuccess(true);
      localStorage.removeItem('pending_invite_token');
      
      // Refresh workspaces store so the new workspace is available
      await fetchWorkspaces();

      // Redirect to the workspace dashboard overview after 2 seconds
      setTimeout(() => {
        navigate(`/workspace/${decoded.workspaceId}/overview`);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to accept invitation. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  // Handle logout to switch accounts
  const handleLogout = async () => {
    try {
      if (token) {
        localStorage.setItem('pending_invite_token', token);
      }
      await supabase.auth.signOut();
      useAuthStore.setState({ user: null, profile: null, isAuthenticated: false });
      navigate('/onboarding');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Redirect to onboarding/register
  const handleGoToRegister = () => {
    if (token) {
      localStorage.setItem('pending_invite_token', token);
    }
    navigate('/onboarding?mode=register');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a10] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-xs text-muted font-medium uppercase tracking-wider">Decoding invitation...</p>
      </div>
    );
  }

  // Check email mismatch
  const emailMismatch = user && decoded && profile && profile.email.toLowerCase() !== decoded.email.toLowerCase();

  return (
    <div className="min-h-screen bg-[#070a10] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />

      <Card className="max-w-md w-full border border-hairline bg-[#0d1117] shadow-2xl relative">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="logo text-primary font-bold text-2xl tracking-tighter">DevCollab</div>
            <p className="text-xs text-muted font-medium uppercase tracking-wider">Workspace Invitation</p>
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Invitation Error</span>
              </div>
              <p className="text-xs font-light">{error}</p>
              {!user && (
                <Button size="sm" onClick={() => navigate('/onboarding')} className="w-full mt-2">
                  Go to Dashboard
                </Button>
              )}
            </div>
          )}

          {success && decoded && (
            <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-ink">Invitation Accepted!</h3>
                <p className="text-xs text-muted">Adding you to <strong>{decoded.workspaceName}</strong>...</p>
              </div>
              <p className="text-[10px] text-muted animate-pulse">Redirecting you to the workspace overview...</p>
            </div>
          )}

          {!error && !success && decoded && (
            <div className="space-y-6">
              {/* Workspace Badge Card */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 text-center space-y-3">
                <div className="w-14 h-14 bg-primary/20 border border-primary/30 text-primary rounded-xl flex items-center justify-center mx-auto text-xl font-bold uppercase">
                  {decoded.workspaceName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink">{decoded.workspaceName}</h2>
                  <p className="text-xs text-muted flex items-center justify-center gap-1.5 mt-1 font-light">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    Role: <span className="capitalize font-medium text-ink">{decoded.role}</span>
                  </p>
                </div>
              </div>

              {/* Action Flows based on Auth State */}
              {!user ? (
                // Scenario 1: Not logged in
                <div className="space-y-4">
                  <p className="text-xs text-muted text-center leading-relaxed">
                    You have been invited to join this workspace. Please register an account or log in with your email <strong className="text-ink">{decoded.email}</strong> to accept this invite.
                  </p>
                  <div className="flex flex-col gap-2 pt-2">
                    <Button onClick={handleGoToRegister} className="w-full flex items-center justify-center gap-2 py-2.5">
                      <span>Create Account & Join</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" onClick={() => navigate('/onboarding?mode=login')} className="w-full">
                      Sign In to Join
                    </Button>
                  </div>
                </div>
              ) : emailMismatch ? (
                // Scenario 2: Logged in, but email mismatch
                <div className="space-y-4 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Account Mismatch</span>
                  </div>
                  <p className="text-xs font-light leading-relaxed">
                    This invitation was sent to <strong className="text-ink">{decoded.email}</strong>, but you are currently logged in as <strong className="text-ink">{profile?.email}</strong>.
                  </p>
                  <p className="text-xs font-light leading-relaxed">
                    Please log out and sign in using the correct email address to accept the invitation.
                  </p>
                  <Button variant="secondary" onClick={handleLogout} className="w-full mt-2 flex items-center justify-center gap-2 border-amber-500/30 hover:bg-amber-500/10">
                    <LogOut className="w-4 h-4" />
                    <span>Log Out & Switch Accounts</span>
                  </Button>
                </div>
              ) : (
                // Scenario 3: Logged in & email matches
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-white/5 border border-hairline rounded-xl">
                    <Mail className="w-5 h-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted">Accepting as</p>
                      <p className="text-xs font-semibold text-ink truncate">{decoded.email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted leading-relaxed text-center font-light">
                    By accepting, you will gain access to this workspace and its projects as a team member.
                  </p>
                  <Button 
                    onClick={handleAcceptInvite} 
                    disabled={accepting} 
                    className="w-full py-2.5 flex items-center justify-center gap-2"
                  >
                    {accepting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Accepting Invitation...</span>
                      </>
                    ) : (
                      <>
                        <span>Accept Invitation</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
