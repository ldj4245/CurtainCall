import api from './axios';

export interface ChatRoom {
  id: number;
  companionPostId: number;
  companionPostTitle: string;
  showTitle: string;
  showPosterUrl: string | null;
  performanceDate: string;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  senderNickname: string;
  senderProfileImage: string | null;
  content: string;
  type: 'ENTER' | 'TALK' | 'LEAVE';
  createdAt: string;
}

export const chatApi = {
  getMyRooms: async (): Promise<ChatRoom[]> => {
    const { data } = await api.get<ChatRoom[]>('/chat/rooms');
    return data;
  },

  getMessages: async (roomId: number): Promise<ChatMessage[]> => {
    const { data } = await api.get<ChatMessage[]>(`/chat/rooms/${roomId}/messages`);
    return data;
  },
};
