export interface User {
  id: number
  nickname: string
  email: string
  profileImage?: string
  role: 'USER' | 'ADMIN'
}

export interface Show {
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
  posterUrl?: string
  castInfo?: string
  priceInfo?: string
  runtime?: string
  status: 'ONGOING' | 'ENDED' | 'UPCOMING'
  statusDisplayName: string
  ageLimit?: string
  averageScore?: number
  reviewCount?: number
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
  rating: number
  comment?: string
  ticketPrice?: number
  isOpen: boolean
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

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  last: boolean
  first: boolean
}
