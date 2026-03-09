import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { showsApi, type ShowAutocomplete } from '../../api/shows'

const DEBOUNCE_MS = 300

export default function SearchBar() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ShowAutocomplete[]>([])
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 1) {
      setResults([])
      setOpen(false)
      return
    }
    try {
      const data = await showsApi.autocomplete(q.trim())
      setResults(data)
      setOpen(data.length > 0)
      setActiveIdx(-1)
    } catch {
      setResults([])
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => fetchSuggestions(val), DEBOUNCE_MS)
  }

  const handleSelect = (show: ShowAutocomplete) => {
    setQuery('')
    setOpen(false)
    navigate(`/shows/${show.id}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    if (activeIdx >= 0 && results[activeIdx]) {
      handleSelect(results[activeIdx])
    } else {
      setOpen(false)
      navigate(`/shows?keyword=${encodeURIComponent(query.trim())}`)
    }
    setQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const statusLabel = (status: string | null) => {
    if (status === 'ONGOING') return <span className="text-xs text-green-500">공연 중</span>
    if (status === 'UPCOMING') return <span className="text-xs text-blue-400">예정</span>
    return <span className="text-xs text-gray-400">종료</span>
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 h-9 px-3 rounded-full border border-gray-200 bg-gray-50 focus-within:bg-white focus-within:border-brand/40 focus-within:ring-2 focus-within:ring-brand/10 transition-all">
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="공연 검색..."
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none min-w-0"
          />
        </div>
      </form>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-white rounded-xl border border-gray-100 shadow-lg z-50 overflow-hidden">
          {results.map((show, idx) => (
            <button
              key={show.id}
              onMouseDown={() => handleSelect(show)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                idx === activeIdx ? 'bg-brand-50' : 'hover:bg-gray-50'
              }`}
            >
              {show.posterUrl ? (
                <img
                  src={show.posterUrl}
                  alt={show.title}
                  className="w-8 h-10 object-cover rounded flex-shrink-0 bg-gray-100"
                />
              ) : (
                <div className="w-8 h-10 rounded bg-gray-100 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate font-medium">{show.title}</p>
                <div className="mt-0.5">{statusLabel(show.status)}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
