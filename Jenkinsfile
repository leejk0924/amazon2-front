pipeline {
  agent any

  environment {
    PROJECT_NAME = 'amazon2-front'
    // Private Registry 설정 (환경변수로 변경 가능)
    REGISTRY_URL = credentials('registry-url') ?: 'localhost:5000'
    DOCKER_IMAGE = "${REGISTRY_URL}/${PROJECT_NAME}:${BUILD_NUMBER}"
    DOCKER_IMAGE_LATEST = "${REGISTRY_URL}/${PROJECT_NAME}:latest"
    NODE_ENV = 'production'
  }

  options {
    // 빌드 로그 보관 기간 설정
    buildDiscarder(logRotator(numToKeepStr: '30', daysToKeepStr: '10'))
    // 동시 빌드 방지
    disableConcurrentBuilds()
    // 빌드 타임아웃 설정 (30분)
    timeout(time: 30, unit: 'MINUTES')
  }

  stages {
    stage('Checkout') {
      steps {
        echo '📦 Git 저장소 체크아웃 중...'
        checkout scm
      }
    }

    stage('Install Dependencies') {
      steps {
        echo '📥 의존성 설치 중...'
        sh 'npm ci'
      }
    }

    stage('Lint & Format Check') {
      steps {
        echo '✅ ESLint 검증 중...'
        sh 'npm run lint --no-fix' || {
          unstable('ESLint 경고 발견')
        }
      }
    }

    stage('Type Check') {
      steps {
        echo '🔍 TypeScript 타입 검사 중...'
        sh 'npm run type-check' || {
          unstable('TypeScript 타입 오류 발견')
        }
      }
    }

    stage('Test') {
      steps {
        echo '🧪 테스트 실행 중...'
        sh 'npm run test -- --run' || {
          unstable('테스트 실패')
        }
      }
    }

    stage('Build') {
      steps {
        echo '🔨 프로젝트 빌드 중...'
        sh 'npm run build'
      }
    }

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
        echo "✅ Docker 이미지 빌드 완료: ${DOCKER_IMAGE}"
      }
    }

    stage('Test Docker Image') {
      steps {
        echo '🧪 Docker 이미지 테스트 중...'
        sh '''
          # 컨테이너 실행
          docker run -d \
            --name test-${BUILD_NUMBER} \
            -p 8080:80 \
            ${DOCKER_IMAGE}

          # 헬스체크
          sleep 3
          docker ps | grep test-${BUILD_NUMBER} || {
            echo "❌ Docker 컨테이너 실행 실패"
            exit 1
          }

          # HTTP 응답 확인
          curl -f http://localhost:8080/index.html || {
            echo "❌ HTTP 헬스체크 실패"
            docker logs test-${BUILD_NUMBER}
            exit 1
          }

          echo "✅ Docker 이미지 테스트 완료"
          docker stop test-${BUILD_NUMBER}
          docker rm test-${BUILD_NUMBER}
        '''
      }
    }

    stage('Push to Private Registry') {
      steps {
        echo '📤 Private Registry에 이미지 푸시 중...'
        sh '''
          echo "Registry: ${REGISTRY_URL}"
          docker push ${DOCKER_IMAGE}
          docker push ${DOCKER_IMAGE_LATEST}
        '''
      }
    }
  }

  post {
    always {
      echo '🧹 정리 중...'
      sh '''
        # 테스트 컨테이너 정리
        docker rm -f test-${BUILD_NUMBER} 2>/dev/null || true
      '''
    }

    success {
      echo '✅ 빌드 및 푸시 성공!'
      echo "📦 이미지: ${DOCKER_IMAGE_LATEST}"
      echo "🔗 Registry: ${REGISTRY_URL}"
      echo "🚀 배포 준비 완료"
    }

    unstable {
      echo '⚠️  빌드 경고'
      echo '📋 ESLint 또는 테스트 경고를 확인하세요'
    }

    failure {
      echo '❌ 빌드 실패!'
      sh 'docker logs test-${BUILD_NUMBER} 2>/dev/null || true'
    }
  }
}
