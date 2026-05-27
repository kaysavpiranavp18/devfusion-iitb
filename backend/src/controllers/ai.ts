import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

interface ProjectTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigneeId?: string;
  updatedAt: string;
}

export async function handleAIChat(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const { message, model, attachments, projectTasks } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    if (!apiKey) {
      // Fallback to simulated response
      const fallbackText = simulateAIResponse(message, model, attachments, projectTasks);
      return res.status(200).json({ success: true, text: fallbackText });
    }

    // Call real Gemini API
    const geminiModel = model.startsWith('gemini') ? model : 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;

    // System instruction & Context construction
    let contextPrompt = `You are a helpful DevCollab Project Copilot, an expert assistant for software development teams.
You can summarize project progress, identify blockers, generate daily standup reports, write code reviews, and break down features into task lists.

`;

    // Add task list context
    if (projectTasks && projectTasks.length > 0) {
      contextPrompt += `Here are the current tasks in the active project:\n`;
      projectTasks.forEach((t: ProjectTask) => {
        contextPrompt += `- [${t.status.toUpperCase()}] [Priority: ${t.priority.toUpperCase()}] "${t.title}" (Assignee: ${t.assigneeId || 'Unassigned'}, Last Updated: ${t.updatedAt})\n`;
      });
      contextPrompt += `\n`;
    }

    // Add attached items context
    if (attachments && attachments.length > 0) {
      contextPrompt += `User attached the following project items for context:\n`;
      attachments.forEach((att: any) => {
        contextPrompt += `- [${att.type.toUpperCase()}] "${att.title}" (ID: ${att.id})\n`;
      });
      contextPrompt += `\n`;
    }

    contextPrompt += `Formatting Instructions:
1. Use clean Markdown styling for headers, bullet points, and code blocks.
2. If the user asks to "break down feature" or "create task list" or similar, you MUST include a list of subtasks in your response. Each subtask MUST be on a new line and formatted EXACTLY as:
[TASK] Task title here | pX
Where pX is the priority: p0 (high), p1 (medium), or p2 (low).
For example:
[TASK] Design database schema | p0
[TASK] Create signup UI | p1

Please respond to the user's message.
User: ${message}
Response:`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: contextPrompt
              }
            ]
          }
        ]
      })
    });

    const data: any = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || 'Gemini API request failed');
    }

    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    return res.status(200).json({ success: true, text: responseText });
  } catch (err: any) {
    next(err);
  }
}

// Fallback simulator if Gemini API key is missing
function simulateAIResponse(
  message: string,
  model: string,
  attachments: any[],
  projectTasks: ProjectTask[] = []
): string {
  const query = message.toLowerCase();

  // If reviewer mode, mock code review
  if (model.includes('reviewer') || query.includes('review') || query.includes('function') || query.includes('const ') || query.includes('class ')) {
    return `### 🔍 AI Code Review: Pasted Code Snippet

I have audited this snippet across four core dimensions:

#### 1. 🐛 Bug Risks & Correctness
🟢 **Sound comparators**: Clear comparisons and robust branching checks observed.
* *Action:* Include standard null checks to safeguard parameters.

#### 2. ⚡ Performance Optimization
🟢 **Time complexity efficiency**: Runs in linear time. No redundant array operations detected.

#### 3. 📝 Readability Suggestions
🟢 **Clean naming & modern styles**: CamelCase naming and modern block variable declarations are respected.

#### 4. 🔒 Security Concerns
🟢 **Secure runtime logic**: No dangerous subprocesses or OS system command concatenations were detected.

---

### 📊 Overall Quality Score: **8/10**
*Note: Add the GEMINI_API_KEY environment variable to backend/.env to get real-time AI reviews on your exact code.*`;
  }

  // Handle attachments
  if (attachments && attachments.length > 0) {
    const itemsList = attachments.map(a => `[${a.type.toUpperCase()}] "${a.title}"`).join(', ');
    return `### Context Reference Identified

I have successfully scanned the active project item(s) you attached:
* **${itemsList}**

Here is my analysis and recommended action plan:
1. **Integration Alignment:** Ensure the changes in this block map directly to existing interface routes.
2. **Reviewing Code Quality:** Let me know if you'd like me to perform an automated code review on these snippets to inspect styling compliance.

*Note: Add the GEMINI_API_KEY environment variable to backend/.env to get real-time AI context analysis.*`;
  }

  // Handle project summaries
  if (query.includes('summarize') || query.includes('summary') || query.includes('progress')) {
    const todo = projectTasks.filter(t => t.status === 'todo').length;
    const inProgress = projectTasks.filter(t => t.status === 'in_progress').length;
    const inReview = projectTasks.filter(t => t.status === 'in_review').length;
    const done = projectTasks.filter(t => t.status === 'done').length;
    const total = projectTasks.length;
    const p0 = projectTasks.filter(t => t.priority === 'p0' && t.status !== 'done').length;
    const pct = total > 0 ? Math.round(done / total * 100) : 0;

    return `### Project Progress Summary (Simulated)

* **Overall Progress:** ${pct}% complete (${done}/${total} tasks completed)
* **Task Breakdown:**
  * **Done:** ${done} task(s)
  * **In Review:** ${inReview} task(s)
  * **In Progress:** ${inProgress} task(s)
  * **To Do:** ${todo} task(s)

⚠️ **Critical Alert:** ${p0} high-priority (P0) task(s) remaining.
*Note: Configure GEMINI_API_KEY in backend/.env for real generative summaries.*`;
  }

  // Handle blockers
  if (query.includes('blocker') || query.includes('stagnant') || query.includes('blocking')) {
    return `### Stagnant Task & Blocker Analysis (Simulated)

No blockers detected. All in-progress tasks have been updated recently. Great velocity!
*Note: Configure GEMINI_API_KEY in backend/.env for real-time generative blocker detection.*`;
  }

  // Handle standups
  if (query.includes('standup') || query.includes('report')) {
    return `### Daily Standup Report (Simulated)

**1. Completed Yesterday:**
   * Review open PRs and clean code

**2. Working On (Today):**
   * Workspace email invitations feature integration

**3. Blockers:**
   * None

*Note: Configure GEMINI_API_KEY in backend/.env to generate custom team standups.*`;
  }

  // Handle breakdowns
  if (query.includes('break down') || query.includes('breakdown') || query.includes('feature') || query.includes('task breakdown')) {
    const cleanFeature = message
      .replace(/(break down feature|break down|breakdown|task breakdown for|task breakdown)/i, '')
      .trim();
    const featureName = cleanFeature || 'New Feature';

    return `I've broken down the feature **"${featureName}"** into actionable subtasks. You can import these directly to your project Kanban board using the button below:

[TASK] Design database schema & API endpoints for ${featureName} | p0
[TASK] Implement frontend UI and validation for ${featureName} | p1
[TASK] Develop backend service logic and logic filters for ${featureName} | p1
[TASK] Write unit tests & perform staging QA for ${featureName} | p2

*Note: Configure GEMINI_API_KEY in backend/.env for smart generative feature breakdowns.*`;
  }

  // Standard response
  return `I'm here to help you manage your project. Try asking me to:
* **"Summarize progress"**
* **"Find blockers"**
* **"Generate standup report"**
* **"Break down feature: [feature name]"**

*To enable real Gemini AI intelligence, please add GEMINI_API_KEY to your backend/.env file.*`;
}
