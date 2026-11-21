import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { showsApi } from '../../api/shows'
import type { ScheduleShowItem } from '../../types'

interface Props {
  genre?: string
}

const REGION_PRIORITY = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종']
const INITIAL_VISIBLE_LIMIT = 15

function getKstClock() {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const formatYmd = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
  const addDays = (days: number) => new Date(kst.getTime() + days * 24 * 60 * 60 * 1000)
  const hhmm = `${String(kst.getUTCHours()).padStart(2, '0')}:${String(kst.getUTCMinutes()).padStart(2, '0')}`
  const todayStr = formatYmd(kst)
  const tomorrow = addDays(1)
  const tomorrowStr = formatYmd(tomorrow)
  const dow = kst.getUTCDay()
  const satOffset = (6 - dow + 7) % 7
  const sunOffset = (7 - dow) % 7
  const sat = addDays(satOffset)
  const sun = addDays(sunOffset)

  const candidates = [
    { value: todayStr, label: '오늘' },
    { value: tomorrowStr, label: '내일' },
    { value: formatYmd(sat), label: `토(${sat.getUTCMonth() + 1}/${sat.getUTCDate()})` },
    { value: formatYmd(sun), label: `일(${sun.getUTCMonth() + 1}/${sun.getUTCDate()})` },
  ]
  const quickDates: { value: string; label: string }[] = []
  for (const item of candidates) {
    if (!quickDates.some((q) => q.value === item.value)) {
      quickDates.push(item)
    }
  }
  return { todayStr, tomorrowStr, hhmm, quickDates }
}

function sortRegions(regions: string[]): string[] {
  return [...regions].sort((a, b) => {
    const ia = REGION_PRIORITY.indexOf(a)
    const ib = REGION_PRIORITY.indexOf(b)
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return a.localeCompare(b, 'ko')
  })
}

