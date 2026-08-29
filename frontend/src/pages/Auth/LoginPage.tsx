import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
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

  const getPostLoginPath = () => fromPath || sessionStorage.getItem('postLoginRedirect') || '/'

  const startSocialLogin = (providerUrl: string) => {
    sessionStorage.setItem('postLoginRedirect', getPostLoginPath())
    window.location.href = providerUrl
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const result = await authApi.login(data.email, data.password)
      setAccessToken(result.accessToken)
      setUser(await authApi.getMe())
      const redirectPath = getPostLoginPath()
      sessionStorage.removeItem('postLoginRedirect')
      toast.success('로그인되었습니다.')
      navigate(redirectPath)
    } catch (error: any) {
      toast.error(error.response?.data?.message || '로그인에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-12 bg-surface-base">
      <div className="w-full max-w-[340px]">
        {/* 로고 및 타이틀 */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-[17px] font-semibold tracking-[-0.055em] text-ink-darkest">
            <span className="grid h-5 w-5 place-items-center bg-brand font-serif text-[13px] text-white">C</span>
            CurtainCall
          </Link>
          <h1 className="mt-4 text-[20px] font-semibold tracking-[-0.05em] text-ink-darker">로그인</h1>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-ink-muted mb-1">이메일</label>
            <input
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              className="w-full h-[38px] border border-line-base bg-surface-base px-3 text-[12px] text-ink-base placeholder:text-ink-lightest focus:border-ink-darkest focus:outline-none transition-colors"
              {...register('email', {
                required: '이메일을 입력해 주세요.',
                pattern: { value: /^\S+@\S+$/i, message: '올바른 이메일 형식이 아닙니다.' },
              })}
            />
            {errors.email && <p className="mt-1 text-[10px] text-brand">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-muted mb-1">비밀번호</label>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="비밀번호 입력"
              className="w-full h-[38px] border border-line-base bg-surface-base px-3 text-[12px] text-ink-base placeholder:text-ink-lightest focus:border-ink-darkest focus:outline-none transition-colors"
              {...register('password', { required: '비밀번호를 입력해 주세요.' })}
            />
            {errors.password && <p className="mt-1 text-[10px] text-brand">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[38px] mt-1 bg-ink-darkest text-white text-[12px] font-semibold hover:bg-brand transition-colors disabled:opacity-50"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 소셜 로그인 */}
        <div className="my-5 flex items-center gap-2">
          <span className="h-px flex-1 bg-line-lighter" />
          <span className="text-[10px] text-ink-lightest">또는</span>
          <span className="h-px flex-1 bg-line-lighter" />
        </div>

        <button
          type="button"
          onClick={() => startSocialLogin('/oauth2/authorization/kakao')}
          className="w-full h-[38px] flex items-center justify-center gap-2 border border-line-base bg-surface-base text-[12px] text-ink-muted hover:border-line-dark hover:text-ink-base transition-colors"
        >
          <span className="h-2 w-2 rounded-full bg-[#FEE500]" />
          카카오 로그인
        </button>

        {/* 회원가입 이동 */}
        <p className="mt-6 text-center text-[11px] text-ink-lighter">
          계정이 없으신가요?{' '}
          <Link to="/signup" className="text-ink-base font-semibold underline underline-offset-4 hover:text-brand">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
