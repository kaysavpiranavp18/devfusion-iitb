import { useState } from 'react';
import { Shield, Loader2, Bug, Gauge, Eye, Lock, Lightbulb } from 'lucide-react';
import { clsx } from 'clsx';
import type { AIReviewResult } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

const languages = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust'];

export function AICodeReview() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIReviewResult | null>(null);

  const simulateReview = () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);

    setTimeout(() => {
      const lineCount = code.split('\n').length;
      const hasAsync = code.includes('async') || code.includes('await');
      const hasTryCatch = code.includes('try') || code.includes('catch');
      const hasConsole = code.includes('console.log');
      const hasAny = code.includes(': any') || code.includes('any');

      setResult({
        bugs: [
          ...(hasConsole ? ['Remove console.log statements before production deployment'] : []),
          ...(!hasTryCatch ? ['Consider adding error handling with try/catch blocks'] : []),
          ...(hasAny ? ['Avoid using "any" type — use proper TypeScript types instead'] : []),
          'Potential null reference: add null checks for object properties',
        ],
        performance: [
          `Function has ${lineCount} lines; consider breaking into smaller functions`,
          ...(hasAsync ? ['Multiple async operations detected — consider using Promise.all for parallel execution'] : []),
        ],
        readability: [
          'Add JSDoc comments for better documentation',
          'Use more descriptive variable names',
          'Consider extracting magic strings/numbers into constants',
        ],
        security: [
          'Validate and sanitize all user inputs',
          'Avoid exposing sensitive data in error messages',
        ],
        score: hasTryCatch && !hasConsole ? 7 : 5,
        suggestions: [
          'Add unit tests for edge cases',
          'Implement input validation at the entry point',
          'Use early returns to reduce nesting',
          'Extract business logic into separate service layer',
        ],
      });
      setLoading(false);
    }, 1500);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-500';
    if (score >= 6) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return 'bg-semantic-success/10 border-semantic-success/30';
    if (score >= 6) return 'bg-semantic-warning/10 border-semantic-warning/30';
    return 'bg-semantic-danger/10 border-semantic-danger/30';
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield size={20} className="text-m-blue-light" />
        <h2 className="text-lg font-bold text-ink uppercase tracking-normal">AI Code Reviewer</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-ink">Paste your code below</label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="text-xs border border-hairline bg-surface-card text-ink px-2 py-1 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white"
            >
              {languages.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder={`// Paste your ${language} code here for AI review...`}
            rows={16}
            className="w-full border border-hairline bg-surface-card text-ink placeholder:text-muted p-4 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white resize-none"
          />
          <Button onClick={simulateReview} loading={loading} disabled={!code.trim()}>
            <Shield size={16} /> Review Code
          </Button>
        </div>

        {/* Results */}
        <div>
          {loading && (
            <div className="flex items-center justify-center h-full min-h-[300px] bg-surface-card border border-hairline">
              <div className="text-center">
                <Loader2 size={32} className="animate-spin text-m-blue-light mx-auto mb-3" />
                <p className="text-sm text-muted">AI is analyzing your code...</p>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              {/* Score */}
              <div className={clsx('p-4 border', getScoreBg(result.score))}>
                <div className="flex items-center justify-between mb-2">
                  <span className={clsx('text-sm font-semibold', result.score >= 6 ? 'text-ink' : 'text-ink')}>Quality Score</span>
                  <div className="flex items-center gap-2">
                    <Gauge size={18} className={getScoreColor(result.score)} />
                    <span className={clsx('text-2xl font-bold', getScoreColor(result.score))}>
                      {result.score}/10
                    </span>
                  </div>
                </div>
              </div>

              {/* Bugs */}
              <CategorySection icon={Bug} color="text-semantic-danger" bg="bg-semantic-danger/10 border-semantic-danger/30" title="Bugs & Errors" items={result.bugs} />

              {/* Performance */}
              <CategorySection icon={Gauge} color="text-semantic-warning" bg="bg-semantic-warning/10 border-semantic-warning/30" title="Performance Issues" items={result.performance} />

              {/* Readability */}
              <CategorySection icon={Eye} color="text-body-strong" bg="bg-surface-elevated border-hairline" title="Readability" items={result.readability} />

              {/* Security */}
              <CategorySection icon={Lock} color="text-m-blue-light" bg="bg-white/10 border-white/20" title="Security Concerns" items={result.security} />

              {/* Suggestions */}
              <CategorySection icon={Lightbulb} color="text-semantic-success" bg="bg-semantic-success/10 border-semantic-success/20" title="Suggestions" items={result.suggestions} />
            </div>
          )}

          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-surface-card border border-hairline text-center p-8">
              <Shield size={48} className="text-muted mb-4" />
              <h3 className="text-lg font-medium text-muted mb-2">AI Code Review</h3>
              <p className="text-sm text-muted max-w-sm">
                Paste your code on the left and click "Review Code" to get AI-powered feedback on bugs, performance, readability, and security.
              </p>
              <p className="text-xs text-muted mt-4">Supports JS, Python, Java, C++, Go, Rust</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategorySection({ icon: Icon, color, bg, title, items }: {
  icon: any; color: string; bg: string; title: string; items: string[];
}) {
  return (            <div className={clsx('p-3 border', bg)}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className={color} />            <h4 className="text-sm font-bold text-body-strong uppercase tracking-wider">{title}</h4>
        <Badge variant="default" size="sm">{String(items.length)}</Badge>
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-muted flex items-start gap-1.5">
            <span className="text-muted mt-0.5 shrink-0">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
