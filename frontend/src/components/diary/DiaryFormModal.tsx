import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, ImagePlus, Loader2, Search, Sparkles, Trash2, X } from 'lucide-react'
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
  onClose: () => void
  onSaved: () => void
}

export default function DiaryFormModal({
  entry,
  initialShowId,
  initialShowTitle,
  onClose,
  onSaved,
}: Props) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isPresetShow = initialShowId != null && !entry

  const [rating, setRating] = useState(entry?.rating ?? 5)
  const [showSearch, setShowSearch] = useState('')
  const [selectedShowId, setSelectedShowId] = useState<number | null>(entry?.showId ?? initialShowId ?? null)
  const [selectedShowTitle, setSelectedShowTitle] = useState(entry?.showTitle ?? initialShowTitle ?? '')
  const [photoUrls, setPhotoUrls] = useState<string[]>(entry?.photoUrls ?? [])
  const [showOptionalFields, setShowOptionalFields] = useState(
    Boolean(entry?.seatInfo || entry?.castMemo || entry?.ticketPrice || entry?.photoUrls?.length)
  )
  const [isUploading, setIsUploading] = useState(false)

  const { data: searchResults } = useQuery({
    queryKey: ['shows', 'search', showSearch],
    queryFn: () => showsApi.search({ keyword: showSearch, size: 5 }),
    enabled: showSearch.trim().length > 1 && !isPresetShow,
  })

  const { register, handleSubmit } = useForm<DiaryCreateRequest>({
    defaultValues: {
      showId: entry?.showId,
      watchedDate: entry?.watchedDate ?? new Date().toISOString().slice(0, 10),
      seatInfo: entry?.seatInfo ?? '',
      castMemo: entry?.castMemo ?? '',
      comment: entry?.comment ?? '',
      ticketPrice: entry?.ticketPrice,
      isOpen: entry?.isOpen ?? false,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: DiaryCreateRequest) => {
      const payload = {
        ...data,
        showId: selectedShowId!,
        rating,
        photoUrls,
      }
      return entry ? diaryApi.update(entry.id, payload) : diaryApi.create(payload)
    },
    onSuccess: () => {
      toast.success(entry ? '기록을 수정했어요.' : '관극 기록을 남겼어요.')
      queryClient.invalidateQueries({ queryKey: ['diary'] })
      queryClient.invalidateQueries({ queryKey: ['diary', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['diary', 'me', 'recent-home'] })
      onSaved()
    },
    onError: () => {
      toast.error('저장에 실패했어요. 잠시 후 다시 시도해주세요.')
    },
  })

  const handlePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])

    if (photoUrls.length + files.length > MAX_PHOTOS) {
      toast.error(`사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있어요.`)
      return
    }

    setIsUploading(true)
    try {
      const uploadedUrls = await Promise.all(files.map((file) => diaryApi.uploadImage(file)))
      setPhotoUrls((prev) => [...prev, ...uploadedUrls])
    } catch {
      toast.error('사진 업로드에 실패했어요.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const onSubmit = (data: DiaryCreateRequest) => {
    if (!selectedShowId) {
      toast.error('공연을 먼저 선택해주세요.')
      return
    }

    mutation.mutate(data)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" onClick={onClose}>
      <div className="flex h-full items-end justify-center sm:items-center sm:p-4">
        <div
          className="flex h-[92vh] w-full flex-col overflow-hidden rounded-t-[28px] bg-[#fffdfa] shadow-card-lg sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-[28px]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="sticky top-0 z-10 border-b border-[#eee5dc] bg-[#fffdfa]/95 px-4 py-4 backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="journal-kicker">{entry ? '기록 다듬기' : '오늘의 관극 기록'}</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                  {entry ? '기록을 더 선명하게 남겨볼까요?' : '공연의 여운을 지금 남겨두세요.'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              <div className="space-y-6">
                <section className="paper-panel p-4 sm:p-5">
                  <p className="journal-kicker">공연</p>
                  {selectedShowTitle ? (
                    <div className="mt-3 rounded-2xl border border-[#e9ddd1] bg-white px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-gray-900">{selectedShowTitle}</p>
                          <p className="mt-1 text-sm text-gray-500">
                            {isPresetShow ? '공연 상세에서 바로 기록 중이에요.' : '선택한 공연으로 기록할게요.'}
                          </p>
                        </div>
                        {!isPresetShow && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedShowId(null)
                              setSelectedShowTitle('')
                            }}
                            className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500 transition-colors hover:border-brand/20 hover:text-brand"
                          >
                            변경
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={showSearch}
                          onChange={(event) => setShowSearch(event.target.value)}
                          placeholder="공연명을 검색해 선택하세요"
                          className="input-field pl-11"
                        />
                      </div>
                      {searchResults && searchResults.content.length > 0 && showSearch.trim().length > 1 && (
                        <div className="mt-2 overflow-hidden rounded-2xl border border-[#e8ded3] bg-white shadow-card-sm">
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
                                <img src={show.posterUrl} alt="" className="h-12 w-9 rounded-lg object-cover" />
                              ) : (
                                <div className="h-12 w-9 rounded-lg bg-warm-100" />
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900">{show.title}</p>
                                <p className="truncate text-xs text-gray-500">{show.theaterName || '공연장 정보 없음'}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </section>

                <section className="paper-panel p-4 sm:p-5">
                  <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">관람일</label>
                      <input
                        type="date"
                        {...register('watchedDate', { required: true })}
                        className="input-field mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">오늘의 별점</label>
                      <div className="mt-3 rounded-2xl border border-[#eee5dc] bg-white px-4 py-4">
                        <StarRating value={rating} onChange={setRating} size="lg" />
                        <p className="mt-3 text-sm text-gray-500">
                          좋았던 순간의 온도를 별점으로 먼저 남겨보세요.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <label className="text-sm font-semibold text-gray-700">감상</label>
                    <textarea
                      {...register('comment')}
                      rows={6}
                      placeholder="어떤 장면이 가장 오래 남았나요? 오늘의 감정, 배우의 순간, 다시 보고 싶은 이유를 적어보세요."
                      className="input-field mt-2 resize-none"
                    />
                  </div>
                </section>

                <section className="paper-panel overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowOptionalFields((prev) => !prev)}
                    className="flex w-full items-center justify-between px-4 py-4 text-left sm:px-5"
                  >
                    <div>
                      <p className="journal-kicker">추가로 남기기</p>
                      <p className="mt-1 text-sm text-gray-500">
                        좌석, 캐스트 메모, 가격, 사진 같은 디테일은 여기에 적어둘 수 있어요.
                      </p>
                    </div>
                    {showOptionalFields ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </button>

                  {showOptionalFields && (
                    <div className="border-t border-[#eee5dc] px-4 py-5 sm:px-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium text-gray-700">좌석</label>
                          <input
                            type="text"
                            {...register('seatInfo')}
                            placeholder="예: 1층 A구역 5열"
                            className="input-field mt-2"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">티켓 가격</label>
                          <input
                            type="number"
                            {...register('ticketPrice', { valueAsNumber: true })}
                            placeholder="예: 150000"
                            className="input-field mt-2"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-700">캐스트 메모</label>
                        <input
                          type="text"
                          {...register('castMemo')}
                          placeholder="오늘 무대에 선 배우, 기억하고 싶은 배역"
                          className="input-field mt-2"
                        />
                      </div>

                      <div className="mt-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <label className="text-sm font-medium text-gray-700">사진</label>
                            <p className="mt-1 text-xs text-gray-500">{photoUrls.length}/{MAX_PHOTOS}장</p>
                          </div>
                          <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                            <input type="checkbox" {...register('isOpen')} className="h-4 w-4 accent-brand" />
                            공개 기록으로 남기기
                          </label>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-3">
                          {photoUrls.map((url, index) => (
                            <div key={url} className="group relative h-24 w-24 overflow-hidden rounded-2xl border border-[#e7ddd2] bg-white">
                              <img src={url} alt={`관극 사진 ${index + 1}`} className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setPhotoUrls((prev) => prev.filter((_, currentIndex) => currentIndex !== index))}
                                className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <Trash2 size={16} className="text-white" />
                              </button>
                            </div>
                          ))}

                          {photoUrls.length < MAX_PHOTOS && (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading}
                              className="flex h-24 w-24 flex-col items-center justify-center rounded-2xl border border-dashed border-[#d9c7b8] bg-[#fff8f2] text-gray-500 transition-colors hover:border-brand/40 hover:text-brand disabled:opacity-60"
                            >
                              {isUploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                              <span className="mt-2 text-xs">{isUploading ? '업로드 중' : '사진 추가'}</span>
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
                </section>
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-[#eee5dc] bg-[#fffdfa]/96 px-4 py-4 backdrop-blur sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={onClose} className="btn-secondary order-2 w-full sm:order-1 sm:w-auto">
                  닫기
                </button>
                <button
                  type="submit"
                  disabled={mutation.isPending || isUploading}
                  className="btn-primary order-1 w-full justify-center sm:order-2 sm:w-auto"
                >
                  <Sparkles size={16} />
                  <span>{mutation.isPending ? '저장 중...' : entry ? '기록 수정하기' : '기록 남기기'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
