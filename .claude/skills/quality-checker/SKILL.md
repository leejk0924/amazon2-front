---
name: quality-checker
description: 프론트엔드 코드의 품질을 종합적으로 검증합니다. ESLint 규칙, 테스트 커버리지, 빌드 성공, Prettier 형식을 확인합니다. 린트 오류, 테스트 실패, 빌드 오류를 감지하고 원인을 분석하여 개선 방안을 제시합니다. 코드 검증, 품질 체크, CI/CD 파이프라인 검증이 필요할 때 사용하세요.
---

# Quality Checker

코드 품질을 검증하는 스킬입니다.

## 용도

- ESLint 규칙 검증
- 테스트 커버리지 확인
- 빌드 성공 검증
- Prettier 형식 체크
- CI/CD 준비도 평가

## 검증 프로세스

### 1. ESLint 검증

```bash
npm run lint
```

**검증 항목:**

- 사용되지 않는 변수/임포트
- 잠재적 버그 패턴
- 코드 스타일 규칙
- React hooks 규칙 (exhaustive-deps 등)

**출력 해석:**

```
✓ 0 errors, 5 warnings
  - 2개 파일에서 경고 발생
  - 자동 수정 가능한 것: 3개
  - 수동 수정 필요한 것: 2개
```

**개선 권고:**

```
- 자동 수정: eslint --fix로 해결 가능한 항목
- 수동 수정: 코드 로직 변경 필요한 항목 (리스트 제시)
- 무시할 항목: 정당한 사유가 있는 경우 (eslint-disable 주석)
```

### 2. 테스트 커버리지

```bash
npm run test:coverage
```

**커버리지 메트릭:**

- **라인(Line)**: 실행된 코드 라인 비율
- **브랜치(Branch)**: 모든 분기가 테스트되었는지
- **함수(Function)**: 모든 함수가 호출되었는지
- **문(Statement)**: 모든 명령이 실행되었는지

**해석 예시:**

```
Lines       : 82.5% ( 165/200 )  ← 35줄 테스트 필요
Statements  : 81.2% ( 162/200 )
Functions   : 85.0% ( 17/20 )    ← 3개 함수 테스트 필요
Branches    : 78.0% ( 39/50 )    ← 11개 분기 테스트 필요
```

**개선 전략:**

1. 커버리지 낮은 파일 식별
2. 누락된 테스트 케이스 명시
3. 테스트 추가 우선순위 제시 (영향도 순)

### 3. 빌드 검증

```bash
npm run build
```

**검증 항목:**

- 빌드 성공 여부
- 번들 크기
- 오류 및 경고
- 소스맵 생성 (개발용)

**빌드 출력 해석:**

```
✓ src/main.jsx → dist/index.html
✓ dist/assets/index-abc123.js (145.2 KB)
✓ dist/assets/index-def456.css (12.5 KB)

경고:
- Unused CSS (style-loader) 2개
- Source map files created
```

**최적화 권고:**

- 번들 크기 증가 분석 (5KB 초과 시 경고)
- 사용되지 않는 리소스 제거
- 코드 스플릿 기회 제시

### 4. Prettier 형식

```bash
npm run format -- --check
```

**검증 항목:**

- 들여쓰기 (2칸)
- 세미콜론
- 따옴표 (싱글 vs 더블)
- 줄 길이 (80자)
- 객체/배열 포매팅

**출력:**

```
✗ Formatting check failed

Files that need formatting:
- src/components/Button.jsx
- src/utils/helpers.js

자동 수정: npm run format
```

## 검증 보고서 템플릿

```markdown
# 품질 검증 보고서

## 요약

- 전체 상태: ⚠️ 경고 (통과 가능)
- 검증 일시: YYYY-MM-DD HH:mm
- 검증 범위: src/components/, src/utils/

## 1. ESLint (린트)

**상태**: ✓ 통과 (0 errors, 2 warnings)

**경고 항목**:

- `src/components/Button.jsx:12`: unused variable 'theme'
- `src/utils/api.js:45`: missing dependency in useEffect

**권고사항**:

- Button.jsx에서 'theme' 변수 제거 또는 사용
- useEffect 의존성 배열에 'data' 추가

## 2. 테스트 커버리지

**상태**: ⚠️ 기준 미달

**현황**:

- 전체: 78.5% (목표 80%)
- 누락 파일: `src/utils/formatters.js`
- 누락 테스트: 카운터 컴포넌트의 음수 처리

**개선 방안**:

1. formatters.js 테스트 추가 (예상 시간: 30분)
2. Counter 음수 케이스 테스트 추가 (예상 시간: 15분)

## 3. 빌드

**상태**: ✓ 성공 (149.7 KB)

**세부 사항**:

- JavaScript: 145.2 KB
- CSS: 12.5 KB
- 이전 빌드 대비: +3.2 KB (2.2% 증가)

**권고사항**:

- 사용되지 않는 CSS 클래스 검토
- 번들 분석 도구 사용 권장

## 4. Prettier 형식

**상태**: ✓ 통과

모든 파일이 Prettier 규칙을 준수합니다.

## 종합 평가

**현재 상태**: 제출 가능

- ✓ 린트 통과
- ⚠️ 테스트 커버리지 2% 부족
- ✓ 빌드 성공
- ✓ 형식 준수

**다음 단계**:

1. 우선: 테스트 커버리지 80% 달성
2. 선택: 번들 크기 최적화 검토

**예상 작업 시간**: 45분
```

## 검증 체크리스트

- [ ] ESLint 실행 및 에러/경고 분류
- [ ] 테스트 커버리지 측정 (80% 목표)
- [ ] 빌드 성공 확인
- [ ] 빌드 크기 변화 분석
- [ ] Prettier 형식 확인
- [ ] 각 항목별 개선 방안 제시
- [ ] 우선순위 명시

## 마크다운 출력 규칙

- 상태 아이콘: ✓ (통과), ⚠️ (경고), ✗ (실패)
- 우선순위: **높음** (빨강), **중간** (노랑), **낮음** (초록)
- 파일/라인 명시: `파일명:라인번호`
- 구체적 수정안 제시: "삭제하세요" 대신 "변수 'x' 제거"
