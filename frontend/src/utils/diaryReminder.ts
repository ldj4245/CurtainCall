import type { DiaryEntry, DiaryStats } from '../types'

export function getCurrentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function getThisMonthDiaryCount(stats?: DiaryStats, date = new Date()) {
  if (!stats) return 0
  return stats.monthlyCount?.[getCurrentMonthKey(date)] ?? 0
}

export function getDaysSinceWatched(entry?: Pick<DiaryEntry, 'watchedDate'> | null) {
  if (!entry?.watchedDate) return null

  const watchedDate = new Date(`${entry.watchedDate}T00:00:00`)
  const now = new Date()
  const diff = now.getTime() - watchedDate.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export function getDiaryReminder(stats?: DiaryStats, recentEntry?: DiaryEntry | null) {
  const thisMonthCount = getThisMonthDiaryCount(stats)
  const daysSinceRecent = getDaysSinceWatched(recentEntry)

  if (!recentEntry) {
    return {
      title: '첫 관극 기록을 남겨보세요',
      description: '공연을 보고 느낀 점을 짧게 남기면 나중에 다시 꺼내 보기 쉽습니다.',
    }
  }

  if (thisMonthCount === 0) {
    return {
      title: '이번 달 기록이 아직 없습니다',
      description: '최근에 본 공연이 있다면 지금 한 줄이라도 남겨두세요.',
    }
  }

  if (daysSinceRecent !== null && daysSinceRecent >= 7) {
    return {
      title: `최근 기록한 지 ${daysSinceRecent}일 지났습니다`,
      description: `${recentEntry.showTitle} 이후의 관극 기록이 비어 있습니다.`,
    }
  }

  return null
}
