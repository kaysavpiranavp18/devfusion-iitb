import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { initSocket } from './socket';
import { errorHandler } from './middleware/errorHandler';

import authRouter from './routes/auth';
import profileRouter from './routes/profile';
import workspacesRouter from './routes/workspaces';
import projectsRouter from './routes/projects';
import tasksRouter from './routes/tasks';
import commentsRouter from './routes/comments';
import snippetsRouter from './routes/snippets';
import wikiRouter from './routes/wiki';
import activityRouter from './routes/activity';
import notificationsRouter from './routes/notifications';

const app = express();
const server = http.createServer(app);

const port = process.env.PORT || 3001;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// Initialize Socket.IO
initSocket(server, clientUrl);

// Middleware
app.use(helmet());
app.use(cors({
  origin: clientUrl,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/snippets', snippetsRouter);
app.use('/api/wiki', wikiRouter);
app.use('/api/activity', activityRouter);
app.use('/api/notifications', notificationsRouter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'OK' });
});

// Error handling
app.use(errorHandler);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
