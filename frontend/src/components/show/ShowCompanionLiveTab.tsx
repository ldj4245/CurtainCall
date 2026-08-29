import ShowLiveChat from './ShowLiveChat'
import CompanionList from '../companion/CompanionList'

interface Props {
  showId: number
  isOngoing: boolean
}

export default function ShowCompanionLiveTab({ showId, isOngoing }: Props) {
  return (
    <div className="space-y-6">
      {/* 1. 당일 관람객 실시간 '오늘 라이브' 채팅 */}
      {isOngoing && (
        <section className="border border-line-base bg-surface-base p-5">
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-line-lightest pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-brand" />
                <span className="text-[11px] font-bold text-brand uppercase tracking-wider">Live today</span>
              </div>
              <h2 className="mt-1 text-[16px] font-semibold tracking-[-0.03em] text-ink-darker">
                오늘의 공연 이야기
              </h2>
              <p className="mt-1 text-[12px] text-ink-light">
                오늘 같은 공연을 본 관객과 감상을 나눠보세요.
              </p>
            </div>
          </div>

          <ShowLiveChat showId={showId} />
        </section>
      )}

      {/* 2. 동행 매칭 목록 */}
      <section>
        <CompanionList showId={showId} />
      </section>
    </div>
  )
}
