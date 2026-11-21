import type { CommunityCategory } from '../../types'

export const COMMUNITY_CATEGORIES: ReadonlyArray<{ value: CommunityCategory; label: string }> = [
  { value: 'FREE', label: '자유' },
  { value: 'REVIEW', label: '후기·감상' },
  { value: 'INFO', label: '정보·꿀팁' },
  { value: 'QUESTION', label: '질문' },
]

export function formatCommunityDate(iso?: string, withTime = false): string {
  if (!iso) return ''
  const date = iso.slice(0, 10).replace(/-/g, '.')
  if (!withTime || iso.length < 16) return date
  return `${date} ${iso.slice(11, 16)}`
}
