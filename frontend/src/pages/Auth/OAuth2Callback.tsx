import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

export default function OAuth2Callback() {
  const navigate = useNavigate()
  const { setAccessToken, setUser, logout } = useAuthStore()
  const processedRef = useRef(false)

  useEffect(() => {
    if (processedRef.current) return
    processedRef.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    if (error) {
      toast.error('소셜 로그인이 취소되었습니다.')
      navigate('/login', { replace: true })
      return
    }

    if (!code) {
      navigate('/login', { replace: true })
      return
    }

    authApi.exchangeOAuth2Code(code)
      .then(({ accessToken }) => {
        setAccessToken(accessToken)
        return authApi.getMe()
      })
      .then((user) => {
        setUser(user)
        const redirectPath = sessionStorage.getItem('postLoginRedirect') || '/'
        sessionStorage.removeItem('postLoginRedirect')
        toast.success(`${user.nickname || '회원'}님, 반갑습니다!`)
        navigate(redirectPath, { replace: true })
      })
      .catch((err) => {
        console.error('OAuth exchange error', err)
        logout()
        toast.error('소셜 로그인 처리에 실패했습니다.')
        navigate('/login', { replace: true })
      })
  }, [logout, navigate, setAccessToken, setUser])

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-base px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-line-base border-t-brand" />
        <h2 className="text-[15px] font-semibold text-ink-darkest">로그인 처리 중</h2>
        <p className="mt-1 text-[12px] text-ink-muted">잠시만 기다려 주세요.</p>
      </div>
    </main>
  )
}
