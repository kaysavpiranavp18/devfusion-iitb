import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, Plus, Check, ArrowUp, Shield, Brain, X
} from 'lucide-react';
import { clsx } from 'clsx';
import { useTaskStore, useAuthStore, useUIStore, useWorkspaceStore } from '../../store';
import { backendJson } from '../../lib/api';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  isBreakdown?: boolean;
  breakdownTasks?: { title: string; priority: 'p0' | 'p1' | 'p2'; isDone: boolean }[];
  feature?: string;
}

interface AttachedItem {
  type: 'task' | 'doc' | 'snippet';
  id: string;
  title: string;
}

interface AIAssistantProps {
  projectId: string;
}

export function AIAssistant({ projectId }: AIAssistantProps) {
  const navigate = useNavigate();
  const { tasks, addTask } = useTaskStore();
  const { activeAiModel, setActiveAiModel, toggleAiSidebar } = useUIStore();
  const { currentWorkspace } = useWorkspaceStore();
  const isPro = currentWorkspace?.plan === 'pro';

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [importedStates, setImportedStates] = useState<Record<string, boolean>>({});
  
  // Drag and drop states
  const [attachedItems, setAttachedItems] = useState<AttachedItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [copilotMode, setCopilotMode] = useState<'assistant' | 'reviewer'>('assistant');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize directly in chat conversation view
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I'm your DevCollab Project Copilot. I can summarize project progress, identify stagnant blockers, generate standup reports, or break down features into task lists. How can I help you today?",
      timestamp: new Date().toISOString()
    }
  ]);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{
          id: 'welcome',
          sender: 'ai',
          text: copilotMode === 'reviewer'
            ? "Code Reviewer Mode Active. Drag code snippets or paste code here, and I'll analyze it for bugs, security vulnerabilities, performance optimization, and readability."
            : "Hello! I'm your DevCollab Project Copilot. I can summarize project progress, identify stagnant blockers, generate standup reports, or break down features into task lists. How can I help you today?",
          timestamp: new Date().toISOString()
        }];
      } else {
        const lastMsg = prev[prev.length - 1];
        const targetText = copilotMode === 'reviewer'
          ? "System: Switched to **Code Reviewer** mode. Send any code block to analyze bugs, readability, security, and performance."
          : "System: Switched to **Assistant** mode. Ask me about progress, blockers, daily standup, or feature breakdowns.";
        if (lastMsg && lastMsg.text === targetText) return prev;
        
        return [
          ...prev,
          {
            id: `system-${Date.now()}`,
            sender: 'ai',
            text: targetText,
            timestamp: new Date().toISOString()
          }
        ];
      }
    });
  }, [copilotMode]);

  const projectTasks = tasks.filter(t => t.projectId === projectId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Hook into custom header new-chat event
  useEffect(() => {
    const handleNewChat = () => {
      setInputValue('');
      setAttachedItems([]);
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: "Hello! I'm your DevCollab Project Copilot. I can summarize project progress, identify stagnant blockers, generate standup reports, or break down features into task lists. How can I help you today?",
          timestamp: new Date().toISOString()
        }
      ]);
    };
    window.addEventListener('copilot-new-chat', handleNewChat);
    return () => window.removeEventListener('copilot-new-chat', handleNewChat);
  }, []);

  const parseTasks = (text: string): { title: string; priority: 'p0' | 'p1' | 'p2'; isDone: boolean }[] => {
    if (!text) return [];
    const lines = text.split('\n').filter(line => line.trim().startsWith('[TASK]'));
    return lines.map(line => {
      const content = line.replace(/^\[TASK\]\s*/i, '');
      const parts = content.split('|');
      const title = parts[0]?.trim() || '';
      const priorityStr = parts[1]?.trim().toLowerCase() || 'p1';
      const priority: 'p0' | 'p1' | 'p2' = (priorityStr === 'p0' || priorityStr === 'p1' || priorityStr === 'p2') ? priorityStr : 'p1';
      return { title, priority, isDone: true };
    });
  };

  const callAIChat = async (userText: string, attachments: AttachedItem[]) => {
    try {
      const response = await backendJson<{ success: boolean; text: string }>(
        '/ai/chat',
        {
          method: 'POST',
          body: JSON.stringify({
            message: userText,
            model: copilotMode === 'reviewer' ? 'reviewer' : activeAiModel,
            attachments,
            projectTasks
          }),
        }
      );

      const responseText = response.text;
      const isBreakdown = responseText.includes('[TASK]');
      const breakdownTasks = isBreakdown ? parseTasks(responseText) : [];
      
      let featureName = '';
      if (isBreakdown) {
        const cleanFeature = userText
          .replace(/(break down feature|break down|breakdown|task breakdown for|task breakdown)/i, '')
          .trim();
        featureName = cleanFeature || 'New Feature';
      }

      setMessages(prev => [
        ...prev,
        {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai',
          text: responseText,
          timestamp: new Date().toISOString(),
          isBreakdown,
          breakdownTasks,
          feature: featureName
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: `msg-ai-err-${Date.now()}`,
          sender: 'ai',
          text: `Error calling DevCollab AI Assistant: ${err.message || 'Unknown network error.'}`,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed && attachedItems.length === 0) return;

    const currentAttached = [...attachedItems];
    setAttachedItems([]);

    const finalUserText = trimmed || `Analyze attached project item(s)`;

    const userMessage: Message = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: finalUserText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    callAIChat(finalUserText, currentAttached);
  };

  const handleImportTasks = (messageId: string, feature: string, tasksToImport: any[]) => {
    const currentUser = useAuthStore.getState().user;
    tasksToImport.forEach((sub, index) => {
      const newTaskId = `t-ai-${Date.now()}-${index}`;
      addTask({
        id: newTaskId,
        projectId: projectId,
        title: sub.title,
        description: `Automatically generated subtask for feature: ${feature}`,
        status: 'todo',
        priority: sub.priority,
        labels: ['AI-Generated', 'Feature-Breakdown'],
        attachments: [],
        comments: [],
        order: 100 + index,
        createdBy: currentUser?.id || 'u1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    setImportedStates(prev => ({
      ...prev,
      [messageId]: true
    }));
  };

  // Hook into custom review snippet event
  useEffect(() => {
    const handleReviewSnippet = (e: Event) => {
      const customEvent = e as CustomEvent;
      const snippet = customEvent.detail;
      if (!snippet) return;

      setCopilotMode('reviewer');

      const attached: AttachedItem = {
        type: 'snippet',
        id: snippet.id,
        title: snippet.title
      };

      const finalUserText = `Please review this code snippet: ${snippet.title}`;

      const userMessage: Message = {
        id: `msg-user-${Date.now()}`,
        sender: 'user',
        text: finalUserText,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setLoading(true);

      callAIChat(finalUserText, [attached]);
    };

    window.addEventListener('copilot-review-snippet', handleReviewSnippet);
    return () => window.removeEventListener('copilot-review-snippet', handleReviewSnippet);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#070a10] font-sans select-text relative">
      {/* Top Mode Switcher, Model Selector & Action Buttons */}
      <div className="px-4 py-2 border-b border-[#1e1e2e]/50 bg-[#0d1117] flex justify-between items-center shrink-0 select-none z-10">
        <div className="flex items-center gap-3">
          <div className="flex bg-[#161b22] border border-[#30363d]/60 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setCopilotMode('assistant')}
              className={clsx(
                "px-3 py-0.5 rounded text-[8px] font-bold uppercase transition-all duration-150 cursor-pointer border-none",
                copilotMode === 'assistant' ? "bg-white/10 text-ink" : "text-muted hover:text-ink hover:bg-white/[0.02]"
              )}
            >
              Assistant
            </button>
            <button
              type="button"
              onClick={() => setCopilotMode('reviewer')}
              className={clsx(
                "px-3 py-0.5 rounded text-[8px] font-bold uppercase transition-all duration-150 cursor-pointer border-none",
                copilotMode === 'reviewer' ? "bg-white/10 text-ink" : "text-muted hover:text-ink hover:bg-white/[0.02]"
              )}
            >
              Reviewer
            </button>
          </div>
          
          <div className="flex items-center gap-1">
            <Shield size={10} className="text-muted/80 shrink-0" />
            <select
              value={activeAiModel}
              onChange={(e) => setActiveAiModel(e.target.value)}
              className="bg-transparent border-none text-muted hover:text-ink text-[9px] font-semibold focus:ring-0 focus:outline-none cursor-pointer pr-1 leading-none py-0 select-none"
            >
              <option value="gemini-2.5-pro" className="bg-[#0a0a0f]">Gemini 2.5 Pro</option>
              <option value="gemini-2.5-flash" className="bg-[#0a0a0f]">Gemini 2.5 Flash</option>
              <option value="claude-3.5-sonnet" className="bg-[#0a0a0f]">Claude 3.5 Sonnet</option>
              <option value="gpt-4o" className="bg-[#0a0a0f]">GPT-4o</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-muted">
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('copilot-new-chat'));
            }}
            className="p-1 hover:text-ink rounded transition-colors cursor-pointer hover:bg-white/[0.04] border-none bg-transparent"
            title="New Chat Session"
          >
            <Plus size={13} />
          </button>
          <button
            onClick={toggleAiSidebar}
            className="p-1 hover:text-ink rounded transition-colors cursor-pointer hover:bg-white/[0.04] ml-0.5 border-none bg-transparent"
            title="Close panel"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Chat message bubbles */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-[#070a10] scrollbar-thin select-text">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx(
              "flex gap-3",
              msg.sender === 'user' ? "justify-end" : "justify-start"
            )}
          >
            {msg.sender === 'ai' && (
              <div className="w-6 h-6 bg-[#6366f1]/10 border border-[#6366f1]/30 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <Brain size={12} className="text-[#6366f1]" />
              </div>
            )}
            <div
              className={clsx(
                "max-w-[85%] rounded-xl p-3 text-xs leading-relaxed text-left",
                msg.sender === 'user'
                  ? "bg-[#6366f1]/10 border border-[#6366f1]/20 text-[#cbd5e1]"
                  : "bg-[#161b22] border border-[#30363d]/60 text-[#e6edf3]"
              )}
            >
              <div className="prose prose-invert max-w-none text-xs break-words">
                {msg.text.split('\n').map((line, idx) => {
                  if (line.startsWith('### ')) {
                    return <h3 key={idx} className="text-white font-bold my-1.5 text-sm">{line.replace('### ', '')}</h3>;
                  }
                  if (line.startsWith('* ')) {
                    return <li key={idx} className="ml-3 list-disc my-0.5">{line.replace('* ', '')}</li>;
                  }
                  return <p key={idx} className="my-0.5">{line}</p>;
                })}
              </div>

              {/* Feature Breakdown imports inside bubble */}
              {msg.isBreakdown && msg.breakdownTasks && (
                <div className="mt-3 pt-3 border-t border-[#30363d] space-y-2">
                  <div className="space-y-1.5">
                    {msg.breakdownTasks.map((task, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-[#0d1117] border border-[#30363d]/50 rounded-lg text-[10px]">
                        <span className="truncate pr-2 font-medium text-[#c9d1d9]">{task.title}</span>
                        <span className={clsx(
                          "px-1.5 py-0.2 rounded text-[8px] font-bold uppercase",
                          task.priority === 'p0' ? "bg-red-500/10 text-red-400" :
                          task.priority === 'p1' ? "bg-orange-500/10 text-orange-400" :
                          "bg-yellow-500/10 text-yellow-400"
                        )}>
                          {task.priority.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleImportTasks(msg.id, msg.feature || 'Feature', msg.breakdownTasks || [])}
                    disabled={importedStates[msg.id]}
                    className={clsx(
                      "w-full mt-2 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 border-none",
                      importedStates[msg.id]
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-[#6366f1] hover:bg-[#4f46e5] text-white"
                    )}
                  >
                    {importedStates[msg.id] ? (
                      <>
                        <Check size={11} />
                        <span>Imported Successfully</span>
                      </>
                    ) : (
                      <>
                        <Plus size={11} />
                        <span>Import Tasks to Board</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start animate-in fade-in duration-300">
            <div className="w-6 h-6 bg-[#6366f1]/10 border border-[#6366f1]/30 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <Brain size={12} className="text-[#6366f1]" />
            </div>
            <div className="bg-[#161b22] border border-[#30363d]/60 rounded-xl p-3 text-xs flex items-center gap-2 text-muted">
              <Loader2 size={12} className="animate-spin text-[#6366f1]" />
              <span>Copilot is typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input area */}
      <div className="pt-2 pb-3 bg-[#070a10] border-t border-[#1e1e2e]/40 shrink-0 select-none">
        {/* Prompt Input Container with Drop Handling */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const dataStr = e.dataTransfer.getData('application/devcollab-item');
            if (dataStr) {
              try {
                const item = JSON.parse(dataStr) as AttachedItem;
                if (!attachedItems.some(i => i.id === item.id && i.type === item.type)) {
                  setAttachedItems(prev => [...prev, item]);
                }
              } catch (err) {
                console.error(err);
              }
            }
          }}
          className={clsx(
            "mx-3 bg-[#0d1117] border rounded-xl p-2.5 transition-all duration-150",
            dragOver 
              ? "border-[#6366f1] bg-[#6366f1]/5 ring-2 ring-[#6366f1]/10" 
              : "border-[#1e1e2e] focus-within:border-[#6366f1]/50 focus-within:ring-1 focus-within:ring-[#6366f1]/20"
          )}
        >
          {/* Attached Items Chips */}
          {attachedItems.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2 pb-1.5 border-b border-[#1e1e2e]/20 select-none">
              {attachedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-[#cbd5e1] animate-in"
                >
                  <span className="text-[8px] font-bold uppercase text-muted bg-white/5 px-1 rounded select-none leading-normal">
                    {item.type}
                  </span>
                  <span className="truncate max-w-[120px] font-medium">{item.title}</span>
                  <button
                    type="button"
                    onClick={() => setAttachedItems(prev => prev.filter((_, i) => i !== idx))}
                    className="text-muted hover:text-rose-400 font-bold transition-colors cursor-pointer text-xs leading-none border-none bg-transparent"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-end">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(inputValue);
                }
              }}
              disabled={loading}
              placeholder={copilotMode === 'reviewer' ? "Paste your code here to review..." : "Ask a question or drag project items here..."}
              rows={1}
              className="flex-1 bg-transparent border-none outline-none text-xs text-ink placeholder:text-[#8b949e] resize-none focus:ring-0 focus:outline-none min-h-[24px] max-h-[120px] py-1 scrollbar-none"
            />
            
            <button
              type="button"
              onClick={() => handleSend(inputValue)}
              disabled={(!inputValue.trim() && attachedItems.length === 0) || loading}
              className="p-1.5 bg-[#6366f1] disabled:bg-[#1e1e2e] text-white disabled:text-muted rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:cursor-not-allowed border-none shrink-0"
            >
              <ArrowUp size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Premium features lock paywall */}
      {!isPro && (
        <div className="absolute inset-x-0 bottom-0 top-[37px] bg-[#070a10]/85 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-200">
          <div className="max-w-xs space-y-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 text-white rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
              <Brain size={24} className="animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Copilot (Pro)</h3>
              <p className="text-xs text-muted leading-relaxed font-light">
                Unlock automated code reviews, dynamic feature breakdowns, daily standup summaries, and smart developer assistance.
              </p>
            </div>
            <button
              onClick={() => navigate('/payments')}
              className="w-full py-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-md shadow-primary/10 border-none font-sans"
            >
              Upgrade Workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
