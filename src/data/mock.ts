import type { User, Workspace, Project, Task, Snippet, DocPage, Activity, Notification, Plan } from '../types';

const now = new Date().toISOString();
const day = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

// =============== Users ===============
export const currentUser: User = {
  id: 'u1',
  name: 'Alex Rivera',
  email: 'alex@devcollab.io',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4',
  bio: 'Full-stack developer & open source enthusiast. Building the future of developer collaboration.',
  skills: ['React', 'TypeScript', 'Node.js', 'Python', 'PostgreSQL'],
  github: 'https://github.com/alexrivera',
  createdAt: day(120),
};

export const users: User[] = [
  currentUser,
  {
    id: 'u2',
    name: 'Priya Sharma',
    email: 'priya@devcollab.io',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=c0aede',
    bio: 'Backend developer & DevOps engineer.',
    skills: ['Go', 'Kubernetes', 'AWS', 'Terraform'],
    github: 'https://github.com/priyasharma',
    createdAt: day(90),
  },
  {
    id: 'u3',
    name: 'Marcus Chen',
    email: 'marcus@devcollab.io',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=ffdfbf',
    bio: 'Mobile & frontend developer. React Native enthusiast.',
    skills: ['React Native', 'Swift', 'Kotlin', 'Flutter'],
    github: 'https://github.com/marcuschen',
    createdAt: day(60),
  },
  {
    id: 'u4',
    name: 'Sarah Johnson',
    email: 'sarah@devcollab.io',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=d1d4f9',
    bio: 'Product designer & frontend developer.',
    skills: ['Figma', 'Tailwind CSS', 'Framer Motion', 'Storybook'],
    github: 'https://github.com/sarahjohnson',
    createdAt: day(45),
  },
  {
    id: 'u5',
    name: 'David Kim',
    email: 'david@devcollab.io',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David&backgroundColor=b6e3f4',
    bio: 'Data scientist & ML engineer.',
    skills: ['Python', 'TensorFlow', 'PyTorch', 'SQL'],
    github: 'https://github.com/davidkim',
    createdAt: day(30),
  },
];

// =============== Workspaces ===============
export const workspaces: Workspace[] = [
  {
    id: 'w1',
    name: 'DevCollab',
    description: 'Main team building the DevCollab platform',
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=DevCollab&backgroundColor=6366f1',
    ownerId: 'u1',
    members: [
      { user: users[0], role: 'owner', joinedAt: day(120) },
      { user: users[1], role: 'admin', joinedAt: day(90) },
      { user: users[2], role: 'member', joinedAt: day(60) },
      { user: users[3], role: 'member', joinedAt: day(45) },
      { user: users[4], role: 'viewer', joinedAt: day(30) },
    ],
    projects: ['p1', 'p2'],
    createdAt: day(120),
    plan: 'pro',
  },
  {
    id: 'w2',
    name: 'Open Source Hub',
    description: 'Contributing to open source projects',
    ownerId: 'u1',
    members: [
      { user: users[0], role: 'owner', joinedAt: day(60) },
      { user: users[3], role: 'admin', joinedAt: day(50) },
    ],
    projects: ['p3'],
    createdAt: day(60),
    plan: 'free',
  },
  {
    id: 'w3',
    name: 'Hackathon Squad',
    description: 'DevFusion Hackathon 2.0 team',
    ownerId: 'u1',
    members: [
      { user: users[0], role: 'member', joinedAt: day(14) },
      { user: users[1], role: 'member', joinedAt: day(14) },
      { user: users[2], role: 'admin', joinedAt: day(14) },
    ],
    projects: [],
    createdAt: day(14),
    plan: 'free',
  },
];

