import { useState, useEffect } from 'react';
import { Search, Copy, Check, Plus, Trash2, X, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { useSnippetStore } from '../../store';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { getUserById } from '../../data/mock';
import { AICodeReview } from '../ai/AICodeReview';
import type { Snippet } from '../../types';

interface SnippetListProps {
  projectId: string;
}

const languageBadgeClasses: Record<string, string> = {
  typescript: 'bg-blue-950/60 text-blue-400 border border-blue-900/30',
  python: 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/30',
  javascript: 'bg-yellow-950/60 text-yellow-400 border border-yellow-900/30',
  java: 'bg-orange-950/60 text-orange-400 border border-orange-900/30',
  go: 'bg-cyan-950/60 text-cyan-400 border border-cyan-900/30',
};

function getLanguageBadgeClass(lang: string) {
  return languageBadgeClasses[lang.toLowerCase()] || 'bg-[#1e1e2e]/60 text-[#64748b] border border-[#1e1e2e]/80';
}

function HeaderCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg hover:bg-white/5 text-muted hover:text-ink transition-colors cursor-pointer border border-[#1e1e2e] bg-transparent"
      title="Copy snippet code"
    >
      {copied ? (
        <Check size={13} className="text-emerald-400" />
      ) : (
        <Copy size={13} />
      )}
    </button>
  );
}

