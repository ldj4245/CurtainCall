import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Send, Wifi, WifiOff } from 'lucide-react';
import { chatApi } from '../../api/chat';
import { useChat } from '../../hooks/useChat';
import { useAuthStore } from '../../store/authStore';

export default function ChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const roomIdNumber = Number(roomId);
  const draftStorageKey = `chat-draft-${roomIdNumber}`;
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: initialMessages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', roomIdNumber],
    queryFn: () => chatApi.getMessages(roomIdNumber),
    enabled: Number.isFinite(roomIdNumber) && roomIdNumber > 0,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: chatApi.getMyRooms,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const currentRoom = rooms.find((r) => r.id === roomIdNumber);

  const { messages, connected, sendMessage } = useChat({
    roomId: roomIdNumber,
    initialMessages,
  });

  useEffect(() => {
    if (!Number.isFinite(roomIdNumber) || roomIdNumber <= 0) {
      setInput('');
      return;
    }

    const savedDraft = sessionStorage.getItem(draftStorageKey);
    setInput(savedDraft ?? '');
  }, [draftStorageKey, roomIdNumber]);

  useEffect(() => {
    if (!Number.isFinite(roomIdNumber) || roomIdNumber <= 0) {
      return;
    }

    if (input) {
      sessionStorage.setItem(draftStorageKey, input);
      return;
    }

    sessionStorage.removeItem(draftStorageKey);
  }, [draftStorageKey, input, roomIdNumber]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
    sessionStorage.removeItem(draftStorageKey);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const utc = isoString.endsWith('Z') ? isoString : isoString + 'Z';
    return new Date(utc).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-surface-base">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-line-base border-t-brand" />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-surface-base">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-line-lightest bg-white px-4 py-3 sm:px-6">
        <button
          onClick={() => navigate('/chat')}
          className="p-1 text-ink-muted hover:text-ink-darkest transition-colors"
          aria-label="동행 메시지 목록으로"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-ink-darkest">
            {currentRoom?.companionPostTitle ?? '채팅방'}
          </p>
          {currentRoom && (
            <p className="truncate text-[11px] text-ink-muted">{currentRoom.showTitle} · {currentRoom.performanceDate}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {connected ? (
            <>
              <Wifi size={12} className="text-emerald-500" />
              <span className="text-[10px] text-ink-muted">연결됨</span>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-ink-lightest" />
              <span className="text-[10px] text-ink-lightest">연결 중</span>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-8">
        {messages.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-[11px] text-[#999]">아직 대화가 없습니다. 먼저 인사를 건네보세요.</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMine = msg.senderId === currentUser?.id;
          const isSystem = msg.type === 'ENTER' || msg.type === 'LEAVE';

          if (isSystem) {
            return (
              <div key={msg.id ?? idx} className="flex justify-center">
                <span className="border border-[#ededed] bg-white px-2 py-1 text-[10px] text-[#777]">
                  {msg.senderNickname}님이 {msg.type === 'ENTER' ? '입장' : '퇴장'}했습니다
                </span>
              </div>
            );
          }

          return (
            <div
              key={msg.id ?? idx}
              className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {!isMine && (
                <div className="flex h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[#f2f2f1]">
                  {msg.senderProfileImage ? (
                    <img src={msg.senderProfileImage} alt={msg.senderNickname} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-[#555]">
                      {msg.senderNickname[0]}
                    </div>
                  )}
                </div>
              )}

              <div className={`flex max-w-[70%] flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                {!isMine && (
                  <span className="px-1 text-[10px] text-[#777]">{msg.senderNickname}</span>
                )}
                <div
                  className={`rounded-sm px-3 py-2 text-[12px] leading-relaxed ${
                    isMine
                      ? 'bg-[#333] text-white'
                      : 'border border-[#ededed] bg-white text-[#333]'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="px-1 text-[9px] text-[#999]">{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-line-lightest bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 mx-auto max-w-4xl">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={connected ? '메시지를 입력하세요...' : '연결 중...'}
            disabled={!connected}
            className="h-9 flex-1 rounded-md border border-line-base bg-surface-base px-3 text-[13px] text-ink-base outline-none placeholder:text-ink-lighter disabled:opacity-50 focus:border-ink-darkest focus:bg-white transition-colors"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!connected || !input.trim()}
            className="flex h-9 items-center gap-1.5 rounded-md bg-brand px-4 text-[12px] font-semibold text-white transition-opacity disabled:opacity-40 hover:bg-brand/90 shadow-sm"
          >
            <Send size={13} />
            <span>전송</span>
          </button>
        </div>
      </div>
    </div>
  );
}
