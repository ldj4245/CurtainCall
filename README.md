# CurtainCall

뮤지컬·연극 공연 기록 및 동행 커뮤니티 웹 서비스

**[thecurtaincall.me](https://thecurtaincall.me)**

![Java](https://img.shields.io/badge/Java_17-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot_3.2-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL_8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker_Compose-2496ED?style=flat-square&logo=docker&logoColor=white)

---

## 기능

**공연 탐색**
- KOPIS Open API 연동, 매일 새벽 2시 자동 동기화
- 장르 / 상태 / 지역 필터, 키워드 검색
- 박스오피스 기반 인기 공연 랭킹

**관극 다이어리**
- 관람일, 좌석, 캐스트 메모, 별점, 사진(최대 5장) 기록
- 캘린더 / 목록 / 갤러리 뷰
- 관람 통계 (월별 히트맵, 총 지출, 장르 분포)
- SNS 공유용 카드 생성

**리뷰 커뮤니티**
- 스토리 / 캐스팅 / 연출 / 음향 항목별 평점
- 리뷰 좋아요, 댓글

**동행 매칭**
- 공연별 동행 모집글 작성 / 참여
- 동행 참여 시 전용 채팅방 자동 생성
- WebSocket(STOMP) 기반 실시간 채팅, 메시지 DB 영속화

**오늘 라이브**
- 공연 상세 페이지에서 당일 공연을 본 사람들과 실시간 감상 채팅
- 날짜별 독립 채팅방, 이전 날짜 기록 아카이브

**인증**
- 이메일 회원가입 / 로그인
- 카카오 / 네이버 / 구글 OAuth2 소셜 로그인
- JWT (Access 1h / Refresh 7d)

---

## 기술 스택

| | 기술 |
|---|---|
| Backend | Java 17, Spring Boot 3.2, Spring Security, Spring Batch |
| ORM | Spring Data JPA, QueryDSL |
| 실시간 | Spring WebSocket, STOMP |
| DB | MySQL 8.0 |
| Frontend | React 18, TypeScript, Tailwind CSS |
| 상태관리 | Zustand, TanStack Query |
| 인프라 | Docker Compose, Nginx, DigitalOcean |
| 스토리지 | DigitalOcean Spaces (S3 호환) |
| CI/CD | GitHub Actions |

---

## 아키텍처

```
사용자
  │ HTTPS
  ▼
Nginx (SSL 종단 / 리버스 프록시)
  ├── /          → React (정적 파일)
  ├── /api/      → Spring Boot :8080
  └── /ws/       → Spring Boot :8080 (WebSocket Upgrade)
       │
       ├── MySQL 8.0
       ├── KOPIS Open API (Spring Batch, 매일 02:00)
       ├── Kakao / Naver / Google OAuth2
       └── DigitalOcean Spaces (이미지 업로드)
```

**WebSocket 흐름**

```
클라이언트 SockJS 연결 → /ws
  CONNECT 헤더에 JWT 첨부
  → ChannelInterceptor에서 검증 후 Principal 설정

동행 채팅:  /pub/chat/{roomId}  →  /sub/chat/{roomId}
라이브 채팅: /pub/live/{roomId}  →  /sub/live/{roomId}
```

**인증 흐름 (OAuth2)**

```
/oauth2/authorization/kakao
  → 카카오 로그인
  → Spring Security OAuth2 콜백
  → User 조회 또는 생성
  → JWT 발급
  → /oauth2/callback?accessToken=...
```

---

## 프로젝트 구조

```
curtaincall/
├── backend/src/main/java/com/curtaincall/
│   ├── domain/
│   │   ├── show/          공연 검색·필터·상세·인기 랭킹
│   │   ├── theater/       극장 정보
│   │   ├── diary/         관극 다이어리 (CRUD·통계·캘린더·이미지)
│   │   ├── review/        리뷰·댓글·좋아요
│   │   ├── favorite/      찜하기
│   │   ├── companion/     동행 모집·참여
│   │   ├── chat/          동행 채팅방·메시지 (WebSocket)
│   │   ├── showlive/      공연별 날짜 라이브 채팅 (WebSocket)
│   │   ├── casting/       출연진 (PlayDB 크롤링 + KOPIS 폴백)
│   │   └── user/          회원 (이메일 + OAuth2)
│   ├── infra/
│   │   ├── kopis/         KOPIS API 클라이언트 + Spring Batch
│   │   ├── oauth2/        OAuth2 핸들러
│   │   └── storage/       S3 이미지 업로드
│   └── global/
│       ├── config/        Security·WebSocket·Swagger 설정
│       ├── exception/     전역 예외 처리
│       └── jwt/           JWT 발급·검증 필터
│
└── frontend/src/
    ├── pages/             Home·Shows·Diary·MyPage·Chat·Auth
    ├── components/        show·diary·review·companion·common
    ├── api/               Axios 기반 API 레이어
    ├── hooks/             useChat·useShowLive 등 커스텀 훅
    └── store/             Zustand 전역 상태
```

---

## 스크린샷

### 홈 (비로그인)

![홈](docs/screenshots/home_guest.png)

### 홈 (로그인)

![홈 로그인](docs/screenshots/home_loggedin.png)

### 공연 탐색

![공연 목록](docs/screenshots/shows_list.png)

### 공연 상세

![공연 상세 상단](docs/screenshots/show_detail_top.png)
![오늘 라이브](docs/screenshots/show_detail_live.png)
![함께 관극](docs/screenshots/show_detail_companion.png)
![리뷰](docs/screenshots/show_detail_review.png)

### 관극 다이어리

![다이어리](docs/screenshots/diary.png)

### 마이페이지

![마이페이지](docs/screenshots/mypage.png)

### 동행 채팅

![채팅 목록](docs/screenshots/chat_list.png)

### 로그인 / 회원가입

![로그인](docs/screenshots/login.png)
![회원가입](docs/screenshots/signup.png)

---

## 트러블슈팅

<details>
<summary>N+1 쿼리 문제 해결</summary>

### 발견 경위

코드 리뷰 중 목록 API에서 쿼리가 비정상적으로 많이 나가는 걸 확인했다. 로그를 찍어보니 동행 모집글 10개를 조회하는 요청 하나에 쿼리가 40개 넘게 발생하고 있었다.

---

### 원인

목록 조회 후 각 엔티티에 대해 루프 안에서 추가 쿼리를 날리는 구조 때문이었다.

**동행 목록 (최대 4N+1)**

```java
// 수정 전
return posts.map(post -> {
    // 게시글마다 참여자 조회 쿼리 1번
    List<CompanionParticipantResponse> participants =
        companionParticipantRepository.findByCompanionPostId(post.getId());
    // 게시글마다 채팅방 조회 쿼리 1번
    Long chatRoomId = chatRoomRepository.findByCompanionPostId(post.getId())
        .map(ChatRoom::getId).orElse(null);
    // post.getShow(), post.getAuthor() LAZY 로딩으로 추가 2번
    return CompanionPostResponse.from(post, participants, chatRoomId);
});
```

게시글 10개면 기본 1 + 40 = 41쿼리.

**리뷰 목록 (2N+1)**

```java
// 수정 전
return reviews.map(review -> {
    boolean isLiked = likeRepository.existsByReviewIdAndUserId(review.getId(), userId); // N번
    long commentCount = commentRepository.countByReviewId(review.getId()); // N번
    return ReviewResponse.from(review, isLiked, commentCount);
});
```

---

### 해결

**동행 목록:** fetch join으로 `show`, `author`를 한 번에 가져오고, 참여자와 채팅방은 `IN` 조건 배치 쿼리 1번씩으로 처리했다.

```java
// 수정 후 - CompanionPostRepository
@Query(value = "SELECT cp FROM CompanionPost cp JOIN FETCH cp.show JOIN FETCH cp.author WHERE cp.status = :status",
       countQuery = "SELECT COUNT(cp) FROM CompanionPost cp WHERE cp.status = :status")
Page<CompanionPost> findByStatus(@Param("status") CompanionPost.Status status, Pageable pageable);

// 수정 후 - CompanionService
private Page<CompanionPostResponse> toResponsePage(Page<CompanionPost> posts) {
    List<Long> postIds = posts.getContent().stream().map(CompanionPost::getId).toList();

    // 참여자 전체를 한 번에
    Map<Long, List<CompanionParticipantResponse>> participantsByPost =
        companionParticipantRepository.findByCompanionPostIdIn(postIds).stream()
            .collect(Collectors.groupingBy(p -> p.getCompanionPost().getId(), ...));

    // 채팅방 전체를 한 번에
    Map<Long, Long> chatRoomByPost =
        chatRoomRepository.findByCompanionPostIdIn(postIds).stream()
            .collect(Collectors.toMap(r -> r.getCompanionPost().getId(), ChatRoom::getId));

    return new PageImpl<>(posts.getContent().stream()
        .map(post -> CompanionPostResponse.from(
            post,
            participantsByPost.getOrDefault(post.getId(), List.of()),
            chatRoomByPost.get(post.getId())))
        .toList(), posts.getPageable(), posts.getTotalElements());
}
```

결과: **41쿼리 → 3쿼리**

**리뷰 목록:** 좋아요는 `IN` 조건으로 좋아요 누른 reviewId 목록을 한 번에 가져오고, 댓글 수는 `GROUP BY`로 집계한 결과를 Map으로 변환했다.

```java
// ReviewLikeRepository
@Query("SELECT rl.review.id FROM ReviewLike rl WHERE rl.review.id IN :reviewIds AND rl.user.id = :userId")
Set<Long> findLikedReviewIds(@Param("reviewIds") List<Long> reviewIds, @Param("userId") Long userId);

// ReviewCommentRepository
@Query("SELECT c.review.id as reviewId, COUNT(c) as count FROM ReviewComment c WHERE c.review.id IN :reviewIds GROUP BY c.review.id")
List<CommentCountProjection> countByReviewIds(@Param("reviewIds") List<Long> reviewIds);

// ReviewService
private Page<ReviewResponse> enrichReviews(Page<Review> reviews, Long currentUserId) {
    List<Long> reviewIds = reviews.getContent().stream().map(Review::getId).toList();

    Set<Long> likedIds = currentUserId != null
        ? likeRepository.findLikedReviewIds(reviewIds, currentUserId)
        : Collections.emptySet();

    Map<Long, Long> commentCounts = commentRepository.countByReviewIds(reviewIds).stream()
        .collect(Collectors.toMap(CommentCountProjection::getReviewId, CommentCountProjection::getCount));

    return reviews.map(review -> ReviewResponse.from(
        review,
        likedIds.contains(review.getId()),
        commentCounts.getOrDefault(review.getId(), 0L)));
}
```

결과: **21쿼리 → 3쿼리**

**다이어리 목록:** `findByUserIdOrderByWatchedDateDesc`에 fetch join을 추가해 `Show`와 `Theater`를 한 번에 로딩했다.

```java
@Query(value = "SELECT d FROM DiaryEntry d JOIN FETCH d.show s LEFT JOIN FETCH s.theater WHERE d.user.id = :userId ORDER BY d.watchedDate DESC",
       countQuery = "SELECT COUNT(d) FROM DiaryEntry d WHERE d.user.id = :userId")
Page<DiaryEntry> findByUserIdOrderByWatchedDateDesc(@Param("userId") Long userId, Pageable pageable);
```

결과: **2N+1 → 1쿼리**

</details>

---

## API

Swagger UI: `https://thecurtaincall.me:8080/swagger-ui.html`

| 도메인 | 엔드포인트 |
|---|---|
| 공연 | `GET /api/shows`, `GET /api/shows/{id}`, `GET /api/shows/ongoing`, `GET /api/shows/popular` |
| 다이어리 | `GET·POST·PUT·DELETE /api/diary`, `GET /api/diary/me/stats`, `GET /api/diary/me/calendar` |
| 리뷰 | `GET·POST /api/shows/{id}/reviews`, `POST /api/reviews/{id}/like`, `POST /api/reviews/{id}/comments` |
| 찜 | `POST /api/favorites/{showId}` |
| 동행 | `GET·POST /api/shows/{showId}/companions`, `POST /api/companions/{id}/join` |
| 채팅 | `GET /api/chat/rooms`, `GET /api/chat/rooms/{id}/messages` |
| 라이브 | `GET /api/shows/{showId}/live?date=YYYY-MM-DD` |
| 인증 | `POST /api/auth/login`, `POST /api/auth/register` |

---

## 로컬 실행

```bash
git clone https://github.com/ldj4245/CurtainCall.git
cd curtaincall

cp .env.example .env
# .env에 KOPIS_API_KEY, JWT_SECRET, OAuth2 키 입력

docker compose up -d
```

- 사이트: http://localhost
- Swagger: http://localhost:8080/swagger-ui.html
