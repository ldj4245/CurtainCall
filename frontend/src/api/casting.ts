import api from './axios';

export interface ActorInfo {
    name: string;
    imageUrl: string | null;
}

export interface CastingRole {
    roleName: string;
    actors: ActorInfo[];
}

export const castingApi = {
    getByShow: async (showId: number): Promise<CastingRole[]> => {
        const { data } = await api.get<CastingRole[]>(`/shows/${showId}/casting`);
        return data;
    },

    refresh: async (showId: number): Promise<void> => {
        await api.post(`/shows/${showId}/casting/refresh`);
    },
};
