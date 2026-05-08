"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

// ── Types ────────────────────────────────────────────────────────────────────

export interface LiveMessage {
  _id: string;
  content: string;
  createdAt: string;
}

interface NotificationContextValue {
  /** Messages that arrived via SSE since the stream was opened */
  liveMessages: LiveMessage[];
  /** Count of messages the user hasn't viewed yet */
  unreadCount: number;
  /** Call this when the user views the dashboard (resets the badge) */
  markAllRead: () => void;
  /** Call this when the dashboard has consumed the liveMessages into its own state */
  clearLiveMessages: () => void;
  /** Whether the SSE stream is currently connected */
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextValue>({
  liveMessages: [],
  unreadCount: 0,
  markAllRead: () => {},
  clearLiveMessages: () => {},
  isConnected: false,
});

// ── SSE reader ───────────────────────────────────────────────────────────────

const BACKEND = process.env["NEXT_PUBLIC_BACKEND_URL"] ?? "http://localhost:8000";
// Reconnect every 55 min to get a fresh Firebase token before the old one expires
const RECONNECT_INTERVAL_MS = 55 * 60 * 1000;

function parseSseChunk(chunk: string): { event: string; data: string }[] {
  const results: { event: string; data: string }[] = [];
  // SSE events are separated by double newlines
  const blocks = chunk.split(/\n\n+/);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed || trimmed.startsWith(":")) continue; // skip comments / heartbeats

    let event = "message";
    let data = "";

    for (const line of trimmed.split("\n")) {
      if (line.startsWith("event: ")) event = line.slice(7).trim();
      else if (line.startsWith("data: ")) data = line.slice(6).trim();
    }

    if (data) results.push({ event, data });
  }

  return results;
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { authUser } = useAuth();
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Browser notification permission ─────────────────────────────────────
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      // Ask once; browser remembers the answer
      void Notification.requestPermission();
    }
  }, []);

  // ── SSE connection ────────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (!authUser?.firebaseUser) return;

    // Cancel previous connection
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = await authUser.firebaseUser.getIdToken();

      const response = await fetch(`${BACKEND}/api/messages/stream`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`SSE connect failed: ${response.status}`);
      }

      setIsConnected(true);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete events (terminated by \n\n)
        const lastDoubleNewline = buffer.lastIndexOf("\n\n");
        if (lastDoubleNewline !== -1) {
          const toProcess = buffer.slice(0, lastDoubleNewline + 2);
          buffer = buffer.slice(lastDoubleNewline + 2);

          for (const { event, data } of parseSseChunk(toProcess)) {
            if (event === "new-message") {
              try {
                const msg = JSON.parse(data) as LiveMessage;

                setLiveMessages((prev) => [msg, ...prev]);
                setUnreadCount((n) => n + 1);

                // Browser notification when tab is not focused
                if (
                  typeof document !== "undefined" &&
                  document.hidden &&
                  "Notification" in window &&
                  Notification.permission === "granted"
                ) {
                  new Notification("New anonymous message! 💬", {
                    body: msg.content.slice(0, 80),
                    icon: "/favicon.ico",
                  });
                }
              } catch {
                console.warn("[SSE] Failed to parse new-message data:", data);
              }
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return; // intentional disconnect
      console.warn("[SSE] Connection lost, will retry in 5s:", err);
    } finally {
      setIsConnected(false);
    }

    // Auto-reconnect after 5 seconds on unexpected disconnect
    if (!abortRef.current?.signal.aborted) {
      reconnectTimer.current = setTimeout(connect, 5_000);
    }
  }, [authUser]);

  // Start SSE when user is logged in; schedule periodic token refresh reconnect
  useEffect(() => {
    if (!authUser?.firebaseUser) {
      abortRef.current?.abort();
      setIsConnected(false);
      return;
    }

    void connect();

    // Force reconnect every 55 min to get a fresh Firebase token
    reconnectTimer.current = setTimeout(() => void connect(), RECONNECT_INTERVAL_MS);

    return () => {
      abortRef.current?.abort();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [authUser, connect]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const markAllRead = useCallback(() => setUnreadCount(0), []);
  const clearLiveMessages = useCallback(() => setLiveMessages([]), []);

  return (
    <NotificationContext.Provider
      value={{ liveMessages, unreadCount, markAllRead, clearLiveMessages, isConnected }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
