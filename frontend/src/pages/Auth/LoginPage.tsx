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
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Side: Brand Imagery (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-brand">
        {/* Abstract/Dark sophisticated background for a premium feel */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand to-rose-900 opacity-90 mix-blend-multiply" />
        <img
          src="https://images.pexels.com/photos/713149/pexels-photo-713149.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt="Theater Stage"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
        />
        <div className="relative z-10 w-full p-16 flex flex-col justify-between">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition group">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium tracking-wide">홈으로 돌아가기</span>
            </Link>
          </div>
          <div className="mb-24">
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
              무대의 감동을<br />나눌 시간입니다.
            </h1>
            <p className="text-lg text-white/70 font-light max-w-md leading-relaxed">
              CurtainCall에 오신 것을 환영합니다. 당신의 첫 번째 관극 기록부터 맞춤형 추천까지, 모든 여정이 여기서 시작됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 relative bg-white/50 xl:bg-white inset-shadow-sm">
        {/* Mobile only back button */}
        <Link to="/" className="lg:hidden absolute top-8 left-8 text-gray-500 hover:text-gray-900">
          <ArrowLeft size={24} />
        </Link>

        <div className="w-full max-w-md">
          {/* Logo / Header */}
          <div className="mb-10 lg:mb-12 text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand text-white mb-6 shadow-lg shadow-brand/30">
              <Ticket size={22} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">다시 오셨군요!</h2>
            <p className="mt-2 text-gray-500 text-sm">계정에 로그인하고 나만의 기록을 남겨보세요.</p>
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
              className="w-full mt-2 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold shadow-xl shadow-gray-900/10 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
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
            <Link to="/signup" className="font-bold text-brand hover:text-brand-dark hover:underline underline-offset-4 transition-colors">
              회원가입하기
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
