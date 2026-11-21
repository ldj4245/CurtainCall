import api from './axios'
import type { DiaryEntry, DiarySnippet, PageResponse } from '../types'

export interface ViewingPlan {
  id: number; showId: number; showTitle: string; posterUrl?: string; theaterName?: string
  watchedDate: string; watchedTime?: string; seatInfo?: string; memo?: string; reminder: boolean; diaryId?: number
}
export type PlanInput = Pick<ViewingPlan, 'showId' | 'watchedDate' | 'watchedTime' | 'seatInfo' | 'memo' | 'reminder'>
export interface Preferences { plans: boolean; favorites: boolean; replies: boolean; monthly: boolean }
export interface Notice { id: number; title: string; path: string; seen: boolean; createdAt: string }
export interface MonthSummary { month: string; count: number; totalSpent: number; averageRating: number; entries: DiaryEntry[] }
export const retentionApi = {
  plans: () => api.get<ViewingPlan[]>('/plans').then(r => r.data),
  savePlan: (data: PlanInput, id?: number) => (id ? api.put<ViewingPlan>(`/plans/${id}`, data) : api.post<ViewingPlan>('/plans', data)).then(r => r.data),
  deletePlan: (id: number) => api.delete(`/plans/${id}`),
  notices: () => api.get<Notice[]>('/notifications').then(r => r.data),
  seen: (id: number) => api.put(`/notifications/${id}/seen`),
  preferences: () => api.get<Preferences>('/notifications/preferences').then(r => r.data),
  savePreferences: (data: Preferences) => api.put('/notifications/preferences', data),
  month: (year: number, month: number) => api.get<MonthSummary>('/diary/me/month', { params: { year, month } }).then(r => r.data),
  share: (id: number) => api.post<{ path: string }>(`/diary/${id}/share`).then(r => r.data),
  shared: (token: string) => api.get<DiaryEntry>(`/shared/${token}`).then(r => r.data),
  records: (showId: number, page = 0, seatsOnly = false, seat = '') =>
    api.get<PageResponse<DiarySnippet>>(`/shows/${showId}/public-records`, { params: { page, size: 10, seatsOnly, seat } }).then(r => r.data),
}
