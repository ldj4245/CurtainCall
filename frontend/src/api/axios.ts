import axios, { AxiosHeaders, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'
import type { TokenResponse } from './auth'

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

const defaultConfig = {
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
}

const api = axios.create(defaultConfig)
const sessionClient = axios.create(defaultConfig)

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

async function resetSession() {
  try {
    await sessionClient.post('/auth/logout')
  } catch {
    // 로그아웃 정리 요청이 실패해도 로컬 세션은 정리합니다.
  }

  useAuthStore.getState().logout()

  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined
    const url = originalRequest?.url ?? ''

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || url.startsWith('/auth/')) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      const { data } = await sessionClient.post<TokenResponse>('/auth/refresh')
      useAuthStore.getState().setAccessToken(data.accessToken)

      originalRequest.headers = AxiosHeaders.from(originalRequest.headers)
      originalRequest.headers.set('Authorization', `Bearer ${data.accessToken}`)

      return api(originalRequest)
    } catch (refreshError) {
      await resetSession()
      return Promise.reject(refreshError)
    }
  }
)

export default api
