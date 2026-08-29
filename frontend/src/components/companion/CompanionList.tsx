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
                <Loader2 className="h-6 w-6 animate-spin text-[#8993a4]" />
            </div>
        );
    }

    const posts = data?.content || [];

    return (
        <div className="space-y-5">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h2 className="flex items-center gap-2 text-[20px] font-semibold tracking-[-0.035em] text-[#172033]">
                        <HeartHandshake className="h-5 w-5 text-[#9b3155]" />
                        함께 관극
                    </h2>
                    <p className="mt-1 text-[13px] text-[#697386]">이 공연을 함께 볼 동행을 찾아보세요.</p>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex cursor-pointer select-none items-center gap-1.5 text-[12px] text-[#697386]">
                        <input
                            type="checkbox"
                            className="rounded-sm border-[#cfd5df] text-[#172033] focus:ring-[#172033]"
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
                        className="btn-primary h-9"
                    >
                        모집글 작성
                    </button>
                </div>
            </div>

            {posts.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><HeartHandshake size={18} /></div>
                    <p className="text-[13px] text-[#697386]">등록된 동행 모집이 없습니다.<br />첫 번째 동행을 찾아보세요.</p>
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
                <div className="flex justify-center gap-1 mt-6">
                    {Array.from({ length: Math.min(5, data.totalPages) }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i)}
                            className={`h-8 w-8 text-[12px] font-semibold transition-colors ${page === i
                                ? 'bg-[#172033] text-white'
                                : 'text-[#697386] hover:bg-[#f4f5f7]'
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
        <article className="group relative border border-[#e5e8ee] bg-white p-5 transition-colors hover:border-[#cfd5df]">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-[10px] font-semibold ${isOpen
                        ? 'bg-[#f8eff3] text-[#9b3155]'
                        : 'bg-[#f1f3f5] text-[#697386]'
                        }`}>
                        {isOpen ? '모집 중' : post.status === 'CLOSED' ? '모집 마감' : '기간 만료'}
                    </span>
                    <span className="text-[11px] font-medium text-[#8993a4]">
                        {format(parseISO(post.createdAt), 'MM.dd HH:mm')}
                    </span>
                </div>
                {isAuthor && (
                    <div className="flex gap-2">
                        {isOpen && (
                            <button onClick={onClose} className="text-[11px] font-medium text-[#697386] hover:text-[#172033]">
                                마감하기
                            </button>
                        )}
                        <button onClick={onDelete} className="text-[11px] font-medium text-[#c53b4b] hover:text-[#aa2f40]">
                            삭제
                        </button>
                    </div>
                )}
            </div>

            <h3 className="mb-2 line-clamp-1 text-[16px] font-semibold tracking-[-0.025em] text-[#172033]">{post.title}</h3>
            <p className="mb-5 min-h-[40px] line-clamp-2 whitespace-pre-wrap text-[13px] leading-5 text-[#697386]">{post.content}</p>

            <div className="space-y-1.5 mb-5">
                <div className="flex items-center gap-1.5 text-[12px] text-[#697386]">
                    <Calendar className="h-3.5 w-3.5 text-[#8993a4]" />
                    <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-[#697386]">
                    <Clock className="h-3.5 w-3.5 text-[#8993a4]" />
                    <span>{post.performanceTime}</span>
                </div>
                {post.seatInfo && (
                    <div className="flex items-center gap-1.5 text-[12px] text-[#697386]">
                        <MapPin className="h-3.5 w-3.5 text-[#8993a4]" />
                        <span>{post.seatInfo}</span>
                    </div>
                )}
                <div className="flex items-center gap-1.5 text-[12px] text-[#697386]">
                    <Users className="h-3.5 w-3.5 text-[#8993a4]" />
                    <div className="flex items-center gap-1.5 w-full">
                        <span className="font-medium">{post.currentMembers} / {post.maxMembers}명</span>
                        <div className="ml-2 h-1 flex-1 overflow-hidden bg-[#eef0f3]">
                            <div
                                className={`h-full transition-all ${post.currentMembers >= post.maxMembers || !isOpen ? 'bg-[#aeb7c5]' : 'bg-[#9b3155]'}`}
                                style={{ width: `${(post.currentMembers / post.maxMembers) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#eef0f3] pt-4">
                <div className="flex items-center gap-1.5">
                    {post.authorProfileImage ? (
                        <img src={post.authorProfileImage} alt="" className="h-5 w-5 rounded-full object-cover" />
                    ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f1f3f5] text-[10px] font-bold text-[#536076]">
                            {post.authorNickname.charAt(0)}
                        </div>
                    )}
                    <span className="text-[12px] font-medium text-[#536076]">{post.authorNickname}</span>
                </div>

                <div className="flex items-center gap-2">
                    {canAccessChat && (
                        <button
                            onClick={() => navigate(`/chat/${post.chatRoomId}`)}
                            className="btn-secondary h-8 px-2.5 text-[12px]"
                        >
                            <MessageSquare className="w-3 h-3" />
                            채팅
                        </button>
                    )}
                    {!isAuthor && (
                        isParticipant ? (
                            <button
                                onClick={onCancel}
                                disabled={isLoading}
                                className="btn-secondary h-8 px-3 text-[12px]"
                            >
                                참여 취소
                            </button>
                        ) : (
                            <button
                                onClick={onJoin}
                                disabled={!isOpen || isLoading}
                                className={`inline-flex h-8 items-center justify-center px-3 text-[12px] font-semibold transition-colors ${isOpen
                                    ? 'bg-[#172033] text-white hover:bg-[#273247]'
                                    : 'border border-[#e5e8ee] bg-white text-[#98a2b3] cursor-not-allowed'
                                    }`}
                            >
                                {isOpen ? '동행 참여' : '마감됨'}
                            </button>
                        )
                    )}
                </div>
            </div>
        </article>
    );
}
