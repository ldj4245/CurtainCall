import { Star } from 'lucide-react'
import clsx from 'clsx'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_MAP = {
  sm: 14,
  md: 18,
  lg: 24,
}

export default function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const starSize = SIZE_MAP[size]

  if (readonly) {
    return (
      <div className="inline-flex items-center gap-0.5" aria-label={`평점 ${value}점`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={starSize}
            className={star <= Math.round(value) ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-0.5" role="radiogroup" aria-label="별점 선택">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={clsx(
            'p-1 -m-0.5 rounded transition-transform duration-100 active:scale-90 hover:scale-110 focus:outline-none',
            'touch-manipulation'
          )}
          aria-label={`${star}점`}
        >
          <Star
            size={starSize}
            className={star <= value ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}
          />
        </button>
      ))}
    </div>
  )
}
