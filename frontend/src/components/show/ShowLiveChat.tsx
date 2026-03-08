import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Send, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { showLiveApi } from '../../api/showLive';
import { useShowLive } from '../../hooks/useShowLive';
import { useAuthStore } from '../../store/authStore';

interface ShowLiveChatProps {
  showId: number;
}

const TODAY = new Date().toISOString().split('T')[0];

export default function ShowLiveChat({ showId }: ShowLiveChatProps) {
  const { isAuthenticated, user } = useAuthStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: room, isLoading } = useQuery({
    queryKey: ['show-live', showId, TODAY],
    queryFn: () => showLiveApi.getRoom(showId, TODAY),
    enabled: isAuthenticated,
  });

  const { messages, connected, sendMessage } = useShowLive({
    roomId: room?.roomId ?? 0,
    initialMessages: room?.messages ?? [],
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="card overflow-hidden">
      {/* 헤더 */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-brand" />
          <h2 className="font-bold text-gray-900">오늘 관람 후기</h2>
          <span className="text-xs text-gray-400 font-medium">{TODAY}</span>
        </div>
        {isAuthenticated && (
          <div className="flex items-center gap-1.5">
            {connected ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-500">라이브</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                <span className="text-xs text-gray-400">연결 중</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* 비로그인 */}
      {!isAuthenticated && (
        <div className="px-5 py-10 text-center">
          <MessageCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-4">
            오늘 같은 공연을 본 관객들과 실시간으로 감상을 나눠보세요
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand/90 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            로그인하고 참여하기
          </Link>
        </div>
      )}

      {/* 로그인 상태 */}
      {isAuthenticated && (
        <>
          {/* 메시지 목록 */}
          <div className="h-72 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50">
            {isLoading ? (
              <div className="flex justify-center pt-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-sm text-gray-400">오늘 공연을 보셨나요?</p>
                <p className="text-xs text-gray-300 mt-1">첫 번째 감상을 남겨보세요 ✨</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id ?? idx}
                    className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {!isMine && (
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {msg.senderProfileImage ? (
                          <img src={msg.senderProfileImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                            {msg.senderNickname[0]}
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`flex flex-col gap-1 max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                      {!isMine && (
                        <span className="text-xs text-gray-400 px-1">{msg.senderNickname}</span>
                      )}
                      <div className={`px-3 py-2 rounded-2xl text-sm ${
                        isMine
                          ? 'bg-brand text-white rounded-br-sm'
                          : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-xs text-gray-400 px-1">{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력 */}
          <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={connected ? '오늘 공연 어떠셨나요?' : '연결 중...'}
              disabled={!connected}
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!connected || !input.trim()}
              className="w-9 h-9 bg-brand text-white rounded-full flex items-center justify-center hover:bg-brand/90 transition-colors disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
