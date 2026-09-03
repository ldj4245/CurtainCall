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

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ReviewCreateRequest>({
    defaultValues: { content: '', hasSpoiler: false },
  })

  const contentVal = watch('content') || ''

  const mutation = useMutation({
    mutationFn: (data: ReviewCreateRequest) =>
      reviewsApi.create(showId, { ...data, ...scores }),
    onSuccess: () => { toast.success('리뷰가 등록되었습니다!'); onSubmitted() },
    onError: (e: any) => toast.error(e.response?.data?.message || '리뷰 등록에 실패했습니다.'),
  })

  return (
    <div className="border border-line-base bg-white p-5 sm:p-6 rounded-md">
      <h3 className="mb-4 text-[16px] font-semibold tracking-tight text-ink-darkest">관람 후기 작성</h3>
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div className="grid grid-cols-2 divide-x divide-y divide-line-lightest border border-line-lightest md:grid-cols-4 md:divide-y-0 rounded bg-surface-alt/40">
          {SCORE_LABELS.map(({ key, label }) => (
            <div key={key} className="py-2.5 text-center">
              <p className="mb-1 text-[11px] font-medium text-ink-muted">{label}</p>
              <div className="flex justify-center">
                <StarRating value={scores[key]} onChange={(v) => setScores((s) => ({ ...s, [key]: v }))} size="sm" />
              </div>
            </div>
          ))}
        </div>

        <div className="relative">
          <textarea
            {...register('content', { required: '리뷰 내용을 입력해주세요.', minLength: { value: 10, message: '10자 이상 작성해주세요.' } })}
            rows={4}
            placeholder="공연을 보고 느낀 생생한 감상을 10자 이상 남겨주세요."
            className="min-h-[120px] w-full resize-none rounded-md border border-line-base bg-surface-base px-3.5 py-3 text-[13px] leading-6 text-ink-base placeholder:text-ink-lighter focus:border-ink-darkest focus:bg-white focus:outline-none transition-colors"
          />
          <span className={`absolute right-3 bottom-3 text-[10px] ${contentVal.length >= 10 ? 'text-ink-lightest' : 'text-rose-500 font-medium'}`}>
            {contentVal.length} / 10자 이상
          </span>
        </div>
        {errors.content && <p className="text-[12px] text-rose-600">{errors.content.message}</p>}

        <div className="flex items-center justify-between pt-1">
          <label className="flex cursor-pointer items-center gap-2 text-[12px] text-ink-muted select-none">
            <input type="checkbox" {...register('hasSpoiler')} className="h-3.5 w-3.5 accent-brand rounded" />
            스포일러 포함
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="h-9 px-4 border border-line-base text-ink-muted rounded-md text-[12px] font-medium bg-white hover:bg-surface-alt transition-colors inline-flex items-center justify-center"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || contentVal.trim().length < 10}
              className="h-9 px-5 bg-brand text-white rounded-md text-[12px] font-semibold hover:bg-brand/90 transition-colors disabled:opacity-40 inline-flex items-center justify-center"
            >
              {mutation.isPending ? '등록 중' : '후기 등록'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
