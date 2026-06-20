---
name: performance-analyzer
description: 프론트엔드 성능을 분석하고 최적화 기회를 제시합니다. 번들 크기, 렌더링 성능, 의존성 분석, 코드 패턴을 검사합니다. 성능 병목을 식별하고 구체적인 개선 방안을 제시합니다. 성능 개선, 의존성 분석, 번들 최적화가 필요할 때 사용하세요.
---

# Performance Analyzer

성능 분석 및 최적화 기회 제시 스킬입니다.

## 용도

- 번들 크기 분석
- 렌더링 성능 평가
- 의존성 분석 (중복, 순환 참조)
- 코드 패턴 분석 (안티패턴)
- 성능 개선 로드맵 제시

## 분석 항목

### 1. 번들 크기 분석

**측정 방법:**

```bash
npm run build
# dist/assets/ 폴더 확인
```

**분석 항목:**

- 전체 번들 크기
- JavaScript vs CSS 비율
- 이전 빌드 대비 변화
- 주요 의존성 크기

**해석:**

```
dist/
├── assets/
│   ├── index-main.js (145 KB)  ← JavaScript 최대
│   ├── index-react.js (42 KB)  ← React 라이브러리
│   └── index-style.css (12 KB)
└── index.html

분석:
- 전체: 199 KB (gzip: ~60 KB)
- React 포함 비율: 21% (개선 기회 낮음)
- 주요 기회: main.js 내 사용하지 않는 모듈
```

**개선 권고:**

```
1. 높음 (즉시 적용):
   - 사용되지 않는 의존성 제거 (예: lodash 전체 임포트)
   - 트리 쉐이킹 확인

2. 중간 (다음 마일스톤):
   - 라우트별 코드 스플릿
   - 동적 임포트(lazy loading) 적용

3. 낮음 (선택):
   - 미니피케이션 수준 조정
   - 소스맵 최적화
```

### 2. 렌더링 성능 평가

**평가 기준:**

| 메트릭                  | 좋음   | 보통     | 나쁨   |
| ----------------------- | ------ | -------- | ------ |
| Initial Load            | < 3s   | 3~6s     | > 6s   |
| Time to Interactive     | < 5s   | 5~10s    | > 10s  |
| First Contentful Paint  | < 1.8s | 1.8~3s   | > 3s   |
| Cumulative Layout Shift | < 0.1  | 0.1~0.25 | > 0.25 |

**분석 방법:**

```bash
# Chrome DevTools Lighthouse 실행
# (또는 실제 측정 도구 연동)

결과 예시:
- Largest Contentful Paint (LCP): 2.3s ✓
- First Input Delay (FID): 45ms ✓
- Cumulative Layout Shift (CLS): 0.08 ✓
```

**개선 권고:**

```
1. LCP (최대 콘텐츠풀 칠): 2.3s
   - ✓ 좋음 (목표 < 2.5s)
   - 현재 상태 유지

2. FID (첫 입력 지연): 45ms
   - ✓ 좋음 (목표 < 100ms)
   - 현재 상태 유지

3. CLS (누적 레이아웃 변경): 0.08
   - ✓ 좋음 (목표 < 0.1)
   - 현재 상태 유지
```

### 3. 의존성 분석

**분석 항목:**

```javascript
// 1. 중복 의존성 확인
npm ls react
// npm WARN multiple versions of react installed:

// 2. 순환 의존성 확인
// (수동 검사 또는 도구 사용)
// 예: ComponentA → ComponentB → ComponentA

// 3. 미사용 의존성 확인
// package.json에는 있지만 코드에서 사용하지 않는 패키지
```

**보고 형식:**

```
의존성 분석 결과

중복 의존성:
- react@19.2.5 (1개 버전) ✓ 문제 없음
- react-dom@19.2.5 (1개 버전) ✓ 문제 없음

순환 의존성: ✓ 없음

미사용 의존성:
- lodash (package.json에만 있음) → 제거 권고
- axios (devDependencies, 테스트용 아님) → 제거 확인
```

### 4. 코드 패턴 분석

**검사 항목:**

