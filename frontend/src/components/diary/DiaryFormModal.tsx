import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Loader2,
  Search,
  X,
  ClipboardPaste,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { diaryApi, type DiaryCreateRequest } from '../../api/diary'
import { showsApi } from '../../api/shows'
import { castingApi, type CastingRole } from '../../api/casting'
import type { DiaryEntry } from '../../types'
import StarRating from '../common/StarRating'
import { parseTicketText } from '../../utils/ticketParser'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { localDate, track } from '../../utils/analytics'
import { compressImageFile } from '../../utils/imageCompress'
import type { ViewingPlan } from '../../api/retention'

const MAX_PHOTOS = 5

interface Props {
  entry?: DiaryEntry
  initialShowId?: number
  initialShowTitle?: string
  initialCastMemo?: string
  initialPlan?: ViewingPlan
  copyEntry?: DiaryEntry
  mode?: 'quick' | 'full'
  onClose: () => void
  onSaved: (savedEntry: DiaryEntry) => void
}

export default function DiaryFormModal({
  entry,
  initialShowId,
  initialShowTitle,
  initialCastMemo,
  initialPlan,
  copyEntry,
  mode = 'quick',
  onClose,
  onSaved,
}: Props) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [draft] = useState(() => {
    if (entry || copyEntry || initialPlan) return undefined
    try {
      const value = JSON.parse(sessionStorage.getItem('diary-draft') || 'null') as (DiaryCreateRequest & { showTitle?: string }) | null
      return value && (!initialShowId || value.showId === initialShowId) ? value : undefined
    } catch { return undefined }
  })
  const isQuickMode = mode === 'quick' && !entry
  const isPresetShow = initialShowId != null && !entry
  const hasEntryExtras = Boolean(
    entry &&
      (entry.seatInfo || entry.castMemo || entry.ticketPrice || entry.photoUrls?.length || entry.isOpen)
  )

  const [rating, setRating] = useState<number>(entry?.rating ?? draft?.rating ?? 0)
  const [showSearch, setShowSearch] = useState('')
  const [selectedShowId, setSelectedShowId] = useState<number | null>(entry?.showId ?? initialShowId ?? copyEntry?.showId ?? draft?.showId ?? null)
  const [selectedShowTitle, setSelectedShowTitle] = useState(entry?.showTitle ?? initialShowTitle ?? copyEntry?.showTitle ?? draft?.showTitle ?? '')
  const [photoUrls, setPhotoUrls] = useState<string[]>(entry?.photoUrls ?? [])
  const [isUploading, setIsUploading] = useState(false)
  const [showExtraFields, setShowExtraFields] = useState(!isQuickMode || hasEntryExtras)
  const [showSmartPaste, setShowSmartPaste] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
      if (event.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not([type="hidden"]):not(:disabled), textarea, select, a[href]')
      const visible = Array.from(focusable ?? []).filter(element => element.getClientRects().length > 0)
      const first = visible[0]
      const last = visible[visible.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', handleKey)
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', handleKey); previousFocus?.focus() }
  }, [])

  const { data: searchResults } = useQuery({
    queryKey: ['shows', 'search', showSearch],
    queryFn: () => showsApi.search({ keyword: showSearch, size: 5 }),
    enabled: !isPresetShow && !selectedShowId && showSearch.length > 1,
  })

  const { data: casting } = useQuery({
    queryKey: ['casting', selectedShowId],
    queryFn: () => (selectedShowId ? castingApi.getByShow(selectedShowId) : Promise.resolve([])),
    enabled: Boolean(selectedShowId),
  })

  const defaultValues = useMemo<DiaryCreateRequest>(
    () => ({
      showId: entry?.showId ?? initialShowId ?? 0,
      watchedDate: entry?.watchedDate ?? initialPlan?.watchedDate ?? draft?.watchedDate ?? localDate(),
      rating: entry?.rating ?? draft?.rating ?? null,
      seatInfo: entry?.seatInfo ?? initialPlan?.seatInfo ?? draft?.seatInfo ?? '',
      castMemo: entry?.castMemo ?? copyEntry?.castMemo ?? initialCastMemo ?? draft?.castMemo ?? '',
      comment: entry?.comment ?? draft?.comment ?? '',
      ticketPrice: entry?.ticketPrice ?? draft?.ticketPrice,
      isOpen: entry?.isOpen ?? draft?.isOpen ?? false,
      hasSpoiler: entry?.hasSpoiler ?? draft?.hasSpoiler ?? false,
    }),
    [entry, initialShowId, initialCastMemo, initialPlan, copyEntry, draft]
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
  } = useForm<DiaryCreateRequest>({
    defaultValues,
  })

  const currentCastMemo = watch('castMemo') || ''
  const formValues = watch()
  useEffect(() => {
    if (entry) return
    try { sessionStorage.setItem('diary-draft', JSON.stringify({ ...formValues, showId: selectedShowId, showTitle: selectedShowTitle, rating: rating || null })) } catch { /* Storage can be disabled. */ }
  }, [entry, formValues, selectedShowId, selectedShowTitle, rating])
  useEffect(() => { track('diary_start', initialShowId) }, [initialShowId])

  const handleActorToggle = (actorName: string) => {
    const actors = currentCastMemo
      .split(/[,/]+/)
      .map((s) => s.trim())
      .filter(Boolean)

    let updated: string[]
    if (actors.includes(actorName)) {
      updated = actors.filter((name) => name !== actorName)
    } else {
      updated = [...actors, actorName]
    }
    setValue('castMemo', updated.join(', '))
  }

  const handleApplySmartPaste = () => {
    if (!pasteText.trim()) {
      toast.error('텍스트를 입력해 주세요.')
      return
    }

    const parsed = parseTicketText(pasteText)
    let appliedCount = 0

    if (parsed.watchedDate) {
      setValue('watchedDate', parsed.watchedDate)
      appliedCount++
    }
    if (parsed.seatInfo) {
      setValue('seatInfo', parsed.seatInfo)
      appliedCount++
    }
    if (parsed.ticketPrice) {
      setValue('ticketPrice', parsed.ticketPrice)
      appliedCount++
    }
    if (parsed.showTitle && !selectedShowId) {
      setShowSearch(parsed.showTitle)
    }

    if (appliedCount > 0) {
      toast.success(`${appliedCount}건 적용됨`)
      setShowExtraFields(true)
      setShowSmartPaste(false)
      setPasteText('')
    } else {
      toast('일치하는 정보를 찾지 못했습니다.')
    }
  }

  const handlePhotoSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) { toast('사진은 로그인 후 첨부할 수 있습니다.'); return }
    const files = Array.from(event.target.files ?? [])

    if (photoUrls.length + files.length > MAX_PHOTOS) {
      toast.error(`최대 ${MAX_PHOTOS}장까지 가능합니다.`)
      return
    }

    setIsUploading(true)
    try {
      const processed = await Promise.all(files.map((file) => compressImageFile(file)))
      const urls = await Promise.all(processed.map((file) => diaryApi.uploadImage(file)))
      setPhotoUrls((prev) => [...prev, ...urls])
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(message || '사진 업로드에 실패했습니다.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
  }

  const mutation = useMutation({
    mutationFn: (data: DiaryCreateRequest) => {
      const payload: DiaryCreateRequest = {
        ...data,
        showId: selectedShowId!,
        rating: rating || null,
        ticketPrice: typeof data.ticketPrice === 'number' && Number.isFinite(data.ticketPrice) ? data.ticketPrice : undefined,
        photoUrls,
        planId: initialPlan?.id,
      }

      return entry ? diaryApi.update(entry.id, payload) : diaryApi.create(payload)
    },
    onSuccess: (savedEntry) => {
      if (!entry) sessionStorage.removeItem('diary-draft')
      track('diary_saved', selectedShowId ?? undefined)
      toast.success('저장되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['diary'] })
      queryClient.invalidateQueries({ queryKey: ['diary', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['diary', 'me', 'recent-home'] })
      queryClient.invalidateQueries({ queryKey: ['show-diary-snippets', selectedShowId] })
      queryClient.invalidateQueries({ queryKey: ['public-records', selectedShowId] })
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      queryClient.invalidateQueries({ queryKey: ['show', selectedShowId] })
      onSaved(savedEntry)
    },
    onError: (error: any) => {
      track('diary_save_failed', selectedShowId ?? undefined)
      toast.error(error.response?.data?.message || '저장하지 못했습니다. 입력한 내용은 유지됩니다.')
    },
  })

  const onSubmit = (data: DiaryCreateRequest) => {
    if (!selectedShowId) {
      toast.error('공연을 선택해 주세요.')
      return
    }
    if (!isAuthenticated) {
      sessionStorage.setItem('postLoginRedirect', '/diary?compose=1')
      navigate('/login')
      return
    }
    mutation.mutate(data)
  }

  const title = entry ? '기록 수정' : '기록 작성'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-dialog-title"
        tabIndex={-1}
        className="record-dialog w-full max-w-xl border border-line-base bg-surface-base rounded-xl shadow-2xl overflow-hidden outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line-lightest px-5 py-4">
          <div>

            <h2 id="record-dialog-title" className="text-[22px] font-medium tracking-tight text-ink-darkest">{title}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-ink-lightest hover:text-ink-dark transition-colors" aria-label="기록 작성 닫기">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="max-h-[78vh] space-y-5 overflow-y-auto px-5 py-5">
          <div className="flex items-center justify-between border-l-2 border-brand bg-surface-alt px-3.5 py-3">
            <span className="text-[13px] text-ink-muted">예매 내역에서 정보 가져오기</span>
            <button
              type="button"
              onClick={() => setShowSmartPaste(!showSmartPaste)}
              className="flex items-center gap-1 text-[11px] text-ink-light underline underline-offset-4"
            >
              <ClipboardPaste size={14} />
              {showSmartPaste ? '닫기' : '붙여넣기'}
            </button>
          </div>

          {showSmartPaste && (
            <div className="space-y-3 border border-line-lightest p-3">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={3}
                placeholder="예매 완료 메시지를 붙여넣으세요"
                className="min-h-[84px] w-full resize-none border border-line-base bg-surface-alt p-3 text-[13px] text-ink-base placeholder:text-ink-lighter focus:border-ink-dark focus:bg-white focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSmartPaste(false)}
                  className="h-8 border border-line-base px-3 text-[11px] text-ink-muted bg-white"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleApplySmartPaste}
                  className="h-8 bg-ink-darkest px-3 text-[11px] font-semibold text-white"
                >
                  적용
                </button>
              </div>
            </div>
          )}

          {selectedShowTitle ? (
            <div className="flex items-center justify-between border border-line-lightest bg-surface-alt p-3.5">
              <div>
                <span className="text-[10px] text-ink-lighter">선택한 공연</span>
                <p className="mt-1 text-[14px] font-semibold text-ink-base">{selectedShowTitle}</p>
              </div>
              {!isPresetShow && !entry && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedShowId(null)
                    setSelectedShowTitle('')
                  }}
                  className="text-[11px] text-ink-light underline underline-offset-4"
                >
                  변경
                </button>
              )}
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-ink-muted">공연 검색</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-lighter" size={14} />
                <input
                  type="text"
                  value={showSearch}
                  onChange={(e) => setShowSearch(e.target.value)}
                  placeholder="공연명 입력"
                  className="h-10 w-full border border-line-base bg-white pl-9 pr-3 text-[13px] text-ink-base outline-none"
                />
              </div>

              {searchResults && searchResults.content.length > 0 && showSearch.length > 1 && (
                <div className="mt-2 border border-line-lightest bg-white">
                  {searchResults.content.map((show) => (
                    <button
                      key={show.id}
                      type="button"
                      onClick={() => {
                        setSelectedShowId(show.id)
                        setSelectedShowTitle(show.title)
                        setShowSearch('')
                      }}
                      className="flex w-full items-center gap-3 border-b border-line-lightest px-3 py-2.5 text-left hover:bg-surface-alt last:border-0"
                    >
                      {show.posterUrl ? (
                        <img src={show.posterUrl} alt={show.title} className="h-10 w-7 rounded-[2px] object-cover" />
                      ) : (
                        <div className="h-10 w-7 rounded-[2px] bg-surface-background" />
                      )}
                      <div>
                        <p className="text-[13px] font-semibold text-ink-base">{show.title}</p>
                        <p className="text-[11px] text-ink-lighter">{show.theaterName}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-ink-muted">관람일</label>
              <input
                type="date"
                max={localDate()}
                {...register('watchedDate', { required: true })}
                className="h-10 w-full border border-line-base bg-white px-3 text-[13px] text-ink-base outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-ink-muted">평점 (선택)</label>
              <div className="flex h-10 items-center justify-between border border-line-base bg-white px-3">
                <StarRating value={rating} onChange={setRating} size="sm" />
                <button type="button" onClick={() => setRating(0)} className="text-[12px] text-ink-muted">{rating ? `${rating}.0 · 지우기` : '미입력'}</button>
              </div>
            </div>
          </div>

          {casting && casting.length > 0 && (
            <div className="space-y-2 border border-line-lightest p-3.5">
              <label className="text-[12px] font-semibold text-ink-muted">관람한 배우 선택</label>
              <p className="feed-meta">전체 출연진입니다. 실제 관람한 회차의 배우만 선택해 주세요.</p>
              <div className="space-y-2">
                {casting.map((role: CastingRole, rIdx: number) => (
                  <div key={rIdx} className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-[11px] text-ink-lighter">
                      {role.roleName || '배우'}:
                    </span>
                    {role.actors.map((actor, aIdx) => {
                      const isSelected = currentCastMemo.split(',').map(name => name.trim()).includes(actor.name)
                      return (
                        <button
                          key={aIdx}
                          type="button"
                          onClick={() => handleActorToggle(actor.name)}
                          className={`border px-2 py-1 text-[11px] ${
                            isSelected
                              ? 'border-brand bg-brand text-white'
                              : 'border-line-lightest bg-white text-ink-muted hover:border-line-base'
                          }`}
                        >
                          {actor.name}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-ink-muted">감상</label>
            <textarea
              {...register('comment')}
              rows={3}
              placeholder="감상 입력 (선택)"
              className="min-h-[110px] w-full resize-none border border-line-base bg-surface-alt p-3.5 text-[13px] leading-6 text-ink-base placeholder:text-ink-lighter focus:border-ink-dark focus:bg-white focus:outline-none"
            />
          </div>

          <div className="border border-line-lightest">
            <button
              type="button"
              onClick={() => setShowExtraFields((prev) => !prev)}
              className="flex w-full items-center justify-between px-3.5 py-3 text-left hover:bg-surface-alt"
            >
              <span className="text-[13px] font-semibold text-ink-base">추가 정보 · 좌석, 가격, 사진</span>
              {showExtraFields ? <ChevronUp size={14} className="text-ink-lighter" /> : <ChevronDown size={14} className="text-ink-lighter" />}
            </button>

            {showExtraFields && (
              <div className="space-y-4 border-t border-line-lightest p-3.5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-ink-muted">좌석</label>
                    <input
                      type="text"
                      {...register('seatInfo')}
                      className="h-10 w-full border border-line-base bg-white px-3 text-[13px] text-ink-base outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-ink-muted">가격</label>
                    <input
                      type="number"
                      {...register('ticketPrice', { valueAsNumber: true })}
                      className="h-10 w-full border border-line-base bg-white px-3 text-[13px] text-ink-base outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-ink-muted">캐스팅 메모</label>
                  <input
                    type="text"
                    {...register('castMemo')}
                    className="h-10 w-full border border-line-base bg-white px-3 text-[13px] text-ink-base outline-none"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[12px] font-semibold text-ink-muted">사진</label>
                    <span className="text-[11px] text-ink-lighter">
                      {photoUrls.length}/{MAX_PHOTOS}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {photoUrls.map((url, index) => (
                      <div key={url} className="relative h-16 w-16 overflow-hidden rounded border border-line-base bg-surface-alt">
                        <img src={url} alt={`사진 ${index + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors shadow-sm"
                          aria-label="사진 삭제"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}

                    {photoUrls.length < MAX_PHOTOS && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex h-16 w-16 flex-col items-center justify-center rounded border border-dashed border-line-dark text-ink-muted hover:border-ink-darkest hover:text-ink-darkest disabled:opacity-50 transition-colors"
                      >
                        {isUploading ? <Loader2 size={14} className="animate-spin text-brand" /> : <ImagePlus size={16} />}
                        <span className="mt-1 text-[9px]">추가</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </div>

              </div>
            )}
          </div>

          <label className="record-privacy">
            <span><strong>{watch('isOpen') ? '공개 기록' : '나만 보는 기록'}</strong><small>{watch('isOpen') ? '감상과 사진이 공연 페이지에 표시됩니다.' : '공개를 선택하지 않으면 나에게만 표시됩니다.'}</small></span>
            <span className="flex items-center gap-2 shrink-0"><input type="checkbox" {...register('isOpen')} className="h-4 w-4 accent-brand" />공개하기</span>
          </label>
          {watch('isOpen') && <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('hasSpoiler')} />스포일러 포함</label>}
          {!isAuthenticated && <p className="feed-meta">입력한 내용을 유지한 채 로그인으로 이동합니다.</p>}
          <div className="flex gap-2 border-t border-line-lightest pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 flex-1 border border-line-base bg-white rounded-md text-[13px] font-medium text-ink-muted hover:bg-surface-alt transition-colors inline-flex items-center justify-center"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || isUploading}
              className="h-10 flex-1 bg-brand text-white rounded-md text-[13px] font-semibold hover:bg-brand/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
            >
              {mutation.isPending ? <Loader2 size={15} className="animate-spin" /> : !isAuthenticated ? '로그인 후 저장' : entry ? '수정 완료' : '기록 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
