---
name: frontend-harness
description: React 프론트엔드 자동화 하네스입니다. 컴포넌트 생성, 테스트 작성, 코드 리팩토링, 품질 검증, 성능 분석을 하나의 워크플로우로 조율합니다. "컴포넌트 만들어줘", "테스트 써줘", "코드 개선해줘", "품질 검사해줘", "성능 분석해줘" 등의 요청을 받으면 이 하네스를 자동으로 트리거합니다. 팀 기반 협업으로 높은 품질의 결과물을 제공합니다.
---

# Frontend Harness (프론트엔드 개발 자동화 하네스)

React 프로젝트의 개발부터 검증까지 자동화하는 하네스입니다.

## 하네스 구성

### 팀 멤버

| 역할       | 이름      | 전문 분야                | 스킬                                          |
| ---------- | --------- | ------------------------ | --------------------------------------------- |
| **개발자** | Developer | 컴포넌트 생성, 코드 편집 | component-generator, test-writer, code-editor |
| **검증자** | QA        | 품질 검증, 성능 분석     | quality-checker, performance-analyzer         |

### 워크플로우 패턴

**타입 1: 생성 요청** (컴포넌트, 테스트 생성)

```
[오케스트레이터] 요청 분석
  ↓
[Developer] 컴포넌트/테스트 생성 → src/에 저장
  ↓
[QA] 품질 검증 (린트, 테스트, 빌드)
  ↓
[오케스트레이터] 결과 보고 → 사용자
```

**타입 2: 편집 요청** (리팩토링, 버그 수정)

```
[오케스트레이터] 요청 분석
  ↓
[Developer] 코드 편집 → 파일 수정
  ↓
[QA] 품질 검증 (모든 테스트 통과 확인)
  ↓
[오케스트레이터] 결과 보고 → 사용자
```

**타입 3: 검증 요청** (품질 체크, 성능 분석)

```
[오케스트레이터] 요청 분석
  ↓
[QA] 품질 검증 + 성능 분석
  ↓
[오케스트레이터] 종합 보고서 작성 → 사용자
```

## Phase 0: 컨텍스트 확인

작업 시작 전 기존 산출물 확인:

```
작업 디렉토리: _workspace/
├── 존재하는가?
│  ├── Yes (기존 작업)
│  │  ├── 부분 수정 요청? → Phase 2 (부분 실행)
│  │  └── 새로운 입력? → Phase 1 (재실행, 기존 백업)
│  └── No (첫 실행) → Phase 1부터 시작
```

**실행 모드 결정:**

- 신규 생성 요청: Phase 1-3 전체 실행
- 부분 수정 요청: 해당 Phase만 실행
- 품질 검증만: Phase 3 (QA만)

## Phase 1: 요청 분석

### 1-1. 요청 타입 분류

```
입력: "Button 컴포넌트 만들어줘. primary와 secondary 두 가지 variant"

분석 결과:
- 유형: CREATE (생성)
- 대상: Component (컴포넌트)
- 범위: src/components/Button.jsx + Button.test.jsx
- 복잡도: 낮음 (기본 컴포넌트)
- 선행 조건: 없음
```

### 1-2. 작업 분해

```
분해된 작업:
1. Button.jsx 생성 (Developer)
   - Props: children, variant, disabled
   - Variants: primary, secondary
   - CSS: src/App.css 사용

2. Button.test.jsx 작성 (Developer)
   - 렌더링 테스트
   - Props 테스트
   - 이벤트 테스트

3. 품질 검증 (QA)
   - ESLint 확인
   - 테스트 커버리지 80%+
   - 빌드 성공 확인
```

### 1-3. 팀 구성

```
작업 유형에 따라 팀 멤버 결정:
- CREATE: Developer + QA (순차)
- EDIT: Developer + QA (순차)
- VALIDATE: QA (단독)
```

## Phase 2: 개발 (Developer 담당)

Developer가 요청된 작업을 수행합니다.

### 2-1. 생성 작업

```javascript
// 사용할 스킬: component-generator, test-writer
// 입력: 컴포넌트 명세
// 출력: src/components/Button.jsx, Button.test.jsx

결과물 저장 위치:
_workspace/01_developer_button_component.jsx
_workspace/01_developer_button_test.jsx
```

### 2-2. 편집 작업

```javascript
// 사용할 스킬: code-editor
// 입력: 파일명 + 수정 요청
// 출력: 수정된 파일

결과물:
_workspace/02_developer_button_refactored.jsx
```

**Developer에게 전달할 메시지:**

```
[ORCHESTRATOR → DEVELOPER]

작업: Button 컴포넌트 생성
명세:
- Props: children, variant ('primary'|'secondary'), disabled
- 기본값: variant='primary', disabled=false
- 스타일: App.css 클래스 사용
- 테스트: 렌더링, Props, 이벤트 포함

산출물 경로:
- src/components/Button.jsx
- src/components/Button.test.jsx

완료 후: QA에 검증 요청
```

## Phase 3: 검증 (QA 담당)

QA가 품질 검증 및 성능 분석을 수행합니다.

