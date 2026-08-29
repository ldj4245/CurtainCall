import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { diaryApi } from '../../api/diary'
import type { DiaryEntry } from '../../types'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function DiaryCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const navigate = useNavigate()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const { data: entries = [] } = useQuery({
    queryKey: ['diary', 'calendar', year, month + 1],
    queryFn: () => diaryApi.getCalendar(year, month + 1),
  })

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const days = buildCalendarDays(year, month)
  const entryMap = buildEntryMap(entries)

  return (
    <div className="border border-line-lightest bg-white mt-5">
      <div className="flex items-center justify-between border-b border-line-lightest px-4 py-4">
        <button
          onClick={prevMonth}
          className="text-ink-lighter"
          aria-label="이전 달"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <h2 className="text-[17px] font-semibold text-ink-base">
          {year}년 {month + 1}월
          </h2>
        </div>
        <button
          onClick={nextMonth}
          className="text-ink-lighter"
          aria-label="다음 달"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-line-lightest">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={`py-3 text-center text-[11px] font-semibold ${
              i === 0 ? 'text-brand' : i === 6 ? 'text-ink-light' : 'text-ink-muted'
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

          return (
            <div
              key={key}
              className={`relative aspect-square overflow-hidden border-b border-r border-line-lightest ${
                day ? 'cursor-default bg-white' : 'bg-surface-background'
              }`}
            >
              {day && firstEntry?.representativeImageUrl && (
                <button
                  className="absolute inset-0 w-full h-full"
                  onClick={() => navigate(`/shows/${firstEntry.showId}`)}
                  title={firstEntry.showTitle}
                >
                  <img
                    src={firstEntry.representativeImageUrl}
                    alt={firstEntry.showTitle}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-darkest/65 via-transparent to-transparent" />
                </button>
              )}

              {day && !firstEntry?.representativeImageUrl && dayEntries.length > 0 && (
                <button
                  className="absolute inset-0 flex h-full w-full flex-col items-center justify-end bg-surface-muted pb-1.5"
                  onClick={() => navigate(`/shows/${firstEntry.showId}`)}
                >
                  <span className="line-clamp-2 px-0.5 text-center text-[9px] font-medium leading-tight text-ink-base">
                    {firstEntry.showTitle}
                  </span>
                </button>
              )}

              {day && (
                <div className="absolute top-1 left-1.5 z-10">
                  <span
                    className={`text-[11px] font-semibold leading-none ${
                      dayEntries.length > 0 ? (firstEntry?.representativeImageUrl ? 'text-white' : 'text-brand') : 'text-ink-muted'
                    }`}
                  >
                    {day}
                  </span>
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
