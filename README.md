# 🎭 CurtainCall - 뮤덕 관극 플랫폼

뮤지컬·연극 팬을 위한 올인원 관극 라이프 플랫폼

## 기술 스택

| 분야 | 기술 |
|------|------|
| Backend | Java 17, Spring Boot 3.2, Spring Security 6, Spring Batch |
| Database | MySQL 8.0, Spring Data JPA, QueryDSL |
| Auth | OAuth2 (카카오/네이버/구글), JWT |
| Frontend | React 18, TypeScript, Tailwind CSS, React Query |
| Infra | Docker Compose, GitHub Actions |
| Data | KOPIS 공연예술통합전산망 Open API |

## 주요 기능

### 1. 공연 탐색
- KOPIS API 연동으로 뮤지컬·연극 공연 정보 자동 수집 (매일 새벽 2시 동기화)
- 장르/지역/상태별 필터, 공연명·출연진 키워드 검색
- 공연 상세: 포스터, 출연진, 일정, 극장, 티켓 가격, 평균 별점

### 2. 관극 다이어리
- 관람한 공연 기록 (관람일, 좌석, 캐스트 메모, 평점, 한줄평, 티켓 가격)
- 나만의 관극 통계 대시보드
  - 총 관람 횟수, 총 지출
  - 월별 관극 히트맵 차트
  - 가장 많이 본 공연 Top 5

### 3. 리뷰 커뮤니티
- 스토리·캐스팅·연출·음향 세부 별점 리뷰
- 리뷰 좋아요 / 댓글
- 스포일러 방지 기능
- 인기순/최신순 정렬

## 시작하기

### 사전 요구사항
- Docker Desktop
- KOPIS API 키 ([발급](https://kopis.or.kr/por/cs/openapi/openApiUseSend.do?menuId=MNU_00074))
- 소셜 로그인 키 (카카오/네이버/구글 개발자 콘솔)

### 환경변수 설정

```bash
cp .env.example .env
# .env 파일을 열고 각 키를 입력하세요
```

### 실행

```bash
# Docker Compose로 실행
docker compose up -d

# 백엔드만 실행 (개발)
cd backend
./gradlew bootRun

# 프론트엔드만 실행 (개발)
cd frontend
npm install
npm run dev
```

### 접속
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html

## 프로젝트 구조

```
curtaincall/
├── backend/                     # Spring Boot
│   └── src/main/java/com/curtaincall/
│       ├── domain/              # 도메인별 (user/show/theater/diary/review)
│       │   └── {domain}/
│       │       ├── entity/      # JPA Entity
│       │       ├── repository/  # Spring Data JPA + QueryDSL
│       │       ├── service/     # 비즈니스 로직
│       │       ├── controller/  # REST API
│       │       └── dto/         # Request/Response DTO
│       ├── infra/
│       │   ├── kopis/           # KOPIS API 클라이언트 + 동기화 스케줄러
│       │   └── oauth2/          # 소셜 로그인 핸들러
│       └── global/
│           ├── config/          # Security, JPA, Swagger 설정
│           ├── exception/       # 전역 예외 처리
│           └── jwt/             # JWT 발급/검증 필터
└── frontend/                    # React
    └── src/
        ├── pages/               # 페이지 컴포넌트
        ├── components/          # 재사용 컴포넌트
        ├── api/                 # Axios API 함수
        ├── store/               # Zustand 상태관리
        └── types/               # TypeScript 타입 정의
```

## API 문서

서버 실행 후 http://localhost:8080/swagger-ui.html 에서 전체 API 문서를 확인할 수 있습니다.

## 데이터 소스

공연 정보는 **KOPIS(공연예술통합전산망)** Open API를 통해 제공됩니다.
- 매일 새벽 2시: 뮤지컬·연극 공연 목록 및 상세 정보 동기화
- 매주 월요일 새벽 3시: 극장 정보 동기화
