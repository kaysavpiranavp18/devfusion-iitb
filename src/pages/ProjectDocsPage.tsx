import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { DocEditor } from '../components/docs/DocEditor';
import { documents as initialDocs } from '../data/mock';
import type { DocPage } from '../types';
import { Button } from '../components/ui/Button';

export function ProjectDocsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [docs, setDocs] = useState(initialDocs.filter(d => d.projectId === projectId));
  const [activeDoc, setActiveDoc] = useState<DocPage | null>(null);
  const [showSidebar] = useState(true);

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

  if (activeDoc) {
    return (
      <WorkspaceLayout>
        <DocEditor
          doc={activeDoc}
          onSave={handleSave}
          onBack={() => setActiveDoc(null)}
        />
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout>
      <div className="h-full flex">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-56 border-r border-hairline bg-surface-card flex flex-col shrink-0">
            <div className="p-3 border-b border-hairline">
              <Button size="sm" className="w-full" onClick={createDoc}>
                <Plus size={14} /> New Page
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {docs.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => setActiveDoc(doc)}
                  className={clsx(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                    'hover:bg-surface-elevated text-body',
                  )}
                >
                  <FileText size={14} className="text-muted shrink-0" />
                  <span className="truncate">{doc.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-surface-elevated flex items-center justify-center mx-auto mb-4">
              <FileText size={40} className="text-muted" />
            </div>
            <h2 className="text-xl font-bold text-ink mb-2">Documentation Wiki</h2>
            <p className="text-sm text-muted mb-6">
              Like Notion pages for your project. Create rich documents with headings, code blocks, and more.
            </p>
            <Button onClick={createDoc}>
              <Plus size={16} /> Create your first page
            </Button>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
