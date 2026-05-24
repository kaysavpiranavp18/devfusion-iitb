import { useState, useRef } from 'react';
import { Save, Eye, Edit3, Heading1, Bold, Italic, List, Code, Image } from 'lucide-react';
import { clsx } from 'clsx';
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
  const [mode, setMode] = useState<'edit' | 'preview'>('preview');
  const [isDirty, setIsDirty] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const imgTag = `<img src="${dataUrl}" style="max-width: 100%; height: auto; margin: 1rem 0; display: block;" alt="${file.name}" />`;
        
        const textarea = document.querySelector('.doc-editor-textarea') as HTMLTextAreaElement;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newContent = content.slice(0, start) + imgTag + content.slice(end);
          setContent(newContent);
          setIsDirty(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave(content);
    setIsDirty(false);
  };

  const toolbarItems = [
    { icon: Heading1, action: 'heading1', label: 'Heading' },
    { icon: Bold, action: 'bold', label: 'Bold' },
    { icon: Italic, action: 'italic', label: 'Italic' },
    { icon: List, action: 'bullet', label: 'List' },
    { icon: Code, action: 'code', label: 'Code Block' },
  ];

  const insertFormatting = (action: string) => {
    const formatting: Record<string, string> = {
      heading1: '\n# Heading\n',
      bold: '**bold text**',
      italic: '*italic text*',
      code: '`code`',
      bullet: '\n- Item',
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

  const getHtml = (text: string) => {
    // Convert markdown to HTML
    let html = text
      .replace(/^### (.+)$/gm, '<h3 class="text-white text-lg font-semibold my-4">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-white text-xl font-bold my-5 border-b border-hairline pb-2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-white text-2xl font-bold my-6">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-surface-elevated px-1.5 py-0.5 text-xs text-white rounded font-mono">$1</code>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-body my-1.5">$1</li>')
      .replace(/^\d\. (.+)$/gm, '<li class="ml-4 list-decimal text-body my-1.5">$1</li>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary pl-4 italic text-muted my-4">$1</blockquote>')
      .replace(/\n\n/g, '</p><p class="my-3">');

    // Wrap remaining lines that don't have block tags in p tags
    const lines = html.split('\n');
    const processed = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (/^<[a-z/]/i.test(trimmed)) return trimmed;
      return `<p class="my-2">${line}</p>`;
    });
    
    return processed.join('\n');
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="h-full flex flex-col bg-canvas">
      {/* Toolbar */}
      <div className="bg-surface-card border-b border-hairline px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="text-sm text-muted hover:text-ink mr-3 transition-colors cursor-pointer"
          >
            ← Back
          </button>
          <div className="flex items-center gap-1 bg-surface-elevated p-0.5 rounded-lg border border-hairline">
            {(['edit', 'preview'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer',
                  mode === m ? 'bg-surface-card text-ink shadow-sm' : 'text-muted hover:text-ink',
                )}
              >
                {m === 'edit' && <Edit3 size={12} />}
                {m === 'preview' && <Eye size={12} />}
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && <span className="text-xs text-semantic-warning font-semibold uppercase tracking-wider">Unsaved Changes</span>}
          <Button size="sm" onClick={handleSave} disabled={!isDirty} className="rounded-lg bg-primary hover:bg-primary/95 text-white">
            <Save size={14} className="mr-1.5" /> Save
          </Button>
        </div>
      </div>

      {/* Title */}
      <div className="px-6 pt-6 shrink-0 bg-canvas">
        <input
          value={title}
          onChange={e => { setTitle(e.target.value); setIsDirty(true); }}
          className="w-full text-2xl font-semibold bg-transparent border-none outline-none text-[#e2e8f0] pb-3 mb-3 border-b border-[#1e1e2e] focus:ring-0"
          placeholder="Document title..."
        />
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto px-6 py-2 bg-canvas">
        {mode === 'edit' && (
          <div className="h-full flex flex-col">
            {/* Formatting toolbar */}
            <div className="bg-[#13131a] border border-[#1e1e2e] rounded-lg inline-flex p-1 gap-1 mb-4 w-fit shrink-0">
              {toolbarItems.map(item => (
                <button
                  key={item.action}
                  type="button"
                  onClick={() => insertFormatting(item.action)}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors text-[#475569] hover:text-ink cursor-pointer bg-transparent border-0"
                  title={item.label}
                >
                  <item.icon size={14} />
                </button>
              ))}
              <button
                type="button"
                onClick={handleImageClick}
                className="p-1.5 hover:bg-white/10 rounded transition-colors text-[#475569] hover:text-ink cursor-pointer bg-transparent border-0"
                title="Insert Image"
              >
                <Image size={14} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <textarea
              className="doc-editor-textarea w-full flex-1 resize-none border-0 outline-none text-[#cbd5e1] bg-transparent text-sm leading-relaxed min-h-[60vh] focus:ring-0 placeholder:text-muted/50 font-sans"
              value={content}
              onChange={e => { setContent(e.target.value); setIsDirty(true); }}
              placeholder="Start writing your documentation in Markdown..."
            />
          </div>
        )}

        {mode === 'preview' && (
          <div
            className="prose prose-invert max-w-none text-body leading-loose"
            dangerouslySetInnerHTML={{
              __html: getHtml(content),
            }}
          />
        )}
      </div>

      {/* Footer bar */}
      <div className="px-6 py-3 flex items-center justify-end shrink-0 select-none bg-canvas">
        <span className="text-[10px] text-muted">
          Autosaved · {wordCount} words
        </span>
      </div>
    </div>
  );
}