// =============== Projects ===============
export const projects: Project[] = [
  {
    id: 'p1',
    workspaceId: 'w1',
    name: 'DevCollab Platform',
    description: 'Main platform development - frontend & backend',
    color: '#6366f1',
    members: [
      { user: users[0], role: 'owner', joinedAt: day(120) },
      { user: users[1], role: 'admin', joinedAt: day(90) },
      { user: users[2], role: 'member', joinedAt: day(60) },
      { user: users[3], role: 'member', joinedAt: day(45) },
    ],
    createdAt: day(120),
    updatedAt: now,
  },
  {
    id: 'p2',
    workspaceId: 'w1',
    name: 'AI Features',
    description: 'AI-powered code review, assistant, and standup generation',
    color: '#f59e0b',
    members: [
      { user: users[0], role: 'owner', joinedAt: day(60) },
      { user: users[4], role: 'member', joinedAt: day(30) },
      { user: users[1], role: 'admin', joinedAt: day(60) },
    ],
    createdAt: day(60),
    updatedAt: now,
  },
  {
    id: 'p3',
    workspaceId: 'w2',
    name: 'React Components Library',
    description: 'Building reusable UI components',
    color: '#10b981',
    members: [
      { user: users[0], role: 'owner', joinedAt: day(50) },
      { user: users[3], role: 'admin', joinedAt: day(50) },
    ],
    createdAt: day(50),
    updatedAt: day(2),
  },
];

// =============== Tasks ===============
export const tasks: Task[] = [
  {
    id: 't1',
    projectId: 'p1',
    title: 'Design the Kanban board component',
    description: 'Create a drag-and-drop Kanban board with columns for To Do, In Progress, In Review, and Done. Each card should show title, assignee, priority, and due date.',
    status: 'done',
    priority: 'p1',
    assigneeId: 'u3',
    dueDate: day(5),
    labels: ['frontend', 'ui'],
    attachments: [],
    comments: [
      { id: 'c1', taskId: 't1', userId: 'u3', content: 'The drag-and-drop is working smoothly with @hello-pangea/dnd', mentions: [], createdAt: day(6) },
      { id: 'c2', taskId: 't1', userId: 'u1', content: 'Looks great! Can we add transition animations?', mentions: [], createdAt: day(5) },
      { id: 'c3', taskId: 't1', userId: 'u3', content: '@Alex Rivera sure, I\'ll add those in a follow-up', mentions: ['u1'], createdAt: day(5) },
    ],
    order: 0,
    createdBy: 'u1',
    createdAt: day(15),
    updatedAt: day(5),
  },
  {
    id: 't2',
    projectId: 'p1',
    title: 'Implement Socket.IO for real-time collaboration',
    description: 'Set up WebSocket connections for real-time board updates, presence indicators, and live cursors.',
    status: 'in_progress',
    priority: 'p0',
    assigneeId: 'u2',
    dueDate: day(3),
    labels: ['backend', 'realtime'],
    attachments: [],
    comments: [
      { id: 'c4', taskId: 't2', userId: 'u2', content: 'Working on the socket event handlers. Need to define the event types.', mentions: [], createdAt: day(2) },
    ],
    order: 1,
    createdBy: 'u1',
    createdAt: day(10),
    updatedAt: day(2),
  },
  {
    id: 't3',
    projectId: 'p1',
    title: 'Build documentation wiki with rich text editor',
    description: 'Implement a Notion-like wiki using TipTap with headings, code blocks, tables, and image support.',
    status: 'todo',
    priority: 'p1',
    assigneeId: 'u3',
    dueDate: day(10),
    labels: ['frontend', 'docs'],
    attachments: [],
    comments: [],
    order: 2,
    createdBy: 'u1',
    createdAt: day(8),
    updatedAt: day(8),
  },
  {
    id: 't4',
    projectId: 'p1',
    title: 'Create activity feed backend API',
    description: 'REST API endpoints for fetching and filtering activity feed by project and member.',
    status: 'todo',
    priority: 'p2',
    assigneeId: 'u2',
    dueDate: day(14),
    labels: ['backend', 'api'],
    attachments: [],
    comments: [],
    order: 3,
    createdBy: 'u1',
    createdAt: day(7),
    updatedAt: day(7),
  },
  {
    id: 't5',
    projectId: 'p1',
    title: 'Set up CI/CD pipeline',
    description: 'Configure GitHub Actions for automated testing, linting, and deployment.',
    status: 'in_review',
    priority: 'p1',
    assigneeId: 'u2',
    dueDate: day(2),
    labels: ['devops', 'automation'],
    attachments: [],
    comments: [
      { id: 'c5', taskId: 't5', userId: 'u1', content: 'Please check the deployment script for production env vars', mentions: [], createdAt: day(1) },
    ],
    order: 4,
    createdBy: 'u1',
    createdAt: day(6),
    updatedAt: day(1),
  },
  {
    id: 't6',
    projectId: 'p1',
    title: 'User notification preferences UI',
    description: 'Settings page for users to configure email and in-app notification preferences.',
    status: 'in_progress',
    priority: 'p2',
    assigneeId: 'u3',
    dueDate: day(7),
    labels: ['frontend', 'settings'],
    attachments: [],
    comments: [
      { id: 'c6', taskId: 't6', userId: 'u3', content: 'Starting on the notification preferences form today', mentions: [], createdAt: day(1) },
    ],
    order: 5,
    createdBy: 'u1',
    createdAt: day(5),
    updatedAt: day(1),
  },
  {
    id: 't7',
    projectId: 'p2',
    title: 'Implement AI code review feature',
    description: 'Build the AI code review agent that analyzes code snippets for bugs, performance, readability, and security.',
    status: 'done',
    priority: 'p0',
    assigneeId: 'u4',
    dueDate: day(8),
    labels: ['ai', 'backend'],
    attachments: [],
    comments: [],
    order: 0,
    createdBy: 'u1',
    createdAt: day(20),
    updatedAt: day(8),
  },
  {
    id: 't8',
    projectId: 'p2',
    title: 'AI standup report generation',
    description: 'AI analyzes task movements in the last 24 hours and generates a daily standup report.',
    status: 'in_progress',
    priority: 'p1',
    assigneeId: 'u4',
    dueDate: day(5),
    labels: ['ai', 'feature'],
    attachments: [],
    comments: [],
    order: 1,
    createdBy: 'u1',
    createdAt: day(12),
    updatedAt: day(3),
  },
  {
    id: 't9',
    projectId: 'p2',
    title: 'Task breakdown from feature description',
    description: 'Users type a feature description and AI automatically breaks it down into subtasks.',
    status: 'todo',
    priority: 'p1',
    assigneeId: 'u4',
    dueDate: day(12),
    labels: ['ai', 'feature'],
    attachments: [],
    comments: [],
    order: 2,
    createdBy: 'u1',
    createdAt: day(10),
    updatedAt: day(10),
  },
  {
    id: 't10',
    projectId: 'p3',
    title: 'Button component with variants',
    description: 'Create a reusable Button component with variants: primary, secondary, outline, ghost, and danger.',
    status: 'done',
    priority: 'p1',
    assigneeId: 'u3',
    dueDate: day(10),
    labels: ['ui', 'component'],
    attachments: [],
    comments: [],
    order: 0,
    createdBy: 'u1',
    createdAt: day(20),
    updatedAt: day(10),
  },
];

