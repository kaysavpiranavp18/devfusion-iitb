import { io, type Socket } from 'socket.io-client';

export type CursorParticipant = {
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

type CursorJoinPayload = {
  workspaceId: string;
  screenKey: string;
  userId: string;
  userName: string;
  avatar: string;
};

type CursorUpdatePayload = CursorJoinPayload & {
  x: number;
  y: number;
  active: boolean;
};

let socket: Socket | null = null;
let presenceBackendAvailable: boolean | null = null;
let presenceBackendCheck: Promise<boolean> | null = null;

function getPresenceBaseUrl() {
  return import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
}

export async function canUsePresenceBackend() {
  if (presenceBackendAvailable !== null) {
    return presenceBackendAvailable;
  }

  if (!presenceBackendCheck) {
    presenceBackendCheck = (async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 1200);

      try {
        const response = await fetch(`${getPresenceBaseUrl()}/health`, {
          method: 'GET',
          signal: controller.signal,
        });
        presenceBackendAvailable = response.ok;
      } catch {
        presenceBackendAvailable = false;
      } finally {
        window.clearTimeout(timeout);
      }

      return presenceBackendAvailable;
    })();
  }

  return presenceBackendCheck;
}

export function getPresenceSocket() {
  if (!socket) {
    const socketUrl = getPresenceBaseUrl();

    socket = io(socketUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: false,
    });
  }

  return socket;
}

export function emitCursorJoin(payload: CursorJoinPayload) {
  const client = getPresenceSocket();
  if (!client.connected) return;
  client.emit('cursor:join', payload);
}

export function emitCursorUpdate(payload: CursorUpdatePayload) {
  const client = getPresenceSocket();
  if (!client.connected) return;
  client.emit('cursor:update', payload);
}

export function emitCursorLeave(payload: CursorJoinPayload) {
  const client = getPresenceSocket();
  if (!client.connected) return;
  client.emit('cursor:leave', payload);
}