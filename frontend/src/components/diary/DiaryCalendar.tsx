import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { diaryApi } from '../../api/diary'

export default function DiaryCalendar() {
  const [date, setDate] = useState<Date>(new Date())
  const navigate = useNavigate()

  const { data: entries = [] } = useQuery({
    queryKey: ['diary', 'calendar', date.getFullYear(), date.getMonth() + 1],
    queryFn: () => diaryApi.getCalendar(date.getFullYear(), date.getMonth() + 1),
  })

  const getEntriesForDate = (date: Date) => {
    return entries.filter((entry) => {
      const entryDate = new Date(entry.watchedDate)
      return (
        entryDate.getFullYear() === date.getFullYear() &&
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getDate() === date.getDate()
      )
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-card-sm border border-gray-100 p-6">
      <style>{`
        .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
        }
        .react-calendar__navigation button {
          min-width: 44px;
          background: none;
          font-size: 16px;
          border-radius: 8px;
          color: #1a1a1a;
        }
        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus {
          background-color: #fdf2f7;
        }
        .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: 600;
          font-size: 0.75em;
          color: #9ca3af;
          padding: 8px 0;
        }
        .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none;
        }
        .react-calendar__tile {
          height: 120px;
          padding: 8px;
          background: none;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          border: 1px solid #f5f3f0 !important;
        }
        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background-color: #faf9f7;
        }
        .react-calendar__tile--now {
          background: #fdf2f7 !important;
        }
        .react-calendar__tile--active {
          background: white !important;
          color: black !important;
          border-color: #e5e7eb !important;
        }
      `}</style>

      <Calendar
        onChange={(value) => {
          if (value instanceof Date) setDate(value)
        }}
        value={date}
        onActiveStartDateChange={({ activeStartDate }) => {
          if (activeStartDate) setDate(activeStartDate)
        }}
        tileContent={({ date, view }) => {
          if (view !== 'month') return null

          const dayEntries = getEntriesForDate(date)
          if (dayEntries.length === 0) return null

          return (
            <div className="w-full flex-1 flex flex-col gap-1 mt-1 overflow-y-auto custom-scrollbar">
              {dayEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/shows/${entry.showId}`)
                  }}
                  className="w-full text-left text-xs truncate px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors cursor-pointer"
                  title={entry.showTitle}
                >
                  {entry.showTitle}
                </button>
              ))}
            </div>
          )
        }}
        formatDay={(_, date) => String(date.getDate())}
      />
    </div>
  )
}