// =============== Snippets ===============
export const snippets: Snippet[] = [
  {
    id: 's1',
    projectId: 'p1',
    title: 'useDebounce hook',
    code: `import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}`,
    language: 'typescript',
    tags: ['react', 'hooks', 'utility'],
    description: 'A debounce hook for delaying value updates, useful for search inputs.',
    createdBy: 'u3',
    createdAt: day(20),
    updatedAt: day(20),
  },
  {
    id: 's2',
    projectId: 'p1',
    title: 'Prisma pagination helper',
    code: `export async function paginate<T>(
  model: any,
  args: any,
  page: number = 1,
  perPage: number = 20
): Promise<{ data: T[]; total: number; page: number; totalPages: number }> {
  const skip = (page - 1) * perPage;
  const [data, total] = await Promise.all([
    model.findMany({ ...args, skip, take: perPage }),
    model.count({ where: args.where }),
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / perPage),
  };
}`,
    language: 'typescript',
    tags: ['backend', 'prisma', 'pagination'],
    description: 'Generic pagination helper for Prisma models.',
    createdBy: 'u2',
    createdAt: day(15),
    updatedAt: day(15),
  },
  {
    id: 's3',
    projectId: 'p2',
    title: 'Python sentiment analyzer',
    code: `from textblob import TextBlob

def analyze_sentiment(text: str) -> dict:
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity

    if polarity > 0.1:
        sentiment = "positive"
    elif polarity < -0.1:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    return {
        "sentiment": sentiment,
        "polarity": round(polarity, 2),
        "subjectivity": round(subjectivity, 2),
    }`,
    language: 'python',
    tags: ['python', 'nlp', 'sentiment'],
    description: 'Simple sentiment analysis using TextBlob.',
    createdBy: 'u4',
    createdAt: day(10),
    updatedAt: day(10),
  },
  {
    id: 's4',
    projectId: 'p1',
    title: 'API rate limiter middleware',
    code: `import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too many requests, please try again later.',
  },
});

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    status: 429,
    error: 'Too many login attempts. Try again in an hour.',
  },
});`,
    language: 'typescript',
    tags: ['backend', 'security', 'middleware'],
    description: 'Rate limiting middleware for Express.js with separate auth limiter.',
    createdBy: 'u2',
    createdAt: day(5),
    updatedAt: day(5),
  },
];

