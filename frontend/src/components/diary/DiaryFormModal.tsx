import { useState, useRef } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { X, ImagePlus, Trash2, Loader2 } from 'lucide-react'
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

export default function DiaryFormModal({ entry, initialShowId, initialShowTitle, onClose, onSaved }: Props) {
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(entry?.rating ?? 5)
  const [showSearch, setShowSearch] = useState('')
  const [selectedShowId, setSelectedShowId] = useState<number | null>(entry?.showId ?? initialShowId ?? null)
  const [selectedShowTitle, setSelectedShowTitle] = useState<string>(entry?.showTitle ?? initialShowTitle ?? '')
  const [photoUrls, setPhotoUrls] = useState<string[]>(entry?.photoUrls ?? [])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: searchResults } = useQuery({
    queryKey: ['shows', 'search', showSearch],
    queryFn: () => showsApi.search({ keyword: showSearch, size: 5 }),
    enabled: showSearch.length > 1,
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

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
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
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const mutation = useMutation({
    mutationFn: (data: DiaryCreateRequest) => {
      const payload = { ...data, showId: selectedShowId!, rating, photoUrls }
      return entry ? diaryApi.update(entry.id, payload) : diaryApi.create(payload)
    },
    onSuccess: () => {
      toast.success(entry ? '기록이 수정되었습니다.' : '관극 기록이 추가되었습니다!')
      queryClient.invalidateQueries({ queryKey: ['diary'] })
      onSaved()
    },
    onError: () => toast.error('저장에 실패했습니다.'),
  })

  const onSubmit = (data: DiaryCreateRequest) => {
    if (!selectedShowId) { toast.error('공연을 선택해주세요.'); return }
    mutation.mutate(data)
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-card-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{entry ? '기록 수정' : '관극 기록 추가'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">공연 *</label>
            {selectedShowTitle ? (
              <div className="flex items-center justify-between bg-warm-50 border border-gray-100 rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-gray-800">{selectedShowTitle}</span>
                <button type="button" onClick={() => { setSelectedShowId(null); setSelectedShowTitle('') }} className="text-xs text-gray-400 hover:text-red-500">변경</button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={showSearch}
                  onChange={(e) => setShowSearch(e.target.value)}
                  placeholder="공연명 검색..."
                  className="input-field"
                />
                {searchResults && searchResults.content.length > 0 && showSearch.length > 1 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-lg shadow-card-md z-10 mt-1">
                    {searchResults.content.map((show) => (
                      <button
                        key={show.id}
                        type="button"
                        onClick={() => { setSelectedShowId(show.id); setSelectedShowTitle(show.title); setShowSearch('') }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-warm-50 flex gap-2 items-center transition-colors"
                      >
                        {show.posterUrl && <img src={show.posterUrl} className="w-8 h-10 object-cover rounded" alt="" />}
                        <div>
                          <p className="font-medium text-gray-900">{show.title}</p>
                          <p className="text-xs text-gray-400">{show.theaterName}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">관람일 *</label>
              <input type="date" {...register('watchedDate', { required: true })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">좌석</label>
              <input type="text" {...register('seatInfo')} placeholder="1층 A구역 5열 10번" className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">캐스트 메모</label>
            <input type="text" {...register('castMemo')} placeholder="오늘의 배우 이름..." className="input-field" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">평점 *</label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">한줄평</label>
            <textarea {...register('comment')} rows={3} placeholder="오늘의 관극 소감을 남겨보세요..." className="input-field resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">티켓 가격 (원)</label>
              <input type="number" {...register('ticketPrice', { valueAsNumber: true })} placeholder="150000" className="input-field" />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input type="checkbox" id="isOpen" {...register('isOpen')} className="w-4 h-4 accent-brand" />
              <label htmlFor="isOpen" className="text-sm text-gray-700">공개 기록</label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              사진 첨부 <span className="text-gray-400 font-normal">({photoUrls.length}/{MAX_PHOTOS})</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {photoUrls.map((url, i) => (
                <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                  <img src={url} alt={`첨부사진 ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
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
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-brand hover:text-brand transition-colors disabled:opacity-50"
                >
                  {isUploading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
                  <span className="text-xs mt-1">{isUploading ? '업로드 중' : '추가'}</span>
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

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">취소</button>
            <button type="submit" disabled={mutation.isPending || isUploading} className="flex-1 btn-primary">
              {mutation.isPending ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
