import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Mail, Lock, Ticket } from 'lucide-react'
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
  const { setAccessToken, setUser } = useAuthStore()
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

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const res = await authApi.login(data.email, data.password)
      setAccessToken(res.accessToken)
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
    <div className="flex min-h-screen bg-warm-50 font-sans">
      {/* Left Side: Brand Imagery (Hidden on mobile) */}
      <div className="relative hidden overflow-hidden bg-brand-900 lg:flex lg:w-1/2">
        {/* Abstract/Dark sophisticated background for a premium feel */}
        <div className="absolute inset-8 rounded-[36px] border border-white/10 bg-white/5" />
        <div className="relative z-10 flex w-full flex-col justify-between p-16">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition group">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium tracking-wide">홈으로 돌아가기</span>
            </Link>
          </div>
          <div className="mb-24">
            <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-white">
              기록은<br />로그인 후 이어집니다.
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-white/70">
              최근 기록과 찜한 공연, 동행 채팅을 이어서 볼 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="relative flex w-full items-center justify-center p-8 sm:p-12 lg:w-1/2 lg:p-16">
        {/* Mobile only back button */}
        <Link to="/" className="lg:hidden absolute top-8 left-8 text-gray-500 hover:text-gray-900">
          <ArrowLeft size={24} />
        </Link>

        <div className="w-full max-w-md rounded-[32px] border border-gray-100 bg-white p-6 shadow-card-md sm:p-8">
          {/* Logo / Header */}
          <div className="mb-10 lg:mb-12 text-center lg:text-left">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white">
              <Ticket size={22} />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-950">로그인</h2>
            <p className="mt-2 text-gray-500 text-sm">저장해 둔 공연과 기록을 이어서 봅니다.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand transition-colors">
                <Mail size={18} />
              </div>
              <input
                type="email"
                placeholder="이메일을 입력하세요"
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all outline-none placeholder:text-gray-400 font-medium"
                {...register('email', {
                  required: '이메일을 입력해주세요',
                  pattern: { value: /^\S+@\S+$/i, message: '올바른 이메일을 입력해주세요' },
                })}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="비밀번호를 입력하세요"
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all outline-none placeholder:text-gray-400 font-medium"
                {...register('password', { required: '비밀번호를 입력해주세요' })}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary mt-2 w-full py-4 disabled:opacity-70"
            >
              {isLoading ? '로그인 중...' : '이메일로 로그인'}
            </button>
          </form>

          <div className="mt-8 relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative bg-white px-4 text-xs font-semibold tracking-wider text-gray-400 uppercase">
              또는
            </div>
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={() => startSocialLogin('/oauth2/authorization/kakao')}
              className="w-full flex items-center justify-center py-4 px-4 bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-bold rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.477 3 2 6.545 2 10.916c0 2.846 1.83 5.344 4.606 6.758-.291 1.09-1.05 3.931-1.076 4.026-.032.115.018.238.109.31.066.052.152.072.235.05.033-.008 3.327-.965 4.61-2.195a12.1 12.1 0 001.516.096c5.523 0 10-3.545 10-7.915S17.523 3 12 3z" />
              </svg>
              카카오계정으로 로그인
            </button>
          </div>

          <p className="mt-10 text-center text-sm text-gray-500">
            아직 계정이 없으신가요?{' '}
            <Link to="/signup" className="font-bold text-brand hover:text-brand-700 hover:underline underline-offset-4 transition-colors">
              회원가입하기
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
