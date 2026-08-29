import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, Star, Edit2, LogOut, User as UserIcon } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/auth'
import { favoritesApi } from '../../api/favorites'
import { reviewsApi } from '../../api/reviews'

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

    const handleLogout = async () => {
        try {
            await authApi.logout()
        } catch { }
        storeLogout()
        navigate('/')
        toast.success('로그아웃되었습니다')
    }

    const deleteReview = useMutation({
        mutationFn: (id: number) => reviewsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-reviews'] })
            toast.success('후기가 삭제되었습니다')
            setDeletingReviewId(null)
        },
        onError: () => toast.error('후기 삭제에 실패했습니다'),
    })

    const tabs = [
        { key: 'favorites' as Tab, label: '관심 공연' },
        { key: 'reviews' as Tab, label: '작성한 후기' },
        { key: 'profile' as Tab, label: '프로필 설정' },
    ]

    return (
        <div className="px-4 py-4 sm:px-5">
            <p className="text-[10px] text-ink-lightest mb-1.5">홈&nbsp; › &nbsp;<span className="text-ink-light">마이페이지</span></p>
            <div className="mb-5 flex items-end justify-between border-b border-line-lightest pb-3">
                <h1 className="text-[18px] font-semibold tracking-[-0.05em] text-ink-darker">마이페이지</h1>
            </div>

            {/* 유저 프로필 카드 */}
            <div className="mb-6 border border-line-base bg-surface-alt/40 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-surface-muted border border-line-base">
                        {user?.profileImage ? (
                            <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
                        ) : <UserIcon size={18} className="text-ink-lightest" />}
                    </div>
                    <div>
                        <b className="block text-[13px] font-semibold text-ink-darkest">{user?.nickname}</b>
                        <span className="text-[11px] text-ink-lightest">{user?.email}</span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => { void handleLogout() }}
                    className="flex items-center gap-1 text-[11px] text-ink-muted hover:text-brand transition-colors"
                >
                    <LogOut size={12} />
                    로그아웃
                </button>
            </div>

            {/* 탭 네비게이션 */}
            <div className="flex gap-6 border-b border-line-lightest pb-2.5 text-[12px]">
                {tabs.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`transition-colors ${
                            activeTab === key ? 'font-semibold text-brand border-b-2 border-brand pb-2.5 -mb-[11px]' : 'text-ink-lighter hover:text-ink-dark'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* 탭 콘텐츠 */}
            <div className="mt-5">
                {activeTab === 'favorites' && (
                    <div>
                        {favorites && favorites.content.length > 0 ? (
                            <>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-5">
                                    {favorites.content.map((show: any) => (
                                        <Link key={show.id} to={`/shows/${show.id}`} className="min-w-0 group">
                                            <div className="relative aspect-[2/3] overflow-hidden bg-surface-background border border-line-lightest">
                                                {show.posterImage ? (
                                                    <img src={show.posterImage} alt={show.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-[10px] text-ink-lightest">No Image</div>
                                                )}
                                            </div>
                                            <h3 className="mt-2 truncate text-[12px] font-semibold text-ink-darker group-hover:text-brand transition-colors">{show.title}</h3>
                                            <p className="mt-0.5 truncate text-[10px] text-ink-lightest">{show.facilityName}</p>
                                        </Link>
                                    ))}
                                </div>
                                {favorites.totalPages > 1 && (
                                    <div className="mt-6">
                                        <Pagination currentPage={favPage} totalPages={favorites.totalPages} onPageChange={setFavPage} />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="py-16 text-center">
                                <Heart size={20} className="mx-auto mb-3 text-line-base" />
                                <p className="text-[12px] font-semibold text-ink-muted">관심 등록한 공연이 없습니다.</p>
                                <p className="mt-1 text-[11px] text-ink-lightest">마음에 드는 공연을 찜해보세요.</p>
                                <button onClick={() => navigate('/shows')} className="mt-4 border border-line-base bg-surface-base px-3.5 py-1.5 text-[11px] text-ink-muted hover:border-line-dark transition-colors">
                                    공연 둘러보기
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div>
                        {myReviews && myReviews.content?.length > 0 ? (
                            <div className="space-y-3">
                                {myReviews.content.map((r: any) => (
                                    <div key={r.id} className="border border-line-lightest p-3 bg-surface-alt/30">
                                        <div className="flex items-center justify-between">
                                            <Link to={`/shows/${r.showId}`} className="text-[12px] font-semibold text-ink-darker hover:text-brand transition-colors">
                                                {r.showTitle}
                                            </Link>
                                            <div className="flex items-center gap-1 text-brand text-[11px]">
                                                <Star size={11} className="fill-brand" />
                                                <span>{r.score}</span>
                                            </div>
                                        </div>
                                        <p className="mt-1.5 text-[11px] text-ink-muted leading-relaxed line-clamp-2">{r.content}</p>
                                        <div className="mt-2 flex items-center justify-between text-[10px] text-ink-lightest">
                                            <span>{r.createdAt?.slice(0, 10)}</span>
                                            <button
                                                onClick={() => setDeletingReviewId(r.id)}
                                                className="text-red-500 hover:underline"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-16 text-center">
                                <Star size={20} className="mx-auto mb-3 text-line-base" />
                                <p className="text-[12px] font-semibold text-ink-muted">작성한 후기가 없습니다.</p>
                                <p className="mt-1 text-[11px] text-ink-lightest">공연을 보고 느낀 점을 남겨 보세요.</p>
                                <button onClick={() => navigate('/shows')} className="mt-4 border border-line-base bg-surface-base px-3.5 py-1.5 text-[11px] text-ink-muted hover:border-line-dark transition-colors">
                                    공연 둘러보기
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="border border-line-lightest p-4 space-y-4">
                        <div>
                            <h3 className="text-[11px] font-semibold text-ink-muted">닉네임</h3>
                            {editingNickname ? (
                                <div className="mt-2 flex gap-2">
                                    <input
                                        type="text"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        className="h-8 flex-1 border border-line-base bg-surface-base px-2.5 text-[11px] text-ink-base outline-none focus:border-line-dark"
                                        maxLength={20}
                                    />
                                    <button onClick={() => updateNickname.mutate()} disabled={updateNickname.isPending || !nickname.trim()} className="h-8 bg-ink-darkest px-3 text-[11px] font-semibold text-white disabled:opacity-50">저장</button>
                                    <button onClick={() => { setEditingNickname(false); setNickname(user?.nickname || '') }} className="h-8 border border-line-base bg-surface-base px-3 text-[11px] text-ink-muted">취소</button>
                                </div>
                            ) : (
                                <div className="mt-1.5 flex items-center justify-between">
                                    <span className="text-[13px] font-medium text-ink-darker">{user?.nickname}</span>
                                    <button onClick={() => setEditingNickname(true)} className="flex items-center gap-1 text-[11px] text-ink-muted hover:text-ink-darkest"><Edit2 size={12} /> 수정</button>
                                </div>
                            )}
                        </div>
                        <div className="border-t border-line-lightest pt-3">
                            <h3 className="text-[11px] font-semibold text-ink-muted">이메일 계정</h3>
                            <p className="mt-1 text-[12px] text-ink-base">{user?.email}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* 인앱 정보 및 출처 */}
            <div className="mt-12 pt-5 border-t border-line-lightest text-center text-[10px] text-ink-lightest space-y-1">
                <p className="font-semibold text-ink-lighter">CurtainCall v1.0</p>
                <p>공연 정보 제공: KOPIS (공연예술통합전산망)</p>
                <p>© 2026 CurtainCall. All rights reserved.</p>
            </div>

            {deletingReviewId && (
                <ConfirmModal
                    title="후기 삭제"
                    message="정말로 이 후기를 삭제하시겠습니까?"
                    confirmText="삭제"
                    onConfirm={() => deleteReview.mutate(deletingReviewId)}
                    onCancel={() => setDeletingReviewId(null)}
                />
            )}
        </div>
    )
}
