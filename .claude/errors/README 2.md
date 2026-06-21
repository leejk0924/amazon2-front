# 에러 관리 시스템

하네스 엔지니어링 중 발생하는 에러를 자동으로 수집하고 패턴을 분석하는 시스템입니다.

## 디렉토리 구조

```
.claude/errors/
├── logs/           # 개별 에러 로그 (JSON)
├── patterns/       # 에러 패턴 분석 결과
├── analysis/       # 분석 보고서
└── README.md       # 이 파일
```

## 사용 방법

### 1. 에러 분석 실행

```bash
npm run errors:analyze
```

- 누적된 에러 로그를 분석
- 패턴 추출 및 분류
- 메모리에 반복되는 패턴 저장

### 2. 에러 로그 확인

```bash
npm run errors:view
```

- 최근 분석 보고서 확인

### 3. 에러 로그 초기화

```bash
npm run errors:clear
```

- 모든 에러 로그 삭제 (분석 보고서는 유지)

## 자동 에러 로깅

개발 중 발생하는 에러는 다음과 같이 자동 기록됩니다:

### TypeScript/JavaScript에서

```javascript
import { logError } from './scripts/error-logger.js';

try {
  // 작업
} catch (error) {
  logError({
    type: 'MY_ERROR_TYPE',
    message: error.message,
    stack: error.stack,
    context: {
      /* 추가 정보 */
    },
  });
}
```

### npm 스크립트에서

```json
"test": "node scripts/safe-run.js vitest"
```

## 에러 로그 형식

```json
{
  "timestamp": "2026-06-13T10:30:45.123Z",
  "type": "BUILD_ERROR",
  "message": "Module not found: can't resolve '@/components'",
  "stack": "Error: ...",
  "context": {
    "command": "npm run build",
    "file": "src/App.tsx"
  },
  "command": "build",
  "cwd": "/path/to/project",
  "nodeVersion": "v22.14.0"
}
```

## 메모리 시스템 연동

분석 결과는 자동으로 프로젝트 메모리에 저장됩니다:

```
memory/harness_error_patterns.md
```

- 반복되는 에러 패턴 기록
- 각 패턴의 해결 방법 문서화
- 같은 실수를 반복하지 않도록 학습

## 에러 패턴 분류

자동으로 다음과 같이 분류됩니다:

| 분류                | 예시                            |
| ------------------- | ------------------------------- |
| `module-resolution` | Module not found, can't resolve |
| `linting`           | ESLint 관련 오류                |
| `build`             | Vite 빌드 오류                  |
| `testing`           | Vitest 실행 오류                |
| `type-checking`     | TypeScript 타입 오류            |
| `dependency`        | package.json 의존성 오류        |
| `permission`        | 권한 관련 오류                  |
| `other`             | 기타                            |

## 주기적 분석

권장 주기:

- **매일**: `npm run errors:analyze` 실행
- **주단위**: 누적된 패턴 검토 및 메모리 업데이트
- **반복 오류**: 즉시 원인 파악 및 해결

## 팁

- 같은 에러가 반복되면 **메모리의 해결 방법**을 참고하세요
- 새로운 에러 패턴 발견 시 `.claude/errors/patterns/`에 기록하세요
- 프로젝트 메모리의 `harness_error_patterns.md`를 정기적으로 검토하세요
