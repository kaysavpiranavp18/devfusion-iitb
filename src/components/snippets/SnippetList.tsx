import React, { useState, useEffect, useRef } from 'react';
import { Search, Copy, Check, Plus, Trash2, Sparkles, FileCode, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { useSnippetStore, useUIStore, useAuthStore } from '../../store';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';

interface SnippetListProps {
  projectId: string;
}

function getFileIcon(lang: string) {
  const l = lang.toLowerCase();
  if (['typescript', 'javascript', 'typescriptreact', 'javascriptreact'].includes(l)) {
    return <FileCode size={14} className="text-[#3b82f6]" />;
  }
  if (l === 'python') {
    return <FileCode size={14} className="text-[#10b981]" />;
  }
  if (l === 'go') {
    return <FileCode size={14} className="text-[#06b6d4]" />;
  }
  if (l === 'java' || l === 'cpp' || l === 'rust') {
    return <FileCode size={14} className="text-[#f97316]" />;
  }
  if (l === 'html' || l === 'css') {
    return <FileCode size={14} className="text-[#ef4444]" />;
  }
  return <FileText size={14} className="text-muted" />;
}

function getExtensionForLanguage(lang: string): string {
  const l = lang.toLowerCase();
  switch (l) {
    case 'typescript': return '.ts';
    case 'javascript': return '.js';
    case 'python': return '.py';
    case 'go': return '.go';
    case 'rust': return '.rs';
    case 'java': return '.java';
    case 'cpp': return '.cpp';
    case 'css': return '.css';
    case 'html': return '.html';
    default: return '.txt';
  }
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
  const { snippets, deleteSnippet, addSnippet, fetchSnippets } = useSnippetStore();
  const { profiles, user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newLang, setNewLang] = useState('typescript');
  const [newDesc, setNewDesc] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newFilename, setNewFilename] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'file'>('list');
  const [selectedSnippetId, setSelectedSnippetId] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchSnippets(projectId);
    }
  }, [projectId, fetchSnippets]);

  // Drag & drop file upload and panel resizing
  const [isDragOver, setIsDragOver] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(320);
  const [isResizingPanel, setIsResizingPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

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

  const handleFilenameChange = (val: string) => {
    setNewFilename(val);
    const ext = val.split('.').pop()?.toLowerCase();
    if (ext) {
      if (ext === 'ts' || ext === 'tsx') {
        setNewLang('typescript');
      } else if (ext === 'js' || ext === 'jsx') {
        setNewLang('javascript');
      } else if (ext === 'py') {
        setNewLang('python');
      } else if (ext === 'go') {
        setNewLang('go');
      } else if (ext === 'rs') {
        setNewLang('rust');
      } else if (ext === 'java') {
        setNewLang('java');
      } else if (ext === 'cpp' || ext === 'h' || ext === 'hpp' || ext === 'cc') {
        setNewLang('cpp');
      } else if (ext === 'css') {
        setNewLang('css');
      } else if (ext === 'html') {
        setNewLang('html');
      }
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setNewCode(text);
      
      const fname = file.name;
      setNewFilename(fname);
      
      const titleWithoutExt = fname.substring(0, fname.lastIndexOf('.')) || fname;
      const formattedTitle = titleWithoutExt
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      setNewTitle(formattedTitle);
      
      const ext = fname.split('.').pop()?.toLowerCase();
      if (ext) {
        if (ext === 'ts' || ext === 'tsx') {
          setNewLang('typescript');
        } else if (ext === 'js' || ext === 'jsx') {
          setNewLang('javascript');
        } else if (ext === 'py') {
          setNewLang('python');
        } else if (ext === 'go') {
          setNewLang('go');
        } else if (ext === 'rs') {
          setNewLang('rust');
        } else if (ext === 'java') {
          setNewLang('java');
        } else if (ext === 'cpp' || ext === 'h' || ext === 'hpp' || ext === 'cc') {
          setNewLang('cpp');
        } else if (ext === 'css') {
          setNewLang('css');
        } else if (ext === 'html') {
          setNewLang('html');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleAdd = () => {
    if (!newTitle.trim() || !newCode.trim() || !user) return;
    addSnippet({
      id: `s${Date.now()}`,
      projectId,
      title: newTitle.trim(),
      filename: newFilename.trim() || undefined,
      code: newCode,
      language: newLang,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      description: newDesc.trim(),
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setNewTitle('');
    setNewCode('');
    setNewDesc('');
    setNewTags('');
    setNewFilename('');
    setShowForm(false);
  };

  const startResizePanel = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingPanel(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingPanel && leftPanelRef.current) {
        const rect = leftPanelRef.current.getBoundingClientRect();
        const newWidth = e.clientX - rect.left;
        if (newWidth >= 200 && newWidth <= 500) {
          setLeftPanelWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingPanel(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizingPanel) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingPanel]);

  const handleReview = () => {
    if (!selectedSnippet) return;
    useUIStore.getState().setAiSidebarOpen(true);
    window.dispatchEvent(new CustomEvent('copilot-review-snippet', {
      detail: {
        id: selectedSnippet.id,
        title: selectedSnippet.title,
        code: selectedSnippet.code,
        language: selectedSnippet.language
      }
    }));
  };

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

      {/* Add form modal */}
      <Modal
        open={showForm}
        onClose={() => {
          setNewTitle('');
          setNewCode('');
          setNewDesc('');
          setNewTags('');
          setNewFilename('');
          setShowForm(false);
        }}
        title="Create New Snippet"
        size="lg"
      >
        <div className="space-y-4 text-left">
          {/* File Drag and Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={clsx(
              "border border-dashed rounded-lg p-5 text-center cursor-pointer transition-all duration-200",
              isDragOver 
                ? "border-primary bg-primary/5 text-ink" 
                : "border-hairline hover:border-primary/50 text-muted hover:text-ink bg-canvas/30"
            )}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-1 text-xs">
              <Sparkles size={16} className={clsx("text-muted", isDragOver && "text-primary animate-pulse")} />
              <span className="font-semibold text-ink">Drag & drop a code file here, or click to upload</span>
              <span className="text-[10px] text-muted font-normal">Automatically populates form fields & auto-detects programming language</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Title *</label>
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. useDebounce hook"
                className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted/50 px-3.5 py-2.5 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-medium"
                required
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Filename</label>
              <input
                value={newFilename}
                onChange={e => handleFilenameChange(e.target.value)}
                placeholder="e.g. useDebounce.ts"
                className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted/50 px-3.5 py-2.5 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Language *</label>
              <select
                value={newLang}
                onChange={e => setNewLang(e.target.value)}
                className="w-full border border-hairline bg-canvas text-ink px-3.5 py-2.5 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer font-semibold"
              >
                {['typescript', 'javascript', 'python', 'go', 'rust', 'java', 'cpp', 'css', 'html'].map(l => (
                  <option key={l} value={l} className="bg-[#0a0a0f]">{l.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Description</label>
              <input
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Briefly describe what this snippet does"
                className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted/50 px-3.5 py-2.5 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Tags</label>
              <input
                value={newTags}
                onChange={e => setNewTags(e.target.value)}
                placeholder="comma-separated list, e.g. react, hooks"
                className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted/50 px-3.5 py-2.5 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Code *</label>
            <textarea
              value={newCode}
              onChange={e => setNewCode(e.target.value)}
              placeholder="Paste or write your code snippet here..."
              rows={8}
              className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted/50 p-4 text-xs font-mono rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-y"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-hairline">
            <button
              type="button"
              onClick={() => {
                setNewTitle('');
                setNewCode('');
                setNewDesc('');
                setNewTags('');
                setNewFilename('');
                setShowForm(false);
              }}
              className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink bg-white/5 hover:bg-white/10 rounded-lg transition-all cursor-pointer border-none"
            >
              Cancel
            </button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!newTitle.trim() || !newCode.trim()}
              className="rounded-lg px-5 text-xs font-bold"
            >
              Add Snippet
            </Button>
          </div>
        </div>
      </Modal>

      {/* Two-panel layout */}
      <div className="flex border border-[#1e1e2e] rounded-xl bg-[#0d0d14] flex-1 min-h-0 overflow-hidden mt-2 relative">
        {/* LEFT PANEL: Snippet List */}
        <div
          ref={leftPanelRef}
          style={{ width: `${leftPanelWidth}px` }}
          className={clsx(
            "shrink-0 border-r border-[#1e1e2e] flex flex-col bg-[#0d0d14] h-full relative",
            !isResizingPanel && "transition-all duration-150"
          )}
        >
          {/* Label Header */}
          <div className="text-[11px] uppercase tracking-widest text-muted px-4 py-2.5 border-b border-[#1e1e2e] font-semibold flex items-center justify-between shrink-0 select-none">
            <span>Snippets ({filtered.length})</span>
            <div className="flex bg-[#13131a] rounded-lg p-0.5 border border-[#1e1e2e]">
              <button
                onClick={() => setViewMode('list')}
                className={clsx(
                  "px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all duration-150 cursor-pointer border-none",
                  viewMode === 'list' ? "bg-white/10 text-ink" : "text-muted hover:text-ink hover:bg-white/[0.02]"
                )}
                title="List View"
              >
                List
              </button>
              <button
                onClick={() => setViewMode('file')}
                className={clsx(
                  "px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all duration-150 cursor-pointer border-none",
                  viewMode === 'file' ? "bg-white/10 text-ink" : "text-muted hover:text-ink hover:bg-white/[0.02]"
                )}
                title="File View"
              >
                Files
              </button>
            </div>
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
                  draggable
                  onDragStart={(e) => {
                    const itemData = JSON.stringify({ type: 'snippet', id: snippet.id, title: snippet.title });
                    e.dataTransfer.setData('application/devcollab-item', itemData);
                    e.dataTransfer.setData('text/plain', `@snippet:${snippet.title}`);
                  }}
                >
                  {viewMode === 'file' ? (
                    <>
                      {/* Top row: filename + icon */}
                      <div className="flex items-center gap-2">
                        {getFileIcon(snippet.language)}
                        <span className={clsx(
                          'text-sm font-mono truncate flex-1',
                          isSelected ? 'text-[#e2e8f0]' : 'text-[#cbd5e1]'
                        )}>
                          {snippet.filename || (snippet.title.toLowerCase().replace(/\s+/g, '-') + getExtensionForLanguage(snippet.language))}
                        </span>
                      </div>
                      {/* Bottom row: snippet title (as context) */}
                      <div className="text-[10px] text-muted truncate font-medium pl-5">
                        {snippet.title}
                      </div>
                    </>
                  ) : (
                    <>
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
                    </>
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

          {/* Resize Handle */}
          <div
            onMouseDown={startResizePanel}
            className="hidden md:block absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/20 active:bg-primary/40 transition-colors z-50 select-none group"
          >
            {/* Top and Bottom Corner Grab notches */}
            <div className="absolute top-4 right-0.5 flex gap-[1px] items-center justify-center opacity-40 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
              <div className="w-[1.5px] h-3.5 bg-gray-500 rounded-full" />
              <div className="w-[1.5px] h-3.5 bg-gray-500 rounded-full" />
            </div>
            <div className="absolute bottom-4 right-0.5 flex gap-[1px] items-center justify-center opacity-40 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
              <div className="w-[1.5px] h-3.5 bg-gray-500 rounded-full" />
              <div className="w-[1.5px] h-3.5 bg-gray-500 rounded-full" />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Snippet Detail */}
        <div className="flex-1 flex flex-col bg-canvas p-6 h-full overflow-hidden">
          {selectedSnippet ? (
            <div className="flex-grow flex flex-col min-h-0 h-full">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 mb-4 border-b border-[#1e1e2e] shrink-0">
                <div className="min-w-0 flex-1 pr-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-[#e2e8f0] truncate">{selectedSnippet.title}</h2>
                    <span className="text-xs font-mono bg-white/5 border border-hairline px-2 py-0.5 rounded text-muted">
                      {selectedSnippet.filename || (selectedSnippet.title.toLowerCase().replace(/\s+/g, '-') + getExtensionForLanguage(selectedSnippet.language))}
                    </span>
                  </div>
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
                    onClick={handleReview}
                    className="flex items-center gap-1.5 text-[11px] font-bold bg-[#6366f1] hover:bg-[#4f46e5] text-white px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 border-none"
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
                    src={profiles[selectedSnippet.createdBy]?.avatar}
                    name={profiles[selectedSnippet.createdBy]?.name || 'U'}
                    size="xs"
                  />
                  <span className="text-[10px] text-muted">
                    Added by <span className="text-body font-medium">{profiles[selectedSnippet.createdBy]?.name || 'Unknown'}</span> · Updated {format(new Date(selectedSnippet.updatedAt), 'MMM d, yyyy')}
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


    </div>
  );
}
