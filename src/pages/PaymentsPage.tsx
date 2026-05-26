import { Check, Crown, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../components/ui/Button';
import type { Plan } from '../types';
import { useState, useEffect } from 'react';
import { Modal } from '../components/ui/Modal';
import { useWorkspaceStore } from '../store';
import { supabase } from '../lib/supabase';

export function PaymentsPage() {
  const { currentWorkspace, fetchWorkspaces } = useWorkspaceStore();
  const currentPlan = currentWorkspace?.plan || 'free';
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [dbPlans, setDbPlans] = useState<Plan[]>([
    {
      id: 'free',
      name: 'Free',
      price: 0,
      features: ['1 workspace', '3 projects', '5 members per workspace', 'Kanban boards', 'Code snippets', 'Basic activity feed'],
      limits: { workspaces: 1, projects: 3, members: 5, ai: false },
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 12,
      features: ['Unlimited workspaces', 'Unlimited projects', 'Unlimited members', 'AI project assistant', 'AI code reviewer', 'Priority support', 'Advanced analytics'],
      limits: { workspaces: Infinity, projects: Infinity, members: Infinity, ai: true },
    },
  ]);

  useEffect(() => {
    const fetchDbPlans = async () => {
      try {
        const { data, error } = await supabase.from('plans').select('*');
        if (!error && data && data.length > 0) {
          setDbPlans(data.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            features: p.features || [],
            limits: p.limits || {}
          })));
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
      }
    };
    fetchDbPlans();
  }, []);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      if (currentWorkspace) {
        const { error } = await supabase
          .from('workspaces')
          .update({ plan: 'pro' })
          .eq('id', currentWorkspace.id);
        
        if (error) throw error;
        await fetchWorkspaces();
      }
      setIsSuccess(true);
    } catch (err) {
      console.error('Error upgrading plan:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setTimeout(() => {
      setIsSuccess(false);
      setCardNumber('');
      setExpiry('');
      setCvv('');
      setCardName('');
    }, 300);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-canvas">
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-ink mb-4">
              <Crown size={32} className="text-canvas" />
            </div>
            <h1 className="text-3xl font-bold text-ink mb-2">Choose Your Plan</h1>
            <p className="text-muted text-sm max-w-lg mx-auto">
              Start free and upgrade as you grow. All plans include core collaboration features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {dbPlans.map(plan => {
              const isCurrent = plan.id === currentPlan;
              const isSelected = selectedPlan === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={clsx(
                    'relative border-2 p-6 transition-all duration-200 cursor-pointer rounded-2xl',
                    isSelected 
                      ? 'border-primary shadow-[0_0_20px_rgba(99,102,241,0.15)] bg-surface-card' 
                      : 'border-hairline hover:border-white/20 bg-[#0d0d14]',
                    plan.id === 'pro' && !isSelected && 'bg-surface-elevated/40 border-indigo-500/10',
                  )}
                >
                  {plan.id === 'pro' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-md">
                      <div className="flex items-center gap-1">
                        <Sparkles size={10} /> Most Popular
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-sm font-bold text-ink mb-1 uppercase tracking-wider">{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-ink">${plan.price}</span>
                      <span className="text-xs text-muted">/month</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature: string) => (
                      <li key={feature} className="flex items-start gap-2 text-xs text-muted font-light">
                        <Check size={14} className="text-semantic-success mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full rounded-xl text-xs uppercase tracking-wider font-semibold"
                    variant={isCurrent ? 'outline' : plan.id === 'pro' ? 'primary' : 'outline'}
                    disabled={isCurrent}
                    onClick={() => {
                      if (plan.id === 'pro') {
                        setIsCheckoutOpen(true);
                      }
                    }}
                  >
                    {isCurrent ? 'Current Plan' : plan.price === 0 ? 'Get Started Free' : 'Upgrade to Pro'}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* FAQ */}
          <div className="mt-12 max-w-2xl mx-auto">
            <h2 className="text-sm font-bold text-ink text-center mb-6 uppercase tracking-wider">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {[
                { q: 'Can I switch plans at any time?', a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.' },
                { q: 'What happens when I downgrade?', a: 'You\'ll be limited to the features of your new plan. Your data is preserved.' },
                { q: 'Is there a free trial for Pro?', a: 'Yes! We offer a 14-day free trial of the Pro plan with no credit card required.' },
              ].map(faq => (
                <div key={faq.q} className="p-4 bg-surface-card border border-hairline rounded-xl">
                  <h3 className="text-xs font-semibold text-ink mb-1">{faq.q}</h3>
                  <p className="text-xs text-muted font-light leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sandbox Checkout Modal */}
      <Modal
        open={isCheckoutOpen}
        onClose={handleClose}
        title={!isSuccess ? "Upgrade to Pro — $12/month" : undefined}
        size="sm"
      >
        {!isSuccess ? (
          <form onSubmit={handlePay} className="space-y-4">
            <p className="text-xs text-[#71717a] mb-4">
              This is a sandbox checkout. No real payment will be processed.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={e => setCardNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={e => setExpiry(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="123"
                    value={cvv}
                    onChange={e => setCvv(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Cardholder name"
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] disabled:bg-[#6366f1]/50 text-white font-semibold rounded-lg text-xs transition-all uppercase tracking-wider mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed border-none font-sans"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <span>Pay $12.00</span>
              )}
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-6 space-y-4 select-none font-sans">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ink">Payment successful!</h3>
              <p className="text-sm text-[#71717a] mt-1">You are now on the Pro plan.</p>
            </div>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-white/5 border border-hairline hover:bg-white/10 text-ink text-xs font-semibold rounded-lg transition-all cursor-pointer mt-2"
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
