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
    <div className="card p-6">
      <h3 className="font-bold text-gray-900 mb-4">리뷰 작성</h3>
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SCORE_LABELS.map(({ key, label }) => (
            <div key={key} className="text-center">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <StarRating value={scores[key]} onChange={(v) => setScores((s) => ({ ...s, [key]: v }))} size="sm" />
            </div>
          ))}
        </div>

        <textarea
          {...register('content', { required: '리뷰 내용을 입력해주세요.', minLength: { value: 10, message: '10자 이상 작성해주세요.' } })}
          rows={4}
          placeholder="공연에 대한 솔직한 리뷰를 남겨주세요. (스포일러 주의!)"
          className="input-field resize-none"
        />
        {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" {...register('hasSpoiler')} className="accent-brand" />
            스포일러 포함
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="btn-secondary text-sm px-3 py-1.5">취소</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary text-sm px-3 py-1.5">
              {mutation.isPending ? '등록 중...' : '등록'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
