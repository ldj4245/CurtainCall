# 🚀 CurtainCall 배포 가이드 (DigitalOcean & GitHub)

이 문서는 로컬 개발 환경의 코드를 DigitalOcean 클라우드 서버(Ubuntu)에 배포하고 서비스를 구동하는 전체 과정을 기록한 매뉴얼입니다. 나중에 서버를 재구축하거나 업데이트할 때 참고하세요.

---

## 🏗️ 1. 새 서버 초기 세팅 (서버를 처음 만들었을 때만 1회 실행)

DigitalOcean에 새 서버(Droplet)를 만들었다면, 먼저 서버 환경을 구동 가능한 상태로 만들어야 합니다.

1. **서버 접속 (터미널)**
   ```bash
   ssh root@<서버_IP_주소>
   ```
   *(비밀번호를 입력하고 `root@서버이름:~#` 프롬프트가 뜨면 접속 성공)*

2. **패키지 업데이트 및 Docker 설치 (한 번에 복사/붙여넣기)**
   ```bash
   apt update && apt upgrade -y && \
   curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
   ```
   *(중간에 분홍색/파란색 설정 창이 뜨면 기본값인 `keep the local version currently installed` 나 기본 체크된 상태에서 그냥 **Enter**를 치면 넘어갑니다!)*

---

## 🔄 2. 소스 코드 가져오기 (배포 업데이트 시마다 반복)

보안상 로컬 폴더를 직접 전송하지 않고, 항상 **GitHub**를 거쳐서 깔끔한 코드를 다운로드 받는 것을 원칙으로 합니다. (찌꺼기 파일 방지)

1. **임시 퍼블릭 전환 (10초)**
   - 깃허브 레포지토리가 `Private(비공개)` 상태라면 터미널에서 비밀번호를 요구하며 막힙니다.
   - 브라우저에서 `GitHub Repo -> Settings -> Change repository visibility -> Change to public` 으로 딱 10초만 변경합니다.

2. **서버에서 소스코드 클론 (다운로드)**
   - 만약 기존 파일이 있다면 안전하게 삭제 후 다시 받습니다.
   ```bash
   # (선택) 기존 폴더가 있다면 삭제
   rm -rf ~/curtaincall

   # 최신 소스코드 다운로드
   git clone https://github.com/ldj4245/curtaincall.git
   ```

3. **원상 복구**
   - 소스 코드를 서버로 무사히 받았다면 잊지 말고 깃허브 설정을 다시 **`Change to private`** 으로 되돌립니다.

---

## ⚙️ 3. 환경변수(.env) 설정 및 빌드/실행

GitHub에는 카카오 로그인 키, 데이터베이스 암호 등 민감한 정보가 올라가지 않습니다. 따라서 서버 안에 직접 알맹이(`.env`)를 한 번 만들어줘야 합니다.

1. 다운받은 폴더로 들어갑니다.
   ```bash
   cd ~/curtaincall
   ```

2. 터미널 프롬프트에서 아래 코드를 복사 후 한 번에 붙여넣기 하여 `.env` 파일을 생성합니다.
   ```bash
   cat << 'EOF' > .env
   KOPIS_API_KEY=e9a8148559f94e2db0068ef471aa654e
   KAKAO_CLIENT_ID=your-kakao-client-id
   KAKAO_CLIENT_SECRET=your-kakao-client-secret
   NAVER_CLIENT_ID=your-naver-client-id
   NAVER_CLIENT_SECRET=your-naver-client-secret
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   JWT_SECRET=curtaincall-super-secret-jwt-key-must-be-at-least-256-bits-long-for-hs256
   FRONTEND_URL=http://<현재_서버_IP_주소>
   EOF
   ```

3. **최종 컨테이너 빌드 및 실행!**
   도커 컴포즈를 이용해 백엔드/프론트엔드/DB를 일괄 구동합니다.
   ```bash
   docker compose up -d --build
   ```
   - 처음 빌드 시 라이브러리를 받아오고 우분투 이미지를 구성하느라 5~10분이 걸릴 수 있습니다.
   - `Running 5/5` 상태와 함께 `curtaincall-mysql`, `backend`, `frontend` 가 모두 초록불(Healthy/Started)로 뜨면 배포가 무사히 완료된 것입니다.

---

### 🎉 완료 확인
브라우저 주소창에 `http://<서버_IP_주소>`를 치고 들어가서 CurtainCall 메인 화면이 정상적으로 나오는지 확인합니다!

---

## 🔄 4. 코드 수정 후 재배포 방법 (업데이트)

로컬 컴퓨터에서 코드를 수정하고 기능(기록이나 컴포넌트 등)을 추가한 후, 이를 다시 서버에 라이브로 반영하고 싶을 때 순서입니다.

1. **로컬(내 컴퓨터)에서 수정된 코드 깃허브로 전송 (Commit & Push)**
   VS Code나 터미널에서 변경된 코드를 깃허브 마스터(혹은 메인) 브랜치로 올립니다.
   ```bash
   git add .
   git commit -m "feat: 업데이트 내용"
   git push origin master
   ```

2. **GitHub 레포지토리 임시 공개 전환**
   - 브라우저에서 `GitHub Repo -> Settings -> Change repository visibility -> Change to public` 클릭 (처음 다운받을 때와 동일)

3. **서버(droplet)에 접속**
   ```bash
   ssh root@<서버_IP_주소>
   ```

4. **서버의 소스코드 최신화 (가져오기)**
   - 이미 존재하는 다운로드 폴더 안에서 깃허브의 변경사항만 쏙 가져옵니다 (`pull`).
   ```bash
   cd ~/curtaincall
   git pull origin master
   ```

5. **도커 컴포즈 재빌드 및 재실행**
   - 코드가 바뀌었으니 컨테이너를 새로 빌드해서 띄워야 합니다.
   ```bash
   docker compose up -d --build
   ```
   - (이때 도커가 알아서 변경된 부분(프론트 or 백)만 다시 빌드하므로 처음보다 훨씬 빨리 끝납니다.)

6. **GitHub 레포지토리 다시 비공개로 원상 복구**
   - 보안을 위해 다시 `Settings -> Change repository visibility -> Change to private` 로 닫아줍니다.

완성! 사이트에 들어가서 새로고침(F5)을 해보시면 내 컴퓨터에서 수정한 내용이 서버에 완벽하게 반영되어 있습니다.
