import { Check, Crown, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../components/ui/Button';
import { plans } from '../data/mock';
import { useState } from 'react';

export function PaymentsPage() {
  const [selectedPlan, setSelectedPlan] = useState('free');
  const currentPlan = 'free';

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
            {plans.map(plan => {
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
                    {plan.features.map(feature => (
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
    </div>
  );
}