function highlightLine(line: string): string {
  // Escape HTML characters
  let escaped = line
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Handle comments
  if (escaped.trim().startsWith('//') || escaped.trim().startsWith('#')) {
    return `<span class="text-[#475569] italic">${escaped}</span>`;
  }

  // Protect strings by tokenizing them
  const strings: string[] = [];
  escaped = escaped.replace(/(['"`])(.*?)\1/g, (match) => {
    strings.push(match);
    return `__STR_TOKEN_${strings.length - 1}__`;
  });

  // Keywords list
  const keywords = [
    'const', 'let', 'var', 'function', 'return', 'import', 'export', 'from', 'default',
    'class', 'async', 'await', 'if', 'else', 'for', 'while', 'def', 'in', 'as', 'package',
    'func', 'interface', 'type', 'public', 'private', 'readonly', 'implements', 'extends',
    'void', 'string', 'number', 'boolean', 'any', 'unknown', 'never', 'set'
  ];

  // Regex to match keywords (word boundary check)
  const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
  escaped = escaped.replace(keywordRegex, '<span class="text-[#818cf8] font-semibold">$1</span>');

  // Booleans and numbers
  escaped = escaped.replace(/\b(true|false|null|undefined|\d+)\b/g, '<span class="text-[#fb923c]">$1</span>');

  // Functions
  escaped = escaped.replace(/\b([a-zA-Z0-9_]+)(?=\()/g, '<span class="text-[#f472b6]">$1</span>');

  // Restore strings
  strings.forEach((str, index) => {
    const styledStr = `<span class="text-[#34d399] font-normal">${str}</span>`;
    escaped = escaped.replace(`__STR_TOKEN_${index}__`, styledStr);
  });

  return escaped;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');
  if (lines.length > 1 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  return (
    <div className="relative group rounded-[8px] border border-[#1e1e2e] bg-[#0a0a0f] overflow-hidden flex flex-col flex-1 min-h-0 transition-all duration-200 hover:border-[#3b3b5c]">
      {/* Header row with Language Label and Copy Button */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <span className="text-[10px] uppercase text-muted font-semibold">{language}</span>
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-white/5 text-muted hover:text-ink transition-all cursor-pointer bg-transparent border-0"
          title="Copy snippet"
        >
          {copied ? (
            <Check size={12} className="text-emerald-400 animate-in fade-in duration-200" />
          ) : (
            <Copy size={12} />
          )}
        </button>
      </div>
      
      {/* Code display with gutter */}
      <div className="flex font-mono text-sm leading-6 px-4 pb-4 overflow-y-auto flex-1 min-h-0">
        {/* Line numbers gutter */}
        <div className="select-none text-right text-muted/50 text-xs w-8 pr-3 border-r border-[#1e1e2e]/30 shrink-0">
          {lines.map((_, index) => (
            <div key={index} className="h-6 flex items-center justify-end">{index + 1}</div>
          ))}
        </div>
        {/* Code Content */}
        <pre className="pl-4 text-[#a5b4fc] flex-1 overflow-x-auto overflow-y-hidden select-text">
          <code>
            {lines.map((line, index) => (
              <div 
                key={index} 
                className="h-6 flex items-center whitespace-pre"
                dangerouslySetInnerHTML={{ __html: highlightLine(line) }}
              />
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

export function SnippetList({ projectId }: SnippetListProps) {
  const { snippets, deleteSnippet, addSnippet } = useSnippetStore();
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newLang, setNewLang] = useState('typescript');
  const [newDesc, setNewDesc] = useState('');
  const [newTags, setNewTags] = useState('');
  const [reviewingSnippet, setReviewingSnippet] = useState<Snippet | null>(null);
  const [selectedSnippetId, setSelectedSnippetId] = useState<string | null>(null);

  const projectSnippets = snippets.filter(s => s.projectId === projectId);
  const languages = [...new Set(projectSnippets.map(s => s.language))];

  const filtered = projectSnippets.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.tags.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    const matchesLanguage = languageFilter === 'all' || s.language === languageFilter;
    return matchesSearch && matchesLanguage;
  });

  const selectedSnippet = filtered.find(s => s.id === selectedSnippetId) || null;

  useEffect(() => {
    if (selectedSnippetId && !filtered.some(s => s.id === selectedSnippetId)) {
      setSelectedSnippetId(null);
    }
  }, [filtered, selectedSnippetId]);

  const handleAdd = () => {
    if (!newTitle.trim() || !newCode.trim()) return;
    addSnippet({
      id: `s${Date.now()}`,
      projectId,
      title: newTitle.trim(),
      code: newCode,
      language: newLang,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      description: newDesc.trim(),
      createdBy: 'u1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setNewTitle('');
    setNewCode('');
    setNewDesc('');
    setNewTags('');
    setShowForm(false);
  };

  // Close AI drawer on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setReviewingSnippet(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="p-4 sm:p-6 h-[calc(100vh-2.5rem)] flex flex-col overflow-hidden bg-canvas">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search snippets by title or tag..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-hairline bg-surface-card text-ink placeholder:text-muted rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
          <select
            value={languageFilter}
            onChange={e => setLanguageFilter(e.target.value)}
            className="text-sm border border-hairline bg-surface-card text-ink px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
          >
            <option value="all">All Languages</option>
            {languages.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="rounded-lg py-2 shrink-0">
          <Plus size={14} className="mr-1" /> {showForm ? 'Cancel' : 'Add Snippet'}
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-surface-card border border-hairline p-4 sm:p-5 mb-6 rounded-xl space-y-4 transition-all">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Snippet title"
              className="border border-hairline bg-canvas text-ink placeholder:text-muted px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
            <select
              value={newLang}
              onChange={e => setNewLang(e.target.value)}
              className="border border-hairline bg-canvas text-ink px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
            >
              {['typescript', 'javascript', 'python', 'go', 'rust', 'java', 'cpp', 'css', 'html'].map(l => (
                <option key={l} value={l}>{l.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <input
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Description"
            className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
          <input
            value={newTags}
            onChange={e => setNewTags(e.target.value)}
            placeholder="Tags (comma separated)"
            className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
          <textarea
            value={newCode}
            onChange={e => setNewCode(e.target.value)}
            placeholder="Paste your code here..."
            rows={6}
            className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted px-3 py-2 text-sm font-mono rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-y"
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleAdd} disabled={!newTitle.trim() || !newCode.trim()} className="rounded-lg">
              Add Snippet
            </Button>
          </div>
        </div>
      )}

      {/* Two-panel layout */}
      <div className="flex border border-[#1e1e2e] rounded-xl bg-[#0d0d14] flex-1 min-h-0 overflow-hidden mt-2">
        {/* LEFT PANEL: Snippet List */}
        <div className="w-[320px] shrink-0 border-r border-[#1e1e2e] flex flex-col bg-[#0d0d14] h-full">
          {/* Label Header */}
          <div className="text-[11px] uppercase tracking-widest text-muted px-4 py-3 border-b border-[#1e1e2e] font-semibold flex items-center justify-between shrink-0 select-none">
            <span>Snippets</span>
            <span className="text-muted font-bold">{filtered.length}</span>
          </div>
          
          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map(snippet => {
              const isSelected = selectedSnippetId === snippet.id;
              return (
                <div
                  key={snippet.id}
                  onClick={() => setSelectedSnippetId(snippet.id)}
                  className={clsx(
                    'px-4 py-3 cursor-pointer border-b border-[#0f0f17] flex flex-col gap-1 transition-all duration-150',
                    isSelected
                      ? 'bg-[#1a1a2e] border-l-2 border-[#6366f1]'
                      : 'hover:bg-[#13131a] border-l-2 border-transparent'
                  )}
                >
                  {/* Top row: title + language badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={clsx(
                      'text-sm font-medium truncate flex-1',
                      isSelected ? 'text-[#e2e8f0]' : 'text-[#cbd5e1]'
                    )}>
                      {snippet.title}
                    </span>
                    <span className={clsx(
                      'text-[9px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wide shrink-0',
                      getLanguageBadgeClass(snippet.language)
                    )}>
                      {snippet.language}
                    </span>
                  </div>
                  {/* Bottom row: tags */}
                  {snippet.tags.length > 0 && (
                    <div className="text-[10px] text-muted truncate font-medium">
                      {snippet.tags.slice(0, 2).join(' · ')}
                    </div>
                  )}
                </div>
              );
            })}
            
            {filtered.length === 0 && (
              <div className="p-8 text-center text-xs text-muted">
                No snippets found
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Snippet Detail */}
        <div className="flex-1 flex flex-col bg-canvas p-6 h-full overflow-hidden">
          {selectedSnippet ? (
            <div className="flex-grow flex flex-col min-h-0 h-full">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 mb-4 border-b border-[#1e1e2e] shrink-0">
                <div className="min-w-0 flex-1 pr-4">
                  <h2 className="text-lg font-semibold text-[#e2e8f0] truncate">{selectedSnippet.title}</h2>
                  {selectedSnippet.description && (
                    <p className="text-sm text-muted mt-1 leading-relaxed">{selectedSnippet.description}</p>
                  )}
                  {selectedSnippet.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {selectedSnippet.tags.map(tag => (
                        <span key={tag} className="text-[10px] border border-[#1e1e2e] text-muted rounded px-1.5 py-0.5 font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setReviewingSnippet(selectedSnippet)}
                    className="flex items-center gap-1.5 text-[11px] font-bold bg-[#6366f1] hover:bg-[#4f46e5] text-white px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
                  >
                    <Sparkles size={11} /> Review
                  </button>
                  
                  {/* Copy button */}
                  <HeaderCopyButton code={selectedSnippet.code} />
                  
                  {/* Delete button */}
                  <button
                    onClick={() => deleteSnippet(selectedSnippet.id)}
                    className="p-1.5 rounded-lg hover:bg-semantic-danger/10 text-muted hover:text-semantic-danger transition-colors cursor-pointer border border-[#1e1e2e] bg-transparent"
                    title="Delete snippet"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              
              {/* Code block */}
              <div className="flex-1 min-h-0 mb-4 flex flex-col">
                <CodeBlock code={selectedSnippet.code} language={selectedSnippet.language} />
              </div>
              
              {/* Footer */}
              <div className="mt-auto pt-4 border-t border-[#1e1e2e]/40 shrink-0 select-none flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar
                    src={getUserById(selectedSnippet.createdBy)?.avatar}
                    name={getUserById(selectedSnippet.createdBy)?.name || 'U'}
                    size="xs"
                  />
                  <span className="text-[10px] text-muted">
                    Added by <span className="text-body font-medium">{getUserById(selectedSnippet.createdBy)?.name || 'Unknown'}</span> · Updated {format(new Date(selectedSnippet.updatedAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center select-none bg-canvas">
              <span className="text-sm text-muted">Select a snippet to view</span>
            </div>
          )}
        </div>
      </div>

      {/* AI Review Slide-out Drawer */}
      {reviewingSnippet && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-200" 
            onClick={() => setReviewingSnippet(null)} 
          />

          {/* Drawer Panel */}
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[500px] bg-surface-card border-l border-hairline shadow-2xl flex flex-col h-full select-none animate-in">
            <div className="p-4 border-b border-hairline flex items-center justify-between shrink-0 bg-canvas/30">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                <span className="text-xs font-bold text-ink uppercase tracking-wider">AI Review: {reviewingSnippet.title}</span>
              </div>
              <button
                onClick={() => setReviewingSnippet(null)}
                className="p-1 hover:bg-surface-card text-muted hover:text-ink transition-colors cursor-pointer rounded"
                title="Close review (Esc)"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AICodeReview initialCode={reviewingSnippet.code} initialLanguage={reviewingSnippet.language} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
