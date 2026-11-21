import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { communityApi } from '../../api/community'
import { useAuthStore } from '../../store/authStore'
import type { CommunityComment, CommunityPostDetail } from '../../types'
import ConfirmModal from '../../components/common/ConfirmModal'
import Pagination from '../../components/common/Pagination'
import { formatCommunityDate } from './constants'

function isEdited(createdAt: string, updatedAt: string): boolean {
  if (!createdAt || !updatedAt) return false
  const diff = new Date(updatedAt).getTime() - new Date(createdAt).getTime()
  return Number.isFinite(diff) && diff > 5000
}

export default function CommunityDetailPage() {
  const { id } = useParams()
  const postId = Number(id)
  const validPostId = Number.isInteger(postId) && postId > 0

  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()

  const [commentPage, setCommentPage] = useState(0)
  const [commentText, setCommentText] = useState('')
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [confirmDeletePost, setConfirmDeletePost] = useState(false)
  const [deleteCommentTarget, setDeleteCommentTarget] = useState<{ id: number; decrement: number } | null>(null)

  const {
    data: post,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['community-post', postId],
    queryFn: () => communityApi.getPost(postId, true),
    enabled: validPostId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })

  const { data: commentsData } = useQuery({
    queryKey: ['community-comments', postId, commentPage],
    queryFn: () => communityApi.getComments(postId, commentPage, 20),
    enabled: validPostId && Boolean(post),
  })

  const redirectToLogin = () => {
    navigate('/login', { state: { from: location } })
  }

  const adjustCachedCommentCount = (delta: number) => {
    queryClient.setQueryData<CommunityPostDetail>(['community-post', postId], (prev) =>
      prev ? { ...prev, commentCount: Math.max(0, prev.commentCount + delta) } : prev
    )
    void queryClient.invalidateQueries({ queryKey: ['community-posts'] })
  }

  const toggleLikeMutation = useMutation({
    mutationFn: () => communityApi.toggleLike(postId),
    onSuccess: (result) => {
      queryClient.setQueryData<CommunityPostDetail>(['community-post', postId], (prev) =>
        prev ? { ...prev, liked: result.liked, likeCount: result.likeCount } : prev
      )
      void queryClient.invalidateQueries({ queryKey: ['community-posts'] })
      void queryClient.invalidateQueries({ queryKey: ['my-community-posts'] })
    },
    onError: () => toast.error('공감 처리에 실패했습니다.'),
  })

  const deletePostMutation = useMutation({
    mutationFn: () => communityApi.deletePost(postId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['community-post', postId] })
      void queryClient.invalidateQueries({ queryKey: ['community-posts'] })
      void queryClient.invalidateQueries({ queryKey: ['my-community-posts'] })
      toast.success('게시글이 삭제되었습니다.')
      navigate('/community', { replace: true })
    },
    onError: () => toast.error('게시글을 삭제하지 못했습니다.'),
  })

  const createCommentMutation = useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: number }) =>
      communityApi.createComment(postId, content, parentId),
    onSuccess: (_created, variables) => {
      if (variables.parentId) {
        setReplyText('')
        setReplyTargetId(null)
      } else {
        setCommentText('')
      }
      adjustCachedCommentCount(1)
      void queryClient.invalidateQueries({ queryKey: ['community-comments', postId] })
    },
    onError: () => toast.error('댓글을 등록하지 못했습니다.'),
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (target: { id: number; decrement: number }) => communityApi.deleteComment(target.id),
    onSuccess: (_res, target) => {
      setDeleteCommentTarget(null)
      adjustCachedCommentCount(-target.decrement)
      void queryClient.invalidateQueries({ queryKey: ['community-comments', postId] })
      toast.success('댓글이 삭제되었습니다.')
    },
    onError: () => toast.error('댓글을 삭제하지 못했습니다.'),
  })

  if (!validPostId) {
    return (
      <div className="page-width">
        <p className="feed-notice">게시글을 찾을 수 없습니다.</p>
        <Link to="/community" className="text-link">목록으로</Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="page-width">
        <p className="feed-notice">불러오는 중...</p>
      </div>
    )
  }

  if (isError || !post) {
    return (
      <div className="page-width">
        <div className="feed-notice">
          <p>게시글을 불러오지 못했습니다.</p>
          <div className="mt-3 flex gap-4">
            <button type="button" onClick={() => { void refetch() }} className="text-action">
              다시 불러오기
            </button>
            <Link to="/community" className="text-link">목록으로</Link>
          </div>
        </div>
      </div>
    )
  }

  const canEdit = post.author
  const canDelete = post.author || user?.role === 'ADMIN'
  const canDeleteComment = (comment: CommunityComment) =>
    Boolean(user && (user.id === comment.authorId || user.role === 'ADMIN'))

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      redirectToLogin()
      return
    }
    const trimmed = commentText.trim()
    if (!trimmed) {
      toast.error('댓글 내용을 입력해 주세요.')
      return
    }
    createCommentMutation.mutate({ content: trimmed })
  }

  const handleReplySubmit = (e: React.FormEvent, parentId: number) => {
    e.preventDefault()
    if (!isAuthenticated) {
      redirectToLogin()
      return
    }
    const trimmed = replyText.trim()
    if (!trimmed) {
      toast.error('답글 내용을 입력해 주세요.')
      return
    }
    createCommentMutation.mutate({ content: trimmed, parentId })
  }

  return (
    <div className="page-width">
      <div className="max-w-[820px]">
        <div className="pt-6 pb-3">
          <Link to="/community" className="text-link">목록으로</Link>
        </div>

        <article>
          <header className="border-b border-[#e5e5e5] pb-5">
            <p className="eyebrow">{post.categoryDisplayName}</p>
            <h1 className="mt-2 text-[21px] font-semibold tracking-[-0.4px] text-[#111] leading-snug break-words">
              {post.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="feed-meta mt-0">
                <span>{post.authorNickname}</span>
                <time dateTime={post.createdAt}>{formatCommunityDate(post.createdAt, true)}</time>
                {isEdited(post.createdAt, post.updatedAt) && <span>수정됨</span>}
                <span>조회 {post.viewCount}</span>
              </div>
              {(canEdit || canDelete) && (
                <div className="flex items-center gap-3">
                  {canEdit && (
                    <Link to={`/community/${post.id}/edit`} className="text-action">
                      수정
                    </Link>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setConfirmDeletePost(true)}
                      className="text-action text-rose-600 hover:text-rose-700"
                    >
                      삭제
                    </button>
                  )}
                </div>
              )}
            </div>
          </header>

          {post.showId && post.showTitle && (
            <div className="mt-5 flex items-center justify-between gap-4 border border-[#e5e5e5] bg-white px-4 py-3">
              <div className="min-w-0 flex items-center gap-2 text-[13px]">
                <span className="text-[#888] shrink-0">관련 공연</span>
                <Link to={`/shows/${post.showId}`} className="font-medium text-[#242424] hover:underline truncate">
                  {post.showTitle}
                </Link>
              </div>
              <Link to={`/shows/${post.showId}`} className="text-link shrink-0">
                공연 정보
              </Link>
            </div>
          )}

          <div className="py-7 text-[15px] leading-[1.8] text-[#222] whitespace-pre-wrap break-words min-h-[140px]">
            {post.content}
          </div>

          <div className="pb-7 border-b border-[#e5e5e5] flex items-center justify-between gap-4">
            <button
              type="button"
              disabled={toggleLikeMutation.isPending}
              onClick={() => {
                if (!isAuthenticated) {
                  redirectToLogin()
                  return
                }
                toggleLikeMutation.mutate()
              }}
              aria-pressed={post.liked}
              className={post.liked ? 'button-primary' : 'button-secondary'}
            >
              공감 {post.likeCount}
            </button>
            <Link to="/community" className="text-link">목록으로</Link>
          </div>
        </article>

        <section className="pt-7 pb-12" aria-label="댓글">
          <h2 className="text-[15px] font-semibold text-[#111]">
            댓글 {post.commentCount}
          </h2>

          {isAuthenticated ? (
            <form onSubmit={handleCommentSubmit} className="mt-4 space-y-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="댓글을 입력해 주세요."
                aria-label="댓글 입력"
                className="w-full border border-[#ccc] bg-white px-3 py-2 text-[13px] text-[#111] outline-none focus:border-[#242424] resize-y"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={createCommentMutation.isPending || !commentText.trim()}
                  className="button-primary"
                >
                  등록
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-4 border border-[#e5e5e5] bg-white px-4 py-3 text-[13px] text-[#666] flex flex-wrap items-center justify-between gap-2">
              <span>댓글을 작성하려면 로그인이 필요합니다.</span>
              <Link to="/login" state={{ from: location }} className="text-action font-medium text-[#111]">
                로그인하기
              </Link>
            </div>
          )}

          <div className="mt-6 divide-y divide-[#f0f0f0]">
            {commentsData?.content.length ? (
              commentsData.content.map((comment) => (
                <div key={comment.id} className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="feed-meta mt-0">
                      <span className="text-[#242424] font-medium">{comment.authorNickname}</span>
                      <time dateTime={comment.createdAt}>{formatCommunityDate(comment.createdAt, true)}</time>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (!isAuthenticated) {
                            redirectToLogin()
                            return
                          }
                          setReplyText('')
                          setReplyTargetId(replyTargetId === comment.id ? null : comment.id)
                        }}
                        className="text-action"
                      >
                        답글
                      </button>
                      {canDeleteComment(comment) && (
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteCommentTarget({ id: comment.id, decrement: 1 + comment.replies.length })
                          }
                          className="text-action text-rose-600 hover:text-rose-700"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-[#222] whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>

                  {replyTargetId === comment.id && (
                    <form
                      onSubmit={(e) => handleReplySubmit(e, comment.id)}
                      className="mt-3 ml-4 pl-4 border-l border-[#e5e5e5] space-y-2"
                    >
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={2}
                        maxLength={1000}
                        placeholder="답글을 입력해 주세요."
                        aria-label="답글 입력"
                        className="w-full border border-[#ccc] bg-white px-3 py-2 text-[13px] text-[#111] outline-none focus:border-[#242424] resize-y"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyTargetId(null)
                            setReplyText('')
                          }}
                          className="button-secondary"
                        >
                          취소
                        </button>
                        <button
                          type="submit"
                          disabled={createCommentMutation.isPending || !replyText.trim()}
                          className="button-primary"
                        >
                          답글 등록
                        </button>
                      </div>
                    </form>
                  )}

                  {comment.replies.length > 0 && (
                    <div className="mt-3 ml-4 pl-4 border-l border-[#e5e5e5] space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="pt-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="feed-meta mt-0">
                              <span className="text-[#242424] font-medium">{reply.authorNickname}</span>
                              <time dateTime={reply.createdAt}>{formatCommunityDate(reply.createdAt, true)}</time>
                            </div>
                            {canDeleteComment(reply) && (
                              <button
                                type="button"
                                onClick={() => setDeleteCommentTarget({ id: reply.id, decrement: 1 })}
                                className="text-action text-rose-600 hover:text-rose-700"
                              >
                                삭제
                              </button>
                            )}
                          </div>
                          <p className="mt-1 text-[14px] leading-relaxed text-[#222] whitespace-pre-wrap break-words">
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="feed-notice">아직 등록된 댓글이 없습니다.</p>
            )}
          </div>

          {commentsData && commentsData.totalPages > 1 && (
            <Pagination
              currentPage={commentPage}
              totalPages={commentsData.totalPages}
              onPageChange={setCommentPage}
            />
          )}
        </section>
      </div>

      {confirmDeletePost && (
        <ConfirmModal
          title="게시글 삭제"
          message="작성한 게시글을 삭제하시겠습니까?"
          confirmText="삭제"
          onConfirm={() => deletePostMutation.mutate()}
          onCancel={() => setConfirmDeletePost(false)}
        />
      )}

      {deleteCommentTarget !== null && (
        <ConfirmModal
          title="댓글 삭제"
          message="선택한 댓글을 삭제하시겠습니까?"
          confirmText="삭제"
          onConfirm={() => deleteCommentMutation.mutate(deleteCommentTarget)}
          onCancel={() => setDeleteCommentTarget(null)}
        />
      )}
    </div>
  )
}
