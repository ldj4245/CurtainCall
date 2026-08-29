import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, MessageCircle, Users } from 'lucide-react';
import { chatApi } from '../../api/chat';

export default function ChatListPage() {
  const navigate = useNavigate();

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: chatApi.getMyRooms,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  if (isLoading) {
    return (
      <main className="mx-auto min-h-[530px] max-w-[1020px] px-5 py-9 sm:px-10 flex items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#ededed] border-t-[#333]" />
      </main>
    );
  }

  return (
    <div className="px-4 py-4 sm:px-5">
      <p className="text-[10px] text-ink-lightest mb-1.5">홈&nbsp; › &nbsp;<span className="text-ink-light">동행 메시지</span></p>
      
      <div className="mb-5 flex items-end justify-between border-b border-line-lightest pb-3">
        <div>
          <h1 className="text-[18px] font-semibold tracking-[-0.05em] text-ink-darker">동행 메시지</h1>
          <p className="mt-0.5 text-[11px] text-ink-muted">함께 공연을 볼 사람들과 대화를 나눠보세요.</p>
        </div>
      </div>

      <div>
        {rooms.length === 0 ? (
          <div className="py-16 text-center">
            <MessageCircle size={20} className="mx-auto mb-3 text-[#dedede]" />
            <p className="text-[12px] font-semibold text-[#555]">참여 중인 동행이 없습니다.</p>
            <p className="mt-1 text-[11px] text-[#999]">동행에 참여하면 대화방이 자동으로 열립니다.</p>
            <button
              onClick={() => navigate('/shows')}
              className="mt-5 border border-[#d9d9d9] bg-white px-4 py-2 text-[11px] text-[#555]"
            >
              공연 둘러보기
            </button>
          </div>
        ) : (
          <div className="border-t border-[#ededed]">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => navigate(`/chat/${room.id}`)}
                className="group flex w-full items-center gap-4 border-b border-[#ededed] py-4 text-left transition-colors hover:bg-[#fbfbfb]"
              >
                <div className="h-16 w-11 shrink-0 overflow-hidden bg-[#f6f4f2]">
                  {room.showPosterUrl ? (
                    <img
                      src={room.showPosterUrl}
                      alt={room.showTitle}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Users className="h-4 w-4 text-[#dedede]" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-[#333]">{room.companionPostTitle}</p>
                  <p className="mt-1 truncate text-[11px] text-[#555]">{room.showTitle}</p>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-[#999]">
                    <Calendar className="h-3 w-3" />
                    <span>{room.performanceDate}</span>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 shrink-0 text-[#d9d9d9] transition-colors group-hover:text-[#555]" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
