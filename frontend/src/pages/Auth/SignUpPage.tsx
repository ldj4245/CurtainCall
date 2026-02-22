import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft } from 'lucide-react'
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
    const { register, handleSubmit, watch, setError, clearErrors, formState: { errors } } = useForm<SignUpForm>()
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
        if (emailChecked === false) {
            toast.error('이메일 중복을 확인해주세요')
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

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1)
            return
        }
        navigate('/')
    }

    return (
        <div className="min-h-screen bg-white">
            <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
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
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="mx-auto mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-bold">
                        C
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">회원가입</h1>
                    <p className="text-gray-500 mt-2 text-sm">3분 만에 가입하고 공연 기록을 시작하세요</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder="닉네임 (2~20자)"
                            className="input-field"
                            {...register('nickname', {
                                required: '닉네임을 입력해주세요',
                                minLength: { value: 2, message: '닉네임은 2자 이상이어야 합니다' },
                                maxLength: { value: 20, message: '닉네임은 20자 이하여야 합니다' },
                            })}
                        />
                        {errors.nickname && <p className="text-red-500 text-xs mt-1 ml-1">{errors.nickname.message}</p>}
                    </div>

                    <div>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="이메일"
                                className={`input-field ${errors.email ? '!border-red-400' : emailChecked === true ? '!border-emerald-400' : ''}`}
                                {...register('email', {
                                    required: '이메일을 입력해주세요',
                                    pattern: { value: /^\S+@\S+$/i, message: '올바른 이메일 형식이 아닙니다' },
                                    onBlur: (e) => checkEmail(e.target.value),
                                })}
                            />
                            {emailChecked === true && !errors.email && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-sm">✓</span>
                            )}
                        </div>
                        {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>}
                        {emailChecked === true && !errors.email && <p className="text-emerald-500 text-xs mt-1 ml-1">사용 가능한 이메일입니다</p>}
                    </div>

                    <div>
                        <input
                            type="password"
                            placeholder="비밀번호 (8~20자)"
                            className="input-field"
                            {...register('password', {
                                required: '비밀번호를 입력해주세요',
                                minLength: { value: 8, message: '비밀번호는 8자 이상이어야 합니다' },
                                maxLength: { value: 20, message: '비밀번호는 20자 이하여야 합니다' },
                            })}
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>}
                    </div>

                    <div>
                        <input
                            type="password"
                            placeholder="비밀번호 확인"
                            className="input-field"
                            {...register('passwordConfirm', {
                                required: '비밀번호를 다시 입력해주세요',
                                validate: (value) => value === password || '비밀번호가 일치하지 않습니다',
                            })}
                        />
                        {errors.passwordConfirm && <p className="text-red-500 text-xs mt-1 ml-1">{errors.passwordConfirm.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full btn-primary py-3"
                    >
                        {isLoading ? '가입 중...' : '가입하기'}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <span className="text-sm text-gray-500">
                        이미 계정이 있으신가요?{' '}
                        <Link to="/login" className="text-gray-900 font-semibold hover:underline">
                            로그인
                        </Link>
                    </span>
                </div>
            </div>
            </div>
        </div>
    )
}
