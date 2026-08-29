import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  const draftStorageKey = `show-live-draft-${showId}-${TODAY}`;
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: room, isLoading } = useQuery({
    queryKey: ['show-live', showId, TODAY],
    queryFn: () => showLiveApi.getRoom(showId, TODAY),
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { messages, connected, sendMessage } = useShowLive({
    roomId: room?.roomId ?? 0,
    initialMessages: room?.messages ?? [],
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setInput('');
      sessionStorage.removeItem(draftStorageKey);
      return;
    }

    const savedDraft = sessionStorage.getItem(draftStorageKey);
    setInput(savedDraft ?? '');
  }, [draftStorageKey, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (input) {
      sessionStorage.setItem(draftStorageKey, input);
      return;
    }

    sessionStorage.removeItem(draftStorageKey);
  }, [draftStorageKey, input, isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
    sessionStorage.removeItem(draftStorageKey);
  };

  const formatTime = (iso: string) => {
    if (!iso) return '';
    const utc = iso.endsWith('Z') ? iso : iso + 'Z';
    return new Date(utc).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="overflow-hidden border border-line-base bg-surface-base">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-line-lightest px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[13px] font-semibold tracking-[-0.02em] text-ink-base">오늘의 한 줄 감상</h2>
          <span className="text-[11px] font-medium text-ink-lighter">{TODAY}</span>
        </div>
        {isAuthenticated && (
          <div className="flex items-center gap-1.5">
            {connected ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                <span className="text-[11px] text-ink-muted">라이브</span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-ink-lightest" />
                <span className="text-[11px] text-ink-lighter">연결 중</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* 비로그인 */}
      {!isAuthenticated && (
        <div className="bg-surface-alt px-4 py-8 text-center">
          <p className="mb-4 text-[12px] text-ink-light">
            오늘 같은 공연을 본 관객들과 실시간으로 감상을 나눠보세요
          </p>
          <Link
            to="/login"
            className="inline-flex h-[34px] items-center justify-center bg-brand px-4 text-[11px] font-semibold text-white transition-colors"
          >
            로그인하고 참여하기
          </Link>
        </div>
      )}

      {/* 로그인 상태 */}
      {isAuthenticated && (
        <>
          {/* 메시지 목록 */}
          <div className="h-72 space-y-3 overflow-y-auto bg-surface-alt px-4 py-4">
            {isLoading ? (
              <div className="flex justify-center pt-10">
                <span className="text-[12px] text-ink-lighter">불러오는 중</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-[12px] text-ink-light">오늘 공연을 보셨나요?</p>
                <p className="mt-1 text-[11px] text-ink-lighter">첫 번째 감상을 남겨 보세요.</p>
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
                      <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-surface-background border border-line-lightest">
                        {msg.senderProfileImage ? (
                          <img src={msg.senderProfileImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-ink-muted">
                            {msg.senderNickname[0]}
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`flex flex-col gap-1 max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
                      {!isMine && (
                        <span className="px-1 text-[10px] text-ink-light">{msg.senderNickname}</span>
                      )}
                      <div className={`px-3 py-2 text-[12px] ${
                        isMine
                          ? 'bg-ink-darker text-white'
                          : 'border border-line-base bg-surface-base text-ink-base'
                      }`}>
                        {msg.content}
                      </div>
                      <span className="px-1 text-[10px] text-ink-lightest">{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력 */}
          <div className="flex items-center gap-2 border-t border-line-base bg-surface-base px-3 py-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={connected ? '감상 입력' : '연결 중'}
              disabled={!connected}
              className="h-[34px] flex-1 border border-line-base bg-surface-alt px-3 text-[12px] text-ink-base outline-none focus:border-brand disabled:opacity-50 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!connected || !input.trim()}
              className="flex h-[34px] items-center justify-center bg-brand px-4 text-[11px] font-semibold text-white disabled:opacity-50 transition-colors"
            >
              전송
            </button>
          </div>
        </>
      )}
    </div>
  );
}
