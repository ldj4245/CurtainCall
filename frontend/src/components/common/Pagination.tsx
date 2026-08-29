import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
    const start = Math.max(0, Math.min(currentPage - 4, totalPages - 10))
    return start + i
  })

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="flex h-8 w-8 items-center justify-center border border-[#dedede] bg-white text-[#777] transition-colors hover:border-[#333] hover:text-[#333] disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronLeft size={14} />
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={clsx(
            'flex h-8 w-8 items-center justify-center border text-[11px] transition-colors',
            page === currentPage
              ? 'border-[#9d2244] bg-[#9d2244] font-semibold text-white'
              : 'border-[#dedede] bg-white text-[#555] hover:border-[#9d2244]'
          )}
        >
          {page + 1}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className="flex h-8 w-8 items-center justify-center border border-[#dedede] bg-white text-[#777] transition-colors hover:border-[#333] hover:text-[#333] disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}
