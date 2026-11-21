import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { retentionApi } from '../../api/retention'
import Pagination from '../common/Pagination'

export default function PublicRecords({ showId, seatsOnly = false }: { showId: number; seatsOnly?: boolean }) {
  const [page, setPage] = useState(0)
  const [seat, setSeat] = useState('')
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['public-records', showId, seatsOnly, seat, page],
    queryFn: () => retentionApi.records(showId, page, seatsOnly, seat),
  })
  return <section>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-base pb-3">
      <h2 className="font-semibold">{seatsOnly ? '좌석별 기록' : '공개 관극 기록'} {data ? `(${data.totalElements})` : ''}</h2>
      {seatsOnly && <input aria-label="좌석 검색" placeholder="층·구역·좌석 검색" value={seat} onChange={e => { setSeat(e.target.value); setPage(0) }} className="border border-line-base bg-white px-2 py-1 text-sm" />}
    </div>
    {seatsOnly && <p className="feed-meta mt-2">사진은 관객이 첨부한 사진입니다. 평점은 공연 전체에 대한 평가입니다.</p>}
    {isLoading ? <p className="feed-notice">불러오는 중...</p> : isError ? <button className="text-action my-4" onClick={() => refetch()}>다시 불러오기</button> : !data?.content.length ? <p className="feed-notice">등록된 기록이 없습니다.</p> : data.content.map(d =>
      <article key={d.diaryId} className="border-b border-line-lightest py-4">
        <p className="feed-meta">{d.userNickname} · {d.watchedDate}{d.seatInfo && ` · ${d.seatInfo}`}{d.rating != null && ` · 공연 평점 ${d.rating}`}</p>
        {d.hasSpoiler ? <details className="mt-2 text-sm"><summary className="cursor-pointer text-ink-muted">스포일러 포함 · 내용 보기</summary><p className="whitespace-pre-wrap mt-2">{d.comment}</p><Photos photos={d.photoUrls} /></details> : <><p className="whitespace-pre-wrap text-sm mt-2">{d.comment}</p><Photos photos={d.photoUrls} /></>}
        {d.castMemo && <p className="feed-meta mt-2">관람한 출연진 {d.castMemo}</p>}
      </article>
    )}
    {data && data.totalPages > 1 && <div className="mt-4"><Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} /></div>}
  </section>
}
function Photos({ photos = [] }: { photos?: string[] }) { return photos.length ? <div className="mt-3 flex gap-2 overflow-x-auto">{photos.map((photo, i) => <a href={photo} key={i} target="_blank" rel="noreferrer"><img src={photo} alt={`첨부 사진 ${i + 1}`} loading="lazy" className="h-28 max-w-48 object-contain" /></a>)}</div> : null }