// =============== Documents ===============
export const documents: DocPage[] = [
  {
    id: 'd1',
    projectId: 'p1',
    title: 'Getting Started Guide',
    content: `<h1>Welcome to DevCollab</h1><p>This guide will walk you through setting up your workspace and getting your team started.</p><h2>Creating a Workspace</h2><p>Click on the "New Workspace" button from the dashboard. Give your workspace a name and description, then invite your team members via email.</p><h2>Setting Up Projects</h2><p>Inside each workspace, you can create multiple projects. Each project has its own Kanban board, documentation wiki, code snippets, and activity feed.</p><blockquote>Tip: Start with a small project to get familiar with the platform before migrating your entire team.</blockquote>`,
    linkedPages: ['d2'],
    version: 3,
    versions: [
      { version: 3, content: '<h1>Welcome to DevCollab</h1><p>This guide will walk you through...', updatedBy: 'u1', updatedAt: day(5) },
      { version: 2, content: '<h1>Welcome!</h1><p>Getting started with DevCollab...</p>', updatedBy: 'u3', updatedAt: day(10) },
      { version: 1, content: '<h1>DevCollab Guide</h1><p>Initial draft</p>', updatedBy: 'u1', updatedAt: day(20) },
    ],
    createdBy: 'u1',
    createdAt: day(20),
    updatedAt: day(5),
  },
  {
    id: 'd2',
    projectId: 'p1',
    title: 'Architecture Overview',
    content: `<h1>Architecture</h1><p>DevCollab uses a microservices architecture with the following components:</p><h2>Frontend</h2><ul><li>React + TypeScript with Vite</li><li>State management with Zustand</li><li>Real-time communication via Socket.IO</li></ul><h2>Backend</h2><ul><li>Node.js + Express API gateway</li><li>PostgreSQL for persistent data</li><li>Redis for caching and real-time state</li></ul><h2>Infrastructure</h2><p>Deployed on AWS ECS with Docker containers. CI/CD via GitHub Actions.</p>`,
    linkedPages: ['d1'],
    version: 2,
    versions: [
      { version: 2, content: '<h1>Architecture</h1><p>Updated architecture...</p>', updatedBy: 'u2', updatedAt: day(3) },
      { version: 1, content: '<h1>Architecture</h1><p>Initial design...</p>', updatedBy: 'u1', updatedAt: day(15) },
    ],
    createdBy: 'u1',
    createdAt: day(15),
    updatedAt: day(3),
  },
];

