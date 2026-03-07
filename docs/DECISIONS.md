# DECISIONS

## 2026-03-07 - 대형 TSX 편집 규칙
- 결정: [`web/src/App.tsx`](/D:/linkpocket/linkpocket/web/src/App.tsx) 같은 대형 TSX 파일은 `shell_command` 기반 문자열 치환, PowerShell `Get-Content -Raw`/regex replace/재저장 방식으로 편집하지 않는다.
- 결정: 코드 수정은 기본적으로 `apply_patch`만 사용하고, shell은 읽기/검색/빌드 검증에만 사용한다.
- 결정: 대형 파일 정리는 한 번에 큰 범위를 지우지 않고 `호출부 교체 -> 상태 제거 -> 죽은 함수 제거` 순서로 작은 패치 단위로 진행한다.
- 이유: Windows PowerShell 편집 흐름에서 UTF-8/한글/JSX 문자열이 쉽게 손상되고, 정규식 범위 삭제는 TSX 구조를 깨뜨릴 위험이 높다.

## 2026-03-07 - 파일 복구 우선순위
- 결정: 파일 손상 발생 시 전체 워크트리를 되돌리지 않고, 먼저 해당 파일만 `git show HEAD:<path>` 기준으로 복구한다.
- 결정: 복구 후에는 살아 있는 신규 파일(hooks/views/docs)을 최대한 보존하고, 연결부만 다시 얹는다.
- 이유: 이번 리팩터링은 `origin/main` pull 이후 현재 워크트리에서 직접 진행한 작업이므로, 전체 복원은 정상 산출물까지 같이 잃을 위험이 있다.

## 2026-03-05 - 아키텍처 선택
- 결정: Cloudflare Pages(프론트) + Cloudflare Workers(API) + Supabase(Auth/DB) + OpenAI(API)
- 이유: 배포 단순성, 엣지 API 응답성, Supabase RLS 기반 데이터 격리 용이성

## 2026-03-05 - MVP/확장 분리 원칙
- 결정: 사용자 핵심 흐름(인증/저장/조회/정리)을 먼저 고정하고 AI는 비동기 작업으로 분리
- 이유: AI 실패/지연이 있어도 저장/조회 흐름 중단 방지

## 2026-03-05 - 삭제 정책
- 결정: 링크는 soft delete(`deleted_at`) 적용, 복원 가능한 휴지통 제공
- 이유: 실사용 중 오삭제 복구성과 신뢰성 확보
