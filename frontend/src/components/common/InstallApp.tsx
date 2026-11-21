import { useEffect, useState } from 'react'
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
let pendingInstall: InstallEvent | null = null
window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); pendingInstall = event as InstallEvent })
export default function InstallApp() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(pendingInstall)
  useEffect(() => {
    const event = (e: Event) => { e.preventDefault(); setPrompt(e as InstallEvent) }
    window.addEventListener('beforeinstallprompt', event)
    return () => window.removeEventListener('beforeinstallprompt', event)
  }, [])
  if (!prompt || window.matchMedia('(display-mode: standalone)').matches) return null
  return <button className="text-action" onClick={() => { void prompt.prompt().then(() => prompt.userChoice).then(() => setPrompt(null)) }}>홈 화면에 추가</button>
}
