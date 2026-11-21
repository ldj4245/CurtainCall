import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { retentionApi } from '../../api/retention'
import Pagination from '../common/Pagination'

interface Props {
  showId: number
  seatsOnly?: boolean
  onWriteDiary?: () => void
}

export default function PublicRecords({ showId, seatsOnly: defaultSeatsOnly = false, onWriteDiary }: Props) {
  const [seatsOnly, setSeatsOnly] = useState(defaultSeatsOnly)
  const [page, setPage] = useState(0)
  const [seat, setSeat] = useState('')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['public-records', showId, seatsOnly, seat, page],
    queryFn: () => retentionApi.records(showId, page, seatsOnly, seatsOnly ? seat : ''),
  })

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-base pb-3">
        <div className="flex flex-wrap items-center gap-4">
          <nav className="text-tabs" aria-label="기록 필터">
            <button
              type="button"
              aria-pressed={!seatsOnly}
              className={!seatsOnly ? 'is-active' : ''}
              onClick={() => { setSeatsOnly(false); setPage(0) }}
            >
              전체 기록
            </button>
            <button
              type="button"
              aria-pressed={seatsOnly}
              className={seatsOnly ? 'is-active' : ''}
              onClick={() => { setSeatsOnly(true); setPage(0) }}
            >
              좌석 정보만
            </button>
          </nav>
          <span className="text-[12px] text-ink-lighter">
            {data ? `${data.totalElements}개` : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {seatsOnly && (
            <input
              aria-label="좌석 검색"
              placeholder="층·구역·좌석 검색"
              value={seat}
              onChange={(e) => { setSeat(e.target.value); setPage(0) }}
              className="h-9 border border-line-base bg-white px-2.5 text-[12px]"
            />
          )}
          {onWriteDiary && (
            <button type="button" onClick={onWriteDiary} className="button-secondary">
              기록 쓰기
            </button>
          )}
        </div>
      </div>

      {seatsOnly && (
        <p className="feed-meta mt-2">
          사진은 관객이 첨부한 사진이며, 평점은 공연 전체에 대한 평가입니다.
        </p>
      )}

      {isLoading ? (
        <p className="feed-notice" role="status">불러오는 중...</p>
      ) : isError ? (
        <button className="text-action my-4" onClick={() => refetch()}>다시 불러오기</button>
      ) : !data?.content.length ? (
        <div className="quiet-empty">
          <p>{seatsOnly ? '등록된 좌석 기록이 없습니다.' : '아직 공개된 관극 기록이 없습니다.'}</p>
          {onWriteDiary && (
            <button type="button" onClick={onWriteDiary} className="text-action">
              {seatsOnly ? '첫 좌석 기록 남기기' : '첫 공개 기록 남기기'}
            </button>
          )}
        </div>
      ) : (
        data.content.map((d) => (
          <article key={d.diaryId} className="border-b border-line-lightest py-4">
            <p className="feed-meta">
              <span>{d.userNickname}</span>
              <span>{d.watchedDate}</span>
              {d.seatInfo && <span>{d.seatInfo}</span>}
              {d.rating != null && <span>공연 평점 {d.rating}</span>}
            </p>
            {d.hasSpoiler ? (
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-ink-muted">스포일러 포함 · 내용 보기</summary>
                <p className="whitespace-pre-wrap mt-2">{d.comment}</p>
                <Photos photos={d.photoUrls} />
              </details>
            ) : (
              <>
                <p className="whitespace-pre-wrap text-sm mt-2">{d.comment}</p>
                <Photos photos={d.photoUrls} />
              </>
            )}
            {d.castMemo && <p className="feed-meta mt-2">관람한 출연진 {d.castMemo}</p>}
          </article>
        ))
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}
    </section>
  )
}

function Photos({ photos = [] }: { photos?: string[] }) {
  return photos.length ? (
    <div className="mt-3 flex gap-2 overflow-x-auto">
      {photos.map((photo, i) => {
        const img = <img src={photo} alt={`첨부 사진 ${i + 1}`} loading="lazy" className="h-28 max-w-48 object-contain" />
        return photo.startsWith('http://') || photo.startsWith('https://') ? (
          <a href={photo} key={i} target="_blank" rel="noreferrer">{img}</a>
        ) : (
          <div key={i} className="shrink-0">{img}</div>
        )
      })}
    </div>
  ) : null
}
