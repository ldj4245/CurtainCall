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
      {/* 1. 관객 종합 평점 배너 */}
      <div className="border border-line-base bg-surface-base p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-1">
              <span className="text-[26px] font-bold tracking-tight text-ink-darkest">
                {avgScore > 0 ? avgScore.toFixed(1) : '-'}
              </span>
              <span className="text-[11px] text-ink-lighter">/ 5.0</span>
            </div>
            <div className="text-[11px] border-l border-line-lightest pl-3">
              <p className="font-semibold text-ink-darker">관람객 평점</p>
              <p className="text-[10px] text-ink-lightest">후기 {show.reviewCount ?? 0}개</p>
            </div>
          </div>

          <button
            onClick={onOpenReviewForm}
            className="h-7 px-2.5 rounded bg-brand text-[11px] font-semibold text-white hover:bg-brand/90 transition-colors"
          >
            후기 작성
          </button>
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
