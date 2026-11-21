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
  const trimmed = priceInfo?.trim() ?? ''
  if (!trimmed) return []
  if (trimmed === '전석무료' || trimmed === '무료') {
    return [{ grade: '전석', price: '무료' }]
  }

  const normalized = trimmed
    .replace(/(원|무료)\s*,\s*/g, '$1\n')
    .replace(/,\s*(?=[^\d\s])/g, '\n')
    .replace(/[/\n]+/g, '\n')

  const rawParts = normalized.split('\n').map((s) => s.trim()).filter(Boolean)
  const results: PriceGrade[] = []

  for (const part of rawParts) {
    if (part === '전석무료') {
      results.push({ grade: '전석', price: '무료' })
      continue
    }
    const match = part.match(/^(.+?)\s*[:\s-]\s*([0-9][0-9,]*\s*원(?:\s*\([^)]*\))?|[0-9][0-9,]*|무료)$/)
    if (match) {
      const grade = match[1].trim()
      let price = match[2].replace(/\s+원/, '원').trim()
      if (/^[0-9][0-9,]*$/.test(price)) {
        price += '원'
      }
      const isVip = /VIP|OP|R석/i.test(grade)
      results.push({ grade, price, isVip })
    } else {
      results.push({ grade: '안내', price: part })
    }
  }

  return results.length > 0 ? results : [{ grade: '안내', price: trimmed }]
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
      name: 'NOL 티켓(인터파크)',
      url: `https://tickets.interpark.com/search?keyword=${encoded}`,
      badgeColor: 'bg-[#ff2f6e] text-white hover:bg-[#e0245e]',
    },
    {
      provider: 'yes24',
      name: 'YES24 티켓',
      url: `https://ticket.yes24.com/New/Search/Search.aspx?searchtext=${encoded}`,
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

export function formatDtguidance(dtguidance?: string | null): string[] {
  if (!dtguidance || !dtguidance.trim()) return []
  const matches = [...dtguidance.matchAll(/([^()]+?)\(([^)]+)\)/g)]
  if (matches.length === 0) return [dtguidance.trim()]
  return matches
    .map((m) => {
      const days = m[1]
        .replace(/^[,/\s]+/, '')
        .replace(/([월화수목금토일])요일/g, '$1')
        .replace(/\s*~\s*/g, '~')
        .replace(/\bHOL\b/gi, '공휴일')
        .trim()
      const times = m[2]
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .join(', ')
      return days && times ? `${days} ${times}` : `${m[1].trim()}(${m[2].trim()})`
    })
    .filter(Boolean)
}

export function summarizePriceRange(priceInfo?: string | null): string | null {
  if (!priceInfo || !priceInfo.trim()) return null
  const trimmed = priceInfo.trim()
  if (trimmed === '전석무료' || trimmed === '무료') return '무료'
  const matches = [...trimmed.matchAll(/([0-9][0-9,]*)\s*원/g)]
  if (matches.length === 0) return trimmed
  const values = matches
    .map((m) => Number(m[1].replace(/,/g, '')))
    .filter((n) => Number.isFinite(n) && n > 0)
  if (values.length === 0) return trimmed
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) {
    return trimmed.includes('전석') ? `전석 ${min.toLocaleString()}원` : `${min.toLocaleString()}원`
  }
  return `${min.toLocaleString()}원 ~ ${max.toLocaleString()}원`
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
