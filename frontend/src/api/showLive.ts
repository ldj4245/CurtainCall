import api from './axios';

export interface ShowLiveMessage {
  id: number;
  roomId: number;
  senderId: number;
  senderNickname: string;
  senderProfileImage: string | null;
  content: string;
  createdAt: string;
}

export interface ShowLiveRoom {
  roomId: number;
  showTitle: string;
  liveDate: string;
  messages: ShowLiveMessage[];
}

export const showLiveApi = {
  getRoom: async (showId: number, date?: string): Promise<ShowLiveRoom> => {
    const params = date ? { date } : {};
    const { data } = await api.get<ShowLiveRoom>(`/shows/${showId}/live`, { params });
    return data;
  },
};
