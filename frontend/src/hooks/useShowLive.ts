import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '../store/authStore';
import type { ShowLiveMessage } from '../api/showLive';

interface UseShowLiveOptions {
  roomId: number;
  initialMessages: ShowLiveMessage[];
}

export function useShowLive({ roomId, initialMessages }: UseShowLiveOptions) {
  const [messages, setMessages] = useState<ShowLiveMessage[]>(initialMessages);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/sub/live/${roomId}`, (frame) => {
          const msg: ShowLiveMessage = JSON.parse(frame.body);
          setMessages((prev) => [...prev, msg]);
        });
      },
      onDisconnect: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => { client.deactivate(); };
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
