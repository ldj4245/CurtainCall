import { useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

type MockupPage = 'home' | 'detail' | 'diary' | 'login' | 'signup'

const PAGE_LABELS: { key: MockupPage; label: string }[] = [
  { key: 'home', label: '메인' },
  { key: 'detail', label: '공연 상세' },
  { key: 'diary', label: '다이어리' },
  { key: 'login', label: '로그인' },
  { key: 'signup', label: '회원가입' },
]

const shows = [
  { title: '우리의 정원', venue: '대학로 아트원', art: 'OUR\nGARDEN', color: 'bg-[#dce6d5] text-[#244431]' },
  { title: '블루 아워', venue: '국립극장 해오름', art: 'BLUE\nHOUR', color: 'bg-[#302946] text-[#f4ddad]' },
  { title: '더 레터', venue: 'CJ토월극장', art: 'THE\nLETTER', color: 'bg-[#a84e42] text-[#fff3db]' },
  { title: '스틸 라이프', venue: '예스24스테이지', art: 'STILL\nLIFE', color: 'bg-[#dec789] text-[#382d1f]' },
]

function MockPoster({ art, color, className = '' }: { art: string; color: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${color} ${className}`}>
      <span className="absolute left-[19%] top-[16%] h-[52%] w-[58%] border border-current opacity-60" />
      <strong className="absolute bottom-[11%] left-[10%] whitespace-pre-line font-serif text-[clamp(16px,2vw,26px)] leading-[0.86] tracking-[-0.09em]">{art}</strong>
    </div>
  )
}

function MockHeader({ active }: { active?: 'home' | 'shows' | 'diary' | 'companion' }) {
  const links = [
    { key: 'home', label: '홈' },
    { key: 'shows', label: '공연 찾기' },
    { key: 'diary', label: '관극 기록' },
    { key: 'companion', label: '동행' },
  ] as const

  return (
    <header className="flex h-[59px] items-center border-b border-[#e7e7e7] px-5 sm:px-9">
      <div className="flex items-center gap-2 text-[16px] font-semibold tracking-[-0.055em] text-[#202020]">
        <span className="grid h-5 w-5 place-items-center bg-[#9d2244] font-serif text-[13px] text-white">C</span>
        CurtainCall
      </div>
      <nav className="ml-9 hidden h-full items-center gap-6 sm:flex" aria-label="목업 메뉴">
        {links.map((link) => <span key={link.key} className={`flex h-full items-center border-b-2 px-px text-[12px] ${active === link.key ? 'border-[#9d2244] font-semibold text-[#242424]' : 'border-transparent text-[#737373]'}`}>{link.label}</span>)}
      </nav>
      <label className="relative ml-auto hidden w-[205px] sm:block">
        <span className="sr-only">공연 검색</span>
        <input readOnly value="공연명, 배우, 공연장 검색" className="h-[30px] w-full border border-[#dedede] bg-white px-2.5 pr-8 text-[11px] text-[#929292] outline-none" />
        <Search size={14} className="absolute right-2.5 top-2 text-[#777]" />
      </label>
      <span className="ml-4 hidden text-[11px] text-[#777] sm:inline">마이페이지</span>
    </header>
  )
}

function PageHeading({ title, note, action }: { title: string; note?: string; action?: React.ReactNode }) {
  return <div className="mb-6 flex items-end justify-between border-b border-[#282828] pb-4"><h1 className="text-[25px] font-semibold tracking-[-0.06em] text-[#242424]">{title}</h1>{action || <p className="text-[11px] text-[#777]">{note}</p>}</div>
}

function HomeMockup() {
  return (
    <><MockHeader active="home" /><main className="mx-auto min-h-[530px] max-w-[1020px] px-5 py-9 sm:px-10">
      <p className="text-[10px] text-[#666]">홈</p>
      <PageHeading title="이번 주 공연" note="2026년 8월 21일 기준" />
      <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_232px]">
        <section>
          <div className="flex gap-4 border-b border-[#ededed] pb-3.5 text-[12px] text-[#777]"><span className="font-semibold text-[#9d2244]">전체</span><span>뮤지컬</span><span>연극</span><span>클래식</span><span>전시</span></div>
          <div className="mt-6 flex items-baseline justify-between"><h2 className="text-[15px] font-semibold text-[#333]">공연 중인 작품</h2><button type="button" className="text-[11px] text-[#777] underline underline-offset-4">전체 보기</button></div>
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4">
            {shows.map((show) => <article key={show.title} className="min-w-0"><MockPoster art={show.art} color={show.color} className="aspect-[0.7]" /><h3 className="mt-2.5 truncate text-[12px] font-semibold text-[#333]">{show.title}</h3><p className="mt-1 text-[10px] text-[#898989]">{show.venue}</p></article>)}
          </div>
        </section>
        <aside>
          <h2 className="border-b border-[#333] pb-3 text-[13px] font-semibold text-[#333]">오늘의 공연</h2>
          <div className="mt-4 border border-[#e4e4e4] bg-[#fbfbfb] p-3.5"><h3 className="text-[12px] font-semibold text-[#333]">서울 공연 136개</h3><p className="mt-2 text-[11px] leading-5 text-[#777]">예매 마감이 임박한 작품과 개막 예정 공연을 확인하세요.</p></div>
          <div className="mt-6 flex items-baseline justify-between"><h2 className="text-[13px] font-semibold text-[#333]">최근 기록</h2><button type="button" className="text-[10px] text-[#777] underline underline-offset-4">전체</button></div>
          <div className="mt-3 grid grid-cols-[39px_1fr] gap-2.5 border-b border-[#ededed] py-2.5"><MockPoster art="" color="bg-[#3b3154]" className="h-[50px]" /><p className="text-[11px] leading-5 text-[#555]">더 라스트 콜<br /><span className="text-[10px] text-[#999]">08.17 · 1층 B구역 12열</span></p></div>
        </aside>
      </div>
    </main></>
  )
}

function DetailMockup() {
  return (
    <><MockHeader active="shows" /><main className="mx-auto min-h-[530px] max-w-[1020px] px-5 py-9 sm:px-10">
      <p className="text-[10px] text-[#999]">홈&nbsp; › &nbsp;공연 찾기&nbsp; › &nbsp;<span className="text-[#666]">우리의 정원</span></p>
      <section className="mt-5 grid gap-5 sm:grid-cols-[188px_minmax(0,1fr)] sm:gap-7"><MockPoster art="OUR\nGARDEN" color="bg-[#dce6d5] text-[#244431]" className="h-[255px]" />
        <div><span className="text-[11px] font-semibold text-[#9d2244]">뮤지컬 · 공연중</span><h1 className="mt-1 text-[28px] font-semibold tracking-[-0.065em] text-[#242424]">우리의 정원</h1><p className="mt-2 text-[12px] text-[#666]">2026.08.18 — 2026.10.12</p>
          <dl className="mt-4 border-t border-[#e4e4e4] text-[11px]"><div className="grid grid-cols-[75px_1fr] border-b border-[#ededed] py-2"><dt className="text-[#999]">공연장</dt><dd className="m-0 text-[#555]">대학로 아트원씨어터 1관</dd></div><div className="grid grid-cols-[75px_1fr] border-b border-[#ededed] py-2"><dt className="text-[#999]">관람시간</dt><dd className="m-0 text-[#555]">130분 · 인터미션 15분 포함</dd></div><div className="grid grid-cols-[75px_1fr] border-b border-[#ededed] py-2"><dt className="text-[#999]">관람연령</dt><dd className="m-0 text-[#555]">14세 이상 관람가</dd></div></dl>
          <div className="mt-4 flex gap-2"><button type="button" className="h-[34px] bg-[#9d2244] px-3.5 text-[11px] font-semibold text-white">예매처 보기</button><button type="button" className="h-[34px] border border-[#d9d9d9] bg-white px-3.5 text-[11px] text-[#555]">관극 기록하기</button></div></div></section>
      <nav className="mt-8 flex gap-5 border-b border-[#dedede] text-[12px] text-[#777]"><span className="border-b-2 border-[#9d2244] pb-3 font-semibold text-[#333]">공연 정보</span><span className="pb-3">캐스팅</span><span className="pb-3">후기</span><span className="pb-3">좌석 시야</span><span className="pb-3">동행</span></nav>
      <section className="mt-5 grid gap-9 lg:grid-cols-[minmax(0,1fr)_232px]"><article><h2 className="mb-3 text-[14px] font-semibold text-[#333]">작품 소개</h2><p className="max-w-[580px] text-[12px] leading-7 text-[#666]">오래된 정원에 모인 네 사람의 이야기를 따라가는 창작 뮤지컬. 계절이 바뀌는 시간 속에서 서로의 마음을 마주하는 순간을 담았습니다.</p></article><aside><h2 className="border-b border-[#333] pb-3 text-[13px] font-semibold text-[#333]">캐스팅</h2>{[['하윤', '김수연 · 정우연'], ['도윤', '박정민 · 문태유'], ['서진', '이세은 · 최재림']].map(([role, cast]) => <p key={role} className="border-b border-[#ededed] py-3 text-[11px] text-[#555]"><b className="inline-block w-[75px] font-semibold text-[#9d2244]">{role}</b>{cast}</p>)}</aside></section>
    </main></>
  )
}

function DiaryMockup() {
  const entries = [
    { date: '08.17 · 일요일 · 오후 7:30', title: '더 라스트 콜', note: '막이 내린 뒤에도 마지막 장면이 오래 남았다. 넘버가 시작되기 전, 객석이 조용해지는 순간까지.', seat: '1층 B구역 12열', color: 'bg-[#dce6d5]' },
    { date: '08.11 · 월요일 · 오후 8:00', title: '블루 아워', note: '배우들의 호흡이 좋았고, 두 번째 장면의 조명이 특히 인상적이었다.', seat: '2층 C구역 5열', color: 'bg-[#3b3154]' },
  ]
  return (
    <><MockHeader active="diary" /><main className="mx-auto min-h-[530px] max-w-[1020px] px-5 py-9 sm:px-10"><p className="text-[10px] text-[#999]">홈&nbsp; › &nbsp;<span className="text-[#666]">관극 기록</span></p><PageHeading title="나의 관극 기록" action={<button type="button" className="h-[34px] bg-[#9d2244] px-3.5 text-[11px] font-semibold text-white">기록 남기기</button>} />
      <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_232px]"><section><div className="flex items-center justify-between border-b border-[#ededed] pb-3.5"><h2 className="text-[16px] font-semibold text-[#333]">2026년 8월</h2><div className="flex items-center gap-3 text-[11px] text-[#777]"><ChevronLeft size={14} />8월<ChevronRight size={14} /></div></div>{entries.map((entry) => <article key={entry.date} className="grid grid-cols-[73px_minmax(0,1fr)] gap-3.5 border-b border-[#ededed] py-4 sm:grid-cols-[73px_minmax(0,1fr)_auto]"><div className={`h-[98px] ${entry.color}`} /><div><time className="text-[10px] font-semibold text-[#9d2244]">{entry.date}</time><h2 className="mt-1 text-[14px] font-semibold text-[#333]">{entry.title}</h2><p className="mt-2 text-[11px] leading-5 text-[#777]">{entry.note}</p></div><span className="hidden whitespace-nowrap text-right text-[10px] leading-5 text-[#999] sm:block">{entry.seat}<br /><span className="text-[#9d2244]">★</span> 4.8</span></article>)}</section><aside><h2 className="border-b border-[#333] pb-3 text-[13px] font-semibold text-[#333]">내 아카이브</h2><div className="mt-4 flex gap-2.5 border-b border-[#ededed] pb-4"><span className="h-8 w-8 rounded-full bg-[#d9c4b4]" /><p className="text-[11px] leading-5 text-[#555]"><b className="block text-[12px] text-[#333]">지수</b>2026년에 기록한 관극</p></div><dl className="text-[11px]">{[['관람한 공연', '14편'], ['남긴 기록', '11개'], ['가장 많이 간 공연장', '대학로']].map(([label, value]) => <div key={label} className="flex justify-between border-b border-[#ededed] py-2.5"><dt className="text-[#777]">{label}</dt><dd className="m-0 font-semibold text-[#333]">{value}</dd></div>)}</dl></aside></div>
    </main></>
  )
}

function AuthMockup({ signup = false }: { signup?: boolean }) {
  return (
    <div className="grid min-h-[542px] grid-cols-1 sm:grid-cols-[0.8fr_1.2fr]"><aside className="hidden flex-col justify-between bg-[#f6f4f2] p-10 sm:flex"><div><div className="flex items-center gap-2 text-[16px] font-semibold tracking-[-0.055em] text-[#202020]"><span className="grid h-5 w-5 place-items-center bg-[#9d2244] font-serif text-[13px] text-white">C</span>CurtainCall</div><h1 className="mt-9 text-[25px] font-semibold leading-[1.3] tracking-[-0.06em] text-[#292929]">{signup ? <>나만의 관극 기록을<br />시작해 보세요.</> : <>공연을 보고,<br />기억을 남기는 곳.</>}</h1><p className="mt-3 text-[12px] leading-6 text-[#777]">{signup ? <>공연의 제목과 좌석, 그날의 감상을<br />한곳에서 모아볼 수 있습니다.</> : <>보고 싶은 공연을 찾고<br />관람한 순간을 차분하게 기록하세요.</>}</p></div><small className="text-[10px] text-[#999]">© CurtainCall</small></aside>
      <main className="mx-auto w-[83%] max-w-[350px] py-10"><div className="flex items-center gap-2 text-[16px] font-semibold tracking-[-0.055em] text-[#202020]"><span className="grid h-5 w-5 place-items-center bg-[#9d2244] font-serif text-[13px] text-white">C</span>CurtainCall</div><h1 className="mt-9 text-[24px] font-semibold tracking-[-0.055em] text-[#292929]">{signup ? '회원가입' : '로그인'}</h1><p className="mt-2 text-[12px] text-[#777]">{signup ? '기본 정보를 입력해 주세요.' : '기록을 이어서 확인하세요.'}</p>
        {signup ? <div className="mt-5 flex gap-1"><span className="h-[3px] w-[26px] bg-[#9d2244]" /><span className="h-[3px] w-[26px] bg-[#dedede]" /></div> : null}
        <div className="mt-6 space-y-3"><label className="block text-[11px] text-[#555]">이메일<input readOnly value="name@example.com" className="mt-1.5 h-[38px] w-full border border-[#dedede] px-2.5 text-[12px] text-[#999] outline-none" /></label>{signup ? <label className="block text-[11px] text-[#555]">닉네임<input readOnly value="사용할 닉네임" className="mt-1.5 h-[38px] w-full border border-[#dedede] px-2.5 text-[12px] text-[#999] outline-none" /></label> : null}<label className="block text-[11px] text-[#555]">비밀번호<input readOnly value={signup ? '8자 이상 입력' : '••••••••'} className="mt-1.5 h-[38px] w-full border border-[#dedede] px-2.5 text-[12px] text-[#999] outline-none" /></label></div>
        {signup ? <p className="mt-4 border-t border-[#ececec] pt-3 text-[10px] leading-5 text-[#777]">□ 이용약관 및 개인정보 처리방침에 동의합니다.</p> : null}<button type="button" className="mt-5 h-[39px] w-full bg-[#9d2244] text-[12px] font-semibold text-white">{signup ? '다음' : '로그인'}</button>{!signup ? <><div className="my-5 flex items-center gap-2 text-[10px] text-[#aaa]"><span className="h-px flex-1 bg-[#e6e6e6]" />또는<span className="h-px flex-1 bg-[#e6e6e6]" /></div><button type="button" className="h-[38px] w-full border border-[#dfdfdf] bg-white text-[12px] text-[#555]">카카오로 계속하기</button></> : null}<p className="mt-5 text-center text-[11px] text-[#888]">{signup ? <>이미 계정이 있으신가요? <span className="text-[#555] underline underline-offset-4">로그인</span></> : <>처음이신가요? <span className="text-[#555] underline underline-offset-4">회원가입</span></>}</p>
      </main></div>
  )
}

export default function DesignMockupPage() {
  const [page, setPage] = useState<MockupPage>('home')
  const content = { home: <HomeMockup />, detail: <DetailMockup />, diary: <DiaryMockup />, login: <AuthMockup />, signup: <AuthMockup signup /> }[page]

  return (
    <main className="min-h-screen bg-[#f2f2f1] px-4 py-9 sm:px-8">
      <div className="mx-auto max-w-[1120px]"><div className="mb-4 flex flex-wrap gap-2">{PAGE_LABELS.map((item) => <button key={item.key} type="button" onClick={() => setPage(item.key)} className={`h-8 border px-3 text-[12px] transition-colors ${page === item.key ? 'border-[#9d2244] bg-[#9d2244] font-semibold text-white' : 'border-[#dedede] bg-white text-[#666] hover:border-[#9d2244]'}`}>{item.label}</button>)}</div><section className="overflow-hidden border border-[#e5e5e5] bg-white shadow-[0_18px_42px_rgba(0,0,0,0.10)]">{content}</section><p className="mt-4 text-center text-[11px] text-[#8b8b8b]">Design preview · CurtainCall</p></div>
    </main>
  )
}
