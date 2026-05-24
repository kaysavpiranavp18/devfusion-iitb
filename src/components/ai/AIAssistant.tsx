import { useState, useEffect, useRef } from 'react';
import {
  Loader2, Plus, Check, ArrowUp, Shield, Brain, X
} from 'lucide-react';
import { clsx } from 'clsx';
import { useTaskStore, useAuthStore, useUIStore, useSnippetStore } from '../../store';
import { format, differenceInDays } from 'date-fns';

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

function detectLanguage(code: string): string {
  const text = code.trim();
  const lower = text.toLowerCase();
  
  if (lower.includes('package main') || lower.includes('import "fmt"') || lower.includes('func main()')) {
    return 'Go';
  }
  if (lower.includes('#include') || lower.includes('std::cout') || lower.includes('int main(')) {
    return 'C++';
  }
  if (lower.includes('public class ') || lower.includes('system.out.print') || lower.includes('public static void main')) {
    return 'Java';
  }
  if (lower.includes('def ') || lower.includes('import os') || lower.includes('print(') && !lower.includes('function') && !lower.includes('{')) {
    return 'Python';
  }
  return 'JavaScript';
}

function generateCodeReview(code: string, language: string, title: string): string {
  let score = 8;
  let bugs = '';
  let performance = '';
  let readability = '';
  let security = '';
  
  const lower = code.toLowerCase();
  
  if (language.toLowerCase() === 'javascript' || language.toLowerCase() === 'typescript' || language.toLowerCase() === 'javascript/typescript') {
    if (lower.includes('eval(')) {
      security = "🔴 **eval() usage**: Executing arbitrary strings is extremely dangerous and invites remote code execution (RCE) hazards.\n   * *Action:* Replace `eval()` with safe alternatives like `JSON.parse` or direct dictionary lookups.";
      score = Math.min(score, 3);
    } else if (lower.includes('innerhtml')) {
      security = "🔴 **innerHTML Vulnerability**: Injecting content via `innerHTML` opens up dynamic Cross-Site Scripting (XSS) vectors.\n   * *Action:* Swap for `textContent` or run data through a sanitization library first.";
      score = Math.min(score, 5);
    } else {
      security = "🟢 **Safe input flow**: No critical injection patterns or unsafe eval calls detected.\n   * *Action:* Maintain static typing validator limits.";
    }

    if (lower.includes('var ')) {
      readability = "🟡 **Use of deprecated var**: Declaring variables with `var` defaults to function-scoping, which leads to hoisting errors.\n   * *Action:* Refactor all occurrences of `var` to `let` or `const` block scopes.";
      score = Math.min(score, 6);
    } else {
      readability = "🟢 **Clean naming & modern styles**: CamelCase naming and modern block variable declarations are respected.\n   * *Action:* Consistently apply formatter setups.";
    }

    if (lower.includes('useeffect') && !lower.includes('[],') && !lower.includes('],')) {
      performance = "🔴 **Missing useEffect dependencies**: Running effects on every layout update triggers heavy execution loops.\n   * *Action:* Explicitly configure the dependencies array to prevent infinite rendering cascades.";
      score = Math.min(score, 4);
    } else {
      performance = "🟢 **Efficient lifecycle rendering**: Execution is light. Array routines and state adjustments perform well.\n   * *Action:* Use React.memo if scaling child nodes.";
    }

    if (lower.includes('==') && !lower.includes('===')) {
      bugs = "🔴 **Loose equality comparison**: Checking values with `==` triggers implicit type coercion, causing fragile checks.\n   * *Action:* Upgrade all `==` check operators to strict `===` checks.";
      score = Math.min(score, 5);
    } else {
      bugs = "🟢 **Sound comparators**: Clear comparisons and robust branching checks observed.\n   * *Action:* Include standard null checks to safeguard parameters.";
    }
  } 
  else if (language.toLowerCase() === 'python') {
    if (lower.includes('input(') && (lower.includes('exec(') || lower.includes('eval('))) {
      security = "🔴 **Arbitrary code execution**: Evaluating user-inputted strings opens key shell hijack exploits.\n   * *Action:* Replace arbitrary eval statements with dictionary mapping actions.";
      score = Math.min(score, 2);
    } else {
      security = "🟢 **Secure runtime logic**: No dangerous subprocesses or OS system command concatenations were detected.\n   * *Action:* Use absolute paths for resource file handling.";
    }

    if (lower.includes('global ')) {
      readability = "🟡 **Global scope mutations**: Mutating variables in the global namespace decreases code reuse and isolation.\n   * *Action:* Avoid global states; return values explicitly from functions.";
      score = Math.min(score, 6);
    } else {
      readability = "🟢 **PEP 8 conformance**: Snippet complies with typical Python layout, spaces, and snake_case formatting.\n   * *Action:* Integrate a linter like Black.";
    }

    if (lower.includes('append(') && lower.includes('for ')) {
      performance = "🟡 **Loop accumulation list load**: Standard loop appending is slower than utilizing list comprehensions.\n   * *Action:* Refactor to list comprehension format: `result = [x * 2 for x in items]`.";
    } else {
      performance = "🟢 **Time complexity efficiency**: Runs in linear time. No redundant array operations detected.\n   * *Action:* Leverage generators when reading large inputs.";
    }

    if (lower.includes('except:') || lower.includes('except exception:')) {
      bugs = "🔴 **Bare exceptions catcher**: Catching basic or empty exceptions hides keyboard inputs, name errors, and system crashes.\n   * *Action:* Replace with targeted blocks, e.g. `except KeyError:` or `except ValueError:`.";
      score = Math.min(score, 5);
    } else {
      bugs = "🟢 **Graceful handling paths**: Control structures look logical and avoid obvious runtime crashes.\n   * *Action:* Add standard docstrings explaining method inputs.";
    }
  }
  else if (language.toLowerCase() === 'java') {
    if (lower.includes('query =') && lower.includes('select ') && !lower.includes('preparedstatement')) {
      security = "🔴 **SQL injection risk**: String concatenation on database query builders exposes databases to remote injections.\n   * *Action:* Wrap parameter binds inside dynamic `PreparedStatement` properties.";
      score = Math.min(score, 3);
    } else {
      security = "🟢 **Scoped parameters**: Field scopes and visibility are correctly defined.\n   * *Action:* Keep properties encapsulated and expose through getters.";
    }

    if (lower.includes('system.out.print')) {
      readability = "🟡 **Standard output stream printing**: Using `System.out.println` directly bypasses modern standard logging mechanisms.\n   * *Action:* Install a standard logger framework like SLF4J or Logback.";
    } else {
      readability = "🟢 **OOD structure compliance**: Correct camelCase naming and PascalCase class rules are observed.\n   * *Action:* Apply Javadoc comments to public functions.";
    }

    if (lower.includes('new ') && lower.includes('connection(')) {
      performance = "🔴 **Raw unpooled connections**: Recreating database connection pools repeatedly introduces massive garbage collection and network lag.\n   * *Action:* Integrate a dedicated connection pool tool like HikariCP.";
      score = Math.min(score, 4);
    } else {
      performance = "🟢 **Efficient heap load**: Avoids redundant instantiation loops. Low memory print.\n   * *Action:* Ensure stream collections are closed after completion.";
    }

    if (lower.includes('==') && lower.includes('string')) {
      bugs = "🔴 **String comparison using ==**: Java checks reference identity with `==`, meaning string values may evaluate incorrectly.\n   * *Action:* Use `string1.equals(string2)` instead of `==`.";
      score = Math.min(score, 5);
    } else {
      bugs = "🟢 **Type matching checks**: Checked arguments match expected structures. No obvious NPE risks.\n   * *Action:* Utilize Java Optionals to return nullable elements safely.";
    }
  }
  else if (language.toLowerCase() === 'c++') {
    if (lower.includes('strcpy(') || lower.includes('gets(')) {
      security = "🔴 **Dangerous unsafe function call**: Functions like `strcpy` do not validate bounds, causing buffer overflow vectors.\n   * *Action:* Substitute with modern memory safe structures like `std::string` or `std::copy`.";
      score = Math.min(score, 3);
    } else {
      security = "🟢 **Memory boundary configuration**: Code prevents obvious overflow and heap corruptions.\n   * *Action:* Compile using `-fstack-protector` parameters.";
    }

    if (lower.includes('using namespace std;')) {
      readability = "🟡 **std Namespace pollution**: Declaring global using directives creates naming conflicts for custom objects.\n   * *Action:* Remove standard namespace exports and specify `std::` explicitly.";
    } else {
      readability = "🟢 **Clean type naming**: Scopes are neatly marked, parameters are const-correct.\n   * *Action:* Document ownership behaviors inside class definitions.";
    }

    if (lower.includes('new ') && !lower.includes('delete ') && !lower.includes('unique_ptr') && !lower.includes('shared_ptr')) {
      performance = "🔴 **Dangling raw resource leakage**: Allocating memory using `new` without corresponding deletion results in leakages.\n   * *Action:* Encapsulate allocations inside modern smart containers like `std::unique_ptr`.";
      score = Math.min(score, 4);
    } else {
      performance = "🟢 **Optimal pointer indexing**: Low dereference counts and memory accesses are configured.\n   * *Action:* Ensure fast-passing is done using references.";
    }

    if (lower.includes('delete ') && !lower.includes('nullptr') && !lower.includes(' = nullptr')) {
      bugs = "🟡 **Dangling pointers on delete**: Clearing pointers without nulling them creates unsafe dangling references.\n   * *Action:* Set pointers to `nullptr` right after triggering `delete`.";
      score = Math.min(score, 6);
    } else {
      bugs = "🟢 **Memory allocations check**: Destructor chains and memory addresses are clean.\n   * *Action:* Integrate ASan during compilation stages.";
    }
  }
  else if (language.toLowerCase() === 'go') {
    if (lower.includes('query(') && lower.includes('fmt.sprintf') && lower.includes('select')) {
      security = "🔴 **Dynamic SQL creation**: Concatenating input using `fmt.Sprintf` is vulnerable to injection attacks.\n   * *Action:* Replace with safe parameter bindings (e.g. `db.QueryContext(ctx, \"SELECT ... WHERE id = ?\", id)`).";
      score = Math.min(score, 3);
    } else {
      security = "🟢 **Secure interfaces configuration**: System commands are not run dynamically.\n   * *Action:* Sanitize path arguments in file lookups.";
    }

    if (lower.includes('panic(')) {
      readability = "🟡 **Improper usage of panic()**: Halt commands in Go disrupt control. Go code should return errors to callers instead.\n   * *Action:* Refactor panics to explicit error wrapper returns.";
      score = Math.min(score, 6);
    } else {
      readability = "🟢 **Idiomatic struct formatting**: Idiomatic layout conforms to typical Go conventions.\n   * *Action:* Run standard `gofmt` commands.";
    }

    if (lower.includes('go ') && !lower.includes('select') && !lower.includes('chan')) {
      performance = "🟡 **Goroutine lifecycle leak risk**: Initiating routines without channels can result in lingering threads under heavy load.\n   * *Action:* Use context control parameters or channels to coordinate termination.";
    } else {
      performance = "🟢 **Low heap escape runtime**: Data fits onto stack frames, decreasing garbage collection weight.\n   * *Action:* Benchmark recurrent memory footprints.";
    }

    if (lower.includes('err :=') || lower.includes('err =')) {
      if (!lower.includes('err != nil')) {
        bugs = "🔴 **Ignored error status**: Assigning errors without checks leads to application crashes when operations fail.\n   * *Action:* Implement standard `if err != nil` validations immediately.";
        score = Math.min(score, 5);
      } else {
        bugs = "🟢 **Explicit error checks**: Returns are checked properly.\n   * *Action:* Contextually wrap returned errors.";
      }
    } else {
      bugs = "🟢 **Solid operations check**: Variable declarations check out. Normal control flow paths.\n   * *Action:* Add unit test validation scenarios.";
    }
  }
  else {
    score = 8;
    bugs = "🟢 **Sound logic paths**: Logic blocks execute in order without obvious bug risks.\n   * *Action:* Run standard checks.";
    performance = "🟢 **Speed check**: No heavy recursion or loops detected.\n   * *Action:* Monitor scaling loads.";
    readability = "🟢 **Style conventions**: Code is clean and comments explain operations.\n   * *Action:* Document public structs.";
    security = "🟢 **Data boundary validation**: Safe parsing actions.\n   * *Action:* Verify configuration profiles.";
  }

  score = Math.max(1, Math.min(10, score));

  return `### 🔍 AI Code Review: ${title}

I have audited this **${language}** snippet across four core dimensions. Below is your detailed review card:

#### 1. 🐛 Bug Risks & Correctness
${bugs}

#### 2. ⚡ Performance Optimization
${performance}

#### 3. 📝 Readability Suggestions
${readability}

#### 4. 🔒 Security Concerns
${security}

---

### 📊 Overall Quality Score: **${score}/10**
*Actionable Next Step: Fix the high-impact issues listed above to increase the score.*`;
}

