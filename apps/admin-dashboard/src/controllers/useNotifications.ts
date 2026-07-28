import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
const SOUND_DEBOUNCE_MS = 2000;

export interface AdminNotification {
  id: string;
  type: string;
  message: string;
  referenceUrl: string;
  read: boolean;
  createdAt: string;
}

export interface UseNotificationsResult {
  notifications: AdminNotification[];
  unreadCount: number;
  soundEnabled: boolean;
  toggleSound: () => void;
  markRead: (id: string) => void;
}

/**
 * TASK-notif-7: useNotifications controller.
 * - Fetches all notifications via REST on mount
 * - Manages WebSocket connection with JWT auth for real-time updates
 * - Sound playback queue with 2s debounce (TASK-notif-9)
 * - Reconnection with exponential backoff (TASK-notif-10)
 */
export function useNotifications(accessToken: string | null): UseNotificationsResult {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('notif_sound') !== 'off';
    } catch {
      return true;
    }
  });

  const socketRef = useRef<Socket | null>(null);
  const lastSoundRef = useRef<number>(0);
  const backoffRef = useRef(1000);

  // ── Sound debounce ──────────────────────────────────────────────────────
  const playSound = useCallback(() => {
    if (!soundEnabled) return;
    const now = Date.now();
    if (now - lastSoundRef.current < SOUND_DEBOUNCE_MS) return;
    lastSoundRef.current = now;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.4;
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      /* AudioContext not available in test env */
    }
  }, [soundEnabled]);

  // ── Fetch all notifications via REST on mount ───────────────────────────
  useEffect(() => {
    if (!accessToken) return;

    fetch(`${API_BASE}/admin/notifications`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: AdminNotification[]) => setNotifications(data))
      .catch(() => {
        /* ignore fetch errors — websocket will provide data */
      });
  }, [accessToken]);

  // ── Socket connection ────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;

    function connect() {
      // Socket.IO connects to the current origin with namespace '/admin'.
      // The custom path '/api/socket.io' routes through Nginx's /api/ location
      // which strips the prefix and proxies to api-core's /socket.io endpoint.
      const socketPath = API_BASE === '/api' ? '/api/socket.io' : '/socket.io';
      const socketUrl = window.location.origin + '/admin';
      const socket = io(socketUrl, {
        path: socketPath,
        auth: { token: accessToken },
        reconnection: false,
        transports: ['websocket', 'polling'],
      });
      socketRef.current = socket;

      socket.on('notifications.unread', (data: AdminNotification[]) => {
        // Merge unread from WebSocket with existing notifications
        setNotifications((prev) => {
          const map = new Map(prev.map((n) => [n.id, n]));
          for (const n of data) {
            map.set(n.id, n);
          }
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        });
        backoffRef.current = 1000;
      });

      socket.on('notification.new', (n: AdminNotification) => {
        setNotifications((prev) => [n, ...prev.filter((x) => x.id !== n.id)]);
        playSound();
        backoffRef.current = 1000;
        window.dispatchEvent(new CustomEvent('notification.new', { detail: n }));
      });

      socket.on('notification.marked_read', ({ id }: { id: string }) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      });

      socket.on('disconnect', () => {
        setTimeout(() => {
          if (socketRef.current?.connected === false) {
            socket.close();
            backoffRef.current = Math.min(backoffRef.current * 2, 30_000);
            connect();
          }
        }, backoffRef.current);
      });
    }

    connect();
    return () => {
      socketRef.current?.close();
    };
  }, [accessToken, playSound]);

  const markRead = useCallback((id: string) => {
    socketRef.current?.emit('notification.mark_read', { id });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('notif_sound', next ? 'on' : 'off');
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, soundEnabled, toggleSound, markRead };
}
