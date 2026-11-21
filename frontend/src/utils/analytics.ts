import api from '../api/axios'
type EventName = 'show_view' | 'diary_start' | 'signup_complete' | 'diary_saved' | 'diary_save_failed' | 'plan_saved' | 'share_link_created' | 'shared_record_opened'
const recentlySent = new Map<string, number>()
export function track(name: EventName, showId?: number) {
  const key = name + ":" + (showId ?? "")
  if (["show_view", "diary_start", "shared_record_opened"].includes(name) && Date.now() - (recentlySent.get(key) ?? 0) < 2000) return
  recentlySent.set(key, Date.now())
  if (localStorage.getItem('analytics-disabled') === '1' || navigator.doNotTrack === '1') return
  let sessionId = sessionStorage.getItem('analytics-session')
  if (!sessionId) { sessionId = crypto.randomUUID(); sessionStorage.setItem('analytics-session', sessionId) }
  void api.post('/events', { name, sessionId, showId }).catch(() => {})
}
export function localDate(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}
