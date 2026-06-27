# Jenkins CI/CD 설정 가이드

## 개요

이 가이드는 Jenkins를 사용하여 amazon2-front 프로젝트의 CI/CD 파이프라인을 구축하는 방법을 설명합니다.

## 파이프라인 단계

```
Checkout → Install → Lint → Type Check → Test → Build → Build Docker → Test Docker
```

각 단계별 역할:

| 단계                     | 역할                         | 실패 시     |
| ------------------------ | ---------------------------- | ----------- |
| **Checkout**             | Git 저장소에서 코드 다운로드 | 빌드 중단   |
| **Install Dependencies** | npm 의존성 설치              | 빌드 중단   |
| **Lint & Format Check**  | ESLint 검증                  | 경고 (진행) |
| **Type Check**           | TypeScript 타입 검사         | 경고 (진행) |
| **Test**                 | Vitest 테스트 실행           | 경고 (진행) |
| **Build**                | Vite로 프로젝트 빌드         | 빌드 중단   |
| **Build Docker Image**   | Docker 이미지 빌드           | 빌드 중단   |
| **Test Docker Image**    | 빌드된 이미지 실행 및 검증   | 빌드 중단   |

## 사전 요구사항

### Jenkins 서버

- Jenkins 2.387+
- Docker 플러그인 설치
- Git 플러그인 설치
- Blue Ocean 플러그인 (선택사항, 시각화)

### 설치 명령어

```bash
# Jenkins 설치 (Docker 사용)
docker run -d \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --name jenkins \
  jenkins/jenkins:lts

# 초기 비밀번호 확인
docker logs jenkins | grep "Initial Admin password"
```

### Jenkins 플러그인 설치

Jenkins 메인 페이지 → `Manage Jenkins` → `Manage Plugins`

필수 플러그인:

- Pipeline
- Git
- GitHub
- Docker
- Blue Ocean (선택사항)

## 1단계: Jenkins 파이프라인 생성

### 방법 1: GitHub 레포지토리에서 자동 감지 (권장)

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
# - Credentials: GitHub 계정 (없으면 추가)
# - Branch: */main
# - Script Path: Jenkinsfile
# - Save
```

### 방법 2: Jenkinsfile 직접 작성

```bash
# 1. New Item → Pipeline
# 2. Pipeline 설정
#   - Definition: Pipeline script
#   - Script: Jenkinsfile 전체 내용 붙여넣기
# 3. Save
```

## 2단계: GitHub Webhook 설정

### GitHub에서 Webhook 추가

```bash
# 1. GitHub 레포지토리 → Settings → Webhooks
# 2. Add webhook
# 3. 다음 정보 입력:
#   - Payload URL: http://<jenkins-url>/github-webhook/
#   - Content type: application/json
#   - Events: Push events + Pull requests
#   - Active: 체크
# 4. Add webhook
```

### Jenkins 설정

```bash
# 1. Jenkins 파이프라인 프로젝트 설정 페이지
# 2. Build Triggers 섹션
#   - GitHub hook trigger for GITscm polling 체크
# 3. Save
```

**결과:** GitHub에 push 시 자동으로 빌드 시작

## 3단계: Jenkins 크리덴셜 설정

### Docker Hub 크리덴셜 (선택사항)

나중에 Docker Hub에 이미지를 푸시하려면:

```bash
# 1. Jenkins 대시보드 → Manage Jenkins → Manage Credentials
# 2. Stores scoped to Jenkins → Jenkins → Global credentials
# 3. Add Credentials
# 4. Kind: Username with password
#   - Username: <Docker Hub username>
#   - Password: <Docker Hub access token>
#   - ID: docker-hub
# 5. Create
```

### GitHub 크리덴셜

```bash
# 1. Jenkins 대시보드 → Manage Jenkins → Manage Credentials
# 2. Global credentials
# 3. Add Credentials
# 4. Kind: GitHub App
#   또는 Username with password
#   - Username: <GitHub username>
#   - Password: <GitHub personal access token>
#   - ID: github
# 5. Create
```

## 4단계: 빌드 실행

### 수동 빌드 시작

```bash
# 1. Jenkins 대시보드 → amazon2-front
# 2. Build Now 클릭
```

### 자동 빌드 트리거

```bash
# 1. GitHub에 코드 푸시
# 2. Jenkins가 자동으로 빌드 시작
# 3. Jenkins 대시보드에서 빌드 진행 상황 확인
```

## 5단계: 빌드 결과 확인

### 콘솔 로그 보기

```bash
# 1. Jenkins 대시보드 → amazon2-front → Build History
# 2. 빌드 번호 클릭
# 3. Console Output 클릭
```

### 빌드 상태

- ✅ **Success**: 모든 단계 성공
- ⚠️ **Unstable**: ESLint/TypeScript/테스트 경고 있음 (Docker 이미지는 빌드됨)
- ❌ **Failure**: 빌드 또는 Docker 이미지 테스트 실패

### Docker 이미지 확인

```bash
# Jenkins 서버에서 실행
docker images | grep amazon2-front

