import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageCircle, Trash2, ChevronDown, ChevronUp, AlertTriangle, CornerDownRight, Star } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { reviewsApi } from '../../api/reviews'
import { useAuthStore } from '../../store/authStore'
import type { Review, Comment } from '../../types'
import StarRating from '../common/StarRating'
import ConfirmModal from '../common/ConfirmModal'

interface Props {
  review: Review
  onUpdated: () => void
}

function CommentItem({
  comment,
  reviewId,
  currentUserId,
  onRequireLogin,
}: {
  comment: Comment
  reviewId: number
  currentUserId?: number
  onRequireLogin: () => void
}) {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  const [replyText, setReplyText] = useState('')
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)

  const deleteCommentMutation = useMutation({
    mutationFn: (id: number) => reviewsApi.deleteComment(id),
    onSuccess: () => {
      toast.success('댓글이 삭제되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['comments', reviewId] })
      setDeleteTargetId(null)
    },
    onError: () => toast.error('댓글 삭제에 실패했습니다.'),
  })

  const replyMutation = useMutation({
    mutationFn: () => reviewsApi.createComment(reviewId, replyText, comment.id),
    onSuccess: () => {
      setReplyText('')
      setShowReplyInput(false)
      queryClient.invalidateQueries({ queryKey: ['comments', reviewId] })
    },
  })

  return (
    <div>
      <div className="flex gap-2 group">
        <div className="w-7 h-7 rounded-full bg-warm-200 overflow-hidden shrink-0 mt-0.5">
          {comment.userProfileImage && (
            <img src={comment.userProfileImage} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1 bg-warm-50 rounded-xl px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">{comment.userNickname}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    onRequireLogin()
                    return
                  }
                  setShowReplyInput(!showReplyInput)
                }}
                className="text-xs text-gray-400 hover:text-brand transition-colors px-1"
              >
                답글
              </button>
              {currentUserId === comment.userId && (
                <button
                  onClick={() => setDeleteTargetId(comment.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                  disabled={deleteCommentMutation.isPending}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-0.5">{comment.content}</p>
        </div>
      </div>

      {showReplyInput && (
        <div className="ml-9 mt-1.5 flex gap-2">
          <CornerDownRight size={14} className="text-gray-300 mt-2 shrink-0" />
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`${comment.userNickname}에게 답글...`}
            className="flex-1 input-field text-sm py-1.5"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && replyText.trim()) replyMutation.mutate()
              if (e.key === 'Escape') setShowReplyInput(false)
            }}
          />
          <button
            onClick={() => { if (replyText.trim()) replyMutation.mutate() }}
            className="btn-primary text-xs px-3 py-1.5 shrink-0"
          >
            등록
          </button>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-9 mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex gap-2 group">
              <CornerDownRight size={14} className="text-gray-300 mt-2 shrink-0" />
              <div className="w-6 h-6 rounded-full bg-warm-100 overflow-hidden shrink-0 mt-0.5">
                {reply.userProfileImage && (
                  <img src={reply.userProfileImage} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 bg-warm-50 rounded-xl px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">{reply.userNickname}</span>
                  {currentUserId === reply.userId && (
                    <button
                      onClick={() => setDeleteTargetId(reply.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      disabled={deleteCommentMutation.isPending}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {deleteTargetId !== null && (
        <ConfirmModal
          title="댓글 삭제"
          message="정말 이 댓글을 삭제하시겠습니까?"
          confirmText="삭제하기"
          cancelText="취소"
          onConfirm={() => deleteCommentMutation.mutate(deleteTargetId)}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  )
}

export default function ReviewCard({ review, onUpdated }: Props) {
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [showSpoiler, setShowSpoiler] = useState(false)
  const [isDeletingReview, setIsDeletingReview] = useState(false)

  const requireLogin = () => {
    sessionStorage.setItem('postLoginRedirect', `${location.pathname}${location.search}`)
    toast('로그인 후 이용할 수 있어요.')
    navigate('/login', { state: { from: { pathname: location.pathname } } })
  }

  const likeMutation = useMutation({
    mutationFn: () => reviewsApi.toggleLike(review.id),
    onSuccess: () => onUpdated(),
    onError: () => requireLogin(),
  })

  const deleteMutation = useMutation({
    mutationFn: () => reviewsApi.delete(review.id),
    onSuccess: () => {
      toast.success('리뷰가 삭제되었습니다.')
      setIsDeletingReview(false)
      onUpdated()
    },
    onError: () => {
      toast.error('리뷰 삭제에 실패했습니다.')
      setIsDeletingReview(false)
    }
  })

  const { data: comments } = useQuery({
    queryKey: ['comments', review.id],
    queryFn: () => reviewsApi.getComments(review.id),
    enabled: showComments,
  })

  const commentMutation = useMutation({
    mutationFn: () => reviewsApi.createComment(review.id, commentText),
    onSuccess: () => {
      setCommentText('')
      queryClient.invalidateQueries({ queryKey: ['comments', review.id] })
    },
  })

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {review.userProfileImage && (
            <img src={review.userProfileImage} alt={review.userNickname} className="w-8 h-8 rounded-full object-cover" />
          )}
          <div>
            <span className="text-sm font-medium text-gray-900">{review.userNickname}</span>
            <p className="text-xs text-gray-400">{review.createdAt?.slice(0, 10)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm font-bold text-gold">
          <Star size={13} className="fill-gold" />
          {review.averageScore.toFixed(1)}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-3">
        {[
          { label: '스토리', score: review.storyScore },
          { label: '캐스팅', score: review.castScore },
          { label: '연출', score: review.directionScore },
          { label: '음향', score: review.soundScore },
        ].map(({ label, score }) => (
          <div key={label} className="flex items-center gap-1 text-xs text-gray-500">
            <span>{label}</span>
            <StarRating value={score} readonly size="sm" />
          </div>
        ))}
      </div>

      {review.hasSpoiler && !showSpoiler ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 text-amber-700 text-sm">
            <AlertTriangle size={14} />
            <span>스포일러가 포함된 리뷰입니다.</span>
            <button onClick={() => setShowSpoiler(true)} className="underline font-medium">보기</button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-700 leading-relaxed mb-3">{review.content}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (!isAuthenticated) {
                requireLogin()
                return
              }
              likeMutation.mutate()
            }}
            className={`flex items-center gap-1.5 text-sm transition-colors ${review.isLiked ? 'text-brand' : 'text-gray-400 hover:text-brand'}`}
          >
            <Heart size={14} className={review.isLiked ? 'fill-brand' : ''} />
            {review.likeCount}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MessageCircle size={14} />
            {review.commentCount}
            {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
        {user?.id === review.userId && (
          <button
            onClick={() => setIsDeletingReview(true)}
            className="text-gray-300 hover:text-red-500 transition-colors"
            disabled={deleteMutation.isPending}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          {comments?.content.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              reviewId={review.id}
              currentUserId={user?.id}
              onRequireLogin={requireLogin}
            />
          ))}
          {isAuthenticated ? (
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="댓글 달기..."
                className="input-field text-sm py-2"
                onKeyDown={(e) => { if (e.key === 'Enter' && commentText.trim()) commentMutation.mutate() }}
              />
              <button
                onClick={() => { if (commentText.trim()) commentMutation.mutate() }}
                className="btn-primary text-sm px-3 py-2 shrink-0"
              >
                등록
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-100 bg-warm-50 p-3">
              <p className="text-sm text-gray-600">댓글 작성은 로그인 후 이용할 수 있어요.</p>
              <button onClick={requireLogin} className="btn-secondary text-sm mt-2">
                로그인하고 댓글 쓰기
              </button>
            </div>
          )}
        </div>
      )}

      {isDeletingReview && (
        <ConfirmModal
          title="리뷰 삭제"
          message="정말 이 리뷰를 삭제하시겠습니까? (달린 댓글들도 모두 삭제됩니다)"
          confirmText="삭제하기"
          cancelText="취소"
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => setIsDeletingReview(false)}
        />
      )}
    </div>
  )
}
