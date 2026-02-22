import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

interface LoginForm {
  email: string
  password: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setTokens, setUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname

  const getPostLoginPath = () => {
    const stored = sessionStorage.getItem('postLoginRedirect')
    return fromPath || stored || '/'
  }

  const startSocialLogin = (providerUrl: string) => {
    sessionStorage.setItem('postLoginRedirect', getPostLoginPath())
    window.location.href = providerUrl
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/')
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const res = await authApi.login(data.email, data.password)
      setTokens(res.accessToken, res.refreshToken)
      const user = await authApi.getMe()
      setUser(user)
      toast.success('로그인 성공!')
      const redirectPath = getPostLoginPath()
      sessionStorage.removeItem('postLoginRedirect')
      navigate(redirectPath)
    } catch (err: any) {
      toast.error(err.response?.data?.message || '로그인에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            뒤로가기
          </button>
          <Link to="/" className="text-sm font-semibold text-gray-900">
            CurtainCall 홈
          </Link>
        </div>
      </header>
      <div className="flex items-center justify-center p-4 pt-10">
        <div className="bg-white rounded-2xl shadow-card-md border border-gray-100 p-8 w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white text-sm font-bold">
              C
            </div>
            <h1 className="text-2xl font-bold text-gray-900">로그인</h1>
            <p className="text-gray-400 mt-2 text-sm">CurtainCall 계정으로 서비스를 이용하세요</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-6">
            <div>
              <input
                type="email"
                placeholder="이메일"
                className="input-field"
                {...register('email', {
                  required: '이메일을 입력해주세요',
                  pattern: { value: /^\S+@\S+$/i, message: '올바른 이메일을 입력해주세요' },
                })}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <input
                type="password"
                placeholder="비밀번호"
                className="input-field"
                {...register('password', { required: '비밀번호를 입력해주세요' })}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="text-center mb-4">
            <span className="text-sm text-gray-400">
              계정이 없으신가요?{' '}
              <Link to="/signup" className="text-brand font-semibold hover:underline">
                회원가입
              </Link>
            </span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">또는</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => startSocialLogin('/oauth2/authorization/kakao')}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#FEE500] text-[#191919] font-semibold text-sm hover:brightness-95 transition"
            >
              카카오로 시작하기
            </button>
            <button
              type="button"
              onClick={() => startSocialLogin('/oauth2/authorization/naver')}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#03C75A] text-white font-semibold text-sm hover:brightness-95 transition"
            >
              네이버로 시작하기
            </button>
            <button
              type="button"
              onClick={() => startSocialLogin('/oauth2/authorization/google')}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition"
            >
              Google로 시작하기
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            로그인 시 서비스 이용약관에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
