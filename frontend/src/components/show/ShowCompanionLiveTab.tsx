import ShowLiveChat from './ShowLiveChat'
import CompanionList from '../companion/CompanionList'

interface Props {
  showId: number
  isOngoing: boolean
}

export default function ShowCompanionLiveTab({ showId, isOngoing }: Props) {
  return (
    <div className="space-y-6">
      {isOngoing && (
        <section className="border-b border-line-base pb-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
            <h3 className="text-[14px] font-semibold text-ink-base">당일 관람객 채팅</h3>
            <span className="text-[12px] text-ink-lighter">오늘 공연을 보는 관객과 실시간으로 이야기합니다</span>
          </div>
          <details>
            <summary className="cursor-pointer text-[13px] text-ink-base underline underline-offset-4">
              오늘 채팅방 열기
            </summary>
            <div className="mt-4">
              <ShowLiveChat showId={showId} />
            </div>
          </details>
        </section>
      )}

      <section>
        <CompanionList showId={showId} />
      </section>
    </div>
  )
}
