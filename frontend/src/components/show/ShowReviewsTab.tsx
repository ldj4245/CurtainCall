import type { Show, DiarySnippet } from '../../types'
import ReviewList from '../review/ReviewList'

interface Props {
  show: Show
  showId: number
  diarySnippets: DiarySnippet[]
  onWriteDiary: () => void
  showReviewForm: boolean
  onOpenReviewForm: () => void
  onCloseReviewForm: () => void
}

export default function ShowReviewsTab({
  show,
  showId,
  diarySnippets,
  onWriteDiary,
  showReviewForm,
  onOpenReviewForm,
  onCloseReviewForm,
}: Props) {
  const avgScore = show.averageScore ?? 0

  return (
    <div className="space-y-8">
      {/* 1. 관객 종합 평점 & 4대 항목별 지수 카드 */}
      <div className="border border-line-base bg-surface-base p-5 sm:p-6">
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
          {/* 종합 평점 */}
          <div className="text-center md:border-r md:border-line-lightest md:pr-6">
            <p className="text-[11px] font-bold text-brand uppercase tracking-wider">Audience score</p>
            <div className="mt-2 flex items-center justify-center gap-1.5">
              <span className="text-[34px] font-semibold tracking-[-0.05em] text-ink-darker">
                {avgScore > 0 ? avgScore.toFixed(1) : '-'}
              </span>
              <span className="mb-1 self-end text-[12px] font-medium text-ink-lighter">/ 5.0</span>
            </div>
            <p className="mt-1 text-[12px] text-ink-lighter">
              후기 {show.reviewCount ?? 0}개
            </p>
            <button
              onClick={onOpenReviewForm}
              className="mt-5 flex w-full h-[34px] items-center justify-center bg-brand text-[11px] font-semibold text-white transition-colors"
            >
              후기 작성
            </button>
          </div>

          {/* 4대 항목별 평가 안내 */}
          <div className="space-y-3">
            <h3 className="text-[16px] font-semibold tracking-[-0.03em] text-ink-darker">
              관람 포인트
            </h3>
            <p className="text-[12px] text-ink-light">
              스토리, 캐스팅, 연출, 음향을 각각 기록할 수 있습니다.
            </p>
            <div className="grid grid-cols-2 divide-x divide-y divide-line-lightest border border-line-lightest pt-1 sm:grid-cols-4 sm:divide-y-0">
              <div className="p-3 text-center">
                <p className="text-[11px] font-medium text-ink-lighter">스토리</p>
                <p className="mt-0.5 text-[12px] font-semibold text-ink-base">서사·각본</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-[11px] font-medium text-ink-lighter">캐스팅</p>
                <p className="mt-0.5 text-[12px] font-semibold text-ink-base">가창·연기</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-[11px] font-medium text-ink-lighter">무대연출</p>
                <p className="mt-0.5 text-[12px] font-semibold text-ink-base">조명·무대</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-[11px] font-medium text-ink-lighter">넘버·음향</p>
                <p className="mt-0.5 text-[12px] font-semibold text-ink-base">사운드·곡</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 공개 관극 다이어리 스니펫 (최신 3개) */}
      {diarySnippets.length > 0 && (
        <div className="border border-line-base bg-surface-base p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-semibold text-ink-base">공개 관극 기록</h3>
              <span className="text-[11px] text-ink-lighter">{diarySnippets.length}</span>
            </div>
            <button
              onClick={onWriteDiary}
              className="text-[11px] text-brand hover:underline underline-offset-2 transition-colors"
            >
              내 기록 남기기
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {diarySnippets.slice(0, 3).map((snippet) => (
              <div
                key={snippet.diaryId}
                className="flex flex-col justify-between space-y-2 border-l-2 border-line-base bg-surface-alt p-4"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-ink-lighter">
                    <span className="font-semibold text-ink-base">{snippet.userNickname || '익명'}</span>
                    <span>{snippet.watchedDate}</span>
                  </div>
                  {snippet.seatInfo && (
                    <span className="mt-1.5 inline-block bg-surface-background px-2 py-1 text-[11px] font-medium text-ink-muted">
                      {snippet.seatInfo}
                    </span>
                  )}
                  {snippet.comment && (
                    <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-ink-muted">
                      "{snippet.comment}"
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 border-t border-line-lightest pt-2">
                  <span className="text-[12px] font-semibold text-brand">★ {snippet.rating}.0</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. 전체 상세 리뷰 목록 */}
      <ReviewList
        showId={showId}
        showReviewForm={showReviewForm}
        onCloseForm={onCloseReviewForm}
      />
    </div>
  )
}
