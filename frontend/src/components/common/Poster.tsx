import { useState } from 'react'

export default function Poster({ src, title, className = '' }: { src?: string; title: string; className?: string }) {
  const [failedSrc, setFailedSrc] = useState<string>()
  const hasImage = src && src !== failedSrc && !src.endsWith('/curtain.svg')
  return <div className={`poster-art ${className}`}>{hasImage ? <img src={src} alt={title} loading="lazy" onError={() => setFailedSrc(src)} /> : <div className="poster-placeholder" role="img" aria-label={`${title} 포스터 없음`}><span>{title}</span><small>포스터 없음</small></div>}</div>
}

