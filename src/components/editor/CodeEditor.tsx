import { useState, useRef } from 'react';
import { useUIStore } from '../../store';
import { 
  FileCode, FileText, Braces, Hash, X, Save, Check, Code 
} from 'lucide-react';
import { clsx } from 'clsx';

export function CodeEditor() {
  const { 
    openFiles, activeFile, fileContents, 
    setActiveFile, closeFile, updateFileContent, openFile 
  } = useUIStore();
  
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };
  
  const currentContent = activeFile ? fileContents[activeFile] || '' : '';
  const lines = currentContent.split('\n');

  // Helper to get file icons
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop();
    switch (ext) {
      case 'tsx':
      case 'ts':
        return <FileCode className="text-[#3b82f6]" size={14} />;
      case 'css':
        return <Hash className="text-[#ec4899]" size={14} />;
      case 'json':
        return <Braces className="text-[#eab308]" size={14} />;
      case 'md':
        return <FileText className="text-[#14b8a6]" size={14} />;
      default:
        return <FileText className="text-[#94a3b8]" size={14} />;
    }
  };

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0f19] select-text">
      {/* 1. File Tabs Bar */}
      {openFiles.length > 0 && (
        <div className="flex bg-[#070a10] border-b border-hairline overflow-x-auto select-none shrink-0 scrollbar-none">
          {openFiles.map(file => {
            const isActive = activeFile === file;
            return (
              <div
                key={file}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 text-xs border-r border-hairline group cursor-pointer transition-colors relative",
                  isActive 
                    ? "bg-[#0b0f19] text-ink font-medium" 
                    : "text-muted hover:bg-[#0b0f19]/50 hover:text-ink"
                )}
                onClick={() => setActiveFile(file)}
              >
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-white" />
                )}
                {getFileIcon(file)}
                <span>{file}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFile(file);
                  }}
                  className="p-0.5 hover:bg-white/10 rounded-sm text-muted group-hover:opacity-100 opacity-60 hover:text-ink transition-opacity ml-1.5"
                >
                  <X size={10} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Code Editor Area */}
      {activeFile ? (
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Header Panel Toolbar */}
          <div className="h-9 px-4 border-b border-hairline/40 flex items-center justify-between bg-[#080c14] select-none shrink-0">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              EDITING: {activeFile}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-muted hover:text-ink transition-colors cursor-pointer"
                title="Copy all code"
              >
                {copied ? <Check size={12} className="text-emerald-500" /> : <Save size={12} />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          {/* Main Edit Canvas */}
          <div className="flex-1 flex overflow-hidden font-mono text-sm leading-relaxed min-h-0 bg-[#080b13]">
            {/* Line Numbers Column */}
            <div 
              ref={lineNumbersRef}
              className="py-4 select-none text-right pr-3 pl-4 border-r border-hairline/25 bg-[#070a10] text-muted/60 min-w-[3.5rem] select-none text-xs overflow-y-hidden"
            >
              {lines.map((_, i) => (
                <div key={i} className="h-6 leading-6">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Input Textarea */}
            <textarea
              ref={editorRef}
              value={currentContent}
              onChange={(e) => updateFileContent(activeFile, e.target.value)}
              onScroll={handleScroll}
              className="flex-1 p-4 h-full bg-[#080b13] text-ink focus:outline-none resize-none font-mono text-xs leading-6 overflow-y-auto"
              style={{
                tabSize: 2,
                whiteSpace: 'pre',
                wordWrap: 'normal',
              }}
              placeholder="// Write code here..."
            />
          </div>

          {/* Editor Status Bar */}
          <div className="h-6 bg-[#04060b] border-t border-hairline text-muted text-[10px] px-4 flex items-center justify-between select-none shrink-0 font-sans">
            <div className="flex items-center gap-3">
              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Live Editor
              </span>
              <span>main*</span>
              <span>1 modification</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Lines: {lines.length}</span>
              <span>UTF-8</span>
              <span className="uppercase">{activeFile.split('.').pop() || 'Text'}</span>
            </div>
          </div>
        </div>
      ) : (
        /* 3. VS Code styled landing screen if no tabs are open */
        <div className="flex-1 flex flex-col items-center justify-center bg-[#070a11] text-center p-8 select-none">
          <div className="max-w-md w-full border border-hairline/80 bg-[#090d16] p-8 shadow-2xl rounded-lg space-y-6">
            <div className="w-16 h-16 bg-white/5 border border-hairline flex items-center justify-center mx-auto rounded-xl">
              <Code size={36} className="text-m-blue-light" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink mb-1.5">DevCollab IDE</h2>
              <p className="text-xs text-muted">
                Explore, review, and modify local repository workspace files directly.
              </p>
            </div>

            <div className="border-t border-hairline/60 pt-5 space-y-3">
              <h3 className="text-xs font-bold text-ink text-left">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { name: 'Open App.tsx', file: 'App.tsx' },
                  { name: 'Open README.md', file: 'README.md' },
                  { name: 'Open package.json', file: 'package.json' }
                ].map(action => (
                  <button
                    key={action.file}
                    onClick={() => openFile(action.file)}
                    className="flex items-center justify-between p-2.5 bg-surface-card hover:bg-surface-elevated text-xs text-left border border-hairline rounded cursor-pointer transition-colors text-muted hover:text-ink"
                  >
                    <span>{action.name}</span>
                    <span className="text-[10px] text-muted font-mono bg-white/5 px-1.5 py-0.5 rounded border border-hairline">
                      Enter
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-hairline/60 pt-5 flex justify-between text-[11px] text-muted font-mono">
              <span>Show Explorer</span>
              <span className="bg-white/5 px-1 rounded border border-hairline">Click Explorer Icon</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
