import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import type { ChatMessage } from '../api/chat';

interface UseChatOptions {
  roomId: number;
  initialMessages: ChatMessage[];
}

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const merged = new Map<string, ChatMessage>();

  [...current, ...incoming].forEach((message) => {
    const key = message.id != null
      ? `id-${message.id}`
      : `${message.senderId}-${message.type}-${message.createdAt}-${message.content}`;
    merged.set(key, message);
  });

  return [...merged.values()].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  );
}

export function useChat({ roomId, initialMessages }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

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
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/sub/chat/${roomId}`, (frame) => {
          const msg: ChatMessage = JSON.parse(frame.body);
          setMessages((prev) => mergeMessages(prev, [msg]));
          queryClient.setQueryData<ChatMessage[]>(['chat-messages', roomId], (prev = []) =>
            mergeMessages(prev, [msg])
          );
        });
      },
      onDisconnect: () => {
        setConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [roomId, accessToken, queryClient]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!clientRef.current?.connected || !content.trim()) return;
      clientRef.current.publish({
        destination: `/pub/chat/${roomId}`,
        body: JSON.stringify({ content, type: 'TALK' }),
      });
    },
    [roomId]
  );

  return { messages, connected, sendMessage };
}