// =============== Activities ===============
export const activities: Activity[] = [
  { id: 'a1', workspaceId: 'w1', projectId: 'p1', type: 'task_moved', message: 'Marcus moved "Design the Kanban board" to Done', userId: 'u3', createdAt: day(5) },
  { id: 'a2', workspaceId: 'w1', projectId: 'p1', type: 'task_created', message: 'Alex created task "Build documentation wiki"', userId: 'u1', createdAt: day(8) },
  { id: 'a3', workspaceId: 'w1', projectId: 'p1', type: 'comment_added', message: 'Priya commented on "Implement Socket.IO for real-time"', userId: 'u2', createdAt: day(2) },
  { id: 'a4', workspaceId: 'w1', projectId: 'p2', type: 'doc_updated', message: 'Sarah updated "AI Features Overview" document', userId: 'u4', createdAt: day(3) },
  { id: 'a5', workspaceId: 'w1', projectId: 'p1', type: 'member_joined', message: 'David joined the workspace', userId: 'u4', createdAt: day(30) },
  { id: 'a6', workspaceId: 'w1', projectId: 'p2', type: 'task_created', message: 'Sarah created task "AI standup report generation"', userId: 'u4', createdAt: day(12) },
  { id: 'a7', workspaceId: 'w1', projectId: 'p2', type: 'task_assigned', message: 'Alex assigned "Task breakdown from feature description" to Sarah', userId: 'u1', createdAt: day(10) },
  { id: 'a8', workspaceId: 'w1', projectId: 'p1', type: 'snippet_added', message: 'Priya added snippet "Prisma pagination helper"', userId: 'u2', createdAt: day(15) },
  { id: 'a9', workspaceId: 'w1', projectId: 'p1', type: 'task_moved', message: 'Marcus moved "User notification preferences UI" to In Progress', userId: 'u3', createdAt: day(1) },
  { id: 'a10', workspaceId: 'w1', projectId: 'p1', type: 'mention', message: 'Marcus mentioned @Alex Rivera in a comment', userId: 'u3', metadata: { mentionedUser: 'u1' }, createdAt: day(5) },
];

// =============== Notifications ===============
export const notifications: Notification[] = [
  { id: 'n1', userId: 'u1', title: 'Task Moved', message: 'Priya moved "Implement Socket.IO for real-time" to In Progress', type: 'task_update', read: false, link: '/workspace/w1/project/p1/board', createdAt: day(1) },
  { id: 'n2', userId: 'u1', title: 'New Comment', message: 'Marcus mentioned you in a comment on "Design the Kanban board"', type: 'mention', read: false, link: '/workspace/w1/project/p1/board', createdAt: day(5) },
  { id: 'n3', userId: 'u1', title: 'Task Assigned', message: 'You were assigned "Notification preferences UI"', type: 'assignment', read: true, link: '/workspace/w1/project/p1/board', createdAt: day(5) },
  { id: 'n4', userId: 'u1', title: 'Document Updated', message: 'Priya updated "Architecture Overview"', type: 'task_update', read: true, link: '/workspace/w1/project/p1/docs', createdAt: day(3) },
  { id: 'n5', userId: 'u1', title: 'Welcome!', message: 'Welcome to DevCollab! Get started by creating your first workspace.', type: 'system', read: true, createdAt: day(120) },
];

// =============== Plans ===============
export const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: ['1 workspace', '3 projects', '5 members per workspace', 'Kanban boards', 'Code snippets', 'Basic activity feed'],
    limits: { workspaces: 1, projects: 3, members: 5, ai: false },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 12,
    features: ['Unlimited workspaces', 'Unlimited projects', 'Unlimited members', 'AI project assistant', 'AI code reviewer', 'Priority support', 'Advanced analytics'],
    limits: { workspaces: Infinity, projects: Infinity, members: Infinity, ai: true },
  },
];

// =============== Utility ===============
export function getUserById(id: string): User | undefined {
  return users.find(u => u.id === id);
}

export function getWorkspaceById(id: string): Workspace | undefined {
  return workspaces.find(w => w.id === id);
}

export function getProjectById(id: string): Project | undefined {
  return projects.find(p => p.id === id);
}

export function getTasksByProject(projectId: string): Task[] {
  return tasks.filter(t => t.projectId === projectId).sort((a, b) => a.order - b.order);
}

export function getTasksByStatus(projectId: string, status: Task['status']): Task[] {
  return tasks.filter(t => t.projectId === projectId && t.status === status).sort((a, b) => a.order - b.order);
}
