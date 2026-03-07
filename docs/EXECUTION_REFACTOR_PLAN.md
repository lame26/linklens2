# LinkPocket Execution Refactor Plan

## 목적

이 문서는 최신 `origin/main` 기준 실제 코드 상태를 반영한 실행 설계다.

현재 [`web/src/App.tsx`](D:\linkpocket\linkpocket\web\src\App.tsx)는 단순 라이브러리 화면이 아니라 아래 책임을 모두 포함한다.

- 인증 화면
- 라이브러리 화면
- 설정 화면
- AI 요약 설정
- import/export
- bulk 작업
- 도움말 모달
- 상세 편집 autosave

따라서 기존의 "작은 hook 몇 개 추출" 수준이 아니라, `화면 분리 -> 데이터/액션 분리 -> 컴포넌트 분리` 순서로 다시 접근해야 한다.

## 현재 진단

- `App.tsx`: 3539줄
- Router 없음
- 페이지 개념 없이 `auth / library / settings`가 한 컴포넌트에 공존
- Supabase 조회/수정, Worker fetch, draft autosave, bulk action이 모두 직접 구현돼 있음
- 스타일은 여전히 [`web/src/styles.css`](D:\linkpocket\linkpocket\web\src\styles.css) 단일 파일 중심

## 현재 반영 완료

- `web/src/lib/api.ts` 추출 완료
- `App.tsx`에서 공통 API 유틸 import 연결 완료
- 빌드 통과 확인 완료

## 잠그는 방향

### 1. 지금 1순위는 page-level split

먼저 아래 3개 view를 분리한다.

- `AuthView`
- `LibraryView`
- `SettingsView`

이 단계에서는 라우터를 바로 넣지 않아도 된다. 우선 `App.tsx`에서 JSX와 상태 책임을 나눠 "페이지처럼" 분리하는 것이 우선이다.

### 2. 데이터/액션은 도메인별 hook으로 분리

분리 우선순위:

1. `useLinksQuery`
2. `useCollectionsQuery`
3. `useAiPreferences`
4. `useAiActions`
5. `useLinkMutations`
6. `useBulkActions`
7. `useImportExportActions`

### 3. 설정 화면은 별도 도메인으로 취급

현재 settings는 단순 환경설정이 아니다.

- 비밀번호 변경
- AI 요약 설정 저장
- export
- 전체 삭제
- 회원 탈퇴

따라서 `LibraryView`와 분리된 별도 화면 책임으로 유지한다.

### 4. stash는 참고 자료로만 사용

2026-03-07 기준 stash에 이전 분리 초안이 남아 있지만, 최신 `origin/main` UI와 구조가 크게 달라졌으므로 바로 적용하지 않는다.

필요한 로직만 선별 참조한다.

## 목표 구조

```text
web/src/
  views/
    AuthView.tsx
    LibraryView.tsx
    SettingsView.tsx
  hooks/
    useLinksQuery.ts
    useCollectionsQuery.ts
    useAiPreferences.ts
    useAiActions.ts
    useLinkMutations.ts
    useBulkActions.ts
    useImportExportActions.ts
  lib/
    api.ts
    linkData.ts
    importUtils.ts
    types.ts
    supabase.ts
```

## 단계별 실행 순서

### Phase 1. 공통 인프라 추출

- `api.ts`
- 공통 select 문자열
- 공통 응답 에러 파서
- access token 재획득 유틸

### Phase 2. view split

- `AuthView`
- `LibraryView`
- `SettingsView`

이 단계에서 `App.tsx`는 탭/세션 분기와 공통 상태 연결만 담당한다.

### Phase 3. query/action hook split

- links / collections / preferences / ai actions / mutations / bulk / import-export 분리

### Phase 4. 세부 컴포넌트 분리

- sidebar
- topbar
- list toolbar
- card/list item
- detail drawer
- add modal
- help modal

## 완료 기준

- `App.tsx`가 더 이상 "앱 전체 구현 파일"이 아님
- auth/library/settings가 각자 독립 파일로 설명 가능
- Supabase query와 Worker fetch가 `App.tsx` 밖으로 이동
- bulk / import / ai / settings 책임이 각 도메인 훅으로 정리

## 지금 바로 시작할 작업

1. `AuthView` 1차 분리
2. `LibraryView` 1차 분리
3. `SettingsView` 1차 분리
4. 그 다음 query/action hook split 착수
