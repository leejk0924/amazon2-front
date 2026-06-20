---
name: code-editor
description: 기존 React 컴포넌트 및 JavaScript 코드를 리팩토링하고 개선합니다. 성능 최적화, 가독성 개선, 버그 수정, 안티패턴 제거 등을 수행합니다. 코드 리팩토링, 버그 수정, 기술 부채 해결이 필요할 때 사용하세요. 최소 변경(surgical changes) 원칙으로 요청된 부분만 수정합니다.
---

# Code Editor

기존 코드 리팩토링 및 개선 스킬입니다.

## 용도

- 성능 최적화 (렌더링, 번들 크기)
- 가독성 개선 (변수명, 구조)
- 버그 수정
- 안티패턴 제거
- 기술 부채 해결

## 리팩토링 원칙

### 1. Surgical Changes (최소 변경)

**원칙**: 요청한 부분만 수정. 인접한 코드는 건드리지 않음.

```javascript
// ✓ 올바른 예: 요청한 부분만 수정
// Before
function Button({ children, variant = 'primary' }) {
  return <button className={`btn btn-${variant}`}>{children}</button>;
}

// After (불필요한 개선 없음)
function Button({ children, variant = 'primary' }) {
  if (!children) throw new Error('children required');
  return <button className={`btn btn-${variant}`}>{children}</button>;
}

// ✗ 잘못된 예: 요청 없이 과도한 개선
// function Button({ children, variant = 'primary', size = 'md', ... }) {
//   // 완전히 재작성 - 요청하지 않은 변경
// }
```

### 2. 성능 최적화

```javascript
// ✓ 불필요한 리렌더링 제거
const Button = React.memo(({ onClick, children }) => <button onClick={onClick}>{children}</button>);

// ✓ 콜백 메모이제이션 (onClick 안정성)
const handleClick = useCallback(() => {
  // ...
}, [dependency]);

// ✗ 과도한 최적화 (프로파일링 없음)
const memoizedValue = useMemo(() => children, [children]);
```

### 3. 가독성 개선

```javascript
// ✓ 명확한 변수명
const isLoading = status === 'loading';
const userData = response.data;

// ✓ 함수 추출 (복잡한 로직)
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ✗ 과도한 추상화 (단순 코드)
function createButtonStyler() {
  return (variant) => `btn-${variant}`;
}
```

### 4. 버그 수정

```javascript
// ✓ 누수 방지
useEffect(() => {
  const timer = setTimeout(() => {
    // ...
  }, 1000);

  return () => clearTimeout(timer); // 정리 함수
}, []);

// ✓ 안전한 상태 업데이트
setData((prev) => ({ ...prev, status: 'loaded' }));

// ✗ 직접 상태 변경
state.status = 'loaded'; // 반응성 손상
```

### 5. 안티패턴 제거

```javascript
// ✗ 안티패턴: 불필요한 조건부 렌더링
{
  isLoading === true && <Spinner />;
}
{
  isLoading ? <Spinner /> : null;
}

// ✓ 명확한 조건
{
  isLoading && <Spinner />;
}

// ✗ 안티패턴: useEffect에서 상태 동기화
useEffect(() => {
  setDerivedState(prop);
}, [prop]);

// ✓ 직접 계산
const derivedValue = calculateValue(prop);
```

## 리팩토링 체크리스트

- [ ] 요청한 부분만 수정
- [ ] 기존 테스트 통과 (npm run test)
- [ ] 린트 오류 없음 (npm run lint)
- [ ] 빌드 성공 (npm run build)
- [ ] 변경 이유 설명 (주석 추가 필요시)
- [ ] 성능 개선 검증 (성능 영향도 명시)
- [ ] 버그 수정 검증 (재현 케이스 확인)
- [ ] 기존 기능 손상 없음

## 리팩토링 유형별 가이드

### A. 성능 최적화

**측정 먼저**: 프로파일링 도구로 병목 확인 후 수정.

```javascript
// Chrome DevTools Performance 탭에서 확인 후
// 1. 불필요한 리렌더링 제거 (React.memo, useCallback)
// 2. 번들 크기 감소 (lazy loading, 코드 스플릿)
// 3. 연산 최적화 (메모이제이션, 알고리즘)
```

### B. 버그 수정

**재현 가능성**: 버그를 재현하는 테스트를 먼저 작성, 수정 후 통과 확인.

```javascript
// 1. 버그 재현 테스트 작성
it('should handle null response gracefully', () => {
  const data = parseResponse(null);
  expect(data).toEqual({});
});

// 2. 버그 수정
function parseResponse(response) {
  return response?.data || {};
}

// 3. 테스트 통과 확인
```

### C. 기술 부채 해결

**영향도 평가**: 코드 변경으로 인한 파급 효과 최소화.

```javascript
// 1. 영향받는 파일 목록 파악
// 2. 단계적 마이그레이션 계획 수립
// 3. 각 단계마다 테스트 실행
```

## 수정할 수 없는 경우

다음의 경우 수정하지 않고 사유를 설명합니다:

- 테스트 없이 버그 수정 불가
- 복잡도 > 리팩토링 가치
- 기존 기능 손상 위험
- 명세 부족

예시:

```
❌ 수정 불가

파일: src/utils/dataProcessing.js
사유: 입력값 범위가 명시되지 않아 어떤 엣지 케이스를 처리해야 할지 불명확합니다.

권장사항:
1. 입력값 범위 문서화 (예: number[] with length > 0)
2. 엣지 케이스별 테스트 케이스 작성
3. 테스트 통과 후 리팩토링 진행
```

## 리팩토링 출력 형식

```markdown
## 리팩토링 완료

**파일**: src/components/Button.jsx
**변경 사항**: 불필요한 렌더링 최적화

### 변경 전

\`\`\`javascript
// 코드
\`\`\`

### 변경 후

\`\`\`javascript
// 코드
\`\`\`

### 이유

- React.memo로 불필요한 리렌더링 방지 (props 동일 시)
- 성능 개선: 렌더링 시간 15% 단축

### 테스트

- npm run test: ✓ 통과 (모든 테스트)
- npm run lint: ✓ 통과 (오류 0)
```