```javascript
// 패턴 1: 전체 라이브러리 임포트
❌ import _ from 'lodash';
✓ import { debounce } from 'lodash-es';

// 패턴 2: 불필요한 리렌더링
❌ useEffect(() => {
     setState(someValue);
   }, []); // 무한 루프 위험

// 패턴 3: 누수 방지
❌ useEffect(() => {
     const timer = setTimeout(() => {...}, 1000);
   }, []); // 정리 함수 없음

✓ useEffect(() => {
     const timer = setTimeout(() => {...}, 1000);
     return () => clearTimeout(timer);
   }, []);

// 패턴 4: Props 드릴링
❌ <Component user={user} theme={theme} lang={lang} />
✓ <Component data={sharedData} /> + Context API

// 패턴 5: 큰 번들 임포트
❌ import moment from 'moment';
✓ import dayjs from 'dayjs';
```

**개선 기회 우선순위:**

| 순위 | 문제                  | 영향도 | 난도 | 권고    |
| ---- | --------------------- | ------ | ---- | ------- |
| 1    | 번들 크기 (45KB 이상) | 높음   | 낮음 | 즉시    |
| 2    | 의존성 중복           | 중간   | 낮음 | 이번 주 |
| 3    | 렌더링 성능 < 3s      | 중간   | 중간 | 이번 달 |
| 4    | 코드 패턴 개선        | 낮음   | 높음 | 선택    |

## 분석 보고서 템플릿

```markdown
# 성능 분석 보고서

## 요약

- **종합 평가**: ✓ 양호 (개선 기회 3건)
- **분석 일시**: YYYY-MM-DD
- **분석 범위**: 프로젝트 전체

## 1. 번들 크기

**현황**: 149.7 KB (gzip: 45 KB)

**구성**:

- JavaScript: 145.2 KB (96.9%)
- CSS: 12.5 KB (3.1%)
- 이전 대비: +3.2 KB (+2.2%)

**개선 기회**:

- [ ] lodash 전체 임포트 → 필요한 함수만 임포트
      영향도: -8 KB / 난도: 낮음 / 우선순위: **높음**
- [ ] 미사용 CSS 정리 (발견된 미사용 클래스 5개)
      영향도: -2 KB / 난도: 중간 / 우선순위: 중간

- [ ] React 지연 로딩 (라우트별)
      영향도: -30 KB (초기 로드) / 난도: 중간 / 우선순위: 중간

## 2. 렌더링 성능

**현황**: ✓ 우수

| 메트릭 | 값   | 목표    | 상태 |
| ------ | ---- | ------- | ---- |
| LCP    | 2.3s | < 2.5s  | ✓    |
| FID    | 45ms | < 100ms | ✓    |
| CLS    | 0.08 | < 0.1   | ✓    |

**행동**: 현재 상태 유지. 모니터링 계속.

## 3. 의존성 분석

**현황**: ✓ 정상

- 중복 의존성: 0건
- 순환 의존성: 0건
- 미사용 의존성: 2건 발견
  - `lodash` (사용하지 않음, 제거 권고)
  - `axios` (devDep인데 메인에 포함됨, 확인 필요)

## 4. 코드 패턴 분석

**발견 사항**:

1. **과도한 re-render** (Warning)
   - `Button.jsx` 라인 12: props 변경 없어도 부모 리렌더 시 재렌더링
   - 권고: React.memo 적용
   - 영향도: 낮음 (렌더링 시간 <5% 개선)

2. **Props Drilling** (Info)
   - `Layout → Header → Nav → Link` (3단계 전파)
   - 권고: Context API 또는 상태 관리 라이브러리 고려
   - 영향도: 중간 (코드 유지보수성 개선)

## 종합 권고사항

### 즉시 적용 (이번 주)

- [ ] lodash 미사용 의존성 확인 및 제거 (-8 KB)
- [ ] Button.jsx에 React.memo 적용

### 다음 마일스톤

- [ ] 라우트별 코드 스플릿 검토
- [ ] 미사용 CSS 정리

### 모니터링

- 렌더링 성능 지표 (월 1회 체크)
- 번들 크기 추이 (매 배포 시)

**예상 효과**: 전체 번들 크기 10% 감소 (-15 KB)
```

## 분석 체크리스트

- [ ] npm run build 실행 및 번들 크기 측정
- [ ] 주요 의존성 크기 파악
- [ ] 중복/순환 의존성 확인
- [ ] 코드 패턴 스캔
- [ ] 렌더링 성능 메트릭 수집 (가능시)
- [ ] 개선 기회 우선순위 지정
- [ ] 구체적 개선 방안 제시
- [ ] 예상 효과 수치화
