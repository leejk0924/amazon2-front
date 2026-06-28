# 자체 Docker Registry 구축 가이드

## 개요

Docker Hub를 사용하지 않고 자체 프라이빗 Docker Registry를 구축하여 이미지를 관리합니다.

## 아키텍처

```
Local Developer
    ↓
GitHub (git push)
    ↓
Jenkins Server
  (Checkout → Build → Push to Private Registry)
    ↓
Private Docker Registry
    ↓
Deployment Server
  (Pull from Registry → Run Container)
```

## 1단계: Private Docker Registry 설치

### 단일 서버에 설치 (권장)

Registry를 실행할 전용 서버를 선택합니다. (또는 Jenkins 서버와 동일)

```bash
# Registry 디렉토리 생성
mkdir -p /data/registry
cd /data/registry

# docker-compose.yml 생성
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  registry:
    image: registry:2.8
    container_name: docker-registry
    ports:
      - "5000:5000"
    environment:
      REGISTRY_STORAGE_DELETE_ENABLED: "true"
      REGISTRY_LOG_LEVEL: "info"
    volumes:
      - ./data:/var/lib/registry
      - ./config.yml:/etc/docker/registry/config.yml
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5000/v2/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
EOF

# Registry 실행
docker-compose up -d
```

### 확인

```bash
# Registry 상태 확인
curl http://localhost:5000/v2/

# 출력: {}
```

## 2단계: HTTPS 설정 (프로덕션)

### Self-signed 인증서 생성

```bash
# 인증서 디렉토리 생성
mkdir -p /data/registry/certs

# Self-signed 인증서 생성 (365일 유효)
openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout /data/registry/certs/server.key \
  -out /data/registry/certs/server.crt \
  -subj "/CN=docker-registry.example.com"
```

### docker-compose.yml 수정

```yaml
services:
  registry:
    image: registry:2.8
    container_name: docker-registry
    ports:
      - '5000:5000'
    environment:
      REGISTRY_HTTP_ADDR: 0.0.0.0:5000
      REGISTRY_HTTP_TLS_CERTIFICATE: /certs/server.crt
      REGISTRY_HTTP_TLS_KEY: /certs/server.key
      REGISTRY_STORAGE_DELETE_ENABLED: 'true'
    volumes:
      - ./data:/var/lib/registry
      - ./certs:/certs
    restart: unless-stopped
```

## 3단계: Jenkins 설정

### Jenkinsfile 수정

Registry 주소를 환경변수로 설정합니다:

```groovy
pipeline {
  agent any

  environment {
    PROJECT_NAME = 'amazon2-front'
    REGISTRY_URL = '192.168.1.100:5000'  // Registry 서버 IP:포트
    DOCKER_IMAGE = "${REGISTRY_URL}/${PROJECT_NAME}:${BUILD_NUMBER}"
    DOCKER_IMAGE_LATEST = "${REGISTRY_URL}/${PROJECT_NAME}:latest"
    NODE_ENV = 'production'
  }

  stages {
    // ... 기존 stages ...

    stage('Build Docker Image') {
      steps {
        echo '🐳 Docker 이미지 빌드 중...'
        sh '''
          docker build \
            --build-arg NODE_ENV=${NODE_ENV} \
            -t ${DOCKER_IMAGE} \
            -t ${DOCKER_IMAGE_LATEST} \
            .
        '''
      }
    }

    stage('Push to Private Registry') {
      steps {
        echo '📤 Registry에 이미지 푸시 중...'
        sh '''
          docker push ${DOCKER_IMAGE}
          docker push ${DOCKER_IMAGE_LATEST}
        '''
      }
    }

    stage('Test Docker Image') {
      steps {
        echo '🧪 Docker 이미지 테스트 중...'
        sh '''
          docker run -d \
            --name test-${BUILD_NUMBER} \
            -p 8080:80 \
            ${DOCKER_IMAGE}

          sleep 3
          curl -f http://localhost:8080/index.html || {
            echo "❌ HTTP 헬스체크 실패"
            docker logs test-${BUILD_NUMBER}
            exit 1
          }

          docker stop test-${BUILD_NUMBER}
          docker rm test-${BUILD_NUMBER}
        '''
      }
    }
  }

  post {
    always {
      sh '''
        docker rm -f test-${BUILD_NUMBER} 2>/dev/null || true
      '''
    }

    success {
      echo '✅ 빌드 및 푸시 성공!'
      echo "📦 이미지: ${DOCKER_IMAGE_LATEST}"
    }

    failure {
      echo '❌ 빌드 실패!'
    }
  }
}
```

### Jenkins가 Registry에 접근 가능하도록 설정

만약 Registry가 HTTPS를 사용한다면:

```bash
# Jenkins 서버에서 인증서 추가
mkdir -p /etc/docker/certs.d/docker-registry.example.com:5000

# 인증서 복사
cp /data/registry/certs/server.crt \
  /etc/docker/certs.d/docker-registry.example.com:5000/ca.crt

# Docker 데몬 재시작
systemctl restart docker
```

## 4단계: 배포 서버 설정

배포할 서버에서 Registry의 이미지를 pull하여 실행합니다.

### 스크립트 생성

