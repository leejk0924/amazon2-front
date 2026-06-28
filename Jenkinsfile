pipeline {
  agent none

  parameters {
    string(name: 'VITE_API_BASE_URL', defaultValue: '/api', description: 'API 엔드포인트')
    string(name: 'DOCKER_PORT', defaultValue: '7777', description: '외부 포트')
  }

  environment {
    PROJECT_NAME = 'amazon2-front'
    DOCKER_IMAGE = "${PROJECT_NAME}:${BUILD_NUMBER}"
    DOCKER_IMAGE_LATEST = "${PROJECT_NAME}:latest"
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
          image 'node:22-alpine'
          reuseNode true
        }
      }
      environment {
        HOME = '/tmp'
        npm_config_cache = '/tmp/npm-cache'
        HUSKY = '0'
      }
      steps {
        echo '📥 Node/npm 버전 확인 중...'
        sh '''
          node -v
          npm -v
          echo "NODE_ENV=${NODE_ENV:-unset}"
          npm config get omit
        '''

        echo '📥 의존성 설치 중...'
        sh '''
          rm -rf node_modules
          npm ci --include=dev --ignore-scripts
        '''

        echo '📦 설치 확인 중...'
        sh '''
          npm ls vite || true
          ls -la node_modules/.bin/vite || true
        '''

        echo '🔨 빌드 중...'
        sh "NODE_ENV=production VITE_API_BASE_URL=${VITE_API_BASE_URL} npm run build"
      }
    }

    stage('Build Docker Image') {
      agent any
      steps {
        echo '🐳 Docker 이미지 빌드 중...'
        sh """
          docker build \\
            --build-arg NODE_ENV=${NODE_ENV} \\
            -t ${DOCKER_IMAGE} \\
            -t ${DOCKER_IMAGE_LATEST} \\
            .
        """
      }
    }

    stage('Test Docker Image') {
      agent any
      steps {
        echo '🧪 Docker 이미지 테스트 중...'
        sh """
          docker run -d --name test-${BUILD_NUMBER} -p 8080:80 ${DOCKER_IMAGE}
          sleep 3
          curl -f http://localhost:8080/index.html || {
            docker logs test-${BUILD_NUMBER}
            docker rm -f test-${BUILD_NUMBER}
            exit 1
          }
          docker rm -f test-${BUILD_NUMBER}
          echo '✅ 테스트 완료'
        """
      }
    }

    stage('Deploy') {
      agent any
      steps {
        echo '🚀 배포 중...'
        sh """
          docker stop ${PROJECT_NAME} || true
          docker rm ${PROJECT_NAME} || true
          docker run -d \\
            --name ${PROJECT_NAME} \\
            -p ${DOCKER_PORT}:80 \\
            --restart unless-stopped \\
            ${DOCKER_IMAGE_LATEST}
        """
      }
    }
  }

  post {
    always {
      node('built-in') {
        sh "docker rm -f test-${BUILD_NUMBER} 2>/dev/null || true"
      }
    }
    success {
      echo '✅ 빌드 및 배포 성공!'
    }
    failure {
      echo '❌ 빌드 실패!'
    }
  }
}
