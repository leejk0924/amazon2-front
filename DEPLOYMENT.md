# Docker 배포 가이드

## 개요

Jenkins에서 자동으로 Docker 이미지를 빌드하고 배포하는 간단한 방식입니다.

## 배포 흐름

```
Git Push (main)
    ↓
GitHub Webhook
    ↓
Jenkins 빌드 시작
    ↓
Checkout → Install → Lint → Type Check → Test → Build → Build Docker → Test Docker
    ↓
Deploy (docker run)
    ↓
✅ http://localhost:7777 접속 가능
```

## Jenkins 설정

### 1단계: Jenkins 파이프라인 생성

```bash
# 1. Jenkins 대시보드 접속
# http://localhost:8080

# 2. "New Item" 클릭
# - Item name: amazon2-front
# - Type: Pipeline
# - OK 클릭

# 3. Pipeline 설정
# - Definition: Pipeline script from SCM
# - SCM: Git
# - Repository URL: https://github.com/your-username/amazon2-front.git
# - Credentials: GitHub 계정
# - Branch: */main
# - Script Path: Jenkinsfile
# - Save
```

### 2단계: 파라미터 설정 완료

Jenkinsfile에 이미 파라미터가 정의되어 있습니다:

- `BACKEND_API_URL`: Backend API 주소
- `DOCKER_PORT`: 외부 포트

별도의 Webhook 설정이 필요 없습니다.

## 배포 확인

### 수동 배포 시작

```bash
# 1. Jenkins 대시보드 → amazon2-front
# 2. "Build with Parameters" 클릭
# 3. 파라미터 입력:
#    - BACKEND_API_URL: http://localhost:8080 (또는 실제 Backend 주소)
#    - DOCKER_PORT: 7777 (외부 포트)
# 4. Build 클릭
```

### 파라미터 설명

| 파라미터            | 기본값                | 설명                  |
| ------------------- | --------------------- | --------------------- |
| **BACKEND_API_URL** | http://localhost:8080 | Backend API 서버 주소 |
| **DOCKER_PORT**     | 7777                  | 외부에서 접속할 포트  |

### 웹 접속

```
http://localhost:7777
```

## 실행 중인 컨테이너 확인

### 컨테이너 상태 확인

```bash
# 실행 중인 컨테이너 확인
docker ps | grep amazon2-front

# 출력 예시:
# CONTAINER ID   IMAGE                      STATUS            PORTS
# abc123def456   amazon2-front:latest       Up 2 minutes      0.0.0.0:7777->80/tcp
```

### 컨테이너 로그 확인

```bash
# 실시간 로그
docker logs -f amazon2-front

# 최근 100줄
docker logs --tail 100 amazon2-front
```

### 컨테이너 재시작

```bash
# 수동 재시작 (Jenkins 없이)
docker restart amazon2-front
```

## 문제 해결

### 1. 포트 이미 사용 중

```bash
# 포트 사용 중인 프로세스 확인
lsof -i :7777

# 포트 변경 (Jenkins 재실행 필요)
docker stop amazon2-front
docker rm amazon2-front
docker run -d -p 8888:80 amazon2-front:latest
```

### 2. 컨테이너 실행 오류

```bash
# 로그 확인
docker logs amazon2-front

# 기존 컨테이너 강제 삭제
docker rm -f amazon2-front

# Jenkins에서 빌드 다시 실행
```

### 3. 빌드 실패

Jenkins 대시보드에서 빌드 로그 확인:

- Console Output에서 에러 메시지 확인
- ESLint 오류, 테스트 실패 등 원인 파악

## 수동 배포 (Jenkins 없이)

필요한 경우 수동으로 컨테이너를 실행할 수 있습니다:

```bash
# 이미지 빌드
docker build -t amazon2-front:latest .

# 기존 컨테이너 중지
docker stop amazon2-front || true
docker rm amazon2-front || true

# 새 컨테이너 실행
docker run -d \
  --name amazon2-front \
  -p 7777:80 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  amazon2-front:latest

# 확인
docker ps | grep amazon2-front
curl http://localhost:7777
```

## 이미지 정리

### 미사용 이미지 삭제

```bash
# 모든 미사용 Docker 리소스 정리
docker system prune -a

# 특정 이미지 삭제
docker image rm amazon2-front:123
```

### 이미지 크기 확인

```bash
docker images | grep amazon2-front
```

## 배포 자동화

### 자동 업데이트 (옵션)

매 Jenkins 빌드 후 자동으로 최신 이미지로 교체됩니다.

### 다운타임 없는 배포 (Advanced)

Blue-Green 배포가 필요한 경우:

```bash
# 새 컨테이너를 8888 포트로 실행
docker run -d \
  --name amazon2-front-new \
  -p 8888:80 \
  amazon2-front:latest

# 테스트 (curl http://localhost:8888)

# nginx 리버스 프록시 변경 (또는 포트 스위칭)
# 트래픽을 새 컨테이너로 전환

# 기존 컨테이너 중지
docker stop amazon2-front
```

## 환경 변수

### 배포 시 환경 변수 설정

```bash
docker run -d \
  --name amazon2-front \
  -p 7777:80 \
  -e NODE_ENV=production \
  -e VITE_API_BASE_URL=https://api.example.com \
  amazon2-front:latest
```

### Jenkinsfile에서 환경 변수 설정

```groovy
stage('Deploy') {
  steps {
    sh '''
      docker run -d \
        --name ${PROJECT_NAME} \
        -p ${DOCKER_PORT}:80 \
        -e NODE_ENV=${NODE_ENV} \
        -e VITE_API_BASE_URL=${API_BASE_URL} \
        ${DOCKER_IMAGE_LATEST}
    '''
  }
}
```

## 다음 단계

- **Private Registry**: 여러 서버에 배포 필요 시 [PRIVATE_REGISTRY.md](./PRIVATE_REGISTRY.md) 참고
- **모니터링**: Prometheus, Grafana로 모니터링 추가
- **로깅**: ELK 스택으로 중앙화된 로깅
- **Blue-Green 배포**: 무중단 배포 구성
- **스케일링**: 여러 컨테이너 인스턴스 관리 (Docker Compose/Kubernetes)
