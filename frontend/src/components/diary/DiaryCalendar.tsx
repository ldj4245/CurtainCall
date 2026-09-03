import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { diaryApi } from '../../api/diary'
import type { DiaryEntry } from '../../types'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

interface DiaryCalendarProps {
  onSelectEntry?: (entry: DiaryEntry) => void
}

export default function DiaryCalendar({ onSelectEntry }: DiaryCalendarProps = {}) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const navigate = useNavigate()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  const { data: entries = [] } = useQuery({
    queryKey: ['diary', 'calendar', year, month + 1],
    queryFn: () => diaryApi.getCalendar(year, month + 1),
  })

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const days = buildCalendarDays(year, month)
  const entryMap = buildEntryMap(entries)

  const handleEntryClick = (entry: DiaryEntry) => {
    if (onSelectEntry) {
      onSelectEntry(entry)
    } else {
      navigate(`/shows/${entry.showId}`)
    }
  }

  return (
    <div className="border border-line-base bg-white rounded-md overflow-hidden mt-4">
      <div className="flex items-center justify-between border-b border-line-lightest px-4 py-3 bg-surface-base">
        <button
          onClick={prevMonth}
          className="p-1 text-ink-muted hover:text-ink-darkest rounded transition-colors"
          aria-label="이전 달"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <h2 className="text-[15px] font-semibold text-ink-darkest tracking-tight">
            {year}년 {month + 1}월
          </h2>
        </div>
        <button
          onClick={nextMonth}
          className="p-1 text-ink-muted hover:text-ink-darkest rounded transition-colors"
          aria-label="다음 달"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-line-lightest bg-surface-alt/50">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={`py-2 text-center text-[11px] font-semibold ${
              i === 0 ? 'text-rose-500' : i === 6 ? 'text-blue-500' : 'text-ink-muted'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const key = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : `empty-${idx}`
          const dayEntries = day ? (entryMap[key] ?? []) : []
          const firstEntry = dayEntries[0]
          const isToday = isCurrentMonth && today.getDate() === day

          return (
            <div
              key={key}
              className={`relative aspect-square overflow-hidden border-b border-r border-line-lightest ${
                day ? 'bg-white' : 'bg-surface-alt/30'
              }`}
            >
              {day && firstEntry?.representativeImageUrl && (
                <button
                  type="button"
                  className="absolute inset-0 w-full h-full text-left group"
                  onClick={() => handleEntryClick(firstEntry)}
                  title={firstEntry.showTitle}
                >
                  <img
                    src={firstEntry.representativeImageUrl}
                    alt={firstEntry.showTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                </button>
              )}

              {day && !firstEntry?.representativeImageUrl && dayEntries.length > 0 && (
                <button
                  type="button"
                  className="absolute inset-0 flex h-full w-full flex-col items-center justify-end bg-brand/10 p-1 hover:bg-brand/15 transition-colors"
                  onClick={() => handleEntryClick(firstEntry)}
                >
                  <span className="line-clamp-2 text-center text-[9px] font-medium leading-tight text-brand">
                    {firstEntry.showTitle}
                  </span>
                </button>
              )}

              {day && (
                <div className="absolute top-1 left-1.5 z-10 flex items-center gap-1">
                  <span
                    className={`text-[11px] font-semibold leading-none rounded-full h-4 w-4 inline-flex items-center justify-center ${
                      isToday
                        ? 'bg-brand text-white font-bold'
                        : dayEntries.length > 0
                        ? firstEntry?.representativeImageUrl
                          ? 'text-white drop-shadow-md'
                          : 'text-brand'
                        : 'text-ink-muted'
                    }`}
                  >
                    {day}
                  </span>
                  {dayEntries.length > 1 && (
                    <span className="text-[9px] font-bold bg-black/60 text-white px-1 rounded">
                      +{dayEntries.length - 1}
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: (number | null)[] = []

  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const remaining = 7 - (days.length % 7)
  if (remaining < 7) for (let i = 0; i < remaining; i++) days.push(null)

  return days
}

function buildEntryMap(entries: DiaryEntry[]): Record<string, DiaryEntry[]> {
  const map: Record<string, DiaryEntry[]> = {}
  for (const entry of entries) {
    const key = entry.watchedDate.slice(0, 10)
    if (!map[key]) map[key] = []
    map[key].push(entry)
  }
  return map
}