### 3-1. 품질 검증

```bash
// 사용할 스킬: quality-checker

검증 항목:
1. npm run lint (ESLint)
2. npm run test (Vitest 테스트)
3. npm run test:coverage (커버리지)
4. npm run build (빌드)
5. npm run format --check (Prettier)
```

### 3-2. 성능 분석

```bash
// 사용할 스킬: performance-analyzer

분석 항목:
1. 번들 크기 변화
2. 의존성 분석
3. 렌더링 성능 (발견시)
4. 코드 패턴 (안티패턴)
```

**QA에게 전달할 메시지:**

```
[ORCHESTRATOR → QA]

대상: src/components/Button.jsx, Button.test.jsx
범위: quality-checker + performance-analyzer

검증:
- ESLint 오류 0개
- 테스트 커버리지 80%+
- 빌드 성공
- 성능 메트릭 분석

완료 후: 결과 보고
```

## Phase 4: 개선 (피드백 반영)

QA 검증 결과 문제 발견 시:

```
QA 보고:
- ESLint: unused variable 'color'
- 커버리지: 75% (목표 80%)

개선 필요:
- [ ] 불필요한 변수 제거
- [ ] 테스트 케이스 3개 추가 (Props, 이벤트, 상태)

→ Developer에게 재작업 요청 (Phase 2로 돌아감)
→ 완료 후 QA 재검증 (Phase 3)
```

**재귀 구조:**

```
Phase 2 (작업) → Phase 3 (검증)
         ↑           ↓
         └─ 문제 발견 ─┘
            (피드백 → 개선)
```

## Phase 5: 결과 보고

최종 산출물을 사용자에게 보고합니다.

```markdown
## 작업 완료 보고서

### 요청

Button 컴포넌트 생성 (primary, secondary variant)

### 결과

✓ **성공**

#### 생성된 파일

- src/components/Button.jsx
- src/components/Button.test.jsx

#### 검증 결과

- ESLint: ✓ 통과 (0 errors)
- 테스트: ✓ 통과 (커버리지 85%)
- 빌드: ✓ 성공 (번들 크기 +2 KB)
- 성능: ✓ 정상

#### 코드 요약

\`\`\`jsx
export function Button({ children, variant = 'primary', disabled = false, ...props }) {
return (
<button
className={`button button--${variant}`}
disabled={disabled}
{...props} >
{children}
</button>
);
}
\`\`\`

#### 다음 단계

1. 컴포넌트 사용법 검토
2. 실제 프로젝트에 통합
3. 추가 variants 필요시 알려주세요
```

## 에러 핸들링

### 에러 케이스

**1. 검증 실패**

```
QA 검증 실패:
- 테스트 커버리지 62% (목표 80%)
- ESLint 에러 2개

→ 재작업 요청
→ Developer가 피드백 반영
→ 재검증
```

**2. 빌드 오류**

```
빌드 실패:
- 컴포넌트 파일이 존재하지 않거나 문법 오류

→ 디버깅 및 수정
→ 원인 분석 보고
→ 재시도
```

**3. 명세 부족**

```
요청이 불명확한 경우:
- Props 정의 없음
- 스타일링 방식 미정

→ 사용자에게 확인 요청
→ 명확한 명세 후 진행
```

## 후속 작업 지원

### 반복 실행

같은 하네스로 계속 작업 가능:

```
첫 번째: Button 컴포넌트 생성
두 번째: "Button 컴포넌트에 size props 추가해줘"
  → _workspace 확인 → 기존 Button 수정
  → Phase 2 (부분 실행)
  → Phase 3 (재검증)

세 번째: "모든 컴포넌트 품질 체크해줘"
  → Phase 3 (QA만 실행)
```

### 트리거 키워드

하네스를 다시 실행할 때 사용:

- "다시 해줘"
- "수정해줘"
- "개선해줘"
- "검사해줘"
- "분석해줘"
- "추가 기능: ..."
- "버그: ..."

## 테스트 시나리오

### 정상 흐름 테스트

```
요청: "TextInput 컴포넌트 만들어줘"
      value, onChange, placeholder, disabled props 지원

예상:
1. Developer: TextInput.jsx + TextInput.test.jsx 생성
2. QA: 모든 검증 통과
3. 최종: 사용자에게 완성된 컴포넌트 제공
```

### 에러 흐름 테스트

```
요청: "Button 컴포넌트 만들어줘" (명확한 명세 없음)

예상:
1. 요청 분석 실패
2. 사용자에게 명세 확인 요청
3. 명확한 명세 제공 후 재진행
```

## 체크리스트

하네스 사용 후 확인:

- [ ] 생성/수정된 파일이 src/ 하위에 있는가?
- [ ] 테스트 파일도 함께 생성되었는가? (필수)
- [ ] ESLint, 테스트, 빌드 모두 통과했는가?
- [ ] 테스트 커버리지 80% 이상인가?
- [ ] 성능 메트릭이 악화되지 않았는가?
- [ ] Contributing Guide를 따랐는가?
- [ ] 커밋할 준비가 되었는가?
