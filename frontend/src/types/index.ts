export interface User {
  id: number
  nickname: string
  email: string
  profileImage?: string
  role: 'USER' | 'ADMIN'
}

export interface OfficialBookingLink {
  name: string
  url: string
}

export interface Show {
  sourceUpdatedAt?: string
  id: number
  kopisId: string
  title: string
  genre: string
  genreDisplayName: string
  startDate: string
  endDate: string
  theaterId?: number
  theaterName?: string
  theaterRegion?: string
  theaterAddress?: string
  theaterSeatScale?: number
  posterUrl?: string
  castInfo?: string
  priceInfo?: string
  runtime?: string
  dtguidance?: string
  bookingLinks?: OfficialBookingLink[]
  status: 'ONGOING' | 'ENDED' | 'UPCOMING'
  statusDisplayName: string
  popularityRank?: number | null
  ageLimit?: string
  castList?: string[]
  introImages?: string[]
  averageScore?: number
  ratingCount?: number
  reviewCount?: number
  diaryCount?: number
}

export interface ShowHomeSections {
  popular: Show[]
  endingSoon: Show[]
  openingThisMonth: Show[]
  mostRecorded: Show[]
}

export interface ScheduleShowItem {
  theaterRegion?: string
  sourceUpdatedAt?: string
  id: number
  kopisId: string
  title: string
  genre?: string
  genreDisplayName?: string
  theaterName?: string
  posterUrl?: string
  runtime?: string
  priceInfo?: string
  castInfo?: string
  time: string
}

export interface TimeSlot {
  time: string
  label: string
  count: number
  shows: ScheduleShowItem[]
}

export interface ShowSchedule {
  date: string
  dayOfWeek: string
  totalShowsToday: number
  timeSlots: TimeSlot[]
}

export interface Theater {
  id: number
  kopisId: string
  name: string
  address?: string
  seatScale?: number
  region?: string
  characteristics?: string
}

export interface DiaryEntry {
  id: number
  showId: number
  showTitle: string
  showPosterUrl?: string
  theaterName?: string
  watchedDate: string
  seatInfo?: string
  castMemo?: string
  rating: number | null
  comment?: string
  ticketPrice?: number
  hasSpoiler?: boolean
  isOpen: boolean
  photoUrls: string[]
  representativeImageUrl?: string
  createdAt: string
}

export interface DiaryStats {
  totalCount: number
  totalSpent: number
  averageRating: number
  topShows: Array<{
    showId: number
    showTitle: string
    posterUrl?: string
    count: number
  }>
  topCasts: Array<{
    castName: string
    count: number
  }>
  monthlyCount: Record<string, number>
}

export interface DiarySnippet {
  hasSpoiler?: boolean
  diaryId: number
  userNickname: string
  watchedDate: string
  seatInfo?: string
  castMemo?: string
  rating: number | null
  comment?: string
  representativeImageUrl?: string
  photoUrls?: string[]
}

export interface DiarySnippetResponse {
  totalCount: number
  items: DiarySnippet[]
}

export interface Review {
  id: number
  userId: number
  userNickname: string
  userProfileImage?: string
  showId: number
  showTitle: string
  storyScore: number
  castScore: number
  directionScore: number
  soundScore: number
  averageScore: number
  content: string
  likeCount: number
  hasSpoiler: boolean
  isLiked: boolean
  commentCount: number
  createdAt: string
}

export interface Comment {
  id: number
  userId: number
  userNickname: string
  userProfileImage?: string
  content: string
  parentId?: number
  replies: Comment[]
  createdAt: string
}

export type CommunityCategory = 'FREE' | 'REVIEW' | 'INFO' | 'QUESTION'

export interface CommunityPostSummary {
  id: number
  category: CommunityCategory
  categoryDisplayName: string
  title: string
  showId?: number | null
  showTitle?: string | null
  authorId: number
  authorNickname: string
  viewCount: number
  likeCount: number
  commentCount: number
  liked: boolean
  createdAt: string
}

export interface CommunityPostDetail extends CommunityPostSummary {
  content: string
  showPosterUrl?: string | null
  author: boolean
  updatedAt: string
}

export interface CommunityComment {
  id: number
  authorId: number
  authorNickname: string
  content: string
  parentId?: number | null
  replies: CommunityComment[]
  createdAt: string
}

export interface CommunityLikeResult {
  liked: boolean
  likeCount: number
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  last: boolean
  first: boolean
}