# 예시 출력:
# amazon2-front   123     50.5MB
# amazon2-front   latest  50.5MB
```

## 6단계: 배포 설정 (선택사항)

### 로컬 서버에 배포

Jenkinsfile을 수정하여 Docker 컨테이너를 자동으로 실행:

```groovy
stage('Deploy') {
  steps {
    sh '''
      docker stop amazon2-front || true
      docker rm amazon2-front || true
      docker run -d \
        --name amazon2-front \
        -p 7777:80 \
        amazon2-front:latest
    '''
  }
}
```

### 원격 서버에 배포

SSH를 사용하여 원격 서버에 배포:

```groovy
stage('Deploy to Production') {
  steps {
    sh '''
      ssh -i /path/to/key user@server.com "
        docker pull amazon2-front:latest && \
        docker stop amazon2-front || true && \
        docker rm amazon2-front || true && \
        docker run -d -p 7777:80 amazon2-front:latest
      "
    '''
  }
}
```

## 문제 해결

### 1. Docker 권한 오류

```
docker: permission denied
```

**해결책:**

```bash
# Jenkins 사용자를 docker 그룹에 추가
sudo usermod -aG docker jenkins
# Jenkins 서비스 재시작
sudo systemctl restart jenkins
```

### 2. GitHub Webhook 작동 안 함

```bash
# 1. GitHub → Repository → Settings → Webhooks
# 2. Recent Deliveries에서 요청 확인
# 3. Response 확인 (200 OK 여야 함)
# 4. Jenkins URL 확인 (공개 IP/도메인 필요)
```

### 3. 빌드 타임아웃

Jenkinsfile의 timeout 값 증가:

```groovy
options {
  timeout(time: 60, unit: 'MINUTES')  // 30분에서 60분으로 증가
}
```

### 4. npm 캐시 문제

```bash
# Jenkins에서 npm 캐시 삭제
npm cache clean --force
rm -rf node_modules
npm ci
```

## 모니터링

### 빌드 이력

```bash
# Jenkins 대시보드 → amazon2-front → Build History
# 각 빌드의 상태와 실행 시간 확인
```

### 성능 지표

```bash
# Blue Ocean 플러그인 사용 시
# Jenkins 대시보드 → Open Blue Ocean
# 파이프라인 시각화 및 상세 통계 확인
```

### 로그 분석

```bash
# 실패한 빌드의 콘솔 로그 확인
# 특정 단계에서 실패한 이유 파악
# ESLint 오류, 테스트 실패 등 원인 확인
```

## 다음 단계

1. **Docker Hub 푸시**: Docker 이미지를 Docker Hub에 자동 푸시
2. **Slack 알림**: 빌드 결과를 Slack에 자동 통지
3. **다중 환경**: dev/staging/production 환경별 배포
4. **자동 배포**: 빌드 성공 시 자동으로 서버에 배포
5. **성능 테스트**: Lighthouse/k6 등으로 성능 측정

## 참고

- Jenkins 공식 문서: https://www.jenkins.io/doc/
- GitHub Actions 대안: [GitHub Actions로 마이그레이션](./GITHUB_ACTIONS.md)
- Jenkinsfile 다양한 예제: [Jenkinsfile 패턴](./JENKINSFILE_PATTERNS.md)
