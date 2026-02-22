import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/auth'

export default function OAuth2Callback() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const accessToken = params.get('accessToken')
    const refreshToken = params.get('refreshToken')

    if (!accessToken || !refreshToken) {
      navigate('/login')
      return
    }

    setTokens(accessToken, refreshToken)

    authApi.getMe()
      .then((user) => {
        setUser(user)
        const redirectPath = sessionStorage.getItem('postLoginRedirect') || '/'
        sessionStorage.removeItem('postLoginRedirect')
        navigate(redirectPath)
      })
      .catch(() => navigate('/login'))
  }, [navigate, setTokens, setUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
        <p className="text-gray-600 text-sm">로그인 정보를 확인하고 있습니다...</p>
      </div>
    </div>
  )
}
