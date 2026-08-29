import { useState, useMemo } from 'react'
import type { Show, DiarySnippet } from '../../types'

interface Props {
  show: Show
  diarySnippets: DiarySnippet[]
  onAddSeatReview: () => void
}

export default function ShowSeatViewTab({ show, diarySnippets, onAddSeatReview }: Props) {
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL')

  // 좌석 정보가 등록된 실제 다이어리 스니펫 추출
  const seatEntries = useMemo(() => {
    return diarySnippets.filter((item) => item.seatInfo && item.seatInfo.trim() !== '')
  }, [diarySnippets])

  // 고유한 층/구역 태그 목록 동적 생성
  const availableTags = useMemo(() => {
    const set = new Set<string>()
    seatEntries.forEach((e) => {
      if (!e.seatInfo) return
      const floorMatch = e.seatInfo.match(/([0-9]층)/)
      if (floorMatch) set.add(floorMatch[1])
      const zoneMatch = e.seatInfo.match(/([A-Za-z가-힣]구역|[A-Za-z]블록)/)
      if (zoneMatch) set.add(zoneMatch[1])
    })
    return Array.from(set)
  }, [seatEntries])

  // 필터 적용된 목록
  const filteredEntries = useMemo(() => {
    if (selectedFilter === 'ALL') return seatEntries
    return seatEntries.filter((item) => item.seatInfo && item.seatInfo.includes(selectedFilter))
  }, [seatEntries, selectedFilter])

  return (
    <div className="space-y-4">
      {/* 1. 극장 좌석 가이드 헤더 */}
      <div className="border border-line-base p-4 bg-surface-base">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line-lightest">
          <div>
            <span className="text-[11px] font-bold text-ink-lightest uppercase tracking-wide">
              공연장 시야 아카이브
            </span>
            <h2 className="mt-1 text-[15px] font-bold text-ink-base">
              {show.theaterName || '공연장'} 좌석 시야 후기
            </h2>
            <p className="mt-0.5 text-[12px] text-ink-light">
              실제 관객들이 관람하고 등록한 좌석별 시야 사진과 한줄평을 확인하세요.
            </p>
          </div>

          <button
            onClick={onAddSeatReview}
            className="flex h-[34px] items-center justify-center bg-brand text-white text-[11px] font-semibold px-4 whitespace-nowrap transition-colors"
          >
            시야 등록하기
          </button>
        </div>

        {/* 관람 통계 안내 */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-[12px] text-ink-muted">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-ink-base">위치:</span>
            <span>{show.theaterRegion || '전국'} {show.theaterName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-ink-base">등록 기록:</span>
            <span className="font-bold text-ink-base">{seatEntries.length}건</span>
          </div>
        </div>
      </div>

      {/* 2. 동적 좌석 태그 필터링 바 */}
      {availableTags.length > 0 && (
        <div className="border border-line-base p-3 bg-surface-base">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[12px] font-bold text-ink-lightest shrink-0 mr-1">필터</span>
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3 py-1.5 text-[11px] font-semibold transition-all border ${
                selectedFilter === 'ALL'
                  ? 'bg-brand text-white border-brand'
                  : 'bg-surface-base text-ink-muted border-line-base hover:bg-surface-alt'
              }`}
            >
              전체 ({seatEntries.length})
            </button>

            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedFilter(tag)}
                className={`px-3 py-1.5 text-[11px] font-semibold transition-all border ${
                  selectedFilter === tag
                    ? 'bg-brand text-white border-brand'
                    : 'bg-surface-base text-ink-muted border-line-base hover:bg-surface-alt'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. 좌석 시야 사진 & 리뷰 그리드 */}
      {filteredEntries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.map((entry) => {
            const hasPhoto = entry.photoUrls && entry.photoUrls.length > 0
            const photoSrc = hasPhoto ? entry.photoUrls![0] : entry.representativeImageUrl

            return (
              <div key={entry.diaryId} className="border border-line-base p-4 bg-surface-base flex flex-col justify-between space-y-3">
                <div>
                  {/* 시야 사진 */}
                  {photoSrc ? (
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-background border border-line-lightest mb-3">
                      <img
                        src={photoSrc}
                        alt={entry.seatInfo || '좌석 시야'}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="flex h-24 w-full items-center justify-center bg-surface-background text-ink-lightest mb-3 border border-line-lightest">
                      <span className="text-[12px]">사진 없음</span>
                    </div>
                  )}

                  {/* 좌석 위치 & 별점 */}
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-ink-base">
                      {entry.seatInfo}
                    </span>

                    <span className="text-[12px] font-bold text-ink-base">
                      ★ {entry.rating}.0
                    </span>
                  </div>

                  {/* 관객 감상평 */}
                  {entry.comment && (
                    <p className="mt-2 text-[12px] text-ink-light line-clamp-3">
                      "{entry.comment}"
                    </p>
                  )}

                  {/* 캐스트 메모 */}
                  {entry.castMemo && (
                    <p className="mt-2 text-[11px] text-ink-lighter truncate">
                      캐스트: {entry.castMemo}
                    </p>
                  )}
                </div>

                {/* 하단 작성자 & 관람일 */}
                <div className="pt-3 border-t border-line-lightest flex items-center justify-between text-[11px] text-ink-lighter">
                  <span>{entry.userNickname || '익명'}</span>
                  <span>{entry.watchedDate}</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="border border-line-base p-8 text-center bg-surface-base space-y-3">
          <h3 className="text-[14px] font-bold text-ink-base">
            등록된 좌석 시야 후기가 없습니다.
          </h3>
          <p className="text-[12px] text-ink-light max-w-sm mx-auto">
            이 공연을 관람하셨다면, 좌석 위치와 함께 기록을 남겨보세요.
          </p>
          <button
            onClick={onAddSeatReview}
            className="flex mx-auto h-[34px] items-center justify-center bg-brand text-white text-[11px] font-semibold px-4 mt-2 transition-colors"
          >
            시야 후기 남기기
          </button>
        </div>
      )}
    </div>
  )
}
