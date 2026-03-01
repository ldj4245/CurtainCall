<div align="center">

# 🎭 CurtainCall
### 뮤지컬·연극 팬을 위한 올인원 관극 라이프 플랫폼

**[🌐 thecurtaincall.me](https://thecurtaincall.me)** 에서 바로 사용해보세요

[![Java](https://img.shields.io/badge/Java-17-ED8B00?style=flat-square&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-6DB33F?style=flat-square&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## 📌 프로젝트 소개

CurtainCall은 뮤지컬·연극을 사랑하는 팬(뮤덕)을 위해 만든 관극 특화 플랫폼입니다.

공연 정보 탐색부터 관극 기록, 리뷰 커뮤니티까지 **관극 라이프의 모든 것**을 한 곳에서 경험할 수 있습니다. KOPIS(공연예술통합전산망) Open API를 연동해 매일 자동으로 공연 데이터를 수집하며, 소셜 로그인 기반으로 누구나 쉽게 시작할 수 있습니다.

---

## 🏗️ 시스템 아키텍처

```mermaid
graph TB
    subgraph Client["👤 사용자"]
        Browser["브라우저 (HTTPS)"]
    end

    subgraph Server["🖥️ DigitalOcean Droplet (Ubuntu 22.04)"]
        Nginx["Nginx — SSL 종단 / 리버스 프록시"]
        subgraph Docker["Docker Compose"]
            Frontend["React App (Nginx 내장)"]
            Backend["Spring Boot :8080"]
            DB["MySQL 8.0"]
        end
    end

    subgraph External["🌐 외부 서비스"]
        KOPIS["KOPIS Open API"]
        Kakao["카카오 OAuth2"]
        Naver["네이버 OAuth2"]
        Google["구글 OAuth2"]
        Spaces["DigitalOcean Spaces (CDN)"]
    end

    Browser -->|"HTTPS"| Nginx
    Nginx --> Frontend
    Nginx -->|"/api/, /oauth2/"| Backend
    Backend --> DB
    Backend -->|"Spring Batch 매일 02:00"| KOPIS
    Backend --> Kakao & Naver & Google
    Backend --> Spaces
```

### 인증 플로우 (JWT + OAuth2)

```mermaid
sequenceDiagram
    participant U as 사용자
    participant N as Nginx
    participant B as Spring Boot
    participant K as 카카오

    U->>N: GET /oauth2/authorization/kakao
    N->>B: 프록시 전달
    B->>K: 인가 코드 요청
    K-->>U: 카카오 로그인 페이지
    U->>K: 로그인 완료
    K-->>B: 인가 코드 전달
    B->>K: Access Token 교환
    K-->>B: 사용자 정보
    B->>B: JWT(Access + Refresh) 발급
    B-->>U: /oauth2/callback?accessToken=...
```

---

## ⚙️ 기술 스택

| 계층 | 기술 | 선택 이유 |
|------|------|-----------|
| **Backend** | Java 17, Spring Boot 3.2 | LTS, 최신 기능 |
| **보안** | Spring Security 6, JWT, OAuth2 | Stateless 인증, 소셜 로그인 |
| **ORM** | Spring Data JPA, QueryDSL | 타입 안전한 동적 쿼리 |
| **DB** | MySQL 8.0 | 안정성 |
| **배치** | Spring Batch | 대용량 공연 데이터 주기 동기화 |
| **Frontend** | React 18, TypeScript | 컴포넌트 재사용성, 타입 안정성 |
| **상태관리** | Zustand, React Query | 클라이언트/서버 상태 분리 |
| **스타일** | Tailwind CSS | 빠른 UI 개발 |
| **인프라** | Docker Compose | 단일 명령 전체 환경 구동 |
| **서버** | DigitalOcean Droplet | 비용 효율 |
| **SSL** | Let's Encrypt (Certbot) | 무료, 자동 갱신 |
| **스토리지** | DigitalOcean Spaces | S3 호환 CDN |
| **외부 API** | KOPIS Open API | 공식 공연 데이터 |

---

## 💡 핵심 기능 및 스크린샷

---

### 🏠 홈 화면

<details>
<summary>📸 스크린샷 보기</summary>

**메인 홈 (히어로 섹션)**
> 서비스 소개와 현재 공연 중인 작품들을 한눈에 확인할 수 있는 랜딩 페이지

![홈 히어로](docs/screenshots/01_home_hero_1772338308594.png)

**현재 공연 중인 공연 목록**
> KOPIS API로 수집된 실시간 공연 데이터 표시

![진행 중 공연](docs/screenshots/02_home_ongoing_shows_1772338317901.png)

</details>

---

### 🔍 공연 탐색 & 검색

<details>
<summary>📸 스크린샷 보기</summary>

**전체 공연 목록**
> 뮤지컬·연극 전체 공연 카드 리스트

![공연 목록](docs/screenshots/04_shows_listing_all_1772338341238.png)

**장르 + 지역 복합 필터링**
> 뮤지컬/연극 장르 필터와 서울/경기 등 지역 필터를 조합하여 원하는 공연 탐색

![필터링](docs/screenshots/04_show_filtering_1772339235147.png)

**공연 검색 (데스노트)**
> 공연명·출연진 키워드로 실시간 검색

![데스노트 검색](docs/screenshots/09_search_deathnote_1772338512656.png)

</details>

---

### 🎭 공연 상세 페이지

<details>
<summary>📸 스크린샷 보기</summary>

**공연 상세 - 포스터 & 기본 정보**
> 공연 포스터, 기간, 극장, 관람 연령, 티켓 가격, 평균 별점 표시

![공연 상세 상단](docs/screenshots/10_show_detail_top_1772338524353.png)

**출연진 & 공연 일정**
> 캐스트 목록과 회차별 공연 일정 정보

![캐스트 정보](docs/screenshots/11_show_detail_cast_1772338552831.png)

**관객 리뷰 섹션**
> 세부 항목별 별점과 관객 리뷰 목록 (비회원도 열람 가능)

![리뷰 섹션](docs/screenshots/13_show_reviews_section_1772338590568.png)

</details>

---

### 🔐 회원가입 & 로그인

<details>
<summary>📸 스크린샷 보기</summary>

**로그인 페이지**
> 이메일/비밀번호 로그인 및 카카오·네이버·구글 소셜 로그인 지원

![로그인](docs/screenshots/14_login_page_1772338602657.png)

**회원가입 페이지**
> 이메일 기반 신규 회원 가입

![회원가입](docs/screenshots/15_signup_page_1772338616762.png)

**로그인 후 홈 화면**
> 로그인 완료 후 개인화된 헤더 (프로필 메뉴 활성화)

![로그인 후 홈](docs/screenshots/16_logged_in_home_1772338679283.png)

</details>

---

### ❤️ 공연 찜하기

<details>
<summary>📸 스크린샷 보기</summary>

**찜하기 토글**
> 공연 상세 페이지에서 ♥ 버튼으로 관심 공연 저장/해제 (로그인 필요)

![찜하기](docs/screenshots/17_favorite_toggled_1772338708391.png)

</details>

---

### ✍️ 리뷰 시스템

<details>
<summary>📸 스크린샷 보기</summary>

**리뷰 작성 폼**
> 스토리 / 캐스팅 / 연출 / 음향 4개 항목 세부 별점 + 종합 평점 + 텍스트 리뷰 + 스포일러 방지 옵션

![리뷰 작성 폼](docs/screenshots/18_review_form_full_1772339190317.png)

**리뷰 좋아요**
> 다른 유저 리뷰에 공감 표시 (좋아요 토글)

![리뷰 좋아요](docs/screenshots/20_review_liked_1772339160595.png)

**리뷰 댓글**
> 특정 리뷰에 댓글로 소통하는 커뮤니티 기능

![리뷰 댓글](docs/screenshots/21_review_comment_1772339175812.png)

</details>

---

### 📒 관극 다이어리

<details>
<summary>📸 스크린샷 보기</summary>

**기록 추가 모달**
> 관람한 공연 선택, 관람일, 좌석, 캐스트 메모, 평점, 한줄평, 티켓 가격, 이미지 업로드까지 기록

![기록 추가](docs/screenshots/28_add_diary_modal_1772339080370.png)

**다이어리 목록 뷰**
> 내가 기록한 모든 관람 기록을 리스트 형태로 조회

![다이어리 목록](docs/screenshots/23_diary_list_view_1772339015783.png)

**다이어리 갤러리 뷰**
> 공연 포스터 중심의 시각적인 갤러리 형태로 보기

![다이어리 갤러리](docs/screenshots/24_diary_gallery_view_1772339026424.png)

**월별 캘린더 뷰**
> 월별 관람 일정을 달력에서 한눈에 확인

![캘린더](docs/screenshots/25_diary_calendar_1772339036787.png)

</details>

---

### 📊 마이페이지 & 통계

<details>
<summary>📸 스크린샷 보기</summary>

**마이페이지 개요**
> 프로필 정보, 찜한 공연 목록, 나의 활동 요약

![마이페이지](docs/screenshots/22_mypage_overview_1772339000041.png)

**관극 통계 대시보드**
> 총 관람 횟수, 총 지출, 월별 히트맵 차트, 가장 많이 본 공연 Top 5

![통계](docs/screenshots/26_mypage_stats_1772339046689.png)

**관극 카드 공유**
> 나의 관극 기록을 SNS 공유용 카드로 생성

![공유 카드](docs/screenshots/27_share_card_1772339057891.png)

</details>

---

## 🗂️ 프로젝트 구조

```
curtaincall/
├── backend/
│   └── src/main/java/com/curtaincall/
│       ├── domain/                  # 도메인 계층 (DDD 패키지 구조)
│       │   ├── show/                # 공연 (검색/필터/상세)
│       │   ├── theater/             # 극장
│       │   ├── diary/               # 관극 다이어리 (CRUD + 통계 + 캘린더 + 이미지)
│       │   ├── review/              # 리뷰 & 댓글 & 좋아요
│       │   ├── user/                # 회원 (이메일 + OAuth2)
│       │   └── favorite/            # 찜하기
│       ├── infra/
│       │   ├── kopis/               # KOPIS API 클라이언트 + Spring Batch 동기화
│       │   ├── oauth2/              # OAuth2 소셜 로그인 핸들러
│       │   └── storage/             # DigitalOcean Spaces 파일 업로드
│       └── global/
│           ├── config/              # Security, Swagger, Storage 설정
│           ├── exception/           # 전역 예외 처리 (@RestControllerAdvice)
│           └── jwt/                 # JWT 발급 / 검증 필터
└── frontend/
    └── src/
        ├── pages/                   # Auth / Home / Shows / Diary / MyPage
        ├── components/              # diary / review / show / common
        ├── api/                     # Axios 기반 API 레이어
        ├── store/                   # Zustand 전역 상태
        └── types/                   # TypeScript 타입 정의
```

---

## 📡 API 명세

Swagger UI를 통해 전체 REST API를 확인할 수 있습니다.
- **운영**: https://thecurtaincall.me:8080/swagger-ui.html
- **로컬**: http://localhost:8080/swagger-ui.html

| 도메인 | 주요 엔드포인트 |
|--------|----------------|
| 공연 | `GET /api/shows` (검색/필터), `GET /api/shows/{id}` (상세) |
| 다이어리 | `GET/POST/PUT/DELETE /api/diary`, `GET /api/diary/me/stats`, `GET /api/diary/me/calendar` |
| 리뷰 | `GET/POST /api/shows/{id}/reviews`, `POST /api/reviews/{id}/like`, `POST /api/reviews/{id}/comments` |
| 찜하기 | `POST /api/favorites/{showId}` (토글) |
| 인증 | `POST /api/auth/login`, `POST /api/auth/register`, OAuth2 소셜 로그인 |

---

## 🔒 보안

- HTTPS (Let's Encrypt SSL, 자동 갱신)
- JWT Stateless 인증 (Access 1시간 / Refresh 7일)
- OAuth2 소셜 로그인 (카카오 / 네이버 / 구글)
- CORS 정책으로 허용 오리진 제한
- 환경변수로 민감 정보 분리 (`.env`, GitHub 미포함)

---

## 📊 데이터 수집 스케줄

| 작업 | 주기 | 내용 |
|------|------|------|
| 공연 목록 동기화 | 매일 새벽 02:00 | 뮤지컬·연극 공연 목록 및 상세 정보 |
| 극장 정보 동기화 | 매주 월요일 03:00 | 전국 극장 정보 |

---

## 🚀 로컬 실행

```bash
# 1. 저장소 클론
git clone https://github.com/ldj4245/CurtainCall.git
cd curtaincall

# 2. 환경변수 설정
cp .env.example .env
# .env 파일에서 API 키 입력

# 3. Docker Compose 실행 (전체 환경 한 번에)
docker compose up -d
```

접속:
- 사이트: http://localhost
- Swagger: http://localhost:8080/swagger-ui.html

---

<div align="center">
  <sub>Made with ❤️ for 뮤덕 | <a href="https://thecurtaincall.me">thecurtaincall.me</a></sub>
</div>
