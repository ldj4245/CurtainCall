import { useState } from 'react'
import { ExternalLink, ChevronDown, ChevronUp, MapPin } from 'lucide-react'
import type { Show } from '../../types'
import { getBookingLinks } from '../../utils/showUtils'

interface Props {
  show: Show
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function ShowInfoTab({ show }: Props) {
  const [showAllImages, setShowAllImages] = useState(false)
  const bookingLinks = getBookingLinks(show.title)
  const introImages = show.introImages || []
  const displayImages = showAllImages ? introImages : introImages.slice(0, 2)

  const periodText = show.startDate
    ? `${formatDate(show.startDate)} ~ ${show.endDate ? formatDate(show.endDate) : '미정'}`
    : '공연 일정 미정'

  return (
    <div className="space-y-6">
      {/* 1. 기본 공연 정보 */}
      <div className="border border-line-base bg-surface-base p-5 sm:p-6">
        <h3 className="text-[13px] font-semibold text-ink-base pb-3 border-b border-line-base mb-4">
          기본 공연 정보
        </h3>

        <dl className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-8 text-[12px]">
          <div className="flex items-baseline justify-between sm:justify-start sm:gap-6 border-b border-line-lightest pb-2">
            <dt className="text-ink-lightest min-w-[70px]">장르</dt>
            <dd className="font-medium text-ink-base">{show.genreDisplayName || (show.genre === 'MUSICAL' ? '뮤지컬' : '연극')}</dd>
          </div>

          <div className="flex items-baseline justify-between sm:justify-start sm:gap-6 border-b border-line-lightest pb-2">
            <dt className="text-ink-lightest min-w-[70px]">공연 상태</dt>
            <dd className="font-medium text-ink-base">
              <span className={show.status === 'ONGOING' ? 'text-brand font-semibold' : ''}>
                {show.statusDisplayName || (show.status === 'ONGOING' ? '공연중' : show.status === 'UPCOMING' ? '공연예정' : '공연종료')}
              </span>
            </dd>
          </div>

          <div className="flex items-baseline justify-between sm:justify-start sm:gap-6 border-b border-line-lightest pb-2">
            <dt className="text-ink-lightest min-w-[70px]">공연 기간</dt>
            <dd className="font-medium text-ink-base">{periodText}</dd>
          </div>

          <div className="flex items-baseline justify-between sm:justify-start sm:gap-6 border-b border-line-lightest pb-2">
            <dt className="text-ink-lightest min-w-[70px]">공연 시간</dt>
            <dd className="font-medium text-ink-base">{show.runtime || '정보 없음'}</dd>
          </div>

          <div className="flex items-baseline justify-between sm:justify-start sm:gap-6 border-b border-line-lightest pb-2">
            <dt className="text-ink-lightest min-w-[70px]">관람 연령</dt>
            <dd className="font-medium text-ink-base">{show.ageLimit || '전체 관람가'}</dd>
          </div>

          <div className="flex items-baseline justify-between sm:justify-start sm:gap-6 border-b border-line-lightest pb-2">
            <dt className="text-ink-lightest min-w-[70px]">공연장</dt>
            <dd className="font-medium text-ink-base">{show.theaterName || '공연장 미정'}</dd>
          </div>

          {show.priceInfo && (
            <div className="sm:col-span-2 flex items-baseline justify-between sm:justify-start sm:gap-6 border-b border-line-lightest pb-2">
              <dt className="text-ink-lightest min-w-[70px]">티켓 가격</dt>
              <dd className="font-medium text-ink-base leading-relaxed">{show.priceInfo}</dd>
            </div>
          )}

          {show.castInfo && show.castInfo.trim() !== '' && (
            <div className="sm:col-span-2 flex items-baseline justify-between sm:justify-start sm:gap-6 border-b border-line-lightest pb-2">
              <dt className="text-ink-lightest min-w-[70px]">출연진</dt>
              <dd className="font-medium text-ink-base leading-relaxed">{show.castInfo}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* 2. 공연장 상세 정보 */}
      <div className="border border-line-base bg-surface-base p-5 sm:p-6">
        <div className="flex items-center justify-between pb-3 border-b border-line-base mb-4">
          <h3 className="text-[13px] font-semibold text-ink-base">
            공연장 안내
          </h3>
          {show.theaterRegion && (
            <span className="text-[11px] text-ink-lightest">{show.theaterRegion}</span>
          )}
        </div>

        <div className="space-y-2 text-[12px]">
          <p className="text-[14px] font-semibold text-ink-darker">{show.theaterName || '공연장 미정'}</p>
          {show.theaterAddress && (
            <p className="flex items-center gap-1.5 text-ink-muted">
              <MapPin size={13} className="text-ink-lightest shrink-0" />
              <span>{show.theaterAddress}</span>
            </p>
          )}
          {show.theaterSeatScale && show.theaterSeatScale > 0 && (
            <p className="text-[11px] text-ink-light">
              좌석 수: <strong className="font-semibold text-ink-base">{show.theaterSeatScale.toLocaleString()}석</strong>
              {show.theaterSeatScale >= 1000 ? ' (대극장)' : show.theaterSeatScale >= 300 ? ' (중극장)' : ' (소극장)'}
            </p>
          )}
        </div>
      </div>

      {/* 3. 예매처 바로가기 */}
      <div className="border border-line-base bg-surface-base p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-[13px] font-semibold text-ink-base">티켓 예매처</h4>
            <p className="mt-0.5 text-[11px] text-ink-lightest">공식 예매처에서 예매 일정과 좌석을 확인하세요.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {bookingLinks.map((link) => (
              <a
                key={link.provider}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-[32px] items-center gap-1.5 border border-line-base bg-surface-base px-3 text-[11px] font-medium text-ink-muted hover:border-line-dark hover:text-ink-base transition-colors"
              >
                {link.name}
                <ExternalLink size={11} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* 4. 작품 상세 소개 이미지 (KOPIS 공식 이미지) */}
      {introImages.length > 0 && (
        <div className="border border-line-base bg-surface-base p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3 border-b border-line-base mb-4">
            <h3 className="text-[13px] font-semibold text-ink-base">
              공식 상세 안내
            </h3>
            <span className="text-[10px] text-ink-lightest">총 {introImages.length}장</span>
          </div>

          <div className="space-y-4">
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
          </div>

          {introImages.length > 2 && (
            <button
              onClick={() => setShowAllImages(!showAllImages)}
              className="mt-4 flex w-full h-[34px] items-center justify-center gap-1 border border-line-base text-[11px] text-ink-muted hover:bg-surface-alt transition-colors"
            >
              {showAllImages ? (
                <>
                  <ChevronUp size={13} /> 접기
                </>
              ) : (
                <>
                  <ChevronDown size={13} /> 펼쳐보기 ({introImages.length - 2}장 더보기)
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
