import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, Star, Edit2, LogOut, User as UserIcon, MessageCircle, Trash2, Pencil } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/auth'
import { favoritesApi } from '../../api/favorites'
import { reviewsApi } from '../../api/reviews'
import ShowCard from '../../components/show/ShowCard'
import Pagination from '../../components/common/Pagination'
import ConfirmModal from '../../components/common/ConfirmModal'

type Tab = 'favorites' | 'reviews' | 'profile'

export default function MyPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user, setUser, logout: storeLogout } = useAuthStore()
    const [activeTab, setActiveTab] = useState<Tab>('favorites')
    const [favPage, setFavPage] = useState(0)
    const [editingNickname, setEditingNickname] = useState(false)
    const [nickname, setNickname] = useState(user?.nickname || '')
    const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null)

    const { data: favorites } = useQuery({
        queryKey: ['my-favorites', favPage],
        queryFn: () => favoritesApi.getMyFavorites(favPage, 8),
        enabled: activeTab === 'favorites',
    })

    const { data: myReviews } = useQuery({
        queryKey: ['my-reviews'],
        queryFn: () => reviewsApi.getMyReviews?.() || Promise.resolve({ content: [], totalPages: 0 }),
        enabled: activeTab === 'reviews',
    })

    const updateNickname = useMutation({
        mutationFn: () => authApi.updateNickname(nickname),
        onSuccess: (updatedUser) => {
            setUser(updatedUser)
            setEditingNickname(false)
            toast.success('닉네임이 변경되었습니다!')
        },
        onError: () => toast.error('닉네임 변경에 실패했습니다'),
    })

    const handleLogout = () => {
        storeLogout()
        toast.success('로그아웃 되었습니다')
        navigate('/')
    }

    const deleteReviewMutation = useMutation({
        mutationFn: (reviewId: number) => reviewsApi.delete(reviewId),
        onSuccess: () => {
            toast.success('리뷰가 삭제되었습니다.')
            setDeletingReviewId(null)
            queryClient.invalidateQueries({ queryKey: ['my-reviews'] })
            queryClient.invalidateQueries({ queryKey: ['reviews'] })
        },
        onError: () => toast.error('리뷰 삭제에 실패했습니다.'),
    })

    const tabs = [
        { key: 'favorites' as Tab, label: '찜 목록', icon: <Heart size={15} /> },
        { key: 'reviews' as Tab, label: '내 리뷰', icon: <Star size={15} /> },
        { key: 'profile' as Tab, label: '프로필', icon: <UserIcon size={15} /> },
    ]

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-warm-100 border border-gray-100 flex items-center justify-center overflow-hidden">
                    {user?.profileImage ? (
                        <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : <UserIcon size={24} className="text-gray-400" />}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{user?.nickname || '사용자'}</h1>
                    <p className="text-sm text-gray-400">{user?.email}</p>
                </div>
            </div>

            <div className="flex gap-0.5 bg-warm-100 p-1 rounded-xl w-full mb-6">
                {tabs.map(({ key, label, icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                            activeTab === key
                            ? 'bg-white text-brand shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {icon}
                        {label}
                    </button>
                ))}
            </div>

            {activeTab === 'favorites' && (
                <div>
                    {favorites && favorites.content.length > 0 ? (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                                {favorites.content.map((show: any) => (
                                    <ShowCard key={show.id} show={show} />
                                ))}
                            </div>
                            <div className="mt-6">
                                <Pagination
                                    currentPage={favPage}
                                    totalPages={favorites.totalPages}
                                    onPageChange={setFavPage}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-20 text-gray-400">
                            <Heart size={48} className="mx-auto mb-3 text-gray-200" />
                            <p className="font-medium">찜한 공연이 없어요.</p>
                            <p className="text-sm mt-1">마음에 드는 공연을 저장해 나만의 목록을 만들어보세요.</p>
                            <button onClick={() => navigate('/shows')} className="btn-primary mt-4">
                                공연 둘러보기
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'reviews' && (
                <div>
                    {myReviews && myReviews.content?.length > 0 ? (
                        <div className="space-y-4">
                            {myReviews.content.map((review: any) => (
                                <div key={review.id} className="card p-5">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <Link
                                                to={`/shows/${review.showId}`}
                                                className="font-bold text-gray-900 hover:text-brand transition-colors"
                                            >
                                                {review.showTitle || '공연'}
                                            </Link>
                                            <p className="text-xs text-gray-400">{review.createdAt?.slice(0, 10)}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 text-gold font-bold text-sm">
                                                <Star size={13} className="fill-gold" />
                                                {review.averageScore?.toFixed(1)}
                                            </div>
                                            <button
                                                onClick={() => navigate(`/shows/${review.showId}`)}
                                                className="text-gray-300 hover:text-brand transition-colors"
                                                title="공연 상세에서 수정"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => setDeletingReviewId(review.id)}
                                                className="text-gray-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700 line-clamp-2">{review.content}</p>
                                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                                        <span className="inline-flex items-center gap-1">
                                            <Heart size={12} />
                                            {review.likeCount}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <MessageCircle size={12} />
                                            {review.commentCount}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {deletingReviewId !== null && (
                                <ConfirmModal
                                    title="리뷰 삭제"
                                    message="정말 이 리뷰를 삭제하시겠습니까?"
                                    confirmText="삭제하기"
                                    cancelText="취소"
                                    onConfirm={() => deleteReviewMutation.mutate(deletingReviewId)}
                                    onCancel={() => setDeletingReviewId(null)}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-400">
                            <Star size={48} className="mx-auto mb-3 text-gray-200" />
                            <p className="font-medium">작성한 리뷰가 없어요.</p>
                            <p className="text-sm mt-1">공연을 보고 솔직한 리뷰를 남겨보세요!</p>
                            <button onClick={() => navigate('/shows')} className="btn-primary mt-4">
                                공연 둘러보기
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'profile' && (
                <div className="max-w-md space-y-6">
                    <div className="card p-5">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">닉네임</label>
                        {editingNickname ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    className="input-field flex-1"
                                    maxLength={20}
                                />
                                <button
                                    onClick={() => updateNickname.mutate()}
                                    disabled={updateNickname.isPending || !nickname.trim()}
                                    className="btn-primary text-sm px-4"
                                >
                                    저장
                                </button>
                                <button
                                    onClick={() => { setEditingNickname(false); setNickname(user?.nickname || '') }}
                                    className="btn-secondary text-sm px-4"
                                >
                                    취소
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <span className="text-gray-900 font-medium">{user?.nickname}</span>
                                <button
                                    onClick={() => setEditingNickname(true)}
                                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-brand"
                                >
                                    <Edit2 size={14} />
                                    수정
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="card p-5">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">이메일</label>
                        <span className="text-gray-500">{user?.email}</span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-red-500 hover:text-red-600 text-sm font-medium transition-colors"
                    >
                        <LogOut size={16} />
                        로그아웃
                    </button>
                </div>
            )}
        </div>
    )
}
