import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Clock, ImageOff } from 'lucide-react'
import { showsApi } from '../../api/shows'
import type { ScheduleShowItem } from '../../types'

interface Props {
  genre?: string
  onRecordShow?: (show: ScheduleShowItem) => void
}

export default function TodayScheduleSection({ genre, onRecordShow }: Props) {
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [showAll, setShowAll] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['today-schedule', genre],
    queryFn: () => showsApi.getSchedule(undefined, genre),
    staleTime: 1000 * 60 * 5, // 5분 캐시
  })

  if (isLoading) {
    return (
      <div className="mb-10 border border-line-lightest bg-surface-base p-5 animate-pulse">
        <div className="h-4 w-28 bg-surface-muted rounded mb-3" />
        <div className="flex gap-2 mb-4">
          <div className="h-7 w-16 bg-surface-muted rounded" />
          <div className="h-7 w-20 bg-surface-muted rounded" />
          <div className="h-7 w-20 bg-surface-muted rounded" />
        </div>
        <div className="h-20 bg-surface-alt rounded" />
      </div>
    )
  }

  if (!data || !data.timeSlots || data.timeSlots.length === 0) {
    return null
  }

  const allShows: ScheduleShowItem[] = []
  const seenIds = new Set<number>()
  for (const slot of data.timeSlots) {
    for (const show of slot.shows) {
      if (!seenIds.has(show.id)) {
        seenIds.add(show.id)
        allShows.push(show)
      }
    }
  }

  const activeSlot = data.timeSlots.find((s) => s.time === selectedTime)
  const displayShows = selectedTime === ''
    ? allShows
    : (activeSlot ? activeSlot.shows : [])

  const month = new Date(data.date).getMonth() + 1
  const day = new Date(data.date).getDate()

  return (
    <div className="mb-10 border border-line-base bg-surface-base p-5 sm:p-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-3 border-b border-line-lightest mb-4">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-brand shrink-0" />
          <h2 className="text-[14px] font-semibold tracking-[-0.03em] text-ink-base">
            오늘의 공연 타임테이블
          </h2>
          <span className="text-[11px] text-ink-lightest font-normal">
            {month}월 {day}일 {data.dayOfWeek}
          </span>
        </div>
        <span className="text-[11px] text-ink-lightest">
          총 <strong className="font-semibold text-ink-base">{data.totalShowsToday}</strong>편의 공연 진행 중
        </span>
      </div>

      {/* 시간대 칩 필터 (모바일 가로 스크롤 지원) */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
        <button
          type="button"
          onClick={() => { setSelectedTime(''); setShowAll(false) }}
          className={`h-7 px-3 text-[11px] whitespace-nowrap shrink-0 transition-colors ${
            selectedTime === ''
              ? 'bg-ink-darkest text-white font-semibold'
              : 'border border-line-base bg-surface-base text-ink-muted hover:border-line-dark'
          }`}
        >
          전체 ({allShows.length})
        </button>

        {data.timeSlots.map((slot) => (
          <button
            key={slot.time}
            type="button"
            onClick={() => { setSelectedTime(slot.time); setShowAll(false) }}
            className={`h-7 px-3 text-[11px] whitespace-nowrap shrink-0 transition-colors ${
              selectedTime === slot.time
                ? 'bg-ink-darkest text-white font-semibold'
                : 'border border-line-base bg-surface-base text-ink-muted hover:border-line-dark'
            }`}
          >
            {slot.label} <span className="opacity-70">({slot.count})</span>
          </button>
        ))}
      </div>

      {/* 해당 시간대 공연 목록 (컴팩트 카드 그리드) */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {(showAll ? displayShows : displayShows.slice(0, 6)).map((show) => (
          <Link
            key={`${show.id}-${show.time}`}
            to={`/shows/${show.id}`}
            className="group flex items-center gap-3 border border-line-lightest bg-surface-alt/40 p-2.5 hover:border-line-dark hover:bg-surface-base transition-all"
          >
            {/* 포스터 */}
            <div className="relative h-[68px] w-[46px] shrink-0 overflow-hidden bg-surface-background border border-line-lightest">
              {show.posterUrl ? (
                <img
                  src={show.posterUrl}
                  alt={show.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-ink-lightest">
                  <ImageOff size={14} />
                </div>
              )}
            </div>

            {/* 공연 정보 */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="bg-brand/10 text-brand px-1 py-0.5 text-[9px] font-semibold">
                  {show.time}
                </span>
                <span className="text-[10px] text-ink-lightest">
                  {show.genreDisplayName}
                </span>
              </div>
              <h3 className="mt-1 truncate text-[12px] font-semibold text-ink-darker group-hover:text-brand transition-colors">
                {show.title}
              </h3>
              <p className="mt-0.5 truncate text-[11px] text-ink-light">
                {show.theaterName || '-'}
                {show.runtime && ` · ${show.runtime}`}
              </p>
              {show.castInfo && show.castInfo.trim() !== '' && (
                <p className="mt-0.5 truncate text-[10px] text-ink-lightest">
                  출연: {show.castInfo}
                </p>
              )}
            </div>

            {/* 우측 관극 기록 퀵 버튼 */}
            {onRecordShow && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onRecordShow(show)
                }}
                className="shrink-0 h-7 px-2 border border-line-base bg-white text-[10px] font-semibold text-ink-muted hover:border-brand hover:text-brand transition-colors rounded active:scale-95"
                title="이 공연 관극 기록하기"
              >
                기록
              </button>
            )}
          </Link>
        ))}
      </div>

      {displayShows.length > 6 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="mt-4 flex w-full h-[32px] items-center justify-center border border-line-base bg-surface-base text-[11px] text-ink-muted hover:bg-surface-alt transition-colors"
        >
          {showAll ? '접기' : `펼쳐보기 (+${displayShows.length - 6}편 더보기)`}
        </button>
      )}
    </div>
  )
}
