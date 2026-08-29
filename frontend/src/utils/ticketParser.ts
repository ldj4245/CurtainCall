export interface ParsedTicketInfo {
  showTitle?: string
  watchedDate?: string
  seatInfo?: string
  ticketPrice?: number
}

/**
 * 인터파크, YES24, 멜론티켓, 티켓링크 등의 카카오톡 알림톡/문자 텍스트에서
 * 공연명, 관람일자, 좌석 정보, 결제 금액을 자동 추출합니다.
 */
export function parseTicketText(rawText: string): ParsedTicketInfo {
  const result: ParsedTicketInfo = {}
  if (!rawText || rawText.trim() === '') return result

  // 1. 관람일시 파싱 (YYYY.MM.DD 또는 YYYY-MM-DD 또는 YY.MM.DD)
  const dateMatch = rawText.match(/(?:일시|관람일|날짜|일자|공연일)\s*[:：]?\s*([0-9]{4}[.-][0-9]{1,2}[.-][0-9]{1,2})/)
    || rawText.match(/([0-9]{4})[.-]([0-9]{1,2})[.-]([0-9]{1,2})/)

  if (dateMatch) {
    let dateStr = dateMatch[1]
    // 2024.11.15 -> 2024-11-15 정규화
    dateStr = dateStr.replace(/\./g, '-')
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      const year = parts[0]
      const month = parts[1].padStart(2, '0')
      const day = parts[2].padStart(2, '0')
      result.watchedDate = `${year}-${month}-${day}`
    }
  }

  // 2. 좌석 정보 파싱
  const seatMatch = rawText.match(/(?:좌석|좌석정보|선택좌석)\s*[:：]?\s*([^\n\r]+)/)
    || rawText.match(/([0-9]층\s*[A-Za-z가-힣0-9\s-]*?(?:열|번|구역)[^\n\r]*)/)

  if (seatMatch) {
    let seat = seatMatch[1].trim()
    // 불필요한 매수/가격 표기 정제
    seat = seat.replace(/\(.*?\)|\[.*?\]/g, '').replace(/1매|2매|총\s*\d+매/g, '').trim()
    if (seat) {
      result.seatInfo = seat
    }
  }

  // 3. 금액 파싱
  const priceMatch = rawText.match(/(?:금액|결제금액|티켓금액|총금액|결제)\s*[:：]?\s*([0-9,]+)\s*원?/)
  if (priceMatch) {
    const priceNum = parseInt(priceMatch[1].replace(/,/g, ''), 10)
    if (!isNaN(priceNum) && priceNum > 1000) {
      result.ticketPrice = priceNum
    }
  }

  // 4. 공연명 파싱
  const titleMatch = rawText.match(/(?:공연명|상품명|제목)\s*[:：]?\s*([^\n\r]+)/)
  if (titleMatch) {
    let title = titleMatch[1].trim()
    title = title.replace(/^<|>$|^\[|\]$/g, '').trim()
    result.showTitle = title
  }

  return result
}
