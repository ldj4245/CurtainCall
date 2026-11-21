import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { communityApi } from '../../api/community'
import { showsApi, type ShowAutocomplete } from '../../api/shows'
import type { CommunityCategory } from '../../types'
import { COMMUNITY_CATEGORIES } from './constants'

interface SelectedShow {
  id: number
  title: string
}

export default function CommunityEditorPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const parsedId = id ? Number(id) : NaN
  const validEditId = isEdit && Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [category, setCategory] = useState<CommunityCategory>('FREE')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedShow, setSelectedShow] = useState<SelectedShow | null>(null)
  const [showQuery, setShowQuery] = useState('')
  const [debouncedShowQuery, setDebouncedShowQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const initializedIdRef = useRef<number | null>(null)
  const showBoxRef = useRef<HTMLDivElement>(null)

  const { data: existingPost, isLoading: loadingPost, isError: loadError } = useQuery({
    queryKey: ['community-post-edit', validEditId],
    queryFn: () => communityApi.getPost(validEditId!, false),
    enabled: validEditId !== null,
  })

  useEffect(() => {
    if (!existingPost) return
    if (!existingPost.author) {
      toast.error('작성자만 수정할 수 있습니다.')
      navigate(`/community/${existingPost.id}`, { replace: true })
      return
    }
    if (initializedIdRef.current === existingPost.id) return
    initializedIdRef.current = existingPost.id
    setCategory(existingPost.category)
    setTitle(existingPost.title)
    setContent(existingPost.content)
    if (existingPost.showId && existingPost.showTitle) {
      setSelectedShow({ id: existingPost.showId, title: existingPost.showTitle })
    }
  }, [existingPost, navigate])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedShowQuery(showQuery.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [showQuery])

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (showBoxRef.current && !showBoxRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const { data: suggestions = [] } = useQuery<ShowAutocomplete[]>({
    queryKey: ['shows', 'community-autocomplete', debouncedShowQuery],
    queryFn: () => showsApi.autocomplete(debouncedShowQuery),
    enabled: !selectedShow && dropdownOpen && debouncedShowQuery.length >= 2,
    staleTime: 60_000,
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        category,
        showId: selectedShow ? selectedShow.id : null,
        title: title.trim(),
        content: content.trim(),
      }
      return validEditId !== null
        ? communityApi.updatePost(validEditId, payload)
        : communityApi.createPost(payload)
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(['community-post', saved.id], saved)
      void queryClient.invalidateQueries({ queryKey: ['community-posts'] })
      void queryClient.invalidateQueries({ queryKey: ['my-community-posts'] })
      toast.success(isEdit ? '게시글이 수정되었습니다.' : '게시글이 등록되었습니다.')
      navigate(`/community/${saved.id}`, { replace: true })
    },
    onError: () => {
      toast.error(isEdit ? '게시글 수정에 실패했습니다.' : '게시글 등록에 실패했습니다.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim().length < 2) {
      toast.error('제목은 2자 이상 입력해 주세요.')
      return
    }
    if (content.trim().length < 2) {
      toast.error('내용은 2자 이상 입력해 주세요.')
      return
    }
    saveMutation.mutate()
  }

  if (isEdit && validEditId === null) {
    return (
      <div className="page-width">
        <p className="feed-notice">잘못된 게시글 경로입니다.</p>
        <Link to="/community" className="text-link">목록으로</Link>
      </div>
    )
  }

  if (isEdit && loadingPost) {
    return (
      <div className="page-width">
        <p className="feed-notice">불러오는 중...</p>
      </div>
    )
  }

  if (isEdit && (loadError || !existingPost)) {
    return (
      <div className="page-width">
        <p className="feed-notice">수정할 게시글을 찾을 수 없습니다.</p>
        <Link to="/community" className="text-link">목록으로</Link>
      </div>
    )
  }

  return (
    <div className="page-width">
      <div className="max-w-[760px] pb-14">
        <header className="page-heading border-b border-line-base">
          <h1>{isEdit ? '글 수정' : '글쓰기'}</h1>
        </header>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <span className="block text-[12px] font-medium text-[#666] mb-2">카테고리</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="카테고리 선택">
              {COMMUNITY_CATEGORIES.map((item) => {
                const active = category === item.value
                return (
                  <button
                    key={item.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setCategory(item.value)}
                    className={
                      active
                        ? 'border border-[#242424] bg-[#242424] px-3 py-1.5 text-[12px] font-medium text-white rounded-[2px]'
                        : 'border border-[#ccc] bg-white px-3 py-1.5 text-[12px] text-[#555] hover:border-[#888] rounded-[2px]'
                    }
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div ref={showBoxRef} className="relative">
            <label htmlFor="community-show-search" className="block text-[12px] font-medium text-[#666] mb-2">
              관련 공연 (선택)
            </label>
            {selectedShow ? (
              <div className="flex items-center justify-between gap-3 border border-[#e5e5e5] bg-white px-3 py-2 text-[13px]">
                <span className="font-medium text-[#242424] truncate">{selectedShow.title}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedShow(null)
                    setShowQuery('')
                  }}
                  className="text-action shrink-0"
                >
                  해제
                </button>
              </div>
            ) : (
              <>
                <input
                  id="community-show-search"
                  type="text"
                  value={showQuery}
                  onFocus={() => setDropdownOpen(true)}
                  onChange={(e) => {
                    setShowQuery(e.target.value)
                    setDropdownOpen(true)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setDropdownOpen(false)
                  }}
                  placeholder="공연명으로 검색해 연결할 수 있습니다"
                  className="w-full h-9 border border-[#ccc] bg-white px-3 text-[13px] text-[#111] outline-none focus:border-[#242424]"
                />
                {dropdownOpen && suggestions.length > 0 && (
                  <ul
                    className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto border border-[#e5e5e5] bg-white shadow-sm"
                    role="listbox"
                  >
                    {suggestions.slice(0, 6).map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedShow({ id: item.id, title: item.title })
                            setShowQuery('')
                            setDropdownOpen(false)
                          }}
                          className="w-full px-3 py-2 text-left text-[13px] text-[#242424] hover:bg-[#f5f5f5] border-b border-[#f0f0f0] last:border-b-0"
                        >
                          {item.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          <div>
            <label htmlFor="community-title" className="block text-[12px] font-medium text-[#666] mb-2">
              제목
            </label>
            <input
              id="community-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="제목을 입력해 주세요 (2자 이상)"
              className="w-full h-10 border border-[#ccc] bg-white px-3 text-[14px] text-[#111] outline-none focus:border-[#242424]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="community-content" className="text-[12px] font-medium text-[#666]">
                내용
              </label>
              <span className="text-[11px] text-[#999] tabular-nums">{content.length} / 5000</span>
            </div>
            <textarea
              id="community-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              maxLength={5000}
              placeholder="공연 이야기, 관극 팁, 질문을 자유롭게 남겨 주세요."
              className="w-full border border-[#ccc] bg-white px-3 py-2.5 text-[14px] leading-relaxed text-[#111] outline-none focus:border-[#242424] resize-y"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Link
              to={validEditId !== null ? `/community/${validEditId}` : '/community'}
              className="button-secondary"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="button-primary"
            >
              {isEdit ? '수정 완료' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
