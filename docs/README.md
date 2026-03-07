# LinkPocket Docs Index

## 2026-03-07 재발 방지 규칙

- 대형 TSX 파일(`web/src/App.tsx`) 편집 시 `shell_command` 기반 문자열 치환/PowerShell 재저장을 금지하고 `apply_patch`만 사용한다.
- 파일 손상 발생 시 전체 revert 대신 해당 파일만 `git show HEAD:<path>` 기준으로 먼저 복구한다.
- 큰 정리는 한 번에 지우지 말고 `호출부 교체 -> 상태 제거 -> 죽은 함수 제거` 순서로 작은 패치 단위로 진행한다.

## 지금 상태 요약

- 현재 로컬 브랜치는 최신 `origin/main` 기준이다.
- 로컬 dev 서버로 최신 화면 확인까지 끝났다.
- 리팩터링은 최신 `web/src/App.tsx` 기준으로 다시 시작한 상태다.
- 현재 기준 핵심 문서는 이 파일과 `DECISIONS.md`, `NEXT_TASKS.md`, `EXECUTION_REFACTOR_PLAN.md`, `HISTORY.md`다.
- 과거에 진행하던 분리 작업 초안은 `git stash`로 임시 보관되어 있으며, 바로 apply하지 않고 필요한 부분만 참고하는 것이 원칙이다.

## 다른 세션용 시작 규칙

다른 세션에서 작업을 이어갈 때는 우선 이 파일을 읽고, 바로 아래 순서대로 확인한다.

1. `docs/DECISIONS.md`
2. `docs/KNOWN_ISSUES.md`
3. `docs/NEXT_TASKS.md`
4. `docs/EXECUTION_REFACTOR_PLAN.md`
5. `docs/HISTORY.md`

이 순서면 현재 정책, 남은 작업, 최신 리팩터링 방향, 직전 작업 맥락까지 이어받을 수 있다.

## 현재 단계

- 최신 `origin/main` 기준 구조 분리 재시작 단계
- 기준 파일은 여전히 `web/src/App.tsx`이며, 이 파일의 책임을 점진적으로 줄이는 것이 핵심 작업이다
- 예전 stash 초안은 그대로 복원하지 말고, 최신 UI와 비교해서 필요한 로직만 선별 반영한다

## 현재 우선 작업 축

- 공통 API/데이터 경계 분리
- `App.tsx`의 view split
- query / action hook 분리
- 실제 즉시 작업 항목은 `docs/NEXT_TASKS.md`를 따른다

## 주의사항

- 문서는 루트가 아니라 `docs/` 아래만 기준으로 본다.
- 현재 기준이 아닌 참고 문서는 `docs/ARCHIVE/`에 있다.
- 로컬 전용 파일인 `web/.env.local`은 Git 기준 문서가 아니므로, 세션이 바뀌면 존재 여부를 다시 확인해야 한다.
- dev 로그 파일(`web/vite-dev.log`, `web/vite-dev.err.log`)은 작업 기록이 아니라 임시 실행 파일이다.

## 활성 문서

- `README.md`: 문서 인덱스와 세션 시작 순서
- `DECISIONS.md`: 아키텍처/정책 결정과 이유
- `KNOWN_ISSUES.md`: 재현 버그와 운영 이슈
- `NEXT_TASKS.md`: 현재 우선순위
- `EXECUTION_REFACTOR_PLAN.md`: 최신 `origin/main` 기준 실행 설계
- `SETUP_KO.md`: 로컬/배포 연결 가이드
- `HISTORY.md`: 변경 이력

## 세션 시작 순서

1. `docs/README.md`
2. `docs/DECISIONS.md`
3. `docs/KNOWN_ISSUES.md`
4. `docs/NEXT_TASKS.md`
5. `docs/EXECUTION_REFACTOR_PLAN.md`
6. `docs/SETUP_KO.md`
7. `docs/HISTORY.md`

## 운영 원칙

- 루트에는 문서를 두지 않고 `docs/` 아래로만 관리
- 현재 기준이 아닌 문서는 `docs/ARCHIVE/`로 이동
- 작업 완료 후에는 `docs/HISTORY.md`와 `docs/NEXT_TASKS.md`를 반드시 갱신

## 아카이브

현재 기준에서 직접 사용하지 않는 참고 문서:

- `docs/ARCHIVE/AI_FEATURES.md`
- `docs/ARCHIVE/ARCHITECTURE.md`
- `docs/ARCHIVE/DESIGN_SYSTEM.md`
- `docs/ARCHIVE/PRODUCT_ROADMAP.md`
- `docs/ARCHIVE/PROJECT_CONTEXT.md`
- `docs/ARCHIVE/LinkLens_리마스터링_인수인계.md`
