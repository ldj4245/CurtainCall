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

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          disabled={readonly}
          className={clsx('transition-colors', !readonly && 'cursor-pointer hover:scale-110')}
        >
          <Star
            size={starSize}
            className={star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  )
}
