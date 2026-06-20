---
name: component-generator
description: React 함수형 컴포넌트를 JavaScript/JSX로 생성합니다. 컴포넌트명, props 설명, 사용 예시를 제공하면 production-ready한 JSX 코드를 생성합니다. Props 타입 검증, 기본값 설정, 에러 처리를 포함한 완전한 컴포넌트를 만듭니다. 새 컴포넌트 작성 또는 기존 컴포넌트 리팩토링이 필요할 때 사용하세요.
---

# Component Generator

React 함수형 컴포넌트를 생성하는 스킬입니다.

## 용도

- 새 React 컴포넌트 작성
- 기존 컴포넌트 리팩토링
- UI 컴포넌트 라이브러리 확장

## 사용 예시

**요청:**

```
Button 컴포넌트를 만들어줘.
- 텍스트와 onClick 핸들러 받기
- variant props로 "primary", "secondary" 지원
- disabled 상태 처리
- 기본 스타일은 App.css 클래스 사용
```

**생성 결과:**

```javascript
// src/components/Button.jsx
export function Button({ children, onClick, variant = 'primary', disabled = false, ...props }) {
  if (!children) {
    console.warn('Button: children is required');
  }

  return (
    <button
      className={`button button--${variant}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
```

## 작성 기준

### 1. 함수형 컴포넌트

```javascript
// ✓ 올바른 패턴
export function ComponentName({ prop1, prop2 }) {
  return <div>{prop1}</div>;
}

// ✗ 클래스 컴포넌트 금지
class ComponentName extends React.Component {}

// ✗ 기본 내보내기 금지
export default function () {}
```

### 2. Props 처리

- **Props 검증**: 필수 props 확인, 기본값 설정
- **Props 이름 명확성**: `isLoading`, `onClick`, `onChange` 등 일관된 네이밍
- **스프레드 연산자**: 미처리 props 전달 (예: `<button {...props} />`)

```javascript
export function TextInput({
  value,
  onChange,
  placeholder = 'Enter text',
  disabled = false,
  ...props
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      {...props}
    />
  );
}
```

### 3. 스타일링

- CSS 클래스 우선 (Vite 프로젝트 기본)
- CSS 모듈 가능 (import styles from './Component.module.css')
- 인라인 스타일 최소화

```javascript
// ✓ CSS 클래스
<div className="button button--primary">

// ✓ CSS 모듈
<div className={styles.button}>

// ✗ 인라인 스타일 (성능)
<div style={{ color: 'red' }}>
```

### 4. 접근성 (A11y)

- 시맨틱 HTML: `<button>`, `<nav>`, `<main>` 등
- ARIA 레이블: 필요 시 `aria-label`, `aria-describedby`
- 키보드 네비게이션: 포커스 관리

```javascript
<button aria-label="Close modal" onClick={onClose}>
  ×
</button>
```

### 5. 조건부 렌더링

- 삼항 연산자 또는 논리 연산자 사용
- 복잡한 로직은 헬퍼 함수로 추출

```javascript
// ✓ 명확한 조건
{
  isLoading ? <Spinner /> : <Content />;
}
{
  error && <ErrorMessage error={error} />;
}

// ✓ 헬퍼 함수
function renderContent() {
  if (state === 'loading') return <Spinner />;
  if (state === 'error') return <ErrorMessage />;
  return <Content />;
}
return renderContent();
```

### 6. 메모이제이션 (성능)

- `React.memo` 사용 (props 안정성 필수)
- `useCallback`, `useMemo` 선택적 (과도한 최적화 금지)

```javascript
// 필요할 때만
export const Button = React.memo(function Button({ children, onClick }) {
  return <button onClick={onClick}>{children}</button>;
});
```

## 생성 체크리스트

- [ ] 함수형 컴포넌트 사용
- [ ] Props 검증 및 기본값
- [ ] 스타일링 방식 명확
- [ ] 접근성 고려 (시맨틱 HTML)
- [ ] 조건부 렌더링 명확
- [ ] 콘솔 경고 제거
- [ ] 불필요한 의존성 없음
- [ ] 파일 경로 `src/components/ComponentName.jsx`
