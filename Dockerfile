# Stage 1: 빌드 단계
FROM node:22-alpine as builder

WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# package-lock.json 삭제 후 설치 (플랫폼별 native binding 재해결)
ENV HUSKY=0
RUN rm -f package-lock.json && npm install

# 소스 코드 복사
COPY . .

# 빌드 실행
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV NODE_ENV=production

RUN npm run build

# Stage 2: 실행 단계
FROM nginx:1.27-alpine

# nginx 기본 설정 제거
RUN rm /etc/nginx/conf.d/default.conf

# 커스텀 nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌더 스테이지에서 빌드된 dist 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 포트 노출
EXPOSE 80

# nginx 실행
CMD ["nginx", "-g", "daemon off;"]
