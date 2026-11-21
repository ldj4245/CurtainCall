import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { showsApi } from '../../api/shows'
import type { ScheduleShowItem } from '../../types'

interface Props {
  genre?: string
  onRecordShow?: (show: ScheduleShowItem) => void
}

export default function TodayScheduleSection({ genre, onRecordShow }: Props) {
  const [selectedTime, setSelectedTime] = useState('')
  const [date, setDate] = useState("")
  const [region, setRegion] = useState("")
  const [expanded, setExpanded] = useState(false)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['today-schedule', genre, date],
    queryFn: () => showsApi.getSchedule(date || undefined, genre),
    staleTime: 1000 * 60 * 5,
  })

  if (isLoading) return <p className="feed-notice" role="status">시간표를 불러오는 중...</p>
  if (isError) return <div className="feed-notice"><p>시간표를 불러오지 못했습니다.</p><button className="text-action" onClick={() => refetch()}>다시 시도</button></div>


  const items = (data?.timeSlots ?? [])
    .filter(slot => !selectedTime || slot.time === selectedTime)
    .flatMap(slot => slot.shows.map(show => ({ ...show, time: slot.time })))
    .filter(show => !region || show.theaterRegion === region)
  const visibleItems = expanded ? items : items.slice(0, 12)

  return (
    <section aria-label="오늘 공연 시간표">
      <div className="my-4 flex flex-wrap gap-3"><input aria-label="공연 날짜" type="date" value={date || data?.date || ""} onChange={e => { setDate(e.target.value); setSelectedTime(""); setExpanded(false) }} className="border border-line-base bg-white px-2 py-1 text-sm" /><select aria-label="지역" value={region} onChange={e => { setRegion(e.target.value); setExpanded(false) }} className="border border-line-base bg-white px-2 py-1 text-sm"><option value="">지역 전체</option>{Array.from(new Set((data?.timeSlots ?? []).flatMap(s => s.shows.map(show => show.theaterRegion)).filter(Boolean))).map(r => <option key={r} value={r}>{r}</option>)}</select></div>
      <p className="feed-meta mb-3">KOPIS의 정기 공연 시간 기준입니다. 회차 변경·취소는 예매처에서 확인해 주세요.</p>
      <nav className="text-tabs schedule-times" aria-label="공연 시간">
        <button aria-pressed={!selectedTime} className={!selectedTime ? 'is-active' : ''} onClick={() => { setSelectedTime(''); setExpanded(false) }}>전체</button>
        {data?.timeSlots.map(slot => (
          <button
            key={slot.time}
            aria-pressed={selectedTime === slot.time}
            className={selectedTime === slot.time ? 'is-active' : ''}
            onClick={() => { setSelectedTime(slot.time); setExpanded(false) }}
          >
            {slot.time}
          </button>
        ))}
      </nav>
      <p className="schedule-date">{data?.date} {data?.dayOfWeek} · {items.length}개 회차</p>
      <div className="feed-list">
        {visibleItems.map((show, index) => (
          <article className="feed-item" key={`${show.id}-${show.time}`}>
            <span className="feed-index" aria-hidden="true">{index + 1}</span>
            <div className="feed-item-body">
              <div className="feed-title-line">
                <h2><Link to={`/shows/${show.id}`}>{show.time} {show.title}</Link></h2>
                {show.theaterName && <span className="feed-venue">({show.theaterName})</span>}
              </div>
              {show.castInfo && <p className="feed-description">전체 출연진 {show.castInfo}</p>}
              <div className="feed-meta">
                {show.genreDisplayName && <span>{show.genreDisplayName}</span>}
                {show.runtime && <span>{show.runtime}</span>}
                {onRecordShow && <button className="text-action" onClick={() => onRecordShow(show)}>기록하기</button>}
              </div>
            </div>
          </article>
        ))}
      </div>
      {!items.length && <p className="feed-notice">해당 조건의 공연 시간이 없습니다.</p>}
      {items.length > 12 && <button className="text-action feed-more" onClick={() => setExpanded(!expanded)}>{expanded ? '접기' : '더 보기'}</button>}
    </section>
  )
}
