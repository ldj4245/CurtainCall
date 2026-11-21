# CurtainCall

뮤지컬·연극 공연 정보 탐색, 관극 기록, 동행 채팅 웹 서비스

[https://thecurtaincall.me](https://thecurtaincall.me)

## 주요 기능

- **공연 탐색 · 시간표**
  - KOPIS Open API 정기 동기화(KST 스케줄), 장르·상태·지역·키워드 검색
  - 박스오피스 인기 순위, 오늘 시간표, 출연진 정보(PlayDB + KOPIS), 데이터 출처·갱신 상태 확인
- **관극 기록 · 관람 예정**
  - 비공개 기본값의 관극 다이어리(관람일, 좌석, 캐스트, 별점 선택, 스포일러 표시, 사진 첨부)
  - 로그인 전 임시 작성 및 가입·로그인 후 이어쓰기, 목록·포스터·달력 보기, 재관람 빠른 복사
  - 관람 예정 일정 등록 및 관람 후 기록 전환(기록 삭제 시 일정 전환 가능 상태 복원)
  - 월간 공유 카드(PNG) 생성 및 단건 공개 링크 발급(비공개 전환·삭제·탈퇴 시 기존 링크 폐기)
- **후기 · 동행 · 실시간 채팅**
  - 공연별 공개 관극 기록·좌석 시야 검색 및 기존 세부 평점 후기 열람
  - 동행 모집글과 전용 채팅방, 당일 관람객 실시간 라이브 채팅(WebSocket/STOMP)
  - 신고·사용자 차단 및 운영자 신고 처리
- **계정 · 알림 · 데이터**
  - 이메일 및 카카오·네이버·구글 OAuth2 로그인(JWT)
  - 사이트 내 알림 및 항목별 수신 설정
  - 내 기록 JSON 내보내기, 회원 탈퇴 시 기록·일정·공개 링크 정리 및 프로필 익명화

## 기술 스택

| 영역 | 기술 |
|---|---|
| Backend | Java 17, Spring Boot 3.2, Spring Security, Spring Data JPA, QueryDSL, Spring Batch, Spring WebSocket(STOMP) |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query |
| Database | MySQL 8.0 (테스트 환경 H2) |
| Infra & CI | Oracle Cloud Infrastructure Always Free, Caddy 2, systemd, GitHub Actions |

## 운영 아키텍처

Oracle Cloud Infrastructure Tokyo(`ap-tokyo-1`) Always Free VM 2대 분리 구성으로 운영한다.

```text
사용자
  │ HTTPS (:80 -> :443 자동 리다이렉트)
  ▼
App VM (Caddy 2 자동 TLS)
  └── Spring Boot (:8080, systemd, React 정적 번들 포함)
       ├── /          React SPA & 공개 HTML 메타데이터
       ├── /api/      REST API
       ├── /ws/       WebSocket (STOMP)
       └── /oauth2/   소셜 로그인 콜백
            │
            ├── VCN 사설망 (:3306) ──▶ DB VM (MySQL 8.0, 외부 3306 차단, 일일 cron 백업)
            ├── KOPIS Open API
            └── Kakao / Naver / Google OAuth2
```

- **WebSocket 인증 및 채널**: `/ws` SockJS 연결 후 `CONNECT` 프레임 헤더의 JWT를 검증하며, 동행 채팅(`/pub/chat/{roomId}` → `/sub/chat/{roomId}`)과 라이브 채팅(`/pub/live/{roomId}` → `/sub/live/{roomId}`)으로 분리한다.
- **이미지 저장**: 외부 오브젝트 스토리지(S3 호환) 설정이 비어 있으면 추가 스토리지 비용 없이 Base64 데이터 URI 폴백으로 동작한다.

## 프로젝트 구조

```text
curtaincall/
├── backend/src/main/java/com/curtaincall/
│   ├── domain/
│   │   ├── admin/         운영자 신고 처리·지표 조회
│   │   ├── analytics/     행동 이벤트 수집·집계
│   │   ├── casting/       출연진 정보 (PlayDB + KOPIS)
│   │   ├── chat/          동행 채팅방·메시지 (WebSocket)
│   │   ├── companion/     동행 모집·참여
│   │   ├── diary/         관극 다이어리·통계·달력·공유 링크
│   │   ├── favorite/      관심 공연
│   │   ├── notification/  알림·수신 설정
│   │   ├── plan/          관람 예정 일정·기록 전환
│   │   ├── review/        세부 평점 리뷰·좋아요·댓글
│   │   ├── safety/        신고·사용자 차단
│   │   ├── show/          공연 검색·필터·상세·인기 순위·데이터 상태
│   │   ├── showlive/      공연별 당일 라이브 채팅 (WebSocket)
│   │   ├── theater/       극장 정보
│   │   └── user/          회원·내 데이터 내보내기·탈퇴
│   ├── infra/
│   │   ├── kopis/         KOPIS API 클라이언트·동기화
│   │   └── oauth2/        OAuth2 로그인 핸들러
│   └── global/
│       ├── common/        공통 응답·유틸
│       ├── config/        Security·WebSocket·SPA·공개 메타 설정
│       ├── exception/     전역 예외 처리
│       ├── infra/storage/ 이미지 저장소 처리
│       └── jwt/           JWT 발급·검증 필터
└── frontend/src/
    ├── pages/             Home·Shows·Diary·Plans·Notifications·Shared·MyPage·Chat·Auth
    ├── components/        show·diary·plan·review·companion·admin·common
    ├── api/               Axios API 모듈
    ├── hooks/             useChat·useShowLive
    ├── store/             Zustand 인증 상태
    └── utils/             analytics·diaryReminder·showUtils·ticketParser
```

## 트러블슈팅

<details>
<summary>목록 API N+1 쿼리 제거 및 요청 크기 제한</summary>

- **문제**: 동행(10건 기준 41쿼리), 리뷰(21쿼리), 다이어리·라이브 메시지·박스오피스 순위 갱신 등에서 연관 엔티티 지연 로딩과 루프 내 단건 조회가 반복됐다.
- **조치**:
  - 동행·공연·다이어리·찜·라이브 메시지에 `JOIN FETCH` 또는 `@EntityGraph`를 적용하고, 참여자·채팅방·좋아요·댓글 수·박스오피스 `kopisId`는 `IN` 조건 배치 쿼리와 `Map` 매핑으로 전환했다.
  - 대댓글이 있는 댓글 목록은 root 댓글만 페이지네이션 조회한 뒤 `parentIds` 목록으로 답글을 일괄 조회해 컬렉션 fetch join 페이징 문제를 피했다.
  - 서비스 레이어에서 페이지 크기를 최대 `50`으로 제한(`MAX_PAGE_SIZE`)했다.
- **결과**: 동행 41쿼리 → 3쿼리, 리뷰 21쿼리 → 3쿼리, 라이브 메시지 51쿼리 → 1쿼리 등 목록 조회 쿼리를 상수 개수로 줄였다.

</details>

<details>
<summary>초기 KOPIS 동기화 MySQL Lock Wait Timeout(1205) 및 호출 제한 해결</summary>

- **문제**: 빈 DB에서 서버를 기동하면 `BoxOfficeScheduler`의 외부 `@Transactional`이 `shows` 테이블을 갱신하는 도중 `KopisSyncService.syncShow()`(`REQUIRES_NEW`)가 두 번째 DB 커넥션으로 같은 행을 수정해 InnoDB 락 대기 타임아웃(`SQL Error: 1205`)이 발생했고, KOPIS 연속 요청 시 간헐적 400 응답 및 로그 내 `service` 파라미터 노출 위험도 있었다.
- **조치**:
  - `BoxOfficeScheduler`의 외부 `@Transactional`과 `KopisSyncService`의 중복 기동 이벤트 리스너를 제거하고, 순위 갱신과 DB 상태 반영만 짧은 `TransactionTemplate` 단위로 분리해 단일 비동기 흐름으로 순차 실행했다.
  - `KopisApiClient.fetchXml()`에 `250ms` 간격의 직렬 호출 제어를 두고 에러 로그 출력 시 `service` 키를 마스킹했다.
- **결과**: 기동 시 락 충돌 없이 초기 공연 데이터 및 박스오피스 순위가 정상 적재되고 로그 내 API 키 노출을 차단했다.

</details>

<details>
<summary>OCI 1GB RAM 환경 앱·DB 분리 및 MySQL 설정 로딩 순서 해결</summary>

- **문제**: Always Free `E2.1.Micro`(1GB RAM) 단일 인스턴스에 App·MySQL·프록시를 모두 올리면 OOM 위험이 있었고, DB VM 분리 시 `/etc/mysql/mysql.conf.d/99-curtaincall.cnf`가 알파벳순으로 `mysqld.cnf`보다 먼저 읽혀 `bind-address`가 다시 `127.0.0.1`로 덮어쓰이는 현상이 발생했다.
- **조치**:
  - App VM(Caddy + Spring Boot `-Xmx512m` + `UseSerialGC`)과 DB VM(MySQL `innodb_buffer_pool_size=384M`, `max_connections=60`)을 분리하고 각 VM에 `2GB` Swap(`vm.swappiness=10`)을 구성했다.
  - 커스텀 MySQL 설정 파일명을 `zz-curtaincall.cnf`로 변경해 `mysqld.cnf` 이후 마지막에 적용되도록 했다.
- **결과**: VCN 사설 IP 간 DB 통신을 정상 확보하면서 양쪽 VM 모두 유휴 메모리와 Swap 여유를 유지했다.

</details>

## 로컬 실행

### 저장소 클론 및 환경 변수

```bash
git clone https://github.com/ldj4245/curtaincall.git
cd curtaincall

cp .env.example .env
# .env에 KOPIS_API_KEY, JWT_SECRET, OAuth2 키 입력
```

### 백엔드 / 프론트엔드 개발 서버 실행

Java 17, Node.js 20, MySQL 8.0이 필요하다.

```bash
# 백엔드 (:8080)
./gradlew :backend:bootRun

# 프론트엔드 (frontend/, :3000)
cd frontend
npm install
npm run dev
```

### Docker Compose 실행

```bash
docker compose up -d
```

- 사이트: http://localhost
- Swagger UI: http://localhost:8080/swagger-ui.html
