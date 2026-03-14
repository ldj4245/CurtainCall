import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '../store/authStore';
import type { ShowLiveMessage } from '../api/showLive';

interface UseShowLiveOptions {
  roomId: number;
  initialMessages: ShowLiveMessage[];
}

function mergeMessages(current: ShowLiveMessage[], incoming: ShowLiveMessage[]) {
  const merged = new Map<string, ShowLiveMessage>();

  [...current, ...incoming].forEach((message) => {
    const key = message.id != null
      ? `id-${message.id}`
      : `${message.senderId}-${message.createdAt}-${message.content}`;
    merged.set(key, message);
  });

  return [...merged.values()].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  );
}

export function useShowLive({ roomId, initialMessages }: UseShowLiveOptions) {
  const [messages, setMessages] = useState<ShowLiveMessage[]>(initialMessages);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    setMessages((prev) => mergeMessages(prev, initialMessages));
  }, [initialMessages]);

  useEffect(() => {
    if (!accessToken || roomId <= 0) {
      setConnected(false);
      clientRef.current?.deactivate();
      clientRef.current = null;
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/sub/live/${roomId}`, (frame) => {
          const msg: ShowLiveMessage = JSON.parse(frame.body);
          setMessages((prev) => mergeMessages(prev, [msg]));
        });
      },
      onDisconnect: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [roomId, accessToken]);

  const sendMessage = useCallback((content: string) => {
    if (!clientRef.current?.connected || !content.trim()) return;
    clientRef.current.publish({
      destination: `/pub/live/${roomId}`,
      body: JSON.stringify({ content }),
    });
  }, [roomId]);

  return { messages, connected, sendMessage };
}
