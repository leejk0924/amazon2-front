# Docker + nginx 배포 가이드

## 개요

이 프로젝트는 Docker와 nginx를 사용하여 배포할 수 있습니다. 멀티 스테이지 빌드를 통해 최소한의 이미지 크기를 유지합니다.

## 디렉토리 구조

```
.
├── Dockerfile          # Docker 이미지 빌드 설정
├── nginx.conf          # nginx 웹 서버 설정
├── docker-compose.yml  # 로컬 개발 및 테스트 용 설정
├── .dockerignore       # Docker 빌드 시 제외할 파일 목록
├── .env.example        # 환경 변수 예시
└── DEPLOY.md           # 이 파일
```

## 사전 요구사항

- Docker (v20.10+)
- Docker Compose (v2.0+)

## 로컬 개발 환경에서 테스트

### 1. 환경 변수 설정

```bash
cp .env.example .env.local
# .env.local 파일을 편집하여 필요한 값 설정
```

### 2. Docker 이미지 빌드 및 실행

```bash
# docker-compose로 빌드 및 실행
docker-compose up -d

# 또는 수동으로 빌드
docker build -t amazon2-front:latest .
docker run -d -p 7777:80 amazon2-front:latest
```

### 3. 확인

브라우저에서 http://localhost:7777 접속

## 배포

### 프로덕션 배포

#### 방법 1: docker-compose 사용 (권장)

```bash
# 이미지 빌드
docker-compose build

# 실행
docker-compose up -d

# 중지
docker-compose down
```

#### 방법 2: Docker 명령어 직접 사용

```bash
# 이미지 빌드
docker build -t amazon2-front:latest .

# 실행 (포트 7777)
docker run -d \
  --name amazon2-front \
  -p 7777:80 \
  -e NODE_ENV=production \
  amazon2-front:latest

# 실행 중인 컨테이너 확인
docker ps

# 컨테이너 중지
docker stop amazon2-front

# 컨테이너 삭제
docker rm amazon2-front
```

### 원격 배포 (AWS, GCP, Azure 등)

#### Docker Hub에 푸시

```bash
# Docker Hub 로그인
docker login

# 이미지 빌드 및 태그
docker build -t your-username/amazon2-front:latest .

# 푸시
docker push your-username/amazon2-front:latest
```

#### 원격 서버에서 실행

```bash
# 원격 서버에 SSH 접속 후
docker pull your-username/amazon2-front:latest
docker run -d -p 7777:80 your-username/amazon2-front:latest
```

## 설정 상세

### Dockerfile

- **스테이지 1 (빌드)**: Node.js alpine 이미지에서 의존성 설치 및 빌드
- **스테이지 2 (런타임)**: nginx alpine 이미지에서 빌드된 파일만 복사

장점:

- 최종 이미지에 빌드 도구 미포함 (크기 감소)
- 보안 향상

### nginx.conf

설정 항목:

- **포트**: 80 (컨테이너 내부)
- **root**: `/usr/share/nginx/html` (빌드된 dist 파일 경로)
- **gzip 압축**: 활성화 (성능 향상)
- **정적 파일 캐싱**: 1년 (브라우저 캐시)
- **index.html 캐싱**: 비활성화 (최신 버전 항상 로드)
- **React Router 지원**: 모든 요청을 index.html로 라우팅
- **보안 헤더**: XSS, Clickjacking 방지

### docker-compose.yml

서비스 설정:

- **이미지**: 현재 디렉토리의 Dockerfile로 빌드
- **포트**: 호스트 3000 → 컨테이너 80
- **환경**: NODE_ENV=production
- **재시작 정책**: 컨테이너 중지 시 자동 재시작
- **헬스체크**: 30초마다 상태 확인

## 트러블슈팅

### 포트 이미 사용 중

```bash
# 현재 사용 중인 컨테이너 확인
docker ps

# 기존 컨테이너 중지
docker stop <container_name>

# 포트 변경 (docker-compose.yml 수정)
ports:
  - "7777:80"  # 7777로 변경
```

### 빌드 실패

```bash
# 캐시 제거 후 재빌드
docker build --no-cache -t amazon2-front:latest .
```

### 컨테이너 로그 확인

```bash
# docker-compose 사용 시
docker-compose logs -f

# Docker 직접 사용 시
docker logs -f amazon2-front
```

## 성능 최적화

### 이미지 크기 감소

```bash
# 빌드된 이미지 크기 확인
docker images amazon2-front

# 불필요한 이미지 정리
docker image prune
```

### 빌드 시간 단축

```bash
# .dockerignore에 불필요한 파일 추가
# node_modules, .git, .env 등은 이미 포함됨
```

## 보안

### 권장사항

1. **환경 변수 관리**
   - 민감한 정보는 `.env` 파일 사용
   - `.env` 파일은 `.gitignore`에 포함

2. **이미지 보안**
   - 정기적으로 베이스 이미지 업데이트
   - 정기적인 취약점 스캔 (docker scan)

3. **컨테이너 보안**
   - root 사용자로 실행하지 않기 (현재 nginx는 nobody 사용)
   - read-only 파일시스템 설정 (운영 환경)

## 환경변수 주입 (빌드 타임)

Vite는 빌드 타임에 환경 변수를 번들에 포함합니다.

```bash
# .env 파일 생성
VITE_API_BASE_URL=https://api.example.com

# 빌드
npm run build
```

환경에 따라 빌드 스크립트 작성:

```bash
# .env.production
VITE_API_BASE_URL=https://api.production.com

# 빌드
docker build \
  --build-arg NODE_ENV=production \
  -t amazon2-front:prod .
```

## 다음 단계

- CI/CD 파이프라인 구축 (GitHub Actions, GitLab CI 등)
- 쿠버네티스(Kubernetes) 배포 고려
- 모니터링 및 로깅 설정 (ELK, Datadog 등)
