import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Calendar, ChevronRight, Users } from 'lucide-react';
import { chatApi } from '../../api/chat';

export default function ChatListPage() {
  const navigate = useNavigate();

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: chatApi.getMyRooms,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-6 h-6 text-brand" />
          <h1 className="text-2xl font-bold text-gray-900">동행 채팅</h1>
        </div>

        {rooms.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium mb-2">참여 중인 채팅방이 없어요</p>
            <p className="text-gray-400 text-sm mb-6">동행 모집에 참여하면 채팅방이 자동으로 생성됩니다</p>
            <button
              onClick={() => navigate('/shows')}
              className="px-6 py-2.5 bg-brand text-white rounded-xl font-medium hover:bg-brand/90 transition-colors"
            >
              공연 둘러보기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => navigate(`/chat/${room.id}`)}
                className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-all text-left group"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {room.showPosterUrl ? (
                    <img
                      src={room.showPosterUrl}
                      alt={room.showTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{room.companionPostTitle}</p>
                  <p className="text-sm text-gray-500 truncate mt-0.5">{room.showTitle}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-400">{room.performanceDate}</span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
