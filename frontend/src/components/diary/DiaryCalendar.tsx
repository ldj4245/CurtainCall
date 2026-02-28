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
    <div className="bg-white rounded-2xl shadow-card-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand hover:bg-brand-50 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-base font-bold text-gray-900">
          {year}년 {month + 1}월
        </h2>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand hover:bg-brand-50 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-50">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={`py-2 text-center text-xs font-semibold ${
              i === 0 ? 'text-brand' : i === 6 ? 'text-blue-400' : 'text-gray-400'
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
          const isToday = day !== null && isCurrentDay(year, month, day)
          const isSunday = idx % 7 === 0
          const isSaturday = idx % 7 === 6
          const firstEntry = dayEntries[0]

          return (
            <div
              key={key}
              className={`relative border-b border-r border-gray-50 aspect-square overflow-hidden ${
                day ? 'cursor-default' : 'bg-gray-50/30'
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
                  {dayEntries.length > 1 && (
                    <div className="absolute bottom-1 right-1 bg-brand rounded-full w-4 h-4 flex items-center justify-center">
                      <span className="text-white text-[9px] font-bold">+{dayEntries.length - 1}</span>
                    </div>
                  )}
                </button>
              )}

              {day && !firstEntry?.representativeImageUrl && dayEntries.length > 0 && (
                <button
                  className="absolute inset-0 w-full h-full flex flex-col items-center justify-end pb-1.5 bg-brand-50/60"
                  onClick={() => navigate(`/shows/${firstEntry.showId}`)}
                >
                  <span className="text-[9px] text-brand font-medium text-center px-0.5 leading-tight line-clamp-2">
                    {firstEntry.showTitle}
                  </span>
                </button>
              )}

              {day && (
                <div className="absolute top-1 left-1.5 z-10">
                  <span
                    className={`text-[11px] font-semibold leading-none ${
                      isToday
                        ? 'w-5 h-5 flex items-center justify-center bg-brand text-white rounded-full text-[10px]'
                        : isSunday
                        ? 'text-brand'
                        : isSaturday
                        ? 'text-blue-400'
                        : dayEntries.length > 0
                        ? 'text-white drop-shadow-sm'
                        : 'text-gray-700'
                    }`}
                  >
                    {day}
                  </span>
                </div>
              )}

              {!day && <div className="w-full h-full bg-warm-50/50" />}
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

function isCurrentDay(year: number, month: number, day: number): boolean {
  const today = new Date()
  return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
}
