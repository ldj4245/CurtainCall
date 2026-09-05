import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  // 모바일 화면 폭을 고려해 5개 윈도우 계산
  const windowSize = 5
  const halfWindow = Math.floor(windowSize / 2)
  let start = Math.max(0, currentPage - halfWindow)
  const end = Math.min(totalPages, start + windowSize)

  if (end - start < windowSize) {
    start = Math.max(0, end - windowSize)
  }

  const pages = Array.from({ length: end - start }, (_, i) => start + i)

  return (
    <nav className="flex items-center justify-center gap-1.5 my-8 select-none" aria-label="페이지 탐색">
      <button
        onClick={() => onPageChange(Math.max(0, currentPage - 1))}
        disabled={currentPage === 0}
        aria-label="이전 페이지"
        className="flex h-8 w-8 items-center justify-center border border-line-base bg-white rounded text-ink-muted transition-colors hover:border-ink-darkest hover:text-ink-darkest disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronLeft size={14} />
      </button>

      {start > 0 && (
        <>
          <button
            onClick={() => onPageChange(0)}
            className="flex h-8 w-8 items-center justify-center border border-line-base bg-white rounded text-[11px] text-ink-muted hover:border-ink-darkest"
          >
            1
          </button>
          {start > 1 && <span className="text-[11px] text-ink-lightest px-0.5">...</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          aria-current={page === currentPage ? 'page' : undefined}
          className={clsx(
            'flex h-8 w-8 items-center justify-center border rounded text-[11px] font-medium transition-colors',
            page === currentPage
              ? 'border-brand bg-brand font-semibold text-white'
              : 'border-line-base bg-white text-ink-muted hover:border-ink-darkest hover:text-ink-darkest'
          )}
        >
          {page + 1}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-[11px] text-ink-lightest px-0.5">...</span>}
          <button
            onClick={() => onPageChange(totalPages - 1)}
            className="flex h-8 w-8 items-center justify-center border border-line-base bg-white rounded text-[11px] text-ink-muted hover:border-ink-darkest"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
        disabled={currentPage >= totalPages - 1}
        aria-label="다음 페이지"
        className="flex h-8 w-8 items-center justify-center border border-line-base bg-white rounded text-ink-muted transition-colors hover:border-ink-darkest hover:text-ink-darkest disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronRight size={14} />
      </button>
    </nav>
  )
}
