import api from './axios'
import type { Show, PageResponse } from '../types'

interface ShowSearchParams {
  keyword?: string
  genre?: string
  status?: string
  region?: string
  page?: number
  size?: number
}

export const showsApi = {
  search: (params: ShowSearchParams) =>
    api.get<PageResponse<Show>>('/shows', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get<Show>(`/shows/${id}`).then((r) => r.data),

  getOngoing: (limit = 8) =>
    api.get<Show[]>('/shows/ongoing', { params: { limit } }).then((r) => r.data),

  getPopular: (limit = 8) =>
    api.get<Show[]>('/shows/popular', { params: { limit } }).then((r) => r.data),
}
