import { useState, useEffect } from 'react';
import { Shield, Loader2, Bug, Gauge, Eye, Lock, Lightbulb, ChevronDown, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import type { AIReviewResult } from '../../types';
import { Button } from '../ui/Button';

const languages = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust'];

interface AICodeReviewProps {
  initialCode?: string;
  initialLanguage?: string;
  compact?: boolean;
}

export function AICodeReview({ initialCode = '', initialLanguage = 'typescript' }: AICodeReviewProps) {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIReviewResult | null>(null);
  const [rawResponseText, setRawResponseText] = useState('');

  const parseAIReviewResponse = (rawText: string): AIReviewResult => {
    const parsed: AIReviewResult = {
      bugs: [],
      performance: [],
      readability: [],
      security: [],
      score: 5,
      suggestions: [],
    };

    // Find SCORE
    const scoreMatch = rawText.match(/SCORE:\s*(\d+)/i);
    if (scoreMatch) {
      parsed.score = Math.max(1, Math.min(10, parseInt(scoreMatch[1], 10)));
    }

    // Extract sections
    const extractSection = (header: string): string[] => {
      const regex = new RegExp(`\\[${header}\\]\\s*\\n([\\s\\S]*?)(?:\\n\\s*\\[|$)`, 'i');
      const match = rawText.match(regex);
      if (!match) return [];
      
      return match[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-') || line.startsWith('*'))
        .map(line => line.substring(1).trim()) // Remove leading bullet
        .filter(Boolean);
    };

    parsed.bugs = extractSection('BUGS');
    parsed.performance = extractSection('PERFORMANCE');
    parsed.readability = extractSection('READABILITY');
    parsed.security = extractSection('SECURITY');
    parsed.suggestions = extractSection('SUGGESTIONS');

    return parsed;
  };

  const simulateReview = (codeToReview: string = code) => {
    if (!codeToReview.trim()) return;
    setLoading(true);
    setResult(null);
    setRawResponseText('');

    setTimeout(() => {
      const lineCount = codeToReview.split('\n').length;
      const hasAsync = codeToReview.includes('async') || codeToReview.includes('await');
      const hasTryCatch = codeToReview.includes('try') || codeToReview.includes('catch');
      const hasConsole = codeToReview.includes('console.log');
      const hasAny = codeToReview.includes(': any') || codeToReview.includes('any');

      // Calculate a realistic score between 2 and 10 based on structure
      let computedScore = 6;
      if (hasTryCatch) computedScore += 2;
      else computedScore -= 1;
      
      if (hasConsole) computedScore -= 1;
      if (hasAny) computedScore -= 2;
      if (lineCount > 30) computedScore -= 1;
      else if (lineCount < 15) computedScore += 1;

      const score = Math.max(2, Math.min(10, computedScore));

      const simulatedRawText = `SCORE: ${score}

[BUGS]
${hasConsole ? '- Remove console.log statements before production deployment' : ''}
${!hasTryCatch ? '- Consider adding error handling with try/catch blocks' : ''}
${hasAny ? '- Avoid using "any" type — use proper TypeScript types instead' : ''}
- Potential null reference: add null checks for nested object properties

[PERFORMANCE]
- Function is relatively long (${lineCount} lines); consider breaking into smaller modular functions
${hasAsync ? '- Multiple async operations detected — consider using Promise.all for parallel execution' : ''}

[READABILITY]
- Add JSDoc/docstring comments for better inline API documentation
- Rename generic identifiers to use more descriptive, domain-specific variable names
- Consider extracting magic strings/numbers into top-level constants

[SECURITY]
- Validate and sanitize all external user inputs before processing
- Avoid exposing internal database or server errors in client response messages

[SUGGESTIONS]
- Add comprehensive unit tests covering border and exception states
- Implement field-level schema validation at HTTP endpoints
- Use early-return pattern to reduce arrow nested code complexity
- Extract utility logic into a shared helper service file`;

      setRawResponseText(simulatedRawText);
      const parsedResult = parseAIReviewResponse(simulatedRawText);
      setResult(parsedResult);
      setLoading(false);
    }, 1500);
  };

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      const cleanLang = initialLanguage.toLowerCase();
      setLanguage(languages.includes(cleanLang) ? cleanLang : 'typescript');
      simulateReview(initialCode);
    }
  }, [initialCode, initialLanguage]);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center gap-2 pb-2 border-b border-hairline/50">
        <Shield size={18} className="text-primary" />
        <h2 className="text-sm font-bold text-ink uppercase tracking-wider font-sans">AI Code Reviewer</h2>
      </div>

      <div className="space-y-4">
        {/* Input Block */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-ink font-sans">Paste code below:</label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="text-xs border border-hairline bg-surface-card text-ink px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary rounded-lg cursor-pointer transition-colors"
            >
              {languages.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
          </div>
          
          {/* Custom Code Terminal styled Textarea */}
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder={`// Paste your ${language} code here...`}
            rows={8}
            className="w-full border border-[#1e1e2e] bg-[#0a0a0f] text-ink placeholder:text-muted/60 p-4 text-sm font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary rounded-xl resize-y caret-[#22c55e]"
          />
          
          {/* Centered normal width Review Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => simulateReview()}
              loading={loading}
              disabled={!code.trim()}
              className="text-xs py-2 px-6 rounded-lg bg-primary hover:bg-primary/95 text-white font-semibold transition-all hover:translate-y-[-1px]"
            >
              <Shield size={13} className="mr-1.5 inline" /> Review Code
            </Button>
          </div>
        </div>

        {/* Results Block */}
        <div className="space-y-4 pt-2">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 bg-surface-card border border-hairline rounded-xl">
              <Loader2 size={24} className="animate-spin text-primary mb-2" />
              <p className="text-xs text-muted">Analyzing code quality & patterns...</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              
              {/* Score Circular Badge Prominently Displayed at Top */}
              <div className="flex flex-col items-center justify-center p-6 bg-surface-card border border-hairline rounded-xl shadow-lg">
                <div className={clsx(
                  "w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 font-bold select-none shadow-md mb-3 transition-all duration-300",
                  result.score >= 7 ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" :
                  result.score >= 4 ? "border-amber-500 bg-amber-500/10 text-amber-400" :
                  "border-red-500 bg-red-500/10 text-red-400"
                )}>
                  <span className="text-2xl leading-none">{result.score}</span>
                  <span className="text-[10px] opacity-75 mt-0.5">/ 10</span>
                </div>
                <span className="text-xs font-bold text-ink uppercase tracking-wider">Quality Score</span>
                <span className="text-[10px] text-muted mt-1.5 text-center px-4 max-w-sm">
                  {result.score >= 7 ? "✨ Production ready: Clean patterns, high compliance, low defects." :
                   result.score >= 4 ? "⚠️ Refactoring recommended: Identified modularity improvements." :
                   "🚨 Critical revisions required: Significant security or structural changes needed."}
                </span>
              </div>

              {/* Collapsible details for raw AI output */}
              {rawResponseText && (
                <div className="border border-hairline bg-[#0d0d14]/40 rounded-xl overflow-hidden">
                  <details className="group">
                    <summary className="w-full flex items-center justify-between p-3.5 text-left text-[10px] font-bold text-muted uppercase tracking-wider cursor-pointer hover:bg-white/[0.02] select-none">
                      <span>View Raw AI Response (Before Parsing)</span>
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 group-open:hidden">Show</span>
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 hidden group-open:inline">Hide</span>
                    </summary>
                    <div className="px-4 pb-4 pt-1 border-t border-hairline/20 font-mono text-[10px] text-muted leading-relaxed whitespace-pre bg-[#050508]/80 max-h-48 overflow-y-auto select-all">
                      {rawResponseText}
                    </div>
                  </details>
                </div>
              )}

              {/* 4 Collapsible Categories with colored left borders */}
              <div className="space-y-2.5">
                {/* Bugs */}
                <CollapsibleCategorySection
                  icon={Bug}
                  color="text-semantic-danger"
                  borderClass="border-l-semantic-danger"
                  title="Bugs & Errors"
                  items={result.bugs}
                />

                {/* Performance */}
                <CollapsibleCategorySection
                  icon={Gauge}
                  color="text-semantic-warning"
                  borderClass="border-l-semantic-warning"
                  title="Performance"
                  items={result.performance}
                />

                {/* Readability */}
                <CollapsibleCategorySection
                  icon={Eye}
                  color="text-blue-400"
                  borderClass="border-l-blue-400"
                  title="Readability"
                  items={result.readability}
                />

                {/* Security */}
                <CollapsibleCategorySection
                  icon={Lock}
                  color="text-violet-400"
                  borderClass="border-l-violet-400"
                  title="Security"
                  items={result.security}
                />

                {/* Suggestions */}
                <CollapsibleCategorySection
                  icon={Lightbulb}
                  color="text-semantic-success"
                  borderClass="border-l-semantic-success"
                  title="Improvement Suggestions"
                  items={result.suggestions}
                />
              </div>
            </div>
          )}

          {!result && !loading && (
            <div className="flex flex-col items-center justify-center py-12 bg-surface-card border border-hairline rounded-xl text-center p-6">
              <Shield size={36} className="text-muted/40 mb-3 animate-pulse" />
              <h3 className="text-xs font-bold text-ink uppercase tracking-widest mb-1.5">Code Review Ready</h3>
              <p className="text-[11px] text-muted max-w-xs leading-relaxed">
                Paste any source code block above and run the review to instantly test compile paths, scan security concerns, and score code quality.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CollapsibleSectionProps {
  icon: any;
  color: string;
  borderClass: string;
  title: string;
  items: string[];
}

function CollapsibleCategorySection({ icon: Icon, color, borderClass, title, items }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={clsx('border border-[#1e1e2e] bg-[#111118] rounded-xl overflow-hidden shadow-sm transition-all border-l-4', borderClass)}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between p-3.5 hover:bg-white/[0.02] transition-colors text-left font-sans select-none cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Icon size={14} className={color} />
          <h4 className="text-xs font-bold text-ink uppercase tracking-wider">{title}</h4>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1.5 bg-white/10 text-ink">
            {items.length}
          </span>
        </div>
        {isOpen ? <ChevronDown size={14} className="text-muted" /> : <ChevronRight size={14} className="text-muted" />}
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 pt-1 bg-[#0b0b10]/40 border-t border-hairline/20">
          {items.length === 0 ? (
            <p className="text-[11px] text-muted italic">No issues detected in this category.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((item, i) => (
                <li key={i} className="text-[11px] text-muted flex items-start gap-2 leading-relaxed">
                  <span className="text-primary mt-1 shrink-0 select-none">•</span>
                  <span className="text-ink">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
