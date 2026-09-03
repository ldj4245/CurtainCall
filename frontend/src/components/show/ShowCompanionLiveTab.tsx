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
        <section>
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
