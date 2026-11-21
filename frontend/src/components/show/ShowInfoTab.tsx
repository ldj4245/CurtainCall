import { useState } from 'react'
import { ExternalLink, ChevronDown, ChevronUp, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Show } from '../../types'
import { formatDtguidance, getBookingLinks, parsePriceInfo } from '../../utils/showUtils'

interface Props {
  show: Show
}

export default function ShowInfoTab({ show }: Props) {
  const [showAllImages, setShowAllImages] = useState(false)
  const [showAllBooking, setShowAllBooking] = useState(false)

  const officialLinks = show.bookingLinks ?? []
  const visibleOfficialLinks = showAllBooking ? officialLinks : officialLinks.slice(0, 4)
  const fallbackSearchLinks = getBookingLinks(show.title)

  const scheduleLines = formatDtguidance(show.dtguidance)
  const priceGrades = parsePriceInfo(show.priceInfo)
  const introImages = show.introImages || []
  const isCollapsibleImages = introImages.length > 1
  const displayImages = !isCollapsibleImages || showAllImages ? introImages : introImages.slice(0, 1)

  return (
    <div className="space-y-6">
      {(scheduleLines.length > 0 || priceGrades.length > 0) && (
        <section className="border border-line-base bg-surface-base p-4 sm:p-5">
          <h3 className="text-[13px] font-semibold text-ink-base pb-2.5 border-b border-line-base mb-3">
            공연 시간 · 가격
          </h3>

          <dl className="text-[12px] divide-y divide-line-lightest">
            {scheduleLines.length > 0 && (
              <div className="grid grid-cols-[68px_1fr] gap-2 py-2.5">
                <dt className="text-ink-lightest">공연 시간</dt>
                <dd className="text-ink-base space-y-1">
                  {scheduleLines.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                  <p className="text-[11px] text-ink-lightest pt-0.5">회차 변동은 예매처에서 확인해 주세요.</p>
                </dd>
              </div>
            )}

            {priceGrades.length > 0 && (
              <div className="grid grid-cols-[68px_1fr] gap-2 py-2.5">
                <dt className="text-ink-lightest">티켓 가격</dt>
                <dd className="space-y-1">
                  {priceGrades.map((item, i) => (
                    <div key={i} className="flex items-baseline justify-between gap-4 max-w-[320px]">
                      <span className="text-ink-muted">{item.grade}</span>
                      <span className="font-medium text-ink-base tabular-nums">{item.price}</span>
                    </div>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <section className="border border-line-base bg-surface-base p-4 sm:p-5">
        <div className="mb-3">
          <h3 className="text-[13px] font-semibold text-ink-base">
            {officialLinks.length > 0 ? '예매처' : '예매처 검색'}
          </h3>
          <p className="mt-1 text-[11px] text-ink-lightest">
            {officialLinks.length > 0
              ? 'KOPIS 등록 공식 예매처로 바로 이동합니다.'
              : 'KOPIS에 직접 등록된 예매 링크가 없어 예매처 검색 결과로 연결됩니다.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(officialLinks.length > 0 ? visibleOfficialLinks : fallbackSearchLinks).map((link, idx) => (
            <a
              key={`${link.url}-${idx}`}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[34px] items-center gap-1.5 border border-line-base bg-white px-3 text-[12px] font-medium text-ink-base hover:border-line-dark transition-colors"
            >
              {link.name}
              <ExternalLink size={11} className="text-ink-lighter" />
            </a>
          ))}
        </div>

        {officialLinks.length > 4 && (
          <button
            type="button"
            onClick={() => setShowAllBooking(!showAllBooking)}
            className="text-action mt-2"
          >
            {showAllBooking ? '예매처 접기' : `외 ${officialLinks.length - 4}곳 더 보기`}
          </button>
        )}
      </section>

      <section className="border border-line-base bg-surface-base p-4 sm:p-5">
        <div className="flex items-center justify-between pb-2.5 border-b border-line-base mb-3">
          <h3 className="text-[13px] font-semibold text-ink-base">공연장</h3>
          {show.theaterRegion && (
            <span className="text-[11px] text-ink-lightest">{show.theaterRegion}</span>
          )}
        </div>

        <div className="space-y-2 text-[12px]">
          <p className="text-[14px] font-semibold text-ink-darker">
            {show.theaterName || '공연장 미정'}
            {show.theaterSeatScale != null && show.theaterSeatScale > 0 && (
              <span className="ml-2 font-normal text-[12px] text-ink-lighter">
                · {show.theaterSeatScale.toLocaleString()}석
                {show.theaterSeatScale >= 1000 ? ' (대극장)' : show.theaterSeatScale >= 300 ? ' (중극장)' : ' (소극장)'}
              </span>
            )}
          </p>
          {show.theaterAddress && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="flex items-center gap-1.5 text-ink-muted min-w-0">
                <MapPin size={13} className="text-brand shrink-0" />
                <span className="break-keep">{show.theaterAddress}</span>
              </p>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (show.theaterAddress) {
                      navigator.clipboard.writeText(show.theaterAddress)
                      toast.success('주소가 복사되었습니다.')
                    }
                  }}
                  className="h-7 px-2.5 border border-line-base bg-white text-[11px] text-ink-muted hover:text-ink-darkest transition-colors"
                >
                  주소 복사
                </button>
                <a
                  href={`https://map.kakao.com/link/search/${encodeURIComponent(show.theaterName || show.theaterAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-7 px-2.5 border border-line-base bg-white text-[11px] text-ink-muted hover:text-ink-darkest transition-colors inline-flex items-center gap-1"
                >
                  카카오맵 <ExternalLink size={10} />
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {introImages.length > 0 && (
        <section className="border border-line-base bg-surface-base p-4 sm:p-5">
          <div className="flex items-center justify-between pb-2.5 border-b border-line-base mb-4">
            <h3 className="text-[13px] font-semibold text-ink-base">공식 상세 안내</h3>
            <span className="text-[11px] text-ink-lightest">총 {introImages.length}장</span>
          </div>

          <div className={`space-y-4 relative ${isCollapsibleImages && !showAllImages ? 'max-h-[550px] overflow-hidden' : ''}`}>
            {displayImages.map((url, index) => (
              <div key={index} className="overflow-hidden border border-line-lightest bg-surface-alt">
                <img
                  src={url}
                  alt={`${show.title} 상세 안내 ${index + 1}`}
                  className="w-full object-contain block"
                  loading="lazy"
                />
              </div>
            ))}
            {isCollapsibleImages && !showAllImages && (
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#fbfbfb] via-[#fbfbfb]/85 to-transparent pointer-events-none" />
            )}
          </div>

          {isCollapsibleImages && (
            <button
              type="button"
              onClick={() => setShowAllImages(!showAllImages)}
              className="mt-4 flex w-full h-[36px] items-center justify-center gap-1.5 border border-line-base bg-white text-[12px] font-medium text-ink-muted hover:bg-surface-alt transition-colors"
            >
              {showAllImages ? (
                <>
                  <ChevronUp size={14} /> 상세 안내 접기
                </>
              ) : (
                <>
                  <ChevronDown size={14} /> 상세 안내 펼쳐보기 ({introImages.length}장)
                </>
              )}
            </button>
          )}
        </section>
      )}

      <p className="text-[11px] text-ink-lightest">
        공연 정보 출처: KOPIS
        {show.sourceUpdatedAt && ` · DB 갱신 ${show.sourceUpdatedAt.slice(0, 16).replace('T', ' ')}`}
        {' · '}실제 회차·예매 가능 여부는 예매처 기준입니다.
      </p>
    </div>
  )
}
