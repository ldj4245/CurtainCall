import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageCircle, Trash2, ChevronDown, ChevronUp, AlertTriangle, CornerDownRight, Star } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { reviewsApi } from '../../api/reviews'
import { useAuthStore } from '../../store/authStore'
import type { Review, Comment } from '../../types'
import StarRating from '../common/StarRating'

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

  const deleteCommentMutation = useMutation({
    mutationFn: () => reviewsApi.deleteComment(comment.id),
    onSuccess: () => {
      toast.success('댓글이 삭제되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['comments', reviewId] })
    },
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
        <div className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden shrink-0 mt-0.5">
          {comment.userProfileImage && (
            <img src={comment.userProfileImage} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
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
                className="text-xs text-gray-400 hover:text-pink-500 transition-colors px-1"
              >
                답글
              </button>
              {currentUserId === comment.userId && (
                <button
                  onClick={() => { if (confirm('댓글을 삭제하시겠습니까?')) deleteCommentMutation.mutate() }}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-0.5">{comment.content}</p>
        </div>
      </div>

      {/* 답글 입력 */}
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

      {/* 대댓글 목록 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-9 mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex gap-2 group">
              <CornerDownRight size={14} className="text-gray-300 mt-2 shrink-0" />
              <div className="w-6 h-6 rounded-full bg-gray-100 overflow-hidden shrink-0 mt-0.5">
                {reply.userProfileImage && (
                  <img src={reply.userProfileImage} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">{reply.userNickname}</span>
                  {currentUserId === reply.userId && (
                    <button
                      onClick={() => {
                        if (confirm('댓글을 삭제하시겠습니까?')) {
                          reviewsApi.deleteComment(reply.id).then(() => {
                            toast.success('댓글이 삭제되었습니다.')
                            queryClient.invalidateQueries({ queryKey: ['comments', reviewId] })
                          })
                        }
                      }}
                      className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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
    onSuccess: () => { toast.success('리뷰가 삭제되었습니다.'); onUpdated() },
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
        <div className="flex items-center gap-1 text-sm font-bold text-amber-600">
          <Star size={13} className="fill-amber-600" />
          {review.averageScore.toFixed(1)}
        </div>
      </div>

      {/* Detailed scores */}
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

      {/* Content */}
      {review.hasSpoiler && !showSpoiler ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 text-yellow-700 text-sm">
            <AlertTriangle size={14} />
            <span>스포일러가 포함된 리뷰입니다.</span>
            <button onClick={() => setShowSpoiler(true)} className="underline font-medium">보기</button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-700 leading-relaxed mb-3">{review.content}</p>
      )}

      {/* Actions */}
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
            className={`flex items-center gap-1.5 text-sm transition-colors ${review.isLiked ? 'text-pink-600' : 'text-gray-500 hover:text-pink-500'}`}
          >
            <Heart size={14} className={review.isLiked ? 'fill-pink-600' : ''} />
            {review.likeCount}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-600 transition-colors"
          >
            <MessageCircle size={14} />
            {review.commentCount}
            {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
        {user?.id === review.userId && (
          <button
            onClick={() => { if (confirm('리뷰를 삭제하시겠습니까?')) deleteMutation.mutate() }}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Comments */}
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
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="text-sm text-gray-600">댓글 작성은 로그인 후 이용할 수 있어요.</p>
              <button onClick={requireLogin} className="btn-secondary text-sm mt-2">
                로그인하고 댓글 쓰기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
