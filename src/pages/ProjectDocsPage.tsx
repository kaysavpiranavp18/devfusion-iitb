import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Plus, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { DocEditor } from '../components/docs/DocEditor';
import { documents as initialDocs } from '../data/mock';
import type { DocPage } from '../types';

export function ProjectDocsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [docs, setDocs] = useState(initialDocs.filter(d => d.projectId === projectId));
  const [activeDoc, setActiveDoc] = useState<DocPage | null>(null);

  const handleSave = (content: string) => {
    if (!activeDoc) return;
    const updated = {
      ...activeDoc,
      content,
      version: activeDoc.version + 1,
      updatedAt: new Date().toISOString(),
    };
    setDocs(prev => prev.map(d => d.id === updated.id ? updated : d));
    setActiveDoc(updated);
  };

  const createDoc = () => {
    const newDoc: DocPage = {
      id: `d${Date.now()}`,
      projectId: projectId!,
      title: 'Untitled Document',
      content: '',
      linkedPages: [],
      version: 1,
      versions: [{ version: 1, content: '', updatedBy: 'u1', updatedAt: new Date().toISOString() }],
      createdBy: 'u1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDocs(prev => [...prev, newDoc]);
    setActiveDoc(newDoc);
  };

  return (
    <WorkspaceLayout>
      <div className="h-full flex flex-col sm:flex-row bg-canvas">
        {/* Sidebar */}
        <div className={clsx(
          "w-full sm:w-64 border-r border-hairline bg-surface-card flex flex-col shrink-0 transition-all",
          activeDoc ? "hidden sm:flex" : "flex"
        )}>
          <div className="p-4 border-b border-hairline flex items-center justify-between">
            <span className="text-xs font-bold text-ink uppercase tracking-wider">Pages</span>
            <button
              onClick={createDoc}
              className="p-1 hover:bg-surface-elevated text-muted hover:text-primary rounded-lg transition-colors cursor-pointer"
              title="New documentation page"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
            {docs.map(doc => {
              const isActive = activeDoc?.id === doc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => setActiveDoc(doc)}
                  className={clsx(
                    'w-full flex flex-col gap-1 px-3 py-2.5 text-sm text-left transition-all border-l-2 cursor-pointer',
                    isActive
                      ? 'bg-white/5 text-ink border-l-primary border-y-transparent border-r-transparent font-semibold shadow-sm'
                      : 'border-transparent text-muted hover:bg-white/[0.02] hover:text-ink',
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <FileText size={14} className={clsx(isActive ? 'text-primary' : 'text-muted', 'shrink-0')} />
                    <span className="truncate flex-1 font-semibold">{doc.title}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-muted ml-5 font-normal">
                    <Clock size={9} />
                    <span>Edited {format(new Date(doc.updatedAt), 'MMM d, yyyy')}</span>
                  </div>
                </button>
              );
            })}
            {docs.length === 0 && (
              <div className="text-center py-8 text-xs text-muted">
                No pages created yet.
              </div>
            )}
          </div>
        </div>

        {/* Content Panel */}
        <div className={clsx(
          "flex-1 flex flex-col min-w-0 h-full",
          !activeDoc ? "hidden sm:flex pt-12 pl-12 text-left" : "flex"
        )}>
          {activeDoc ? (
            <DocEditor
              doc={activeDoc}
              onSave={handleSave}
              onBack={() => setActiveDoc(null)}
            />
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-ink">Select a page to begin</h2>
              <p className="text-sm text-muted mt-1">
                Choose a page from the left panel or create a new one
              </p>
            </div>
          )}
        </div>
      </div>
    </WorkspaceLayout>
  );
}
