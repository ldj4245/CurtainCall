import api from './axios'
import type {
  CommunityCategory,
  CommunityComment,
  CommunityLikeResult,
  CommunityPostDetail,
  CommunityPostSummary,
  PageResponse,
} from '../types'

export interface CommunityPostListParams {
  category?: string
  showId?: number
  keyword?: string
  sort?: 'latest' | 'likes'
  page?: number
  size?: number
}

export interface CommunityPostPayload {
  category: CommunityCategory
  showId?: number | null
  title: string
  content: string
}

export const communityApi = {
  getPosts: (params: CommunityPostListParams) =>
    api.get<PageResponse<CommunityPostSummary>>('/community/posts', { params }).then((r) => r.data),

  getMyPosts: (page = 0, size = 10) =>
    api.get<PageResponse<CommunityPostSummary>>('/community/posts/my', { params: { page, size } }).then((r) => r.data),

  getPost: (postId: number, countView = true) =>
    api.get<CommunityPostDetail>(`/community/posts/${postId}`, { params: { countView } }).then((r) => r.data),

  createPost: (payload: CommunityPostPayload) =>
    api.post<CommunityPostDetail>('/community/posts', payload).then((r) => r.data),

  updatePost: (postId: number, payload: CommunityPostPayload) =>
    api.put<CommunityPostDetail>(`/community/posts/${postId}`, payload).then((r) => r.data),

  deletePost: (postId: number) =>
    api.delete(`/community/posts/${postId}`),

  toggleLike: (postId: number) =>
    api.post<CommunityLikeResult>(`/community/posts/${postId}/like`).then((r) => r.data),

  getComments: (postId: number, page = 0, size = 20) =>
    api.get<PageResponse<CommunityComment>>(`/community/posts/${postId}/comments`, { params: { page, size } })
      .then((r) => r.data),

  createComment: (postId: number, content: string, parentId?: number) =>
    api.post<CommunityComment>(`/community/posts/${postId}/comments`, { content, parentId }).then((r) => r.data),

  deleteComment: (commentId: number) =>
    api.delete(`/community/comments/${commentId}`),
}
