import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Calendar, ChevronRight, Users } from 'lucide-react'
import { chatApi } from '../../api/chat'

export default function ChatListPage() {
  const navigate = useNavigate()

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: chatApi.getMyRooms,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  if (isLoading) {
    return (
      <div className="page-width">
        <p className="feed-notice" role="status">대화방을 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="page-width account-page">
      <header className="page-heading border-b border-line-base">
        <h1>동행 메시지</h1>
        <p>함께 공연을 볼 사람들과 대화를 나눠보세요.</p>
      </header>

      <div>
        {rooms.length === 0 ? (
          <div className="quiet-empty">
            <p>참여 중인 동행이 없습니다. 동행에 참여하면 대화방이 자동으로 열립니다.</p>
            <button
              type="button"
              onClick={() => navigate('/shows')}
              className="button-secondary"
            >
              공연 둘러보기
            </button>
          </div>
        ) : (
          <div className="divide-y divide-line-lightest">
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => navigate(`/chat/${room.id}`)}
                className="group flex w-full items-center gap-4 py-4 text-left transition-colors hover:bg-surface-alt/50"
              >
                <div className="h-[68px] w-[50px] shrink-0 overflow-hidden border border-line-lightest bg-surface-alt">
                  {room.showPosterUrl ? (
                    <img
                      src={room.showPosterUrl}
                      alt={room.showTitle}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Users className="h-4 w-4 text-ink-lightest" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-ink-darker">{room.companionPostTitle}</p>
                  <p className="mt-1 truncate text-[12px] text-ink-muted">{room.showTitle}</p>
                  <div className="mt-1 flex items-center gap-1 text-[12px] text-ink-lighter">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{room.performanceDate}</span>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 shrink-0 text-ink-lightest transition-colors group-hover:text-ink-base" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
