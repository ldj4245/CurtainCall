# CurtainCall

뮤지컬·연극 공연 정보 탐색, 관극 기록, 후기 및 공통 커뮤니티 웹 서비스

[https://thecurtaincall.me](https://thecurtaincall.me)

## 주요 기능

- **공연 탐색 · 시간표**
  - KOPIS Open API 정기 동기화(KST 스케줄), 장르·상태·전국 17개 시·도·키워드 검색 및 자동완성
  - 박스오피스 인기 순위(뮤지컬·연극 분리, 예매 중 화제작 포함), 곧 막공·개막 예정·오늘 시간표, 공식 예매처 HTTPS 링크, 데이터 출처·갱신 상태 확인
- **관극 기록 · 관람 예정**
  - 비공개 기본값의 관극 다이어리(관람일, 좌석, 캐스트, 별점 선택, 스포일러 표시, 사진 첨부·클라이언트 압축)
  - 로그인 전 임시 작성 및 가입·로그인 후 이어쓰기, 목록·포스터·달력 보기, 재관람 빠른 복사
  - 관람 예정 일정 등록 및 관람 후 기록 전환(기록 삭제 시 일정 전환 가능 상태 복원)
  - 월간 공유 카드(PNG) 생성 및 단건 공개 링크 발급(비공개 전환·삭제·탈퇴 시 기존 링크 폐기)
- **커뮤니티 · 후기 · 시야**
  - 전체 회원 공통 커뮤니티 게시판(자유·후기·정보·질문 카테고리, 관련 공연 선택 태그, 키워드 검색, 공감·댓글·1단 답글 및 답글 알림)
  - 공연별 공개 관극 기록·좌석 시야 검색 및 세부 평점 후기·댓글 열람
- **계정 · 알림 · 데이터**
  - 이메일 및 카카오 OAuth2 로그인(JWT, 네이버·구글 OAuth2 확장 설정 포함)
  - 사이트 내 알림 및 항목별 수신 설정
  - 내 기록 JSON 내보내기, 회원 탈퇴 시 기록·일정·공개 링크 정리 및 프로필 익명화

## 기술 스택

| 영역 | 기술 |
|---|---|
| Backend | Java 17, Spring Boot 3.2, Spring Security, Spring Data JPA, QueryDSL, Caffeine Cache |
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
       └── /oauth2/   소셜 로그인 콜백
            │
            ├── VCN 사설망 (:3306) ──▶ DB VM (MySQL 8.0, 외부 3306 차단, 일일 cron 백업)
            ├── KOPIS Open API
            └── Kakao OAuth2 (Naver / Google 확장 설정)
```

- **이미지 저장**: 외부 오브젝트 스토리지(S3 호환) 설정이 비어 있으면 추가 스토리지 비용 없이 Base64 데이터 URI 폴백(클라이언트 리사이즈·2MB 상한)으로 동작한다.

## 프로젝트 구조

```text
curtaincall/
├── backend/src/main/java/com/curtaincall/
│   ├── domain/
│   │   ├── admin/         운영자·시스템 현황 조회
│   │   ├── analytics/     행동 이벤트 수집·집계
│   │   ├── casting/       출연진 정보 (KOPIS 출연진·PlayDB 선택 연동)
│   │   ├── community/     공통 커뮤니티 게시판·댓글·대댓글·공감
│   │   ├── diary/         관극 다이어리·통계·달력·공유 링크
│   │   ├── favorite/      관심 공연
│   │   ├── notification/  알림·수신 설정
│   │   ├── plan/          관람 예정 일정·기록 전환
│   │   ├── review/        세부 평점 리뷰·좋아요·댓글
│   │   ├── show/          공연 검색·필터·상세·인기 순위·데이터 상태
│   │   ├── theater/       극장 정보
│   │   └── user/          회원·내 데이터 내보내기·탈퇴
│   ├── infra/
│   │   ├── kopis/         KOPIS API 클라이언트·동기화
│   │   └── oauth2/        OAuth2 로그인 핸들러
│   └── global/
│       ├── common/        공통 응답·유틸
│       ├── config/        Security·SPA·공개 메타 설정
│       ├── exception/     전역 예외 처리
│       ├── infra/storage/ 이미지 저장소 처리
│       └── jwt/           JWT 발급·검증 필터
└── frontend/src/
    ├── pages/             Home·Shows·Community·Diary·Plans·Notifications·Shared·MyPage·Auth
    ├── components/        show·diary·plan·review·admin·common
    ├── api/               Axios API 모듈
    ├── store/             Zustand 인증 상태
    └── utils/             analytics·diaryReminder·imageCompress·showUtils·ticketParser
```

## 트러블슈팅

<details>
<summary>목록 API N+1 쿼리 제거, JPA 조인 보정 및 인덱스 설계</summary>

- **문제**: 리뷰(21쿼리), 다이어리·찜·박스오피스 순위 갱신 등에서 연관 엔티티 지연 로딩이 반복됐고, 다이어리 내보내기(`theater` fetch 누락), 알림 목록 루프 내 `existsBy`, 관리자 지표의 회원별 반복 조회, 찜 목록 `INNER JOIN`으로 극장 미지정 공연 누락 가능성도 존재했다.
- **조치**:
  - 공연·리뷰·다이어리(내보내기/공개 기록 포함)·찜(`LEFT JOIN FETCH`)에 `JOIN FETCH` 또는 `@EntityGraph`를 적용하고, 좋아요·댓글 수·알림 `eventKey` 중복 체크·박스오피스 `kopisId`는 `IN` 조건 배치 쿼리 및 일괄 저장(`saveAll`)으로 전환했다.
  - 관리자 지표(`/api/admin/metrics`)는 회원별 다이어리 조회 루프를 단일 경량 프로젝션(`userId`, `createdAt`) 조회로 바꾸고 일정·이벤트 통계를 DB `COUNT`/`GROUP BY` 집계로 전환했다.
  - 대댓글이 있는 댓글 목록은 root 댓글만 페이지네이션 조회한 뒤 `parentIds` 목록으로 답글을 일괄 조회해 컬렉션 fetch join 페이징 문제를 피했다.
  - `spring.jpa.open-in-view=false`, `hibernate.default_batch_fetch_size=100`, 페이지 크기 상한(`MAX_PAGE_SIZE=50`)과 `shows`/`diary_entries` 조회용 복합 인덱스를 적용했다.
- **결과**: 리뷰 21쿼리 → 3쿼리 등 목록·내보내기·알림·지표 API에서 루프 N+1과 불필요한 엔티티 로드를 제거하고 상수 쿼리 수준으로 안정화했다.

</details>

<details>
<summary>KOPIS 동기화 트랜잭션 경계 정리, Lock Wait Timeout(1205) 및 호출 제한 해결</summary>

- **문제**: 빈 DB 기동 시 `BoxOfficeScheduler`의 외부 `@Transactional`과 `KopisSyncService.syncShow()`(`REQUIRES_NEW`)가 같은 행을 동시에 갱신해 InnoDB 락 대기 타임아웃(`SQL Error: 1205`)이 발생했고, `syncShows()` 내부 자가호출(self-invocation)로 `@Transactional`이 우회되거나 외부 HTTP 호출 중 DB 커넥션을 점유하는 문제도 있었다.
- **조치**:
  - KOPIS 상세/극장 HTTP 조회는 트랜잭션 밖에서 수행하고, 순위·상태·공연 DB 반영만 짧은 `TransactionTemplate` 단위로 분리했다.
  - `KopisApiClient.fetchXml()`에 `250ms` 간격의 직렬 호출 제어와 XML XXE 방어를 적용하고, 에러 로그 출력 시 `service` 키를 마스킹했다.
- **결과**: 기동 시 락 충돌 없이 전체 공연 데이터와 박스오피스 순위가 갱신되며, 기존 공연 업데이트 누락과 로그 내 API 키 노출을 함께 차단했다.

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
