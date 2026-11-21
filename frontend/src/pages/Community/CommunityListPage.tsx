import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { communityApi } from '../../api/community'
import { useAuthStore } from '../../store/authStore'
import Pagination from '../../components/common/Pagination'
import { COMMUNITY_CATEGORIES, formatCommunityDate } from './constants'

export default function CommunityListPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [params, setParams] = useSearchParams()

  const category = params.get('category') ?? ''
  const keyword = params.get('q') ?? ''
  const sort = params.get('sort') === 'likes' ? 'likes' : 'latest'
  const parsedPage = Number(params.get('page') ?? 0)
  const page = Number.isInteger(parsedPage) && parsedPage >= 0 ? parsedPage : 0

  const [input, setInput] = useState(keyword)

  useEffect(() => {
    setInput(keyword)
  }, [keyword])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['community-posts', category, keyword, sort, page],
    queryFn: () =>
      communityApi.getPosts({
        category: category || undefined,
        keyword: keyword || undefined,
        sort,
        page,
        size: 20,
      }),
  })

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  const handleWriteClick = () => {
    if (isAuthenticated) {
      navigate('/community/new')
      return
    }
    navigate('/login', { state: { from: { pathname: '/community/new' } } })
  }

  const clearFilters = () => {
    setParams({})
    setInput('')
  }

  const hasFilter = Boolean(category || keyword || sort === 'likes')

  return (
    <div className="page-width">
      <header className="page-heading flex flex-wrap items-end justify-between gap-4 border-b border-line-base">
        <div>
          <h1>커뮤니티</h1>
          <p>공연 감상, 좌석·관극 팁, 자유로운 이야기를 나누는 게시판입니다.</p>
        </div>
        <button type="button" onClick={handleWriteClick} className="button-primary shrink-0">
          글쓰기
        </button>
      </header>

      <div className="feed-toolbar">
        <div className="text-tabs" role="tablist" aria-label="카테고리 필터">
          <button
            type="button"
            role="tab"
            aria-selected={!category}
            onClick={() => updateParam('category', '')}
            className={!category ? 'is-active' : ''}
          >
            전체
          </button>
          {COMMUNITY_CATEGORIES.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={category === item.value}
              onClick={() => updateParam('category', item.value)}
              className={category === item.value ? 'is-active' : ''}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="text-tabs genre-tabs" role="group" aria-label="정렬">
          <button
            type="button"
            onClick={() => updateParam('sort', '')}
            className={sort === 'latest' ? 'is-active' : ''}
          >
            최신순
          </button>
          <button
            type="button"
            onClick={() => updateParam('sort', 'likes')}
            className={sort === 'likes' ? 'is-active' : ''}
          >
            공감순
          </button>
        </div>
      </div>

      <section className="search-surface" aria-label="게시글 검색">
        <form
          className="large-search"
          onSubmit={(e) => {
            e.preventDefault()
            updateParam('q', input.trim())
          }}
        >
          <input
            type="text"
            aria-label="게시글 검색"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="제목, 내용, 공연명으로 검색"
            maxLength={100}
          />
          <button type="submit" className="button-secondary shrink-0">
            검색
          </button>
          {hasFilter && (
            <button type="button" onClick={clearFilters} className="button-secondary shrink-0">
              초기화
            </button>
          )}
        </form>
      </section>

      {isLoading ? (
        <p className="feed-notice">불러오는 중...</p>
      ) : isError ? (
        <div className="feed-notice">
          <p>게시글을 불러오지 못했습니다.</p>
          <button type="button" onClick={() => { void refetch() }} className="text-action mt-2">
            다시 불러오기
          </button>
        </div>
      ) : !data?.content.length ? (
        <p className="feed-notice">등록된 글이 없습니다.</p>
      ) : (
        <div className="feed-list" aria-label="커뮤니티 게시글 목록">
          {data.content.map((post) => (
            <article key={post.id} className="feed-item">
              <div className="feed-item-body">
                <div className="feed-title-line">
                  <span className="text-[12px] text-[#777] shrink-0">{post.categoryDisplayName}</span>
                  <h2>
                    <Link to={`/community/${post.id}`}>{post.title}</Link>
                  </h2>
                  {post.commentCount > 0 && (
                    <span className="text-[13px] font-medium text-[#555]">[{post.commentCount}]</span>
                  )}
                  {post.showTitle && (
                    <span className="feed-venue">· {post.showTitle}</span>
                  )}
                </div>
                <div className="feed-meta">
                  <span>{post.authorNickname}</span>
                  <time dateTime={post.createdAt}>{formatCommunityDate(post.createdAt)}</time>
                  <span>공감 {post.likeCount}</span>
                  <span>조회 {post.viewCount}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.totalPages}
          onPageChange={(nextPage) => updateParam('page', String(nextPage))}
        />
      )}
    </div>
  )
}