```bash
#!/bin/bash
# deploy.sh

REGISTRY_URL="192.168.1.100:5000"
PROJECT_NAME="amazon2-front"
IMAGE="${REGISTRY_URL}/${PROJECT_NAME}:latest"
PORT=7777

echo "📥 Registry에서 이미지 pull 중..."
docker pull ${IMAGE}

echo "🛑 기존 컨테이너 중지..."
docker stop ${PROJECT_NAME} || true
docker rm ${PROJECT_NAME} || true

echo "🚀 새 컨테이너 실행..."
docker run -d \
  --name ${PROJECT_NAME} \
  -p ${PORT}:80 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  ${IMAGE}

echo "✅ 배포 완료!"
echo "🌐 http://localhost:${PORT}"
```

### 배포 서버에서 자동 실행

#### 방법 1: Jenkins에서 SSH로 배포

Jenkinsfile에 배포 단계 추가:

```groovy
stage('Deploy to Production') {
  steps {
    sh '''
      ssh -i /path/to/key user@deployment-server.com \
        "bash /home/user/deploy.sh"
    '''
  }
}
```

#### 방법 2: 배포 서버에서 cron으로 주기적 업데이트

```bash
# crontab -e
# 매일 자정에 최신 이미지 pull 및 재시작
0 0 * * * /home/user/deploy.sh
```

## 5단계: Registry 관리

### 이미지 조회

```bash
# Registry의 모든 리포지토리 조회
curl http://localhost:5000/v2/_catalog

# 특정 리포지토리의 태그 조회
curl http://localhost:5000/v2/amazon2-front/tags/list
```

### 이미지 삭제

```bash
# Registry에서 이미지 삭제 (manifest hash 필요)
curl -X DELETE http://localhost:5000/v2/amazon2-front/manifests/<digest>

# Docker CLI로 삭제 (Registry 이미지만)
docker image rm ${REGISTRY_URL}/amazon2-front:old-tag
docker system prune -a  # 미사용 이미지 정리
```

### Registry 용량 정리

```bash
# 오래된 이미지 자동 삭제 설정
# docker-compose.yml의 REGISTRY_STORAGE_DELETE_ENABLED 확인

# 또는 수동으로 Registry 정리
docker exec docker-registry registry garbage-collect \
  /etc/docker/registry/config.yml
```

## 6단계: 모니터링

### Registry 상태 확인

```bash
# 헬스체크
curl -I http://localhost:5000/v2/

# 통계
curl http://localhost:5000/v2/_catalog | jq .

# 로그 확인
docker logs docker-registry
```

### 저장소 크기 확인

```bash
du -sh /data/registry/data/
```

## 보안 고려사항

### 인증 추가 (htpasswd)

```bash
# 사용자 인증 파일 생성
mkdir -p /data/registry/auth
docker run --entrypoint htpasswd registry:2.8 \
  -Bbc /auth/htpasswd testuser testpassword > /dev/null

# docker-compose.yml에 추가
environment:
  REGISTRY_AUTH: htpasswd
  REGISTRY_AUTH_HTPASSWD_PATH: /auth/htpasswd
  REGISTRY_AUTH_HTPASSWD_REALM: Registry Realm

volumes:
  - ./auth:/auth
```

### 로컬 네트워크만 접근 허용

```bash
# firewall 설정 (iptables)
iptables -A INPUT -i eth0 -p tcp --dport 5000 -j ACCEPT
iptables -A INPUT -p tcp --dport 5000 -j DROP
```

### TLS/SSL 인증서

```bash
# Let's Encrypt 사용 (선택사항)
# certbot으로 자동 갱신 가능
```

## 트러블슈팅

### 1. Docker daemon이 Registry에 접근 불가

```bash
# 1. Registry 상태 확인
docker ps | grep registry

# 2. Registry 로그 확인
docker logs docker-registry

# 3. 방화벽 확인
netstat -tuln | grep 5000

# 4. DNS 확인
nslookup docker-registry.example.com
```

### 2. Push 실패

```bash
# 1. Registry URL 확인
# - docker.io/image (공개 Registry)
# - localhost:5000/image (로컬 Registry)
# - registry.example.com:5000/image (원격 Registry)

# 2. 이미지 태그 확인
docker images | grep amazon2-front

# 3. Registry 연결 테스트
curl -v http://localhost:5000/v2/
```

### 3. Pull 실패

```bash
# 1. 이미지 존재 여부 확인
curl http://localhost:5000/v2/amazon2-front/tags/list

# 2. 인증 확인 (htpasswd 사용 시)
docker login localhost:5000

# 3. Docker daemon 로그
journalctl -u docker -f
```

## 참고 자료

- Docker Registry 공식 문서: https://docs.docker.com/registry/
- Registry configuration: https://docs.docker.com/registry/configuration/
- Docker authentication: https://docs.docker.com/registry/authentication/

## 다음 단계

1. **Registry UI 추가**: docker-registry-ui로 웹 대시보드 추가
2. **이미지 스캔**: Trivy로 취약점 스캔 자동화
3. **백업**: Registry 데이터 정기 백업
4. **고가용성**: 여러 Registry 서버로 복제 구성
