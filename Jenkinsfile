pipeline {
  agent none

  parameters {
    string(
      name: 'VITE_API_BASE_URL',
      defaultValue: '/api',
      description: 'API 엔드포인트 (기본값: /api - nginx 리버스 프록시 사용)'
    )
    string(
      name: 'DOCKER_PORT',
      defaultValue: '7777',
      description: '외부 포트 (기본값: 7777)'
    )
  }

  environment {
    PROJECT_NAME = 'amazon2-front'
    DOCKER_IMAGE = "${PROJECT_NAME}:${BUILD_NUMBER}"
    DOCKER_IMAGE_LATEST = "${PROJECT_NAME}:latest"
    NODE_ENV = 'production'
    VITE_API_BASE_URL = "${params.VITE_API_BASE_URL}"
    DOCKER_PORT = "${params.DOCKER_PORT}"
  }

  options {
    buildDiscarder(logRotator(numToKeepStr: '30', daysToKeepStr: '10'))
    disableConcurrentBuilds()
    timeout(time: 30, unit: 'MINUTES')
  }

  stages {
    stage('Checkout') {
      agent any
      steps {
        echo '📦 Git 저장소 체크아웃 중...'
        checkout scm
      }
    }

    stage('Install & Build') {
      agent {
        docker {
          image 'node:20-alpine'
        }
      }
      environment {
        HOME = '/tmp'
        npm_config_cache = '/tmp/npm-cache'
        HUSKY = '0'
      }
      steps {
        echo '📥 의존성 설치 중...'
        sh '''
          rm -rf node_modules package-lock.json
          npm cache clean --force
          npm ci --ignore-scripts
        '''

        echo '✅ ESLint 검증 중...'
        catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
          sh 'npm run lint'
        }

        echo '🔍 TypeScript 타입 검사 중...'
        catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
          sh 'npm run type-check'
        }

        echo '🧪 테스트 실행 중...'
        catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
          sh 'npm run test -- --run'
        }

        echo '🔨 프로젝트 빌드 중...'
        echo "API 엔드포인트: ${VITE_API_BASE_URL}"
        sh 'npm run build'
      }
    }

    stage('Build Docker Image') {
      agent any
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
      agent any
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

    stage('Deploy') {
      agent any
      steps {
        echo '🚀 컨테이너 배포 중...'
        echo "포트: ${DOCKER_PORT}"
        sh '''
          # 기존 컨테이너 중지
          docker stop ${PROJECT_NAME} || true
          docker rm ${PROJECT_NAME} || true

          # 새 컨테이너 실행
          docker run -d \
            --name ${PROJECT_NAME} \
            -p ${DOCKER_PORT}:80 \
            -e NODE_ENV=${NODE_ENV} \
            --restart unless-stopped \
            ${DOCKER_IMAGE_LATEST}

          echo "✅ 컨테이너 실행 완료"
          sleep 2
          docker ps | grep ${PROJECT_NAME}
        '''
      }
    }
  }

  post {
    always {
      echo '🧹 정리 중...'
      sh '''
        docker rm -f test-${BUILD_NUMBER} 2>/dev/null || true
      '''
    }

    success {
      echo '✅ 빌드 및 배포 성공!'
      echo "📦 이미지: ${DOCKER_IMAGE_LATEST}"
      echo "🌐 접속: http://localhost:${DOCKER_PORT}"
      echo "🔗 API 엔드포인트: ${VITE_API_BASE_URL}"
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