export function AIAssistant({ projectId }: AIAssistantProps) {
  const { tasks, addTask } = useTaskStore();
  const { activeAiModel, setActiveAiModel, toggleAiSidebar } = useUIStore();
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
        // Only append mode notice if the last message is not already the same system announcement
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

  const handleSend = (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed && attachedItems.length === 0) return;

    const currentAttached = [...attachedItems];
    setAttachedItems([]); // Clear attachments

    // Format text showing attachments if user didn't enter anything but attached files
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

    simulateAIResponse(finalUserText, currentAttached);
  };

  const simulateAIResponse = (userText: string, attachments: AttachedItem[]) => {
    setTimeout(() => {
      let responseText = '';
      let isBreakdown = false;
      let breakdownTasks: any[] = [];
      let featureName = '';

      const query = userText.toLowerCase();

      if (copilotMode === 'reviewer') {
        let codeToReview = userText;
        let language = 'JavaScript';
        let title = 'Pasted Code Snippet';

        if (attachments.length > 0 && attachments[0].type === 'snippet') {
          const snippetObj = useSnippetStore.getState().snippets.find(s => s.id === attachments[0].id);
          if (snippetObj) {
            codeToReview = snippetObj.code;
            language = snippetObj.language;
            title = snippetObj.title;
          }
        } else {
          language = detectLanguage(codeToReview);
        }

        if (!codeToReview.trim() || codeToReview.toLowerCase().includes('paste your code') || codeToReview.toLowerCase().includes('analyze attached project')) {
          responseText = `### 🔍 AI Code Reviewer Mode Active

Please drag in a code snippet or paste code here to receive an interactive code review. I'll inspect it for:
* **Bug Risks** (edge cases, boundary errors)
* **Performance** (redundant loops, heavy computations)
* **Readability** (naming conventions, documentation)
* **Security** (input validation, injection risks)
* **Quality Score** (1-10 grading rating)`;
        } else {
          responseText = generateCodeReview(codeToReview, language, title);
        }
      } else {
        // Check if we have attached files
        if (attachments.length > 0) {
          const itemsList = attachments.map(a => `[${a.type.toUpperCase()}] "${a.title}"`).join(', ');
          responseText = `### Context Reference Identified\n\nI have successfully scanned the active project item(s) you attached:\n* **${itemsList}**\n\nHere is my analysis and recommended action plan:\n\n1. **Integration Alignment:** Ensure the changes in this block map directly to existing interface routes.\n2. **Reviewing Code Quality:** Let me know if you'd like me to perform an automated code review on these snippets to inspect styling compliance and error handling.\n3. **Wiki Updates:** We should log any schema shifts inside the docs wiki for the rest of the team.\n\nWhat would you like me to generate next?`;
        } else if (query.includes('summarize') || query.includes('summary') || query.includes('progress')) {
        const todo = projectTasks.filter(t => t.status === 'todo').length;
        const inProgress = projectTasks.filter(t => t.status === 'in_progress').length;
        const inReview = projectTasks.filter(t => t.status === 'in_review').length;
        const done = projectTasks.filter(t => t.status === 'done').length;
        const total = projectTasks.length;
        const p0 = projectTasks.filter(t => t.priority === 'p0' && t.status !== 'done').length;
        const pct = total > 0 ? Math.round(done / total * 100) : 0;

        responseText = `### Project Progress Summary\n\n* **Overall Progress:** ${pct}% complete (${done}/${total} tasks completed)\n* **Task Breakdown:**\n  * **Done:** ${done} task(s)\n  * **In Review:** ${inReview} task(s)\n  * **In Progress:** ${inProgress} task(s)\n  * **To Do:** ${todo} task(s)\n\n⚠️ **Critical Alert:** ${p0} high-priority (P0) task(s) remaining.`;
      } else if (query.includes('blocker') || query.includes('stagnant') || query.includes('blocking')) {
        const stagnant = projectTasks.filter(t => {
          if (t.status !== 'in_progress') return false;
          const days = differenceInDays(new Date(), new Date(t.updatedAt));
          return days >= 3;
        });

        if (stagnant.length === 0) {
          responseText = `### Stagnant Task & Blocker Analysis\n\nNo blockers detected. All in-progress tasks have been updated recently. Great velocity!`;
        } else {
          responseText = `### Stagnant Task & Blocker Analysis\n\nFound **${stagnant.length} stagnant task(s)** (In Progress for 3+ days without updates):\n\n${stagnant.map(t => {
            const days = differenceInDays(new Date(), new Date(t.updatedAt));
            return `* **[${t.priority.toUpperCase()}]** ${t.title}\n  * *Assignee:* ${t.assigneeId ? 'Assignee ID ' + t.assigneeId : 'Unassigned'}\n  * *Unchanged:* ${days} days`;
          }).join('\n')}\n\n*Recommendation: Schedule syncs with assignees immediately to resolve potential bottlenecks.*`;
        }
      } else if (query.includes('standup') || query.includes('report')) {
        const recent = projectTasks.filter(t => differenceInDays(new Date(), new Date(t.updatedAt)) <= 1);
        const recentlyDone = recent.filter(t => t.status === 'done');
        const recentlyMoved = recent.filter(t => t.status !== 'done');

        responseText = `### Daily Standup Report (${format(new Date(), 'MMM d, yyyy')})\n\n**1. Completed Yesterday:**\n${recentlyDone.length === 0 ? '   * None' : recentlyDone.map(t => `   * ${t.title}`).join('\n')}\n\n**2. Working On (Today):**\n${recentlyMoved.length === 0 ? '   * No recent activity to report' : recentlyMoved.map(t => `   * ${t.title} [Status: ${t.status.toUpperCase()}]`).join('\n')}\n\n**3. Blockers:**\n${projectTasks.filter(t => t.status === 'in_progress' && differenceInDays(new Date(), new Date(t.updatedAt)) >= 3).map(t => `   * ${t.title}`).join('\n') || '   * None'}\n\n**4. Recommended Next Steps:**\n   * Review open PRs\n   * Sync up with blocked resources`;
      } else if (query.includes('break down') || query.includes('breakdown') || query.includes('feature') || query.includes('task breakdown')) {
        isBreakdown = true;
        const cleanFeature = userText
          .replace(/(break down feature|break down|breakdown|task breakdown for|task breakdown)/i, '')
          .trim();
        featureName = cleanFeature || 'New Feature';
        const rawTasks = `[TASK] Design database schema & API endpoints for ${featureName} | p0
[TASK] Implement frontend UI and validation for ${featureName} | p1
[TASK] Develop backend service logic and logic filters for ${featureName} | p1
[TASK] Write unit tests & perform staging QA for ${featureName} | p2`;
        
        responseText = `I've broken down the feature **"${featureName}"** into actionable subtasks. You can import these directly to your project Kanban board using the button below:`;
        breakdownTasks = parseTasks(rawTasks);
      } else {
        responseText = `I'm here to help you manage your project. Try asking me to:\n* **"Summarize progress"**\n* **"Find blockers"**\n* **"Generate standup report"**\n* **"Break down feature: [feature name]"**`;
      }
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
      setLoading(false);
    }, 1200);
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

      simulateAIResponse(finalUserText, [attached]);
    };

    window.addEventListener('copilot-review-snippet', handleReviewSnippet);
    return () => window.removeEventListener('copilot-review-snippet', handleReviewSnippet);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#070a10] font-sans select-text">
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
    </div>
  );
}
