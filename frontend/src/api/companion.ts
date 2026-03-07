import api from './axios';

export interface CompanionParticipant {
    id: number;
    userId: number;
    nickname: string;
    profileImage: string | null;
    joinedAt: string;
}

export interface CompanionPost {
    id: number;
    showId: number;
    showTitle: string;
    authorId: number;
    authorNickname: string;
    authorProfileImage: string | null;
    title: string;
    content: string;
    performanceDate: string;
    performanceTime: string;
    maxMembers: number;
    currentMembers: number;
    seatInfo: string;
    status: 'OPEN' | 'CLOSED' | 'EXPIRED';
    createdAt: string;
    participants: CompanionParticipant[];
    chatRoomId: number | null;
}

export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}

export interface CompanionPostRequest {
    title: string;
    content: string;
    performanceDate: string;
    performanceTime: string;
    maxMembers: number;
    seatInfo: string;
}

export const companionApi = {
    getCompanions: async (
        showId: number,
        page: number = 0,
        onlyOpen: boolean = false
    ): Promise<PageResponse<CompanionPost>> => {
        const { data } = await api.get<PageResponse<CompanionPost>>(`/shows/${showId}/companions`, {
            params: { page, size: 5, onlyOpen }
        });
        return data;
    },

    getRecentCompanions: async (): Promise<PageResponse<CompanionPost>> => {
        const { data } = await api.get<PageResponse<CompanionPost>>(`/companions/recent`);
        return data;
    },

    createCompanion: async (showId: number, request: CompanionPostRequest): Promise<number> => {
        const { data } = await api.post<number>(`/shows/${showId}/companions`, request);
        return data;
    },

    joinCompanion: async (id: number): Promise<void> => {
        await api.post(`/companions/${id}/join`);
    },

    cancelJoin: async (id: number): Promise<void> => {
        await api.delete(`/companions/${id}/join`);
    },

    closeCompanion: async (id: number): Promise<void> => {
        await api.patch(`/companions/${id}/close`);
    },

    deleteCompanion: async (id: number): Promise<void> => {
        await api.delete(`/companions/${id}`);
    }
};
