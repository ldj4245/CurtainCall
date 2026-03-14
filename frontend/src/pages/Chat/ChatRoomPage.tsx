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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => navigate('/chat')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {currentRoom?.companionPostTitle ?? '채팅방'}
          </p>
          {currentRoom && (
            <p className="text-xs text-gray-400 truncate">{currentRoom.showTitle} · {currentRoom.performanceDate}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {connected ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-500">연결됨</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">연결 중...</span>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">아직 메시지가 없어요. 먼저 인사해보세요! 👋</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMine = msg.senderId === currentUser?.id;
          const isSystem = msg.type === 'ENTER' || msg.type === 'LEAVE';

          if (isSystem) {
            return (
              <div key={msg.id ?? idx} className="flex justify-center">
                <span className="bg-gray-200 text-gray-500 text-xs px-3 py-1 rounded-full">
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
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {msg.senderProfileImage ? (
                    <img src={msg.senderProfileImage} alt={msg.senderNickname} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                      {msg.senderNickname[0]}
                    </div>
                  )}
                </div>
              )}

              <div className={`flex flex-col gap-1 max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                {!isMine && (
                  <span className="text-xs text-gray-500 px-1">{msg.senderNickname}</span>
                )}
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMine
                      ? 'bg-brand text-white rounded-br-sm'
                      : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-xs text-gray-400 px-1">{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 py-3">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={connected ? '메시지를 입력하세요...' : '연결 중...'}
            disabled={!connected}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!connected || !input.trim()}
            className="w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center hover:bg-brand/90 transition-colors disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
