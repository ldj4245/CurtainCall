import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../../api/auth'

interface SignUpForm {
  nickname: string
  email: string
  password: string
  passwordConfirm: string
}

export default function SignUpPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [emailChecked, setEmailChecked] = useState<boolean | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  const { register, handleSubmit, watch, setError, clearErrors, trigger, formState: { errors } } = useForm<SignUpForm>()
  const password = watch('password')
  const emailValue = watch('email')

  const checkEmail = async (email: string) => {
    if (!email || !/^\S+@\S+$/i.test(email)) {
      setError('email', { message: '올바른 이메일 형식을 입력해 주세요.' })
      return false
    }
    setIsCheckingEmail(true)
    try {
      const response = await authApi.checkEmail(email)
      if (response.duplicate) {
        setError('email', { message: '이미 사용 중인 이메일입니다.' })
        setEmailChecked(false)
        return false
      } else {
        clearErrors('email')
        setEmailChecked(true)
        toast.success('사용 가능한 이메일입니다.')
        return true
      }
    } catch {
      setError('email', { message: '중복 확인에 실패했습니다. 다시 시도해 주세요.' })
      setEmailChecked(null)
      return false
    } finally {
      setIsCheckingEmail(false)
    }
  }

  const onSubmit = async (data: SignUpForm) => {
    // 제출 시 아직 중복 확인이 안 되었다면 자동 실행
    if (emailChecked !== true) {
      const isAvailable = await checkEmail(data.email)
      if (!isAvailable) return
    }

    setIsLoading(true)
    try {
      await authApi.signUp(data.email, data.password, data.nickname)
      toast.success('회원가입이 완료되었습니다! 로그인해 주세요.')
      navigate('/login')
    } catch (error: any) {
      toast.error(error.response?.data?.message || '회원가입에 실패했습니다.')
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
            <span className="grid h-5 w-5 place-items-center bg-brand font-serif text-[13px] text-white rounded-[2px]">C</span>
            CurtainCall
          </Link>
          <h1 className="mt-4 text-[20px] font-semibold tracking-tight text-ink-darker">회원가입</h1>
          <p className="mt-1 text-[12px] text-ink-muted">나만의 관극 다이어리를 시작해 보세요.</p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-ink-muted mb-1">이메일</label>
            <div className="flex gap-2">
              <input
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                className="flex-1 h-10 border border-line-base bg-surface-base px-3 text-[12.5px] text-ink-base rounded placeholder:text-ink-lighter focus:border-ink-darkest focus:bg-white focus:outline-none transition-colors"
                {...register('email', {
                  required: '이메일을 입력해 주세요.',
                  pattern: { value: /^\S+@\S+$/i, message: '올바른 이메일 형식이 아닙니다.' },
                  onChange: () => setEmailChecked(null),
                })}
              />
              <button
                type="button"
                onClick={() => checkEmail(emailValue)}
                disabled={isCheckingEmail || !emailValue}
                className="h-10 px-3 border border-line-base bg-white rounded text-[11px] font-semibold text-ink-muted hover:text-ink-darkest hover:border-line-dark disabled:opacity-50 transition-colors shrink-0"
              >
                {isCheckingEmail ? <Loader2 size={13} className="animate-spin" /> : '중복 확인'}
              </button>
            </div>
            {errors.email ? (
              <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.email.message}</p>
            ) : emailChecked === true ? (
              <p className="mt-1 text-[11px] text-emerald-600 font-medium">사용 가능한 이메일입니다.</p>
            ) : null}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-ink-muted mb-1">닉네임</label>
            <input
              type="text"
              placeholder="2~20자"
              className="w-full h-10 border border-line-base bg-surface-base px-3 text-[12.5px] text-ink-base rounded placeholder:text-ink-lighter focus:border-ink-darkest focus:bg-white focus:outline-none transition-colors"
              {...register('nickname', {
                required: '닉네임을 입력해 주세요.',
                minLength: { value: 2, message: '닉네임은 2자 이상이어야 합니다.' },
                maxLength: { value: 20, message: '닉네임은 20자 이하여야 합니다.' },
              })}
            />
            {errors.nickname && <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.nickname.message}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-ink-muted mb-1">비밀번호</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="8자 이상 영문/숫자"
                className="w-full h-10 border border-line-base bg-surface-base pl-3 pr-9 text-[12.5px] text-ink-base rounded placeholder:text-ink-lighter focus:border-ink-darkest focus:bg-white focus:outline-none transition-colors"
                {...register('password', {
                  required: '비밀번호를 입력해 주세요.',
                  minLength: { value: 8, message: '비밀번호는 8자 이상이어야 합니다.' },
                  maxLength: { value: 20, message: '비밀번호는 20자 이하여야 합니다.' },
                  onChange: () => { void trigger('passwordConfirm') },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-lightest hover:text-ink-dark transition-colors"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-ink-muted mb-1">비밀번호 확인</label>
            <div className="relative">
              <input
                type={showPasswordConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="비밀번호 재입력"
                className="w-full h-10 border border-line-base bg-surface-base pl-3 pr-9 text-[12.5px] text-ink-base rounded placeholder:text-ink-lighter focus:border-ink-darkest focus:bg-white focus:outline-none transition-colors"
                {...register('passwordConfirm', {
                  required: '비밀번호를 다시 입력해 주세요.',
                  validate: (value) => value === password || '비밀번호가 일치하지 않습니다.',
                })}
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-lightest hover:text-ink-dark transition-colors"
                aria-label={showPasswordConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPasswordConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.passwordConfirm && <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.passwordConfirm.message}</p>}
          </div>

          <p className="pt-2 text-[10.5px] text-ink-lightest leading-relaxed">
            가입 시 CurtainCall의 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 mt-2 bg-brand text-white text-[13px] font-semibold rounded hover:bg-brand/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : '가입하기'}
          </button>
        </form>

        {/* 로그인 이동 */}
        <p className="mt-6 text-center text-[11px] text-ink-muted">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-ink-darkest font-semibold underline underline-offset-4 hover:text-brand">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
