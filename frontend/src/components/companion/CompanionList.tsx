import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Clock, MapPin, Calendar, HeartHandshake, Loader2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { companionApi, CompanionPost } from '../../api/companion';
import { useAuthStore } from '../../store/authStore';
import CompanionForm from './CompanionForm';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CompanionListProps {
    showId: number;
}

export default function CompanionList({ showId }: CompanionListProps) {
    const { isAuthenticated, user } = useAuthStore();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);
    const [onlyOpen, setOnlyOpen] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['companions', showId, page, onlyOpen],
        queryFn: () => companionApi.getCompanions(showId, page, onlyOpen),
    });

    const joinMutation = useMutation({
        mutationFn: (id: number) => companionApi.joinCompanion(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companions', showId] });
            toast.success('동행에 참여했습니다!');
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || '참여에 실패했습니다.';
            toast.error(msg);
        }
    });

    const cancelMutation = useMutation({
        mutationFn: (id: number) => companionApi.cancelJoin(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companions', showId] });
            queryClient.invalidateQueries({ queryKey: ['recent-companions'] });
            toast.success('참여를 취소했습니다.');
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || '취소에 실패했습니다.';
            toast.error(msg);
        }
    });

    const closeMutation = useMutation({
        mutationFn: (id: number) => companionApi.closeCompanion(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companions', showId] });
            queryClient.invalidateQueries({ queryKey: ['recent-companions'] });
            toast.success('동행 모집을 마감했습니다.');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => companionApi.deleteCompanion(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companions', showId] });
            queryClient.invalidateQueries({ queryKey: ['recent-companions'] });
            toast.success('동행 모집글을 삭제했습니다.');
        }
    });

    if (isLoading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
            </div>
        );
    }

    const posts = data?.content || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <HeartHandshake className="w-5 h-5 text-brand" />
                        함께 관극
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">이 공연을 함께 볼 동행을 찾아보세요!</p>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            className="rounded border-gray-300 text-brand focus:ring-brand"
                            checked={onlyOpen}
                            onChange={(e) => setOnlyOpen(e.target.checked)}
                        />
                        모집 중만 보기
                    </label>
                    <button
                        onClick={() => {
                            if (!isAuthenticated) return toast.error('로그인이 필요합니다.');
                            setShowForm(true);
                        }}
                        className="btn-primary px-4 py-2 text-sm"
                    >
                        모집글 작성
                    </button>
                </div>
            </div>

            {posts.length === 0 ? (
                <div className="card p-10 text-center text-gray-500 bg-gray-50/50">
                    아직 등록된 동행 모집글이 없습니다.<br />
                    첫 번째 동행을 모집해보세요!
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {posts.map(post => (
                        <CompanionCard
                            key={post.id}
                            post={post}
                            currentUserId={user?.id}
                            onJoin={() => joinMutation.mutate(post.id)}
                            onCancel={() => cancelMutation.mutate(post.id)}
                            onClose={() => closeMutation.mutate(post.id)}
                            onDelete={() => {
                                if (window.confirm('정말 삭제하시겠습니까?')) {
                                    deleteMutation.mutate(post.id);
                                }
                            }}
                            isLoading={joinMutation.isPending || cancelMutation.isPending}
                        />
                    ))}
                </div>
            )}

            {data && data.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    {Array.from({ length: Math.min(5, data.totalPages) }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i)}
                            className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${page === i
                                ? 'bg-brand text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}

            {showForm && (
                <CompanionForm
                    showId={showId}
                    onClose={() => setShowForm(false)}
                    onSuccess={() => {
                        setShowForm(false);
                        queryClient.invalidateQueries({ queryKey: ['companions', showId] });
                        queryClient.invalidateQueries({ queryKey: ['recent-companions'] });
                        setPage(0);
                    }}
                />
            )}
        </div>
    );
}

function CompanionCard({
    post,
    currentUserId,
    onJoin,
    onCancel,
    onClose,
    onDelete,
    isLoading
}: {
    post: CompanionPost;
    currentUserId?: number;
    onJoin: () => void;
    onCancel: () => void;
    onClose: () => void;
    onDelete: () => void;
    isLoading: boolean;
}) {
    const navigate = useNavigate();
    const isAuthor = currentUserId === post.authorId;
    const isParticipant = post.participants.some(p => p.userId === currentUserId);
    const isOpen = post.status === 'OPEN';
    const canAccessChat = (isAuthor || isParticipant) && post.chatRoomId != null;

    const formattedDate = format(parseISO(post.performanceDate), 'yyyy년 M월 d일(E)', { locale: ko });

    return (
        <div className="card p-5 hover:shadow-card-md transition-shadow relative group">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${isOpen
                        ? 'bg-brand-50 text-brand border border-brand-100'
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}>
                        {isOpen ? '모집 중' : post.status === 'CLOSED' ? '모집 마감' : '기간 만료'}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                        {format(parseISO(post.createdAt), 'MM.dd HH:mm')}
                    </span>
                </div>
                {isAuthor && (
                    <div className="flex gap-2">
                        {isOpen && (
                            <button onClick={onClose} className="text-xs text-brand hover:underline font-medium">
                                마감하기
                            </button>
                        )}
                        <button onClick={onDelete} className="text-xs text-red-500 hover:underline font-medium">
                            삭제
                        </button>
                    </div>
                )}
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{post.title}</h3>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px] whitespace-pre-wrap">{post.content}</p>

            <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{post.performanceTime}</span>
                </div>
                {post.seatInfo && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{post.seatInfo}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center gap-1.5 w-full">
                        <span className="font-medium">{post.currentMembers} / {post.maxMembers}명</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden ml-2">
                            <div
                                className={`h-full rounded-full transition-all ${post.currentMembers >= post.maxMembers || !isOpen ? 'bg-gray-400' : 'bg-brand'}`}
                                style={{ width: `${(post.currentMembers / post.maxMembers) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                    {post.authorProfileImage ? (
                        <img src={post.authorProfileImage} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-brand-100 text-brand flex items-center justify-center text-xs font-bold">
                            {post.authorNickname.charAt(0)}
                        </div>
                    )}
                    <span className="text-xs font-medium text-gray-700">{post.authorNickname}</span>
                </div>

                <div className="flex items-center gap-2">
                    {canAccessChat && (
                        <button
                            onClick={() => navigate(`/chat/${post.chatRoomId}`)}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-50 text-brand border border-brand-100 hover:bg-brand-100 transition-colors"
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            채팅
                        </button>
                    )}
                    {!isAuthor && (
                        isParticipant ? (
                            <button
                                onClick={onCancel}
                                disabled={isLoading}
                                className="text-xs font-semibold px-4 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                참여 취소
                            </button>
                        ) : (
                            <button
                                onClick={onJoin}
                                disabled={!isOpen || isLoading}
                                className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors ${isOpen
                                    ? 'bg-brand text-white hover:bg-brand-600'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {isOpen ? '동행 참여' : '마감됨'}
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
