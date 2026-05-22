import { useState } from 'react';
import { Save, Eye, Edit3, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import type { DocPage } from '../../types';
import { Button } from '../ui/Button';

interface DocEditorProps {
  doc: DocPage;
  onSave: (content: string) => void;
  onBack: () => void;
}

export function DocEditor({ doc, onSave, onBack }: DocEditorProps) {
  const [content, setContent] = useState(doc.content);
  const [title, setTitle] = useState(doc.title);
  const [mode, setMode] = useState<'edit' | 'preview' | 'history'>('edit');
  const [isDirty, setIsDirty] = useState(false);

  const handleSave = () => {
    onSave(content);
    setIsDirty(false);
  };

  const toolbarItems = [
    { label: 'H1', action: 'heading1' },
    { label: 'H2', action: 'heading2' },
    { label: 'B', action: 'bold', className: 'font-bold' },
    { label: 'I', action: 'italic', className: 'italic' },
    { label: 'Code', action: 'code', className: 'font-mono text-xs' },
    { label: '•', action: 'bullet' },
    { label: '1.', action: 'ordered' },
    { label: '>', action: 'blockquote', className: 'text-lg' },
  ];

  const insertFormatting = (action: string) => {
    const formatting: Record<string, string> = {
      heading1: '\n# Heading\n',
      heading2: '\n## Heading\n',
      bold: '**bold text**',
      italic: '*italic text*',
      code: '`code`',
      bullet: '\n- Item',
      ordered: '\n1. Item',
      blockquote: '\n> Blockquote',
    };
    const textarea = document.querySelector('.doc-editor-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const insertion = formatting[action] || '';
      const newContent = content.slice(0, start) + insertion + content.slice(end);
      setContent(newContent);
      setIsDirty(true);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="bg-surface-card border-b border-hairline px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="text-sm text-muted hover:text-body mr-2 transition-colors"
          >
            ← Back
          </button>
          <div className="flex items-center gap-1 border-r border-hairline/50 pr-2">
            {(['edit', 'preview', 'history'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={clsx(
                  'flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors',
                  mode === m ? 'bg-white/10 text-ink' : 'text-muted hover:bg-surface-card',
                )}
              >
                {m === 'edit' && <Edit3 size={14} />}
                {m === 'preview' && <Eye size={14} />}
                {m === 'history' && <Clock size={14} />}
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && <span className="text-xs text-semantic-warning uppercase tracking-wider">Unsaved changes</span>}
          <Button size="sm" variant="outline" onClick={handleSave} disabled={!isDirty}>
            <Save size={14} /> Save
          </Button>
        </div>
      </div>

      {/* Title */}
      <div className="px-6 py-4 bg-surface-card/50 border-b border-hairline/30 shrink-0">
        {mode === 'edit' ? (
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); setIsDirty(true); }}
            className="w-full text-2xl font-bold text-ink border-0 outline-none placeholder:text-muted bg-transparent"
            placeholder="Document title..."
          />
        ) : (
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {mode === 'edit' && (
          <>
            {/* Formatting toolbar */}
            <div className="flex items-center gap-1 mb-3 p-1 bg-surface-elevated border border-hairline w-fit">
              {toolbarItems.map(item => (
                <button
                  key={item.action}
                  onClick={() => insertFormatting(item.action)}
                  className={clsx('px-2 py-1 text-sm hover:bg-surface-card transition-colors text-muted', item.className)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <textarea
              className="doc-editor-textarea w-full h-full resize-none border-0 outline-none text-sm leading-relaxed text-body bg-transparent font-mono"
              value={content}
              onChange={e => { setContent(e.target.value); setIsDirty(true); }}
              placeholder="Start writing your documentation..."
            />
          </>
        )}

        {mode === 'preview' && (
          <div
            className="prose prose-sm max-w-none text-body"
            dangerouslySetInnerHTML={{
              __html: content
                .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/`(.+?)`/g, '<code class="bg-surface-elevated px-1.5 py-0.5 text-sm text-body-strong">$1</code>')
                .replace(/^- (.+)$/gm, '<li>$1</li>')
                .replace(/^\d\. (.+)$/gm, '<li>$1</li>')
                .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-m-blue-light/50 pl-4 italic text-muted">$1</blockquote>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/^(?!<[h|b|l|c|p|u|o])/gm, '<p>')
                .replace(/(<p>)\s*<\/p>/g, ''),
            }}
          />
        )}

        {mode === 'history' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-ink">Version History</h3>
            {doc.versions.map(v => (
              <div key={v.version} className="flex items-center justify-between p-3 bg-surface-card border border-hairline">
                <div>
                  <span className="text-sm font-medium text-body-strong">v{v.version}</span>
                  <span className="text-xs text-muted ml-2">{format(new Date(v.updatedAt), 'MMM d, yyyy h:mm a')}</span>
                </div>
                <div className="text-xs text-muted">by {v.updatedBy}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
