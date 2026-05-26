import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server | null = null;

type CursorParticipant = {
  cursorId: string;
  userId: string;
  userName: string;
  avatar: string;
  workspaceId: string;
  screenKey: string;
  x: number;
  y: number;
  active: boolean;
  updatedAt: number;
};

type PresenceRoomState = {
  participants: Map<string, CursorParticipant>;
};

const cursorRooms = new Map<string, PresenceRoomState>();

function buildCursorRoom(workspaceId: string, screenKey: string) {
  return `cursor:${workspaceId}:${screenKey}`;
}

function sanitizeScreenKey(screenKey: string) {
  return screenKey.replace(/[^a-zA-Z0-9:_-]/g, '_');
}

function getOrCreateRoom(room: string) {
  const existing = cursorRooms.get(room);
  if (existing) return existing;
  const created: PresenceRoomState = {
    participants: new Map(),
  };
  cursorRooms.set(room, created);
  return created;
}

function removeParticipant(room: string, cursorId: string) {
  const state = cursorRooms.get(room);
  if (!state) return null;

  const participant = state.participants.get(cursorId) || null;
  state.participants.delete(cursorId);

  if (state.participants.size === 0) {
    cursorRooms.delete(room);
  }

  return participant;
}

function clearSocketPresence(socket: Socket, shouldBroadcast = true) {
  const data = socket.data as { cursorRoom?: string; cursorId?: string };
  if (!data.cursorRoom || !data.cursorId) return;

  const { cursorRoom, cursorId } = data;
  const removed = removeParticipant(cursorRoom, cursorId);
  if (shouldBroadcast && removed) {
    socket.to(cursorRoom).emit('cursor:leave', { cursorId });
  }

  data.cursorRoom = undefined;
  data.cursorId = undefined;
}

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

    const socketData = socket.data as { cursorRoom?: string; cursorId?: string };

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

    socket.on('cursor:join', ({ workspaceId, screenKey, userId, userName, avatar }) => {
      if (!workspaceId || !screenKey || !userId) return;

      const normalizedScreenKey = sanitizeScreenKey(screenKey);
      const room = buildCursorRoom(workspaceId, normalizedScreenKey);

      if (socketData.cursorRoom && socketData.cursorRoom !== room) {
        clearSocketPresence(socket, true);
      }

      socket.join(room);
      socketData.cursorRoom = room;
      socketData.cursorId = socket.id;

      const state = getOrCreateRoom(room);
      const participant: CursorParticipant = {
        cursorId: socket.id,
        userId,
        userName,
        avatar,
        workspaceId,
        screenKey: normalizedScreenKey,
        x: 0,
        y: 0,
        active: false,
        updatedAt: Date.now(),
      };

      state.participants.set(socket.id, participant);

      socket.emit('cursor:sync', {
        room,
        participants: Array.from(state.participants.values()),
      });

      socket.to(room).emit('cursor:join', participant);
      console.log(`Presence cursor join in [${room}] by user [${userName}]`);
    });

    socket.on('cursor:update', ({ workspaceId, screenKey, x, y, active, userId, userName, avatar }) => {
      if (!workspaceId || !screenKey || !userId) return;

      const normalizedScreenKey = sanitizeScreenKey(screenKey);
      const room = buildCursorRoom(workspaceId, normalizedScreenKey);
      const state = cursorRooms.get(room);
      if (!state) return;

      const cursorId = socket.id;
      const existing = state.participants.get(cursorId);
      if (!existing) return;

      const nextParticipant: CursorParticipant = {
        ...existing,
        cursorId,
        userId,
        userName,
        avatar,
        workspaceId,
        screenKey: normalizedScreenKey,
        x,
        y,
        active: Boolean(active),
        updatedAt: Date.now(),
      };

      state.participants.set(cursorId, nextParticipant);
      socket.to(room).emit('cursor:update', nextParticipant);
    });

    socket.on('cursor:leave', ({ workspaceId, screenKey }) => {
      if (!workspaceId || !screenKey) return;

      const normalizedScreenKey = sanitizeScreenKey(screenKey);
      const room = buildCursorRoom(workspaceId, normalizedScreenKey);
      const cursorId = socket.id;
      const removed = removeParticipant(room, cursorId);

      if (removed) {
        socket.to(room).emit('cursor:leave', { cursorId });
        console.log(`Presence cursor leave in [${room}] by user [${removed.userName}]`);
      }

      if (socketData.cursorRoom === room) {
        socketData.cursorRoom = undefined;
        socketData.cursorId = undefined;
      }
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
      clearSocketPresence(socket, true);
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
