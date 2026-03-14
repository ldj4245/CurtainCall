import { BookOpen, CalendarDays, MessageCircle, Share2, Star, Users } from 'lucide-react'

function PreviewLabel({ children }: { children: React.ReactNode }) {
  return <p className="journal-kicker">{children}</p>
}

export default function JournalRefreshPreview() {
  return (
    <div className="min-h-screen bg-[#f8f2ec] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="paper-panel p-6 sm:p-8">
          <PreviewLabel>preview board</PreviewLabel>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-gray-900 sm:text-5xl">
            감성 다이어리 중심 UX 방향
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-600 sm:text-base">
            홈은 기록하러 오게 만들고, 공연 상세는 행동으로 이어지게 만들고, 다이어리는 보기만 해도
            쓰고 싶어지는 개인 기록장처럼 보이게 하는 방향을 미리 확인하는 프리뷰 보드입니다.
          </p>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <section className="paper-panel overflow-hidden p-5 sm:p-6">
            <PreviewLabel>home</PreviewLabel>
            <div className="mt-4 journal-hero rounded-[28px] p-5 sm:p-6">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
                <div>
                  <h2 className="text-3xl font-black tracking-[-0.04em] text-gray-900">
                    공연을 보고 난
                    <br />
                    기분을 남기는 홈
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600">
                    기록이 가장 먼저 보여야 하고, 인기 정보는 그다음에 따라와야 합니다.
                  </p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button className="btn-primary px-5 py-3">오늘 기록하기</button>
                    <button className="btn-secondary px-5 py-3">공연 찾기</button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="ticket-panel p-4">
                    <PreviewLabel>최근 기록</PreviewLabel>
                    <p className="mt-3 text-lg font-semibold text-gray-900">웃는 남자</p>
                    <p className="mt-1 text-sm text-gray-500">2026.03.12 관람</p>
                    <p className="mt-3 text-sm leading-6 text-gray-600">
                      엔딩 장면에서 마음이 오래 남았던 날.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="paper-panel p-4">
                      <BookOpen className="h-4 w-4 text-brand" />
                      <p className="mt-3 text-sm font-semibold text-gray-900">다이어리</p>
                    </div>
                    <div className="paper-panel p-4">
                      <Users className="h-4 w-4 text-brand" />
                      <p className="mt-3 text-sm font-semibold text-gray-900">동행</p>
                    </div>
                    <div className="paper-panel p-4">
                      <MessageCircle className="h-4 w-4 text-brand" />
                      <p className="mt-3 text-sm font-semibold text-gray-900">후기</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="paper-panel overflow-hidden p-5 sm:p-6">
            <PreviewLabel>show detail</PreviewLabel>
            <div className="mt-4 rounded-[28px] bg-[#fbf8f4] p-5">
              <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                <div className="hidden rounded-[24px] bg-[#dbc8bb] lg:block" />
                <div>
                  <h2 className="text-3xl font-black tracking-[-0.04em] text-gray-900">하데스타운</h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4">
                    <div className="paper-panel p-4">
                      <PreviewLabel>동행</PreviewLabel>
                      <p className="mt-2 font-semibold text-gray-900">3개 모집</p>
                    </div>
                    <div className="paper-panel p-4">
                      <PreviewLabel>후기</PreviewLabel>
                      <p className="mt-2 font-semibold text-gray-900">29개</p>
                    </div>
                    <div className="paper-panel p-4">
                      <PreviewLabel>별점</PreviewLabel>
                      <p className="mt-2 font-semibold text-gray-900">4.7</p>
                    </div>
                    <div className="paper-panel p-4">
                      <PreviewLabel>상태</PreviewLabel>
                      <p className="mt-2 font-semibold text-gray-900">공연중</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <button className="btn-primary px-4 py-3">다이어리 작성</button>
                    <button className="btn-secondary px-4 py-3">동행 보기</button>
                    <button className="btn-secondary px-4 py-3">후기 보기</button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="paper-panel overflow-hidden p-5 sm:p-6">
            <PreviewLabel>diary hub</PreviewLabel>
            <div className="mt-4 rounded-[28px] bg-white p-5 ring-1 ring-black/5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-3xl font-black tracking-[-0.04em] text-gray-900">관극 다이어리</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    탭보다 먼저 최근 기록과 새 기록 행동이 보여야 합니다.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary px-4 py-3">새 기록 남기기</button>
                  <button className="btn-secondary px-4 py-3">
                    <Share2 size={16} />
                    공유
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                <div className="paper-panel p-4">
                  <PreviewLabel>총 관극</PreviewLabel>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">18회</p>
                </div>
                <div className="paper-panel p-4">
                  <PreviewLabel>이번 달</PreviewLabel>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">3회</p>
                </div>
                <div className="paper-panel p-4">
                  <PreviewLabel>평균 평점</PreviewLabel>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">4.5</p>
                </div>
                <div className="paper-panel p-4">
                  <PreviewLabel>최근 기록</PreviewLabel>
                  <p className="mt-2 text-lg font-semibold text-gray-900">어쩌면 해피엔딩</p>
                </div>
              </div>
            </div>
          </section>

          <section className="paper-panel overflow-hidden p-5 sm:p-6">
            <PreviewLabel>diary modal</PreviewLabel>
            <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-[28px] bg-[#fffdf9] p-5 ring-1 ring-[#eadfd4]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="journal-kicker">core fields first</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                      필수 입력은 가볍게
                    </h2>
                  </div>
                  <button className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500">
                    저장
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="paper-panel p-4">
                    <CalendarDays className="h-4 w-4 text-brand" />
                    <p className="mt-3 text-sm font-semibold text-gray-900">관람일</p>
                  </div>
                  <div className="paper-panel p-4">
                    <Star className="h-4 w-4 text-brand" />
                    <p className="mt-3 text-sm font-semibold text-gray-900">평점</p>
                  </div>
                  <div className="paper-panel p-4">
                    <BookOpen className="h-4 w-4 text-brand" />
                    <p className="mt-3 text-sm font-semibold text-gray-900">감상</p>
                    <p className="mt-2 text-sm text-gray-500">어떤 장면이 가장 오래 남았나요?</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-dashed border-brand/20 bg-[#fbf5ef] p-5">
                <PreviewLabel>optional details</PreviewLabel>
                <p className="mt-3 text-lg font-semibold text-gray-900">추가로 남기기</p>
                <ul className="mt-4 space-y-3 text-sm text-gray-600">
                  <li>좌석 정보</li>
                  <li>캐스트 메모</li>
                  <li>티켓 금액</li>
                  <li>사진 업로드</li>
                  <li>공개 여부</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
