import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { reviewsApi, type ReviewCreateRequest } from '../../api/reviews'
import StarRating from '../common/StarRating'

interface Props {
  showId: number
  onSubmitted: () => void
  onCancel: () => void
}

const SCORE_LABELS = [
  { key: 'storyScore', label: '스토리' },
  { key: 'castScore', label: '캐스팅' },
  { key: 'directionScore', label: '연출' },
  { key: 'soundScore', label: '음향' },
] as const

export default function ReviewForm({ showId, onSubmitted, onCancel }: Props) {
  const [scores, setScores] = useState({ storyScore: 5, castScore: 5, directionScore: 5, soundScore: 5 })

  const { register, handleSubmit, formState: { errors } } = useForm<ReviewCreateRequest>({
    defaultValues: { content: '', hasSpoiler: false },
  })

  const mutation = useMutation({
    mutationFn: (data: ReviewCreateRequest) =>
      reviewsApi.create(showId, { ...data, ...scores }),
    onSuccess: () => { toast.success('리뷰가 등록되었습니다!'); onSubmitted() },
    onError: (e: any) => toast.error(e.response?.data?.message || '리뷰 등록에 실패했습니다.'),
  })

  return (
    <div className="border border-[#e5e8ee] bg-white p-5 sm:p-6">
      <p className="page-kicker">Write a review</p>
      <h3 className="mb-5 mt-1 text-[20px] font-semibold tracking-[-0.035em] text-[#172033]">후기 작성</h3>
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div className="grid grid-cols-2 divide-x divide-y divide-[#e5e8ee] border border-[#e5e8ee] md:grid-cols-4 md:divide-y-0">
          {SCORE_LABELS.map(({ key, label }) => (
            <div key={key} className="py-3 text-center">
              <p className="mb-1 text-[12px] font-medium text-[#697386]">{label}</p>
              <StarRating value={scores[key]} onChange={(v) => setScores((s) => ({ ...s, [key]: v }))} size="sm" />
            </div>
          ))}
        </div>

        <textarea
          {...register('content', { required: '리뷰 내용을 입력해주세요.', minLength: { value: 10, message: '10자 이상 작성해주세요.' } })}
          rows={4}
          placeholder="공연을 보고 남기고 싶은 감상을 적어 주세요."
          className="min-h-[124px] w-full resize-none rounded-md border border-[#d9dee7] bg-[#fafafb] px-3.5 py-3 text-[13px] leading-6 text-[#172033] placeholder:text-[#98a2b3] focus:border-[#aeb7c5] focus:bg-white focus:outline-none"
        />
        {errors.content && <p className="text-[12px] text-[#c53b4b]">{errors.content.message}</p>}

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#697386]">
            <input type="checkbox" {...register('hasSpoiler')} className="accent-[#172033]" />
            스포일러 포함
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="btn-secondary">취소</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending ? '등록 중' : '후기 등록'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
