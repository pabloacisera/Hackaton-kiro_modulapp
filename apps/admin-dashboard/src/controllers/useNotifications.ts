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
 * - Manages WebSocket connection with JWT auth
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
    // Play a short beep using Web Audio API (no external asset needed)
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

  // ── Socket connection ────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;

    function connect() {
      const socket = io(`${API_BASE}/admin`, {
        auth: { token: accessToken },
        reconnection: false, // we manage reconnection ourselves
      });
      socketRef.current = socket;

      socket.on('notifications.unread', (data: AdminNotification[]) => {
        setNotifications(data);
        backoffRef.current = 1000; // reset on success
      });

      socket.on('notification.new', (n: AdminNotification) => {
        setNotifications((prev) => [n, ...prev]);
        playSound();
        backoffRef.current = 1000;
      });

      socket.on('notification.marked_read', ({ id }: { id: string }) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      });

      socket.on('disconnect', () => {
        // TASK-notif-10: reconnect with backoff
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