export default function TodayScheduleSection({ genre }: Props) {
  const [selectedTime, setSelectedTime] = useState('')
  const [date, setDate] = useState('')
  const [region, setRegion] = useState('')
  const [includePast, setIncludePast] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const { todayStr, tomorrowStr, hhmm, quickDates } = getKstClock()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['today-schedule', genre, date],
    queryFn: () => showsApi.getSchedule(date || undefined, genre),
    staleTime: 1000 * 60 * 5,
  })

  if (isLoading) return <p className="feed-notice" role="status">시간표를 불러오는 중...</p>
  if (isError) {
    return (
      <div className="feed-notice">
        <p>시간표를 불러오지 못했습니다.</p>
        <button type="button" className="text-action" onClick={() => refetch()}>다시 시도</button>
      </div>
    )
  }

  const activeDate = date || data?.date || todayStr
  const isToday = activeDate === todayStr

  const selectDate = (nextDate: string) => {
    setDate(nextDate === todayStr ? '' : nextDate)
    setSelectedTime('')
    setIncludePast(false)
    setExpanded(false)
  }

  const allSlots = data?.timeSlots ?? []
  const availableRegions = sortRegions(
    Array.from(
      new Set(
        allSlots
          .flatMap((slot) => slot.shows.map((s) => s.theaterRegion))
          .filter((r): r is string => Boolean(r && r.trim()))
      )
    )
  )

  const regionFilteredSlots = allSlots
    .map((slot) => ({
      ...slot,
      shows: slot.shows.filter((s) => !region || s.theaterRegion === region),
    }))
    .filter((slot) => slot.shows.length > 0)

  const upcomingSlots = isToday ? regionFilteredSlots.filter((slot) => slot.time >= hhmm) : regionFilteredSlots
  const pastShowCount = isToday
    ? regionFilteredSlots.filter((slot) => slot.time < hhmm).reduce((sum, s) => sum + s.shows.length, 0)
    : 0
  const allPassedToday = isToday && regionFilteredSlots.length > 0 && upcomingSlots.length === 0

  const baseSlots = !isToday || includePast || allPassedToday ? regionFilteredSlots : upcomingSlots
  const totalBaseCount = baseSlots.reduce((sum, s) => sum + s.shows.length, 0)

  const targetSlots = selectedTime ? baseSlots.filter((s) => s.time === selectedTime) : baseSlots
  const flattened = targetSlots.flatMap((slot) => slot.shows.map((show) => ({ ...show, time: slot.time })))
  const visibleFlat = expanded ? flattened : flattened.slice(0, INITIAL_VISIBLE_LIMIT)

  const groupedVisibleSlots: { time: string; shows: (ScheduleShowItem & { time: string })[] }[] = []
  for (const item of visibleFlat) {
    const existing = groupedVisibleSlots.find((g) => g.time === item.time)
    if (existing) existing.shows.push(item)
    else groupedVisibleSlots.push({ time: item.time, shows: [item] })
  }

  return (
    <section aria-label="오늘 공연 시간표">
      <div className="my-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="날짜 빠른 선택">
          {quickDates.map((q) => {
            const active = activeDate === q.value
            return (
              <button
                key={q.value}
                type="button"
                aria-pressed={active}
                onClick={() => selectDate(q.value)}
                className={`h-8 px-2.5 border text-[12px] transition-colors ${
                  active
                    ? 'border-[#242424] bg-[#242424] text-white font-medium'
                    : 'border-line-base bg-white text-ink-base hover:border-line-dark'
                }`}
              >
                {q.label}
              </button>
            )
          })}
        </div>

        <input
          aria-label="공연 날짜"
          type="date"
          value={activeDate}
          onChange={(e) => {
            if (e.target.value) selectDate(e.target.value)
          }}
          className="h-8 border border-line-base bg-white px-2 text-[12px] text-ink-base"
        />

        <select
          aria-label="지역"
          value={region}
          onChange={(e) => {
            setRegion(e.target.value)
            setSelectedTime('')
            setExpanded(false)
          }}
          className="h-8 border border-line-base bg-white px-2 text-[12px] text-ink-base"
        >
          <option value="">지역 전체</option>
          {availableRegions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {baseSlots.length > 0 && (
        <nav className="text-tabs schedule-times" aria-label="공연 시간">
          <button
            type="button"
            aria-pressed={!selectedTime}
            className={!selectedTime ? 'is-active' : ''}
            onClick={() => {
              setSelectedTime('')
              setExpanded(false)
            }}
          >
            전체 ({totalBaseCount})
          </button>
          {baseSlots.map((slot) => (
            <button
              key={slot.time}
              type="button"
              aria-pressed={selectedTime === slot.time}
              className={selectedTime === slot.time ? 'is-active' : ''}
              onClick={() => {
                setSelectedTime(slot.time)
                setExpanded(false)
              }}
            >
              {slot.time} ({slot.shows.length})
            </button>
          ))}
        </nav>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 schedule-date">
        <span>
          {data?.date} {data?.dayOfWeek} · {flattened.length}개 회차
        </span>
        {isToday && pastShowCount > 0 && !allPassedToday && (
          <button
            type="button"
            onClick={() => {
              setIncludePast(!includePast)
              setSelectedTime('')
              setExpanded(false)
            }}
            className="text-action !min-h-0"
          >
            {includePast ? '예정 회차만 보기' : `지난 회차 포함 (${pastShowCount})`}
          </button>
        )}
      </div>

      {allPassedToday && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-ink-muted">
          <span>오늘 예정된 회차가 모두 지났습니다.</span>
          <button type="button" onClick={() => selectDate(tomorrowStr)} className="text-action !min-h-0">
            내일 시간표 보기
          </button>
        </div>
      )}

      <div className="feed-list">
        {groupedVisibleSlots.map((group) => (
          <div key={group.time} className="schedule-group">
            <h3 className="schedule-group-time">
              {group.time}{' '}
              <span className="font-normal text-[12px] text-ink-lighter">· {group.shows.length}편</span>
            </h3>
            {group.shows.map((show, idx) => (
              <article className="feed-item" key={`${show.id}-${group.time}`}>
                <span className="feed-index" aria-hidden="true">{idx + 1}</span>
                <div className="feed-item-body">
                  <div className="feed-title-line">
                    <h2><Link to={`/shows/${show.id}`}>{show.title}</Link></h2>
                    {show.theaterName && (
                      <span className="feed-venue">
                        ({show.theaterName}{show.theaterRegion ? ` · ${show.theaterRegion}` : ''})
                      </span>
                    )}
                  </div>
                  <div className="feed-meta">
                    {show.genreDisplayName && <span>{show.genreDisplayName}</span>}
                    {show.runtime?.trim() && <span>{show.runtime.trim()}</span>}
                    <Link to={`/shows/${show.id}?plan=1`} className="text-action !min-h-0">관람 예정</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ))}
      </div>

      {!flattened.length && <p className="feed-notice">해당 조건의 공연 시간이 없습니다.</p>}

      {flattened.length > INITIAL_VISIBLE_LIMIT && (
        <button
          type="button"
          className="text-action feed-more"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '접기' : `더 보기 (${flattened.length - INITIAL_VISIBLE_LIMIT}개)`}
        </button>
      )}

      <p className="feed-meta mt-4">KOPIS 정기 시간표 기준 · 당일 변동은 예매처 확인</p>
    </section>
  )
}
