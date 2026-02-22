import api from './axios'
import type { Show, PageResponse } from '../types'

export const favoritesApi = {
    toggle: (showId: number) =>
        api.post<{ isFavorited: boolean; favoriteCount: number }>(`/favorites/shows/${showId}`).then((r) => r.data),

    getStatus: (showId: number) =>
        api.get<{ isFavorited: boolean; favoriteCount: number }>(`/favorites/shows/${showId}/status`).then((r) => r.data),

    getMyFavorites: (page = 0, size = 12) =>
        api.get<PageResponse<Show>>('/favorites/my', { params: { page, size } }).then((r) => r.data),
}
