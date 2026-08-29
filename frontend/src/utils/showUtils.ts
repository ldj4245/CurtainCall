export interface PriceGrade {
  grade: string
  price: string
  isVip?: boolean
}

/**
 * KOPIS의 priceInfo 텍스트를 구조화된 좌석 등급 및 가격 목록으로 파싱합니다.
 * 예: "VIP석 170,000원, R석 140,000원, S석 110,000원, A석 80,000원"
 */
export function parsePriceInfo(priceInfo?: string | null): PriceGrade[] {
  if (!priceInfo || priceInfo.trim() === '' || priceInfo === '전석무료') {
    if (priceInfo === '전석무료') return [{ grade: '전석', price: '무료' }]
    return []
  }

  // 쉼표나 슬래시, 줄바꿈으로 분리
  const rawParts = priceInfo.split(/[,/\n]+/).map((s) => s.trim()).filter(Boolean)
  const results: PriceGrade[] = []

  for (const part of rawParts) {
    const match = part.match(/^([가-힣a-zA-Z0-9\s]+?)\s*[:\s-]?\s*([0-9,]+원|[0-9,]+|무료)/)
    if (match) {
      const grade = match[1].trim()
      let price = match[2].trim()
      if (/^[0-9,]+$/.test(price)) {
        price += '원'
      }
      const isVip = /VIP|OP|R석/i.test(grade)
      results.push({ grade, price, isVip })
    } else {
      results.push({ grade: '기본', price: part })
    }
  }

  return results.length > 0 ? results : [{ grade: '입장료', price: priceInfo }]
}

export interface BookingLink {
  provider: 'interpark' | 'yes24' | 'melon' | 'ticketlink'
  name: string
  url: string
  badgeColor: string
}

/**
 * 공연명을 기반으로 주요 예매처의 실시간 검색 딥링크를 생성합니다.
 */
export function getBookingLinks(title: string): BookingLink[] {
  const cleanTitle = title
    .replace(/^\[.*?\]|^<.*?>|^\(.*?\)/g, '')
    .replace(/^(뮤지컬|연극|공연)\s*/g, '')
    .replace(/[<>'"[\]()]/g, '')
    .trim()

  const encoded = encodeURIComponent(cleanTitle || title)

  return [
    {
      provider: 'interpark',
      name: '인터파크 티켓',
      url: `https://tickets.interpark.com/search?keyword=${encoded}`,
      badgeColor: 'bg-[#ff2f6e] text-white hover:bg-[#e0245e]',
    },
    {
      provider: 'yes24',
      name: 'YES24 티켓',
      url: `http://ticket.yes24.com/New/Search/Search.aspx?searchtext=${encoded}`,
      badgeColor: 'bg-[#0074e4] text-white hover:bg-[#0060be]',
    },
    {
      provider: 'melon',
      name: '멜론티켓',
      url: `https://ticket.melon.com/search/index.htm?q=${encoded}`,
      badgeColor: 'bg-[#00cd3c] text-white hover:bg-[#00b334]',
    },
  ]
}

export interface RuntimeBreakdown {
  totalRuntime: string
  act1?: string
  intermission?: string
  act2?: string
}

export function parseRuntimeBreakdown(runtime?: string | null): RuntimeBreakdown {
  if (!runtime || runtime.trim() === '') return { totalRuntime: '정보 없음' }

  const intermissionMatch = runtime.match(/인터미션\s*(\d+)\s*분/)
  if (intermissionMatch) {
    return {
      totalRuntime: runtime,
      intermission: `인터미션 ${intermissionMatch[1]}분 포함`,
    }
  }

  return { totalRuntime: runtime }
}
