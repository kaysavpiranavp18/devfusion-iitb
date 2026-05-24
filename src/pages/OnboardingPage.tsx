import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Check, ArrowRight, Mail, GitPullRequest,
  Terminal, LayoutDashboard, Palette, X
} from 'lucide-react';
import { useAuthStore } from '../store';
import { clsx } from 'clsx';

const THEMES = [
  { id: 'indigo', primary: '#6366f1', bg: 'bg-[#6366f1]', label: 'Indigo' },
  { id: 'emerald', primary: '#10b981', bg: 'bg-[#10b981]', label: 'Emerald' },
  { id: 'rose', primary: '#f43f5e', bg: 'bg-[#f43f5e]', label: 'Rose' },
  { id: 'amber', primary: '#f59e0b', bg: 'bg-[#f59e0b]', label: 'Amber' },
  { id: 'cyan', primary: '#06b6d4', bg: 'bg-[#06b6d4]', label: 'Cyan' }
];

export function OnboardingPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  
  // Auth state
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  // Carousel slider state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Theme preview state
  const [selectedTheme, setSelectedTheme] = useState('indigo');

  // Simulated Google Auth Modal
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleStep, setGoogleStep] = useState<'select' | 'loading'>('select');

  useEffect(() => {
    // Apply selected theme variables dynamically to this page
    const theme = THEMES.find(t => t.id === selectedTheme);
    if (theme) {
      document.documentElement.style.setProperty('--color-primary', theme.primary);
      document.documentElement.style.setProperty('--color-electric-blue', theme.primary);
      localStorage.setItem('themeAccent', theme.id);
    }
  }, [selectedTheme]);

  // Carousel slide timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 3);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    await login(email, password);
    setLoading(false);
    navigate('/dashboard');
  };

  const handleGoogleLogin = async () => {
    setGoogleStep('select');
    setShowGoogleModal(true);
  };

  const proceedGoogleLogin = async () => {
    setGoogleStep('loading');
    await new Promise(resolve => setTimeout(resolve, 1500));
    await login('alex.rivera@gmail.com', 'password');
    setShowGoogleModal(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#070a10] text-[#c9d1d9] flex flex-col md:flex-row font-sans relative overflow-hidden select-none">
      
      {/* Global CSS injection for keyframe animations */}
      <style>{`
        @keyframes drawPath {
          to { stroke-dashoffset: 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.1); }
        }
        @keyframes cursorMove {
          0%, 100% { transform: translate(10px, 10px); }
          33% { transform: translate(120px, 40px); }
          66% { transform: translate(50px, 90px); }
        }
        @keyframes typeCode {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes floatBubble {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.02); }
        }
        
        .logo-path {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: drawPath 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .logo-path-white {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: drawPath 2.2s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards;
        }
        .glow-overlay {
          background: radial-gradient(circle, var(--color-primary) 0%, transparent 65%);
          animation: pulseGlow 10s ease-in-out infinite;
        }
        .mock-cursor {
          animation: cursorMove 6s ease-in-out infinite;
        }
        .floating-card {
          animation: floatBubble 5s ease-in-out infinite;
        }
      `}</style>

      {/* Decorative Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] glow-overlay pointer-events-none rounded-full blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] glow-overlay pointer-events-none rounded-full blur-[120px]" />

      {/* Left Column: Animated Logo and Carousel Onboarding */}
      <div className="w-full md:w-[55%] flex flex-col justify-between p-6 md:p-12 relative z-10 border-b md:border-b-0 md:border-r border-[#30363d]/30 bg-[#0d1117]/30 backdrop-blur-md">
        
        {/* Header Branding */}
        <div className="flex items-center gap-3">
          {/* Animated SVG Logo */}
          <div className="w-12 h-12 flex items-center justify-center relative group">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Spinning orbiting outer tracks */}
              <circle cx="50" cy="50" r="44" stroke="var(--color-primary)" strokeWidth="1.5" fill="none" strokeDasharray="30 150" className="animate-[spin_6s_linear_infinite]" opacity="0.6" filter="url(#glow)" />
              <circle cx="50" cy="50" r="44" stroke="var(--color-primary)" strokeWidth="0.75" fill="none" strokeDasharray="100 200" className="animate-[spin_10s_linear_infinite_reverse]" opacity="0.35" />
              
              {/* "D" Shape in Primary Accent */}
              <path d="M 38 28 L 38 72 M 38 28 C 60 28, 60 72, 38 72" stroke="var(--color-primary)" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#glow)" className="logo-path" />
              
              {/* "C" Shape in White */}
              <path d="M 63 38 C 50 30, 42 42, 42 50 C 42 58, 50 70, 63 62" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" className="logo-path-white" />
            </svg>
          </div>
          <div>
            <span className="font-extrabold text-lg text-[#ffffff] tracking-wider block leading-none">DEVCOLLAB</span>
            <span className="text-[10px] text-muted tracking-widest uppercase">Next-gen Workspace</span>
          </div>
        </div>

        {/* Dynamic Carousel Feature Slider */}
        <div className="my-10 md:my-auto flex-1 flex flex-col justify-center min-h-[350px]">
          <div className="relative overflow-hidden w-full h-[280px]">
            
            {/* Slide 1: Real-time Kanban Collaboration */}
            <div className={clsx(
              "absolute inset-0 flex flex-col justify-center transition-all duration-700 ease-in-out",
              currentSlide === 0 ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-12 scale-95 pointer-events-none"
            )}>
              <div className="flex gap-4 items-start mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <LayoutDashboard size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Real-Time Teamwork & Kanban</h2>
                  <p className="text-xs text-[#8b949e] leading-relaxed max-w-md">Collaborate instantaneously on interactive visual task boards. Watch teammates shift statuses, drag cards, and tag each other in real-time.</p>
                </div>
              </div>
              
              {/* Slide 1 Visualizer Box */}
              <div className="w-full h-32 bg-[#161b22] border border-[#30363d]/60 rounded-xl p-3 relative overflow-hidden flex gap-3 floating-card">
                {/* Simulated Kanban Columns */}
                <div className="w-1/3 flex flex-col gap-1.5 opacity-80">
                  <span className="text-[8px] font-bold text-muted uppercase">Todo</span>
                  <div className="bg-[#0d1117] border border-[#30363d]/45 p-1.5 rounded-lg text-[9px] text-muted font-medium">Setup Socket.IO</div>
                </div>
                <div className="w-1/3 flex flex-col gap-1.5">
                  <span className="text-[8px] font-bold text-primary uppercase">In Progress</span>
                  <div className="bg-[#0d1117] border border-primary/30 p-1.5 rounded-lg text-[9px] text-[#ffffff] font-semibold relative">
                    Design Dashboard
                    <div className="absolute right-1 bottom-1 flex gap-0.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] border border-white/5 flex items-center justify-center text-[5px] text-white">M</div>
                      <div className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] border border-white/5 flex items-center justify-center text-[5px] text-white">A</div>
                    </div>
                  </div>
                </div>
                <div className="w-1/3 flex flex-col gap-1.5 opacity-60">
                  <span className="text-[8px] font-bold text-emerald-500 uppercase">Done</span>
                  <div className="bg-[#0d1117] border border-emerald-500/20 p-1.5 rounded-lg text-[9px] text-muted line-through">Configure Dev Environment</div>
                </div>
                
                {/* Floating cursor */}
                <div className="absolute mock-cursor left-10 top-6 pointer-events-none flex flex-col items-start select-none">
                  <svg className="w-3.5 h-3.5 text-primary filter drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.5 3v15.2l3.8-3.7 4.7 9.8 2.8-1.3-4.6-9.7 5.8-.2z" />
                  </svg>
                  <span className="bg-primary text-[6px] font-bold text-white px-1 py-0.5 rounded ml-2.5 leading-none">Alex Rivera</span>
                </div>
              </div>
            </div>

            {/* Slide 2: AI Code Reviewer */}
            <div className={clsx(
              "absolute inset-0 flex flex-col justify-center transition-all duration-700 ease-in-out",
              currentSlide === 1 ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-12 scale-95 pointer-events-none"
            )}>
              <div className="flex gap-4 items-start mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Sparkles size={20} className="text-[#a78bfa]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Automated AI Code Review</h2>
                  <p className="text-xs text-[#8b949e] leading-relaxed max-w-md">Instantly review code snippets with integrated LLM co-pilots. Receive actionable advice, security analysis, and quality scores automatically.</p>
                </div>
              </div>
              
              {/* Slide 2 Visualizer Box */}
              <div className="w-full h-32 bg-[#161b22] border border-[#30363d]/60 rounded-xl p-3 relative overflow-hidden flex flex-col justify-between font-mono floating-card">
                {/* Terminal Line */}
                <div className="flex items-center gap-1.5 border-b border-[#30363d]/40 pb-1.5 mb-1.5 shrink-0">
                  <Terminal size={11} className="text-muted" />
                  <span className="text-[9px] text-muted">AIAssistant.tsx</span>
                </div>
                
                {/* Typing code snippet */}
                <div className="flex-1 flex gap-2.5 items-start">
                  <div className="w-1/2 flex flex-col gap-1 text-[8px] text-[#8b949e] leading-normal border-r border-[#30363d]/30 pr-2">
                    <span className="text-[#ff7b72]">function <span className="text-[#d2a8ff]">reviewCode</span>() &#123;</span>
                    <span className="pl-3 text-[#79c0ff]">  return <span className="text-[#ff7b72]">await</span> api.fetch();</span>
                    <span className="text-[#ff7b72]">&#125;</span>
                  </div>
                  
                  {/* Review feedback panel */}
                  <div className="w-1/2 bg-[#0d1117] border border-[#30363d]/60 p-2 rounded-lg text-[8px] animate-in fade-in slide-in-from-bottom-2 duration-700 flex flex-col gap-1">
                    <div className="flex justify-between items-center shrink-0">
                      <span className="font-bold text-[#a78bfa] flex items-center gap-0.5"><Sparkles size={8} /> AI Feedback</span>
                      <span className="bg-[#10b981]/25 text-[#10b981] px-1 py-0.2 rounded text-[7px] font-extrabold leading-none">9.0/10</span>
                    </div>
                    <span className="text-[#8b949e] leading-snug">⚠️ Add try/catch bounds for API failures.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide 3: Theme Selector */}
            <div className={clsx(
              "absolute inset-0 flex flex-col justify-center transition-all duration-700 ease-in-out",
              currentSlide === 2 ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-12 scale-95 pointer-events-none"
            )}>
              <div className="flex gap-4 items-start mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Palette size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Workspace Personalization</h2>
                  <p className="text-xs text-[#8b949e] leading-relaxed max-w-md">Express yourself. Customize the visual tone of your collaborative environment. Select your preferred color palette and view theme changes instantly.</p>
                </div>
              </div>
              
              {/* Slide 3 Visualizer Box */}
              <div className="w-full h-32 bg-[#161b22] border border-[#30363d]/60 rounded-xl p-4 flex items-center justify-center gap-4 floating-card">
                {THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={clsx(
                      "w-10 h-10 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-110",
                      selectedTheme === theme.id ? "border-[#ffffff] scale-105 shadow-lg" : "border-transparent"
                    )}
                    style={{ backgroundColor: theme.primary }}
                    title={`Theme Accent: ${theme.label}`}
                  >
                    {selectedTheme === theme.id && <Check size={16} className="text-white filter drop-shadow-md" />}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Dots Indicator */}
          <div className="flex gap-1.5 mt-2 justify-start shrink-0">
            {[0, 1, 2].map(i => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={clsx(
                  "h-1.5 rounded-full transition-all duration-300 border-none cursor-pointer",
                  currentSlide === i ? "w-6 bg-primary" : "w-1.5 bg-[#30363d]"
                )}
                title={`View Onboarding Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Brand Info */}
        <div className="flex items-center justify-between border-t border-[#30363d]/20 pt-6">
          <p className="text-[10px] text-muted">© 2026 DevCollab. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="text-[10px] text-muted hover:text-body transition-colors cursor-pointer">Security</span>
            <span className="text-[10px] text-muted hover:text-body transition-colors cursor-pointer">Status</span>
          </div>
        </div>

      </div>

      {/* Right Column: Sliding Auth Panel */}
      <div className="w-full md:w-[45%] flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-sm">
          
          {/* Main Auth Container Box */}
          <div className="bg-[#0d1117] border border-[#30363d]/60 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            
            {/* Header Switcher text */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-white tracking-tight transition-all duration-300">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-xs text-muted mt-1">
                {isSignUp ? 'Join the DevCollab platform in seconds' : 'Access your secure developer workspace'}
              </p>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1 animate-in fade-in slide-in-from-left-2 duration-300">
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Alex Rivera"
                    required
                    className="block w-full border border-[#30363d]/60 bg-[#070a10] text-[#ffffff] placeholder:text-muted/60 px-3 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="alex.rivera@gmail.com"
                  required
                  className="block w-full border border-[#30363d]/60 bg-[#070a10] text-[#ffffff] placeholder:text-muted/60 px-3 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider">Password</label>
                  {!isSignUp && (
                    <span className="text-[9px] font-semibold text-primary hover:text-ink cursor-pointer transition-colors leading-none">
                      Forgot?
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full border border-[#30363d]/60 bg-[#070a10] text-[#ffffff] placeholder:text-muted/60 px-3 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary hover:opacity-90 active:scale-[0.98] text-[#ffffff] text-xs font-bold rounded-xl border-none transition-all cursor-pointer shadow-lg flex items-center justify-center gap-1.5 mt-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6 select-none">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#30363d]/40" /></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-[#0d1117] px-2.5 text-muted">or join with</span></div>
            </div>

            {/* Social Oauth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#070a10] border border-[#30363d]/60 hover:bg-[#161b22] text-xs font-semibold text-[#ffffff] transition-all rounded-xl cursor-pointer active:scale-95 border-none"
              >
                <Mail size={14} className="text-[#ea4335]" /> Google
              </button>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#070a10] border border-[#30363d]/60 hover:bg-[#161b22] text-xs font-semibold text-[#ffffff] transition-all rounded-xl cursor-pointer active:scale-95 border-none"
              >
                <GitPullRequest size={14} className="text-white" /> GitHub
              </button>
            </div>

            {/* Account Switch Footer */}
            <p className="text-center text-xs text-muted mt-6">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary font-bold hover:text-white transition-colors cursor-pointer border-none bg-transparent"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>

          </div>
        </div>
      </div>

      {/* Simulated Google Authenticating Dialog Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0d1117] border border-[#30363d]/80 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header window-style bar */}
            <div className="bg-[#161b22] border-b border-[#30363d]/70 px-4 py-2.5 flex items-center justify-between select-none">
              <div className="flex items-center gap-1.5">
                <Mail size={14} className="text-[#ea4335]" />
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Sign in with Google</span>
              </div>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="text-muted hover:text-white transition-colors border-none bg-transparent cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {googleStep === 'select' ? (
              /* Step 1: Select Account */
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <div className="inline-flex w-10 h-10 bg-white/5 border border-white/10 rounded-full items-center justify-center mb-2">
                    <Mail size={18} className="text-[#ea4335]" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Choose an Account</h3>
                  <p className="text-[10px] text-muted mt-0.5">to continue to DevCollab securely</p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={proceedGoogleLogin}
                    className="w-full p-3 bg-[#070a10] border border-[#30363d]/60 rounded-xl hover:bg-white/5 transition-all text-left flex items-center gap-3 cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#f43f5e] flex items-center justify-center text-[10px] font-extrabold text-white">AR</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-white leading-none">Alex Rivera</p>
                      <p className="text-[9px] text-muted mt-0.5">alex.rivera@gmail.com</p>
                    </div>
                    <span className="text-[8px] bg-white/10 text-muted px-1.5 py-0.5 rounded">Default</span>
                  </button>

                  <button
                    onClick={proceedGoogleLogin}
                    className="w-full p-3 bg-[#070a10] border border-[#30363d]/60 rounded-xl hover:bg-white/5 transition-all text-left flex items-center gap-3 cursor-pointer opacity-70"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#30363d] flex items-center justify-center text-[10px] font-extrabold text-white">Guest</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-white leading-none">Use guest account</p>
                      <p className="text-[9px] text-muted mt-0.5">guest@devcollab.net</p>
                    </div>
                  </button>
                </div>

                <div className="flex justify-between items-center text-[8px] text-muted pt-2 border-t border-[#30363d]/30">
                  <span>Authorized DevCollab API</span>
                  <span className="hover:underline cursor-pointer">Privacy Policy</span>
                </div>
              </div>
            ) : (
              /* Step 2: Authenticating Spinner */
              <div className="p-10 flex flex-col items-center justify-center space-y-4">
                <div className="relative flex items-center justify-center">
                  {/* Spinner */}
                  <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <Mail size={18} className="absolute text-[#ea4335]" />
                </div>
                <div className="text-center">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Securing Connection</h3>
                  <p className="text-[10px] text-muted mt-0.5">Logging you into your dev workspace...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
