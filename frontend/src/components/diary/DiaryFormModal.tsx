import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Loader2,
  Search,
  Trash2,
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

const MAX_PHOTOS = 5

interface Props {
  entry?: DiaryEntry
  initialShowId?: number
  initialShowTitle?: string
  mode?: 'quick' | 'full'
  onClose: () => void
  onSaved: (savedEntry: DiaryEntry) => void
}

export default function DiaryFormModal({
  entry,
  initialShowId,
  initialShowTitle,
  mode = 'full',
  onClose,
  onSaved,
}: Props) {
  const queryClient = useQueryClient()
  const isQuickMode = mode === 'quick' && !entry
  const isPresetShow = initialShowId != null && !entry
  const hasEntryExtras = Boolean(
    entry &&
      (entry.seatInfo || entry.castMemo || entry.ticketPrice || entry.photoUrls?.length || entry.isOpen)
  )

  const [rating, setRating] = useState(entry?.rating ?? 5)
  const [showSearch, setShowSearch] = useState('')
  const [selectedShowId, setSelectedShowId] = useState<number | null>(entry?.showId ?? initialShowId ?? null)
  const [selectedShowTitle, setSelectedShowTitle] = useState(entry?.showTitle ?? initialShowTitle ?? '')
  const [photoUrls, setPhotoUrls] = useState<string[]>(entry?.photoUrls ?? [])
  const [isUploading, setIsUploading] = useState(false)
  const [showExtraFields, setShowExtraFields] = useState(!isQuickMode || hasEntryExtras)
  const [showSmartPaste, setShowSmartPaste] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      watchedDate: entry?.watchedDate ?? new Date().toISOString().slice(0, 10),
      rating: entry?.rating ?? 5,
      seatInfo: entry?.seatInfo ?? '',
      castMemo: entry?.castMemo ?? '',
      comment: entry?.comment ?? '',
      ticketPrice: entry?.ticketPrice,
      isOpen: entry?.isOpen ?? true,
    }),
    [entry, initialShowId]
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
    const files = Array.from(event.target.files ?? [])

    if (photoUrls.length + files.length > MAX_PHOTOS) {
      toast.error(`최대 ${MAX_PHOTOS}장까지 가능합니다.`)
      return
    }

    setIsUploading(true)
    try {
      const urls = await Promise.all(files.map((file) => diaryApi.uploadImage(file)))
      setPhotoUrls((prev) => [...prev, ...urls])
    } catch {
      toast.error('업로드 실패')
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
        rating,
        photoUrls,
      }

      return entry ? diaryApi.update(entry.id, payload) : diaryApi.create(payload)
    },
    onSuccess: (savedEntry) => {
      toast.success('저장되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['diary'] })
      queryClient.invalidateQueries({ queryKey: ['diary', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['diary', 'me', 'recent-home'] })
      queryClient.invalidateQueries({ queryKey: ['show-diary-snippets', selectedShowId] })
      onSaved(savedEntry)
    },
    onError: () => {
      toast.error('저장 실패')
    },
  })

  const onSubmit = (data: DiaryCreateRequest) => {
    if (!selectedShowId) {
      toast.error('공연을 선택해 주세요.')
      return
    }
    mutation.mutate(data)
  }

  const title = entry ? '기록 수정' : '기록 작성'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-xl border border-line-lightest bg-white shadow-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line-lightest px-5 py-4">
          <div><p className="text-[10px] text-ink-lightest">Theatre archive</p><h2 className="mt-1 text-[19px] font-semibold tracking-[-0.03em] text-ink-darker">{title}</h2></div>
          <button onClick={onClose} className="p-1 text-ink-light" aria-label="기록 작성 닫기">
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
              {!isPresetShow && !isQuickMode && (
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
                {...register('watchedDate', { required: true })} 
                className="h-10 w-full border border-line-base bg-white px-3 text-[13px] text-ink-base outline-none" 
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-ink-muted">평점</label>
              <div className="flex h-10 items-center justify-between border border-line-base bg-white px-3">
                <StarRating value={rating} onChange={setRating} size="sm" />
                <span className="text-[13px] font-semibold text-ink-base">{rating}.0</span>
              </div>
            </div>
          </div>

          {casting && casting.length > 0 && (
            <div className="space-y-2 border border-line-lightest p-3.5">
              <label className="text-[12px] font-semibold text-ink-muted">캐스팅</label>
              <div className="space-y-2">
                {casting.map((role: CastingRole, rIdx: number) => (
                  <div key={rIdx} className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-[11px] text-ink-lighter">
                      {role.roleName || '배우'}:
                    </span>
                    {role.actors.map((actor, aIdx) => {
                      const isSelected = currentCastMemo.includes(actor.name)
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
              placeholder="공연을 보고 남기고 싶은 장면과 감상을 적어 보세요."
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
                      <div key={url} className="group relative h-16 w-16 overflow-hidden rounded-[2px] border border-line-lightest">
                        <img src={url} alt={`사진 ${index + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100"
                        >
                          <Trash2 size={14} className="text-white" />
                        </button>
                      </div>
                    ))}

                    {photoUrls.length < MAX_PHOTOS && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex h-16 w-16 flex-col items-center justify-center border border-dashed border-line-base text-ink-lighter hover:border-ink-light hover:text-ink-muted disabled:opacity-50"
                      >
                        {isUploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
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

                <label className="flex items-center gap-2 pt-1 text-[13px] text-ink-muted">
                  <input type="checkbox" {...register('isOpen')} className="h-3.5 w-3.5 rounded-sm border-line-base accent-brand" />
                  공개
                </label>
              </div>
            )}
          </div>

          <div className="flex gap-2 border-t border-line-lightest pt-4">
            <button type="button" onClick={onClose} className="h-[39px] flex-1 border border-line-base bg-white text-[12px] text-ink-muted">
              취소
            </button>
            <button type="submit" disabled={mutation.isPending || isUploading} className="h-[39px] flex-1 bg-brand text-[12px] font-semibold text-white">
              {mutation.isPending ? '저장 중' : '기록 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
