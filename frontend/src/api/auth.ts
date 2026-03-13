import api from './axios'
import type { User } from '../types'

export interface TokenResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
}

export const authApi = {
  getMe: () => api.get<User>('/users/me').then((r) => r.data),
  updateNickname: (nickname: string) =>
    api.patch<User>('/users/me/nickname', { nickname }).then((r) => r.data),
  logout: () => api.post('/auth/logout'),

  login: (email: string, password: string) =>
    api.post<TokenResponse>('/auth/login', { email, password }).then((r) => r.data),

  signUp: (email: string, password: string, nickname: string) =>
    api.post<TokenResponse>('/auth/signup', { email, password, nickname }).then((r) => r.data),

  refresh: () => api.post<TokenResponse>('/auth/refresh').then((r) => r.data),

  exchangeOAuth2Code: (code: string) =>
    api.post<TokenResponse>('/auth/oauth2/exchange', { code }).then((r) => r.data),

  checkEmail: (email: string) =>
    api.get<{ duplicate: boolean }>('/auth/check-email', { params: { email } }).then((r) => r.data),
}

export const OAUTH2_PROVIDERS = {
  kakao: '/oauth2/authorization/kakao',
  naver: '/oauth2/authorization/naver',
  google: '/oauth2/authorization/google',
} as const
