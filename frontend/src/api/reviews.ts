import api from './axios'
import type { Review, Comment, PageResponse } from '../types'

export interface ReviewCreateRequest {
  storyScore: number
  castScore: number
  directionScore: number
  soundScore: number
  content: string
  hasSpoiler?: boolean
}

export const reviewsApi = {
  getByShow: (showId: number, sort = 'latest', page = 0, size = 10) =>
    api.get<PageResponse<Review>>(`/shows/${showId}/reviews`, { params: { sort, page, size } })
      .then((r) => r.data),

  create: (showId: number, data: ReviewCreateRequest) =>
    api.post<Review>(`/shows/${showId}/reviews`, data).then((r) => r.data),

  update: (reviewId: number, data: ReviewCreateRequest) =>
    api.put<Review>(`/reviews/${reviewId}`, data).then((r) => r.data),

  delete: (reviewId: number) =>
    api.delete(`/reviews/${reviewId}`),

  toggleLike: (reviewId: number) =>
    api.post<{ liked: boolean }>(`/reviews/${reviewId}/like`).then((r) => r.data),

  getComments: (reviewId: number, page = 0, size = 20) =>
    api.get<PageResponse<Comment>>(`/reviews/${reviewId}/comments`, { params: { page, size } })
      .then((r) => r.data),

  createComment: (reviewId: number, content: string, parentId?: number) =>
    api.post<Comment>(`/reviews/${reviewId}/comments`, { content, parentId }).then((r) => r.data),

  deleteComment: (commentId: number) =>
    api.delete(`/comments/${commentId}`),

  getMyReviews: (page = 0, size = 10) =>
    api.get<PageResponse<Review>>('/reviews/my', { params: { page, size } }).then((r) => r.data),
}
