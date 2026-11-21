import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit2, LogOut, User as UserIcon } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/auth'
import { favoritesApi } from '../../api/favorites'
import { reviewsApi } from '../../api/reviews'
import { communityApi } from '../../api/community'
import { formatCommunityDate } from '../Community/constants'

import ShowCard from '../../components/show/ShowCard'
import Pagination from '../../components/common/Pagination'
import ConfirmModal from '../../components/common/ConfirmModal'
import AccountDataSettings from '../../components/common/AccountDataSettings'
import RetentionOperations from '../../components/admin/RetentionOperations'
import AdminOperationsPanel from '../../components/admin/AdminOperationsPanel'

type Tab = 'favorites' | 'reviews' | 'posts' | 'profile'

export default function MyPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, setUser, logout: storeLogout } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('favorites')
  const [favPage, setFavPage] = useState(0)
  const [postPage, setPostPage] = useState(0)
  const [editingNickname, setEditingNickname] = useState(false)
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null)
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null)

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

  const { data: myPosts } = useQuery({
    queryKey: ['my-community-posts', postPage],
    queryFn: () => communityApi.getMyPosts(postPage, 10),
    enabled: activeTab === 'posts',
  })

  const updateNickname = useMutation({
    mutationFn: () => authApi.updateNickname(nickname),
    onSuccess: (updatedUser) => {
      setUser(updatedUser)
      setEditingNickname(false)
      toast.success('닉네임이 변경되었습니다.')
    },
    onError: () => toast.error('닉네임 변경에 실패했습니다.'),
  })

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore logout error
    }
    storeLogout()
    navigate('/')
    toast.success('로그아웃되었습니다.')
  }

  const deleteReview = useMutation({
    mutationFn: (id: number) => reviewsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] })
      toast.success('후기가 삭제되었습니다.')
      setDeletingReviewId(null)
    },
    onError: () => toast.error('후기 삭제에 실패했습니다.'),
  })

  const deleteCommunityPost = useMutation({
    mutationFn: (id: number) => communityApi.deletePost(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-community-posts'] })
      void queryClient.invalidateQueries({ queryKey: ['community-posts'] })
      toast.success('게시글이 삭제되었습니다.')
      setDeletingPostId(null)
    },
    onError: () => toast.error('게시글 삭제에 실패했습니다.'),
  })

  const tabs = [
    { key: 'favorites' as Tab, label: '관심 공연' },
    { key: 'reviews' as Tab, label: '작성한 후기' },
    { key: 'posts' as Tab, label: '작성한 글' },
    { key: 'profile' as Tab, label: '프로필 설정' },
  ]

  return (
    <div className="page-width account-page">
      <header className="page-heading flex items-center justify-between gap-4 border-b border-line-base">
        <h1>마이페이지</h1>
        <button
          type="button"
          onClick={() => { void handleLogout() }}
          className="text-action"
        >
          <LogOut size={14} />
          <span>로그아웃</span>
        </button>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-4 border-b border-line-lightest py-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-line-base bg-surface-muted">
            {user?.profileImage ? (
              <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
            ) : <UserIcon size={18} className="text-ink-lightest" />}
          </div>
          <div>
            <p className="text-[15px] font-semibold text-ink-darkest">{user?.nickname}</p>
            <p className="text-[12px] text-ink-lighter">{user?.email}</p>
          </div>
        </div>
      </section>

      <nav className="flex flex-wrap gap-5 border-b border-line-lightest py-3 text-[13px]" aria-label="내 활동 바로가기">
        <Link to="/diary" className="text-ink-base hover:underline">내 관극 기록</Link>
        <Link to="/plans" className="text-ink-base hover:underline">관람 예정</Link>
        <Link to="/notifications" className="text-ink-base hover:underline">알림</Link>
      </nav>

      <nav className="book-tabs mt-6" aria-label="마이페이지 탭">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            aria-pressed={activeTab === key}
            onClick={() => setActiveTab(key)}
            className={activeTab === key ? 'is-active' : ''}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-4">
        {activeTab === 'favorites' && (
          <div>
            {favorites && favorites.content.length > 0 ? (
              <>
                <div className="feed-list">
                  {favorites.content.map((show, index) => <ShowCard key={show.id} show={show} index={favPage * 8 + index} />)}
                </div>
                {favorites.totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination currentPage={favPage} totalPages={favorites.totalPages} onPageChange={setFavPage} />
                  </div>
                )}
              </>
            ) : (
              <div className="quiet-empty">
                <p>관심 등록한 공연이 없습니다. 공연 상세에서 저장할 수 있습니다.</p>
                <button type="button" onClick={() => navigate('/shows')} className="button-secondary">
                  공연 둘러보기
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            {myReviews && myReviews.content?.length > 0 ? (
              <div className="divide-y divide-line-lightest border-t border-line-base">
                {myReviews.content.map((r: any) => (
                  <article key={r.id} className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <Link to={`/shows/${r.showId}`} className="text-[14px] font-semibold text-ink-darker hover:underline">
                        {r.showTitle}
                      </Link>
                      <span className="text-[12px] text-ink-muted">평점 {r.score}</span>
                    </div>
                    <p className="mt-1.5 text-[13px] text-ink-muted leading-relaxed line-clamp-2">{r.content}</p>
                    <div className="mt-2 flex items-center justify-between text-[12px] text-ink-lighter">
                      <span>{r.createdAt?.slice(0, 10)}</span>
                      <button
                        type="button"
                        onClick={() => setDeletingReviewId(r.id)}
                        className="text-red-600 hover:underline"
                      >
                        삭제
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="quiet-empty">
                <p>작성한 상세 후기가 없습니다.</p>
                <button type="button" onClick={() => navigate('/shows')} className="button-secondary">
                  공연 둘러보기
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'posts' && (
          <div>
            {myPosts && myPosts.content.length > 0 ? (
              <>
                <div className="divide-y divide-line-lightest border-t border-line-base">
                  {myPosts.content.map((post) => (
                    <article key={post.id} className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="text-[12px] text-ink-lighter shrink-0">{post.categoryDisplayName}</span>
                          <Link to={`/community/${post.id}`} className="text-[14px] font-semibold text-ink-darker hover:underline truncate">
                            {post.title}
                          </Link>
                          {post.commentCount > 0 && (
                            <span className="text-[12px] text-ink-muted shrink-0">[{post.commentCount}]</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setDeletingPostId(post.id)}
                          className="text-[12px] text-red-600 hover:underline shrink-0"
                        >
                          삭제
                        </button>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-3 text-[12px] text-ink-lighter">
                        <span>{formatCommunityDate(post.createdAt)}</span>
                        <span>공감 {post.likeCount}</span>
                        <span>조회 {post.viewCount}</span>
                        {post.showTitle && <span>{post.showTitle}</span>}
                      </div>
                    </article>
                  ))}
                </div>
                {myPosts.totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination currentPage={postPage} totalPages={myPosts.totalPages} onPageChange={setPostPage} />
                  </div>
                )}
              </>
            ) : (
              <div className="quiet-empty">
                <p>작성한 커뮤니티 게시글이 없습니다.</p>
                <button type="button" onClick={() => navigate('/community/new')} className="button-secondary">
                  글 작성하기
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="border border-line-base bg-white p-5 space-y-5">
            <div>
              <h3 className="text-[12px] font-semibold text-ink-muted">닉네임</h3>
              {editingNickname ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="h-9 flex-1 min-w-[180px] border border-line-base bg-white px-3 text-[13px] text-ink-base outline-none focus:border-line-dark"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={() => updateNickname.mutate()}
                    disabled={updateNickname.isPending || !nickname.trim()}
                    className="button-primary"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingNickname(false); setNickname(user?.nickname || '') }}
                    className="button-secondary"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[14px] font-medium text-ink-darker">{user?.nickname}</span>
                  <button
                    type="button"
                    onClick={() => setEditingNickname(true)}
                    className="text-action"
                  >
                    <Edit2 size={13} /> 수정
                  </button>
                </div>
              )}
            </div>
            <AccountDataSettings />
            <div className="border-t border-line-lightest pt-4">
              <h3 className="text-[12px] font-semibold text-ink-muted">이메일 계정</h3>
              <p className="mt-1 text-[13px] text-ink-base">{user?.email}</p>
            </div>
          </div>
        )}
      </div>

      {user?.role === 'ADMIN' && <><AdminOperationsPanel /><RetentionOperations /></>}

      <footer className="mt-12 pt-5 border-t border-line-lightest text-[12px] text-ink-lightest flex flex-wrap justify-between gap-2">
        <span>CurtainCall</span>
        <span>공연 정보 KOPIS</span>
      </footer>

      {deletingReviewId && (
        <ConfirmModal
          title="후기 삭제"
          message="정말로 이 후기를 삭제하시겠습니까?"
          confirmText="삭제"
          onConfirm={() => deleteReview.mutate(deletingReviewId)}
          onCancel={() => setDeletingReviewId(null)}
        />
      )}

      {deletingPostId && (
        <ConfirmModal
          title="게시글 삭제"
          message="작성한 커뮤니티 게시글을 삭제하시겠습니까?"
          confirmText="삭제"
          onConfirm={() => deleteCommunityPost.mutate(deletingPostId)}
          onCancel={() => setDeletingPostId(null)}
        />
      )}
    </div>
  )
}
