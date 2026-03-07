# NEXT TASKS

## 2026-03-07 긴급 복구

- [x] `App.tsx` 손상 상태를 먼저 `HEAD` 기준으로 복구
- [x] import/export 호출 경로와 UI 상태 참조를 훅으로 연결 (빌드 통과)
- [x] App.tsx 내 로컬 `importingFile` / `exportingFormat` 상태 및 `handleImportArticlesFile` / `handleExportLinks` 함수 제거 (apply_patch만 사용)

완료 항목 상세 이력은 `docs/HISTORY.md`를 기준으로 확인한다.

## 현재 단계

- 최신 `origin/main` 기준 구조 분리 재시작 단계
- 기준 파일은 `web/src/App.tsx`
- 현재 우선순위는 기능 추가보다 `view split + query/action 분리`

## P0 (지금 바로 진행)

- [x] 최신 `origin/main` 기준 실행 설계 재잠금 (`docs/EXECUTION_REFACTOR_PLAN.md`)
- [x] 공통 API 계층 1차 추출 (`web/src/lib/api.ts`)
- [x] `AuthView` 1차 분리
- [x] `LibraryView` 1차 분리
- [x] `SettingsView` 1차 분리

## P1 (데이터/액션 분리)

- [x] `useLinksQuery` 분리
- [x] `useCollectionsQuery` 분리
- [x] `useAiPreferences` 분리
- [x] `useAiActions` 분리
- [x] `useLinkMutations` 분리
- [x] `useBulkActions` 분리
- [x] `useImportExportActions` 분리

## P2 (세부 컴포넌트 분리)

- [ ] sidebar 분리
- [ ] topbar 분리
- [ ] list toolbar 분리
- [ ] card/list item 분리
- [ ] detail drawer 분리
- [ ] add modal 분리
- [ ] help modal 분리

## 운영/데이터 후속 작업

- [ ] 수동 업로드된 구글 URL 치환 SQL 실행 (`supabase/sql/20260306_replace_google_links_with_article_urls.sql`)
- [ ] 기존 수동 업로드 링크 `published_at` 백필 SQL 실행 및 결과 검증
- [ ] Cloudflare Pages 환경변수(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`) 고정 등록 상태 최종 점검

## 후순위 UX/운영 개선

- [ ] 상단 빠른 추가 바 + 단축키 (`Ctrl/Cmd + K`)
- [ ] 삭제 후 5초 Undo 토스트
- [ ] 필터/정렬 상태 LocalStorage 복원
- [ ] 모바일 상세 패널 하단 액션 고정
- [ ] import 진행률 UI(n/m) + 중단/재시도 UX
- [ ] import 완료 항목 일괄 재분석 버튼
- [ ] 스켈레톤 로딩 카드 추가
- [ ] 저장 -> AI 자동분석 E2E 체크리스트 문서화
- [ ] 인증/저장 실패 네트워크 로그 템플릿(401/CORS/500) 추가
- [ ] 저장 CTA를 `즉시 저장 + AI 후처리`로 명확히 보이게 수정
- [ ] 저장 상태와 AI 상태 피드백 분리 (`저장 완료`, `AI 분석 중`, `AI 실패`, `재시도`)
- [ ] 라이브러리 메인 화면을 숫자 카드 중심에서 재탐색 중심으로 재설계
- [ ] 별점 기능 유지 여부 재검토
- [ ] autosave / 삭제 / 복원 / import-export / 세션 만료 신뢰 UX 보강