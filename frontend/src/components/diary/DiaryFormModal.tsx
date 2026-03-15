import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, ImagePlus, Loader2, Search, Trash2, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { diaryApi, type DiaryCreateRequest } from '../../api/diary'
import { showsApi } from '../../api/shows'
import type { DiaryEntry } from '../../types'
import StarRating from '../common/StarRating'

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
  const [showExtraFields, setShowExtraFields] = useState(
    !isQuickMode || hasEntryExtras
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: searchResults } = useQuery({
    queryKey: ['shows', 'search', showSearch],
    queryFn: () => showsApi.search({ keyword: showSearch, size: 5 }),
    enabled: !isPresetShow && !selectedShowId && showSearch.length > 1,
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
      isOpen: entry?.isOpen ?? false,
    }),
    [entry, initialShowId]
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DiaryCreateRequest>({
    defaultValues,
  })

  const handlePhotoSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])

    if (photoUrls.length + files.length > MAX_PHOTOS) {
      toast.error(`사진은 최대 ${MAX_PHOTOS}장까지 첨부할 수 있습니다.`)
      return
    }

    setIsUploading(true)
    try {
      const urls = await Promise.all(files.map((file) => diaryApi.uploadImage(file)))
      setPhotoUrls((prev) => [...prev, ...urls])
    } catch {
      toast.error('사진 업로드에 실패했습니다.')
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
      toast.success(entry ? '기록을 수정했습니다.' : '관극 기록을 저장했습니다.')
      queryClient.invalidateQueries({ queryKey: ['diary'] })
      queryClient.invalidateQueries({ queryKey: ['diary', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['diary', 'me', 'recent-home'] })
      queryClient.invalidateQueries({ queryKey: ['show-diary-snippets', selectedShowId] })
      onSaved(savedEntry)
    },
    onError: () => {
      toast.error('저장에 실패했습니다.')
    },
  })

  const onSubmit = (data: DiaryCreateRequest) => {
    if (!selectedShowId) {
      toast.error('공연을 먼저 선택해 주세요.')
      return
    }

    mutation.mutate(data)
  }

  const title = entry ? '기록 수정' : isQuickMode ? '빠른 기록' : '관극 기록 남기기'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className={`w-full overflow-hidden rounded-2xl bg-white shadow-card-lg ${
          isQuickMode ? 'max-w-xl' : 'max-w-2xl'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {isQuickMode
                ? '관람일, 별점, 한 줄 감상만 먼저 남겨도 됩니다.'
                : '필요한 정보만 골라서 기록해도 충분합니다.'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600" aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="max-h-[80vh] overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-5">
            {selectedShowTitle ? (
              <div className="rounded-2xl border border-gray-100 bg-warm-50 px-4 py-4">
                <p className="text-xs font-medium text-gray-400">공연</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-gray-900">{selectedShowTitle}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {isQuickMode
                        ? '이 공연 기준으로 빠른 기록을 남깁니다.'
                        : '선택한 공연을 기준으로 기록을 작성합니다.'}
                    </p>
                  </div>
                  {!isPresetShow && !isQuickMode ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedShowId(null)
                        setSelectedShowTitle('')
                      }}
                      className="text-sm font-medium text-gray-400 hover:text-brand"
                    >
                      변경
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">공연</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={showSearch}
                    onChange={(event) => setShowSearch(event.target.value)}
                    placeholder="공연명을 검색해 주세요"
                    className="input-field pl-10"
                  />
                </div>

                {searchResults && searchResults.content.length > 0 && showSearch.length > 1 ? (
                  <div className="mt-2 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-card-md">
                    {searchResults.content.map((show) => (
                      <button
                        key={show.id}
                        type="button"
                        onClick={() => {
                          setSelectedShowId(show.id)
                          setSelectedShowTitle(show.title)
                          setShowSearch('')
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-warm-50"
                      >
                        {show.posterUrl ? (
                          <img src={show.posterUrl} alt={show.title} className="h-12 w-9 rounded object-cover" />
                        ) : (
                          <div className="h-12 w-9 rounded bg-warm-100" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">{show.title}</p>
                          <p className="truncate text-xs text-gray-400">{show.theaterName}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">관람일</label>
                <input type="date" {...register('watchedDate', { required: true })} className="input-field" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">별점</label>
                <div className="rounded-xl border border-gray-100 bg-white px-4 py-3">
                  <StarRating value={rating} onChange={setRating} size="lg" />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">한 줄 감상</label>
              <textarea
                {...register('comment', isQuickMode ? { required: '짧은 감상을 한 줄 남겨주세요.' } : undefined)}
                rows={isQuickMode ? 3 : 4}
                placeholder="공연을 보고 가장 먼저 남기고 싶은 장면이나 느낌을 적어보세요."
                className="input-field resize-none"
              />
              {errors.comment ? <p className="mt-2 text-sm text-red-500">{errors.comment.message}</p> : null}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white">
              <button
                type="button"
                onClick={() => setShowExtraFields((prev) => !prev)}
                className="flex w-full items-center justify-between px-4 py-4 text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">추가 정보 입력</p>
                  <p className="mt-1 text-sm text-gray-500">좌석, 캐스트 메모, 가격, 사진, 공개 여부를 남길 수 있습니다.</p>
                </div>
                {showExtraFields ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </button>

              {showExtraFields ? (
                <div className="space-y-4 border-t border-gray-100 px-4 py-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">좌석</label>
                      <input
                        type="text"
                        {...register('seatInfo')}
                        placeholder="예: 1층 A구역 5열 10번"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">예매 가격</label>
                      <input
                        type="number"
                        {...register('ticketPrice', { valueAsNumber: true })}
                        placeholder="예: 150000"
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">캐스트 메모</label>
                    <input
                      type="text"
                      {...register('castMemo')}
                      placeholder="오늘 본 배우나 기억하고 싶은 메모"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">사진</label>
                      <span className="text-xs text-gray-400">
                        {photoUrls.length}/{MAX_PHOTOS}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {photoUrls.map((url, index) => (
                        <div key={url} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-gray-200">
                          <img src={url} alt={`첨부 사진 ${index + 1}`} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                            aria-label="사진 삭제"
                          >
                            <Trash2 size={16} className="text-white" />
                          </button>
                        </div>
                      ))}

                      {photoUrls.length < MAX_PHOTOS ? (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-gray-400 transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
                        >
                          {isUploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                          <span className="mt-1 text-xs">{isUploading ? '업로드 중' : '추가'}</span>
                        </button>
                      ) : null}
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

                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" {...register('isOpen')} className="h-4 w-4 accent-brand" />
                    공개 기록으로 공유하기
                  </label>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex gap-3 border-t border-gray-100 pt-5">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              취소
            </button>
            <button type="submit" disabled={mutation.isPending || isUploading} className="btn-primary flex-1">
              {mutation.isPending ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
