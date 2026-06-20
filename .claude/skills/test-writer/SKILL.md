---
name: test-writer
description: Vitest를 사용한 React 컴포넌트 및 함수 단위 테스트를 작성합니다. 정상 경로와 에러 케이스를 모두 포함하여 80%+ 커버리지를 달성하는 테스트 코드를 생성합니다. 컴포넌트 테스트, 함수 테스트, 통합 테스트 모두 지원합니다. 테스트 코드 작성, 커버리지 개선, 테스트 리팩토링이 필요할 때 사용하세요.
---

# Test Writer

Vitest 기반 React/JavaScript 테스트를 작성하는 스킬입니다.

## 용도

- 컴포넌트 테스트 (렌더링, 상호작용, 이벤트)
- 함수 테스트 (유틸리티, 헬퍼)
- 통합 테스트 (여러 모듈 협력)

## 테스트 프레임워크

- **테스트 러너**: Vitest
- **DOM 렌더링**: `@testing-library/react`
- **어서션**: Vitest 내장 (`expect`)
- **목(Mock)**: Vitest `vi` 또는 수동

## 작성 기준

### 1. 테스트 파일 구조

```javascript
// src/components/Button.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  // 테스트 케이스들
});
```

**파일 명명:** `ComponentName.test.jsx` 또는 `utilityName.test.js`

### 2. 테스트 케이스 구조

```javascript
describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    await userEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### 3. 테스트 카테고리

**필수 (Mandatory):**

- 정상 렌더링
- 주요 props 처리
- 주요 이벤트 핸들러

**권장 (Recommended):**

- Props 누락 시 동작
- disabled/readonly 상태
- 에러 상황 처리
- 조건부 렌더링

**부가 (Optional):**

- 성능 (렌더링 횟수)
- 접근성 (ARIA 속성)
- 에지 케이스

### 4. 쿼리 우선순위

Testing Library 권장 순서:

```javascript
// 1순위: 시맨틱 쿼리 (추천)
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText(/email/i);

// 2순위: 텍스트 쿼리
screen.getByText('Hello World');

// 3순위: 플레이스홀더 쿼리
screen.getByPlaceholderText(/search/i);

// 4순위: 테스트ID 쿼리 (최후의 수단)
screen.getByTestId('custom-element');

// ✗ 피해야 할 쿼리
container.querySelector('.button'); // DOM 직접 접근
wrapper.find('Button'); // Enzyme 레거시 패턴
```

### 5. 비동기 테스트

```javascript
it('should update after async operation', async () => {
  render(<Component />);

  // 버튼 클릭 (비동기 작업 시작)
  await userEvent.click(screen.getByText('Load'));

  // 결과 대기 (최대 1초)
  expect(await screen.findByText('Loaded')).toBeInTheDocument();
});
```

### 6. Mock 사용

```javascript
import { vi } from 'vitest';

// 함수 목
const handleClick = vi.fn();
render(<Button onClick={handleClick} />);
expect(handleClick).toHaveBeenCalled();

// 모듈 목 (필요시)
vi.mock('./api', () => ({
  fetchUser: vi.fn(() => Promise.resolve({ name: 'John' })),
}));
```

## 커버리지 목표

- **라인 커버리지**: 80%+
- **브랜치 커버리지**: 75%+
- **함수 커버리지**: 80%+

**측정 명령:**

```bash
npm run test:coverage
```

## 테스트 작성 체크리스트

- [ ] 파일명 `*.test.jsx` 또는 `*.test.js`
- [ ] describe/it 구조 명확
- [ ] 테스트명 설명적 (`should...` 형식)
- [ ] 정상 경로 + 에러 경로 모두 포함
- [ ] 시맨틱 쿼리 우선 사용
- [ ] 비동기 작업에 await/findBy 사용
- [ ] Mock 호출 검증
- [ ] 포커스/키보드 이벤트 테스트 (필요시)
- [ ] 80% 커버리지 달성
- [ ] 테스트 실행 성공 (npm run test)

## 예시: 완전한 테스트 작성

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from './Counter';

describe('Counter', () => {
  it('should display initial count', () => {
    render(<Counter initialCount={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should increment count when button clicked', async () => {
    render(<Counter initialCount={0} />);
    const button = screen.getByRole('button', { name: /increment/i });

    await userEvent.click(button);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should call onCountChange callback', async () => {
    const onChange = vi.fn();
    render(<Counter initialCount={0} onCountChange={onChange} />);

    await userEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('should not go below 0', async () => {
    render(<Counter initialCount={0} />);
    const decrementBtn = screen.getByRole('button', { name: /decrement/i });

    await userEvent.click(decrementBtn);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
```
