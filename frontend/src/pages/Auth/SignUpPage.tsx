import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
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
  const [emailChecked, setEmailChecked] = useState<boolean | null>(null)
  const { register, handleSubmit, watch, setError, clearErrors, trigger, formState: { errors } } = useForm<SignUpForm>()
  const password = watch('password')

  const checkEmail = async (email: string) => {
    if (!email || !/^\S+@\S+$/i.test(email)) return
    try {
      const response = await authApi.checkEmail(email)
      if (response.duplicate) {
        setError('email', { message: '이미 사용 중인 이메일입니다.' })
        setEmailChecked(false)
      } else {
        clearErrors('email')
        setEmailChecked(true)
      }
    } catch {
      setEmailChecked(null)
    }
  }

  const onSubmit = async (data: SignUpForm) => {
    if (emailChecked !== true) {
      toast.error('이메일 중복 확인이 필요합니다.')
      return
    }
    setIsLoading(true)
    try {
      await authApi.signUp(data.email, data.password, data.nickname)
      toast.success('회원가입이 완료되었습니다. 로그인해 주세요.')
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
            <span className="grid h-5 w-5 place-items-center bg-brand font-serif text-[13px] text-white">C</span>
            CurtainCall
          </Link>
          <h1 className="mt-4 text-[20px] font-semibold tracking-[-0.05em] text-ink-darker">회원가입</h1>
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
                onChange: () => setEmailChecked(null),
                onBlur: (e) => { void checkEmail(e.target.value) },
              })}
            />
            {errors.email ? (
              <p className="mt-1 text-[10px] text-brand">{errors.email.message}</p>
            ) : emailChecked === true ? (
              <p className="mt-1 text-[10px] text-emerald-600">사용 가능한 이메일입니다.</p>
            ) : null}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-muted mb-1">닉네임</label>
            <input
              type="text"
              placeholder="2~20자"
              className="w-full h-[38px] border border-line-base bg-surface-base px-3 text-[12px] text-ink-base placeholder:text-ink-lightest focus:border-ink-darkest focus:outline-none transition-colors"
              {...register('nickname', {
                required: '닉네임을 입력해 주세요.',
                minLength: { value: 2, message: '닉네임은 2자 이상이어야 합니다.' },
                maxLength: { value: 20, message: '닉네임은 20자 이하여야 합니다.' },
              })}
            />
            {errors.nickname && <p className="mt-1 text-[10px] text-brand">{errors.nickname.message}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-muted mb-1">비밀번호</label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="8자 이상"
              className="w-full h-[38px] border border-line-base bg-surface-base px-3 text-[12px] text-ink-base placeholder:text-ink-lightest focus:border-ink-darkest focus:outline-none transition-colors"
              {...register('password', {
                required: '비밀번호를 입력해 주세요.',
                minLength: { value: 8, message: '비밀번호는 8자 이상이어야 합니다.' },
                maxLength: { value: 20, message: '비밀번호는 20자 이하여야 합니다.' },
                onChange: () => { void trigger('passwordConfirm') },
              })}
            />
            {errors.password && <p className="mt-1 text-[10px] text-brand">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-muted mb-1">비밀번호 확인</label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="비밀번호 재입력"
              className="w-full h-[38px] border border-line-base bg-surface-base px-3 text-[12px] text-ink-base placeholder:text-ink-lightest focus:border-ink-darkest focus:outline-none transition-colors"
              {...register('passwordConfirm', {
                required: '비밀번호를 다시 입력해 주세요.',
                validate: (value) => value === password || '비밀번호가 일치하지 않습니다.',
              })}
            />
            {errors.passwordConfirm && <p className="mt-1 text-[10px] text-brand">{errors.passwordConfirm.message}</p>}
          </div>

          <p className="pt-2 text-[10px] text-ink-lightest leading-relaxed">
            가입 시 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[38px] mt-2 bg-ink-darkest text-white text-[12px] font-semibold hover:bg-brand transition-colors disabled:opacity-50"
          >
            {isLoading ? '가입 중...' : '가입하기'}
          </button>
        </form>

        {/* 로그인 이동 */}
        <p className="mt-6 text-center text-[11px] text-ink-lighter">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-ink-base font-semibold underline underline-offset-4 hover:text-brand">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
