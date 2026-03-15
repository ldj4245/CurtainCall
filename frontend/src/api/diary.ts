import api from './axios'
import type { DiaryEntry, DiarySnippetResponse, DiaryStats, PageResponse } from '../types'

export interface DiaryCreateRequest {
  showId: number
  watchedDate: string
  seatInfo?: string
  castMemo?: string
  rating: number
  comment?: string
  ticketPrice?: number
  isOpen?: boolean
  photoUrls?: string[]
}

export const diaryApi = {
  getMyDiary: (page = 0, size = 10) =>
    api.get<PageResponse<DiaryEntry>>('/diary/me', { params: { page, size } }).then((r) => r.data),

  getCalendar: (year: number, month: number) =>
    api.get<DiaryEntry[]>('/diary/me/calendar', { params: { year, month } }).then((r) => r.data),

  getStats: () =>
    api.get<DiaryStats>('/diary/me/stats').then((r) => r.data),

  getPublicSnippets: (showId: number, size = 3) =>
    api.get<DiarySnippetResponse>(`/shows/${showId}/diary-snippets`, { params: { size } }).then((r) => r.data),

  create: (data: DiaryCreateRequest) =>
    api.post<DiaryEntry>('/diary', data).then((r) => r.data),

  update: (id: number, data: DiaryCreateRequest) =>
    api.put<DiaryEntry>(`/diary/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/diary/${id}`).then((r) => r.data),

  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<{ url: string }>('/diary/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.url)
  },
}
