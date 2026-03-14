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
  roomId: number | null;
  showTitle: string;
  liveDate: string;
  messages: ShowLiveMessage[];
}

export const showLiveApi = {
  getRoom: async (showId: number, date?: string): Promise<ShowLiveRoom> => {
    const params = date ? { date } : {};
    const { data } = await api.post<ShowLiveRoom>(`/shows/${showId}/live`, null, { params });
    return data;
  },
};
