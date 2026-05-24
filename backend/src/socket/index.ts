import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server | null = null;

export function initSocket(server: HttpServer, clientUrl: string) {
  io = new Server(server, {
    cors: {
      origin: clientUrl || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join room for a project
    socket.on('join-project', ({ projectId }) => {
      socket.join(`project:${projectId}`);
      console.log(`Socket [${socket.id}] joined project room: project:${projectId}`);
    });

    // Join room for a workspace
    socket.on('join-workspace', ({ workspaceId }) => {
      socket.join(`workspace:${workspaceId}`);
      console.log(`Socket [${socket.id}] joined workspace room: workspace:${workspaceId}`);
    });

    // Join room for a user (notifications)
    socket.on('join-user', ({ userId }) => {
      socket.join(`user:${userId}`);
      console.log(`Socket [${socket.id}] joined user room: user:${userId}`);
    });

    // Presence join event (client emits when joining board/editor)
    socket.on('presence:join', ({ projectId, userId, userName, avatar }) => {
      socket.to(`project:${projectId}`).emit('presence:join', { userId, userName, avatar });
      console.log(`Presence join in project [${projectId}] by user [${userName}]`);
    });

    // Presence leave event
    socket.on('presence:leave', ({ projectId, userId }) => {
      socket.to(`project:${projectId}`).emit('presence:leave', { userId });
      console.log(`Presence leave in project [${projectId}] by user [${userId}]`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  return io;
}

// Helper to emit events to socket rooms
export function emitToRoom(room: string, event: string, payload: any) {
  if (io) {
    io.to(room).emit(event, payload);
    console.log(`Emitted [${event}] to room [${room}]`);
  }
}
