import api from './axios'

export interface AdminSystemStats {
  currentTime: string
  totalShows: number
  ongoingShows: number
  upcomingShows: number
  endedShows: number
  totalTheaters: number
  totalUsers: number
  totalDiaries: number
  estimatedDbUsageMb: string
  lastSyncTime: string
  lastSyncStatus: string
}

export const adminApi = {
  getStats: () => api.get<AdminSystemStats>('/admin/system-stats').then((r) => r.data),
  syncStatusRankings: () => api.post<{ message: string }>('/admin/sync/status-rankings').then((r) => r.data),
  syncShows: (months: number = 3) => api.post<{ message: string }>('/admin/sync/shows', null, { params: { months } }).then((r) => r.data),
  pruneEnded: (daysAfterEnd: number = 30) => api.post<{ message: string; deletedCount: number }>('/admin/prune-ended', null, { params: { daysAfterEnd } }).then((r) => r.data),
}
