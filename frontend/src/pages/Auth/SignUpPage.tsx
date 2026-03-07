import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, User, Mail, Lock, CheckCircle2 } from 'lucide-react'
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
            const res = await authApi.checkEmail(email)
            if (res.duplicate) {
                setError('email', { message: '이미 사용 중인 이메일입니다' })
                setEmailChecked(false)
            } else {
                clearErrors('email')
                setEmailChecked(true)
            }
        } catch {
            // ignore
        }
    }

    const onSubmit = async (data: SignUpForm) => {
        if (emailChecked !== true) {
            toast.error('이메일 중복 확인을 해주세요')
            return
        }
        setIsLoading(true)
        try {
            await authApi.signUp(data.email, data.password, data.nickname)
            toast.success('가입 완료! 로그인해주세요')
            navigate('/login')
        } catch (err: any) {
            toast.error(err.response?.data?.message || '회원가입에 실패했습니다')
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
                    src="https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1920"
                    alt="Theater Seats"
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
                            당신만의 무대,<br />지금 시작됩니다.
                        </h1>
                        <p className="text-lg text-white/70 font-light max-w-md leading-relaxed">
                            수많은 공연의 감동을 선명하게 기록하세요. CurtainCall이 당신의 완벽한 관극 메이트가 되어 드립니다.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side: Signup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 relative bg-white/50 xl:bg-white inset-shadow-sm overflow-y-auto min-h-screen">
                {/* Mobile only back button */}
                <Link to="/" className="lg:hidden absolute top-8 left-8 text-gray-500 hover:text-gray-900">
                    <ArrowLeft size={24} />
                </Link>

                <div className="w-full max-w-md my-auto">
                    {/* Logo / Header */}
                    <div className="mb-10 text-center lg:text-left">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand text-white font-bold text-xl mb-6 shadow-lg shadow-brand/30">
                            C
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">회원가입</h2>
                        <p className="mt-2 text-gray-500 text-sm">3분 만에 가입하고 공연 기록을 시작하세요.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand transition-colors">
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="닉네임 (2~20자)"
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all outline-none placeholder:text-gray-400 font-medium"
                                {...register('nickname', {
                                    required: '닉네임을 입력해주세요',
                                    minLength: { value: 2, message: '닉네임은 2자 이상이어야 합니다' },
                                    maxLength: { value: 20, message: '닉네임은 20자 이하여야 합니다' },
                                })}
                            />
                            {errors.nickname && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.nickname.message}</p>}
                        </div>

                        <div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    placeholder="이메일을 입력하세요"
                                    className={`w-full pl-11 pr-10 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all outline-none placeholder:text-gray-400 font-medium ${errors.email ? '!border-red-400 !focus:ring-red-400/20' : emailChecked === true ? '!border-emerald-400 !focus:ring-emerald-400/20' : ''}`}
                                    {...register('email', {
                                        required: '이메일을 입력해주세요',
                                        pattern: { value: /^\S+@\S+$/i, message: '올바른 이메일 형식이 아닙니다' },
                                        onChange: () => setEmailChecked(null),
                                        onBlur: (e) => checkEmail(e.target.value),
                                    })}
                                />
                                {emailChecked === true && !errors.email && (
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                        <CheckCircle2 size={18} className="text-emerald-500" />
                                    </div>
                                )}
                            </div>
                            {errors.email && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.email.message}</p>}
                            {emailChecked === true && !errors.email && <p className="text-emerald-500 text-xs mt-1.5 ml-1 font-medium">사용 가능한 이메일입니다</p>}
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand transition-colors">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                placeholder="비밀번호 (8~20자)"
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all outline-none placeholder:text-gray-400 font-medium"
                                {...register('password', {
                                    required: '비밀번호를 입력해주세요',
                                    minLength: { value: 8, message: '비밀번호는 8자 이상이어야 합니다' },
                                    maxLength: { value: 20, message: '비밀번호는 20자 이하여야 합니다' },
                                    onChange: () => trigger('passwordConfirm'),
                                })}
                            />
                            {errors.password && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.password.message}</p>}
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand transition-colors">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                placeholder="비밀번호 확인"
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all outline-none placeholder:text-gray-400 font-medium"
                                {...register('passwordConfirm', {
                                    required: '비밀번호를 다시 입력해주세요',
                                    validate: (value) => value === password || '비밀번호가 일치하지 않습니다',
                                })}
                            />
                            {errors.passwordConfirm && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.passwordConfirm.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-4 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold shadow-xl shadow-gray-900/10 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
                        >
                            {isLoading ? '가입 처리 중...' : '회원가입하기'}
                        </button>
                    </form>

                    <p className="mt-10 text-center text-sm text-gray-500">
                        이미 계정이 있으신가요?{' '}
                        <Link to="/login" className="font-bold text-brand hover:text-brand-dark hover:underline underline-offset-4 transition-colors">
                            로그인하기
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
