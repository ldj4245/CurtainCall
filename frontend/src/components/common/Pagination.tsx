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
    <div className="flex items-center justify-center gap-1 mt-10">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="p-2 rounded-lg text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={clsx(
            'w-8 h-8 text-sm rounded-lg font-medium transition-colors',
            page === currentPage
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          )}
        >
          {page + 1}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className="p-2 rounded-lg text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
