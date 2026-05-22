import { useState } from 'react';
import { Search, Copy, Check, Plus, Trash2, Code } from 'lucide-react';
import { format } from 'date-fns';
import { useSnippetStore } from '../../store';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { getUserById } from '../../data/mock';

interface SnippetListProps {
  projectId: string;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">              <div className="flex items-center justify-between px-4 py-2 bg-surface-elevated border-b border-hairline">
                        <span className="text-xs font-medium text-muted">{language}</span>
                        <button
                          onClick={handleCopy}
                          className="flex items-center gap-1 text-xs text-muted hover:text-ink transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="bg-canvas text-ink p-4 overflow-x-auto">
        <code className="text-sm leading-relaxed font-mono">{code}</code>
      </pre>
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

  const projectSnippets = snippets.filter(s => s.projectId === projectId);
  const languages = [...new Set(projectSnippets.map(s => s.language))];

  const filtered = projectSnippets.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.tags.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    const matchesLanguage = languageFilter === 'all' || s.language === languageFilter;
    return matchesSearch && matchesLanguage;
  });

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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search snippets by title or tag..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-hairline bg-surface-card text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white"
            />
          </div>
          <select
            value={languageFilter}
            onChange={e => setLanguageFilter(e.target.value)}
            className="text-sm border border-hairline bg-surface-card text-ink px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white"
          >
            <option value="all">All Languages</option>
            {languages.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} /> {showForm ? 'Cancel' : 'Add Snippet'}
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-surface-card border border-hairline p-4 mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Snippet title"
              className="border border-hairline bg-surface-card text-ink placeholder:text-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white"
            />
            <select
              value={newLang}
              onChange={e => setNewLang(e.target.value)}
              className="border border-hairline bg-surface-card text-ink px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white"
            >
              {['typescript', 'javascript', 'python', 'go', 'rust', 'java', 'cpp', 'css', 'html'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <input
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Description"
            className="w-full border border-hairline bg-surface-card text-ink placeholder:text-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white"
          />
          <input
            value={newTags}
            onChange={e => setNewTags(e.target.value)}
            placeholder="Tags (comma separated)"
            className="w-full border border-hairline bg-surface-card text-ink placeholder:text-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white"
          />
          <textarea
            value={newCode}
            onChange={e => setNewCode(e.target.value)}
            placeholder="Paste your code here..."
            rows={6}
            className="w-full border border-hairline bg-surface-card text-ink placeholder:text-muted px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white"
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleAdd} disabled={!newTitle.trim() || !newCode.trim()}>
              Add Snippet
            </Button>
          </div>
        </div>
      )}

      {/* Snippet list */}
      <div className="space-y-4">
        {filtered.map(snippet => (
          <div key={snippet.id} className="bg-surface-card border border-hairline overflow-hidden">
            <div className="px-5 py-4 border-b border-hairline/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/10 flex items-center justify-center">
                    <Code size={16} className="text-m-blue-light" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink">{snippet.title}</h3>
                    <p className="text-xs text-muted">{snippet.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {snippet.tags.map(tag => (
                      <Badge key={tag} variant="primary" size="sm">{tag}</Badge>
                    ))}
                  </div>
                  <button
                    onClick={() => deleteSnippet(snippet.id)}
                    className="p-1.5 hover:bg-semantic-danger/20 text-muted hover:text-semantic-danger transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
            <div className="px-5 pb-4">
              <CodeBlock code={snippet.code} language={snippet.language} />
            </div>
            <div className="px-5 py-2 bg-surface-card/50 border-t border-hairline/30 flex items-center justify-between text-xs text-muted">
              <div className="flex items-center gap-2">
                <Avatar src={getUserById(snippet.createdBy)?.avatar} name={getUserById(snippet.createdBy)?.name || 'U'} size="sm" />
                <span>{getUserById(snippet.createdBy)?.name}</span>
              </div>
              <span>Updated {format(new Date(snippet.updatedAt), 'MMM d, yyyy')}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-muted">
            No snippets found. Add your first code snippet!
          </div>
        )}
      </div>
    </div>
  );
}
