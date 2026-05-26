import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Plus, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { DocEditor } from '../components/docs/DocEditor';
import type { DocPage } from '../types';
import { useDocsStore, useAuthStore } from '../store';

export function ProjectDocsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { docs, fetchDocs, addDoc, updateDoc } = useDocsStore();
  const { user } = useAuthStore();
  const [activeDoc, setActiveDoc] = useState<DocPage | null>(null);

  // States and hooks for left panel resizing
  const [panelWidth, setPanelWidth] = useState(256);
  const [isResizingPanel, setIsResizingPanel] = useState(false);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  const startResizePanel = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingPanel(true);
  };

  useEffect(() => {
    if (projectId) {
      fetchDocs(projectId);
      setActiveDoc(null);
    }
  }, [projectId, fetchDocs]);

  useEffect(() => {
    if (activeDoc) {
      const current = docs.find(d => d.id === activeDoc.id);
      if (current) {
        setActiveDoc(current);
      }
    }
  }, [docs, activeDoc?.id]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingPanel && leftPanelRef.current) {
        const rect = leftPanelRef.current.getBoundingClientRect();
        const newWidth = e.clientX - rect.left;
        if (newWidth >= 180 && newWidth <= 450) {
          setPanelWidth(newWidth);
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

  const handleSave = async (title: string, content: string) => {
    if (!activeDoc) return;
    await updateDoc(activeDoc.id, {
      title,
      content,
      version: activeDoc.version + 1
    });
  };

  const createDoc = async () => {
    if (!user || !projectId) return;
    const newDoc: DocPage = {
      id: `d${Date.now()}`,
      projectId: projectId,
      title: 'Untitled Document',
      content: '',
      linkedPages: [],
      version: 1,
      versions: [],
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newId = await addDoc(newDoc);
    if (newId) {
      const created = docs.find(d => d.id === newId) || { ...newDoc, id: newId };
      setActiveDoc(created);
    }
  };

  return (
    <WorkspaceLayout>
      <div className="h-full flex flex-col sm:flex-row bg-canvas relative">
        {/* Sidebar */}
        <div
          ref={leftPanelRef}
          style={{ width: window.innerWidth >= 640 ? `${panelWidth}px` : undefined }}
          className={clsx(
            "w-full sm:w-auto shrink-0 border-r border-hairline bg-surface-card flex flex-col relative",
            !isResizingPanel && "transition-all",
            activeDoc ? "hidden sm:flex" : "flex"
          )}
        >
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
                  draggable
                  onDragStart={(e) => {
                    const itemData = JSON.stringify({ type: 'doc', id: doc.id, title: doc.title });
                    e.dataTransfer.setData('application/devcollab-item', itemData);
                    e.dataTransfer.setData('text/plain', `@doc:${doc.title}`);
                  }}
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

          {/* Resize Handle */}
          <div
            onMouseDown={startResizePanel}
            className="hidden sm:block absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/20 active:bg-primary/40 transition-colors z-50 select-none group"
          >
            {/* Top and Bottom Corner grab notches */}
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
