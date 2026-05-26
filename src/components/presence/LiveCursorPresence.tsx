import { useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Avatar } from '../ui/Avatar';
import { useAuthStore } from '../../store';
import {
  canUsePresenceBackend,
  emitCursorJoin,
  emitCursorLeave,
  emitCursorUpdate,
  getPresenceSocket,
  type CursorParticipant,
} from '../../lib/presenceSocket';

type LiveCursorPresenceProps = {
  workspaceId: string;
  screenKey: string;
  containerRef: React.RefObject<HTMLElement | null>;
};

const cursorUpdateThreshold = 0.003;

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function LiveCursorPresence({ workspaceId, screenKey, containerRef }: LiveCursorPresenceProps) {
  const user = useAuthStore(state => state.user);
  const [participants, setParticipants] = useState<Record<string, CursorParticipant>>({});
  const pendingPointRef = useRef<{ x: number; y: number; active: boolean } | null>(null);
  const lastSentRef = useRef<{ x: number; y: number; active: boolean } | null>(null);
  const frameRef = useRef<number | null>(null);
  const [presenceEnabled, setPresenceEnabled] = useState(false);
  const socket = useMemo(() => getPresenceSocket(), []);

  const identity = useMemo(() => {
    const fallbackName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Teammate';
    return {
      userId: user?.id || '',
      userName: (user as any)?.name || fallbackName,
      avatar: (user as any)?.avatar || user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || user?.id || 'devcollab'}`,
    };
  }, [user]);

  useEffect(() => {
    if (!user || !workspaceId || !screenKey) return;

    const handleSync = (payload: { participants: CursorParticipant[] }) => {
      setParticipants(prev => {
        const next: Record<string, CursorParticipant> = { ...prev };
        payload.participants.forEach(participant => {
          next[participant.cursorId] = participant;
        });
        return next;
      });
    };

    const handleJoin = (participant: CursorParticipant) => {
      setParticipants(prev => ({ ...prev, [participant.cursorId]: participant }));
    };

    const handleUpdate = (participant: CursorParticipant) => {
      setParticipants(prev => ({ ...prev, [participant.cursorId]: participant }));
    };

    const handleLeave = ({ cursorId }: { cursorId: string }) => {
      setParticipants(prev => {
        if (!prev[cursorId]) return prev;
        const next = { ...prev };
        delete next[cursorId];
        return next;
      });
    };

    const handleConnect = () => {
      emitCursorJoin({ workspaceId, screenKey, ...identity });
    };

    socket.on('cursor:sync', handleSync);
    socket.on('cursor:join', handleJoin);
    socket.on('cursor:update', handleUpdate);
    socket.on('cursor:leave', handleLeave);
    socket.on('connect', handleConnect);

    let cancelled = false;

    canUsePresenceBackend().then(enabled => {
      if (cancelled || !enabled) return;
      setPresenceEnabled(true);
      if (!socket.connected) {
        socket.connect();
      } else {
        emitCursorJoin({ workspaceId, screenKey, ...identity });
      }
    });

    return () => {
      cancelled = true;
      emitCursorLeave({ workspaceId, screenKey, ...identity });
      socket.off('cursor:sync', handleSync);
      socket.off('cursor:join', handleJoin);
      socket.off('cursor:update', handleUpdate);
      socket.off('cursor:leave', handleLeave);
      socket.off('connect', handleConnect);
    };
  }, [identity, screenKey, socket, user, workspaceId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !user || !workspaceId || !screenKey) return;

    const flushPoint = () => {
      frameRef.current = null;

      const point = pendingPointRef.current;
      if (!point) return;

      const last = lastSentRef.current;
      if (
        last
        && Math.abs(last.x - point.x) < cursorUpdateThreshold
        && Math.abs(last.y - point.y) < cursorUpdateThreshold
        && last.active === point.active
      ) {
        return;
      }

      if (presenceEnabled) {
        emitCursorUpdate({ workspaceId, screenKey, ...identity, x: point.x, y: point.y, active: point.active });
      }
      lastSentRef.current = point;
    };

    const scheduleFlush = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(flushPoint);
    };

    const handleMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      pendingPointRef.current = {
        x: clamp((event.clientX - rect.left) / rect.width),
        y: clamp((event.clientY - rect.top) / rect.height),
        active: true,
      };
      scheduleFlush();
    };

    const handleLeave = () => {
      pendingPointRef.current = { x: lastSentRef.current?.x ?? 0.5, y: lastSentRef.current?.y ?? 0.5, active: false };
      scheduleFlush();
    };

    container.addEventListener('mousemove', handleMove);
    container.addEventListener('mouseleave', handleLeave);

    return () => {
      container.removeEventListener('mousemove', handleMove);
      container.removeEventListener('mouseleave', handleLeave);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [containerRef, identity, presenceEnabled, screenKey, user, workspaceId]);

  const visibleParticipants = Object.values(participants).filter(participant => participant.active || participant.userId === identity.userId);
  const activeCount = visibleParticipants.filter(participant => participant.active).length;

  if (!workspaceId || !screenKey || !user) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      {(visibleParticipants.length > 0 || activeCount > 0) && (
        <div className="absolute top-3 right-3 flex items-start gap-2 max-w-[min(90vw,320px)]">
          <div className="rounded-2xl border border-white/10 bg-[#070a10]/80 backdrop-blur px-3 py-2 shadow-2xl">
            <div className="flex items-center gap-2">
              <span className={clsx('h-2 w-2 rounded-full', activeCount > 0 ? 'bg-semantic-success animate-pulse' : 'bg-muted')} />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Live cursors</p>
                <p className="text-xs text-ink">{visibleParticipants.length} visible, {activeCount} moving</p>
              </div>
            </div>
            <div className="mt-2 flex -space-x-2">
              {visibleParticipants.slice(0, 4).map(participant => (
                <div key={participant.cursorId} className="relative">
                  <Avatar
                    src={participant.avatar}
                    name={participant.userName}
                    size="sm"
                    className="border border-[#10131b] shadow-lg"
                    showStatus
                    online={participant.active}
                  />
                </div>
              ))}
              {visibleParticipants.length > 4 && (
                <div className="w-6 h-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[10px] font-semibold text-ink">
                  +{visibleParticipants.length - 4}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {Object.values(participants)
        .filter(participant => participant.active)
        .map(participant => {
          const isSelf = participant.userId === identity.userId;
          if (isSelf) return null;

          return (
            <div
              key={participant.cursorId}
              className="absolute transition-[left,top,opacity] duration-75 ease-linear"
              style={{
                left: `${participant.x * 100}%`,
                top: `${participant.y * 100}%`,
                opacity: 1,
              }}
            >
              <div className="relative -translate-x-3 -translate-y-3">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0b1020]/90 px-2 py-1 shadow-2xl backdrop-blur">
                  <Avatar src={participant.avatar} name={participant.userName} size="xs" className="border border-white/10" />
                  <span className="max-w-28 truncate text-[10px] font-semibold text-ink">{participant.userName}</span>
                </div>
                <div className="absolute -bottom-1 left-3 h-2.5 w-2.5 rotate-45 bg-[#0b1020]/90 border-b border-r border-white/10" />
              </div>
            </div>
          );
        })}
    </div>
  );
}