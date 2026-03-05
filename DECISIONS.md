# DECISIONS

## 2026-03-05 - 아키텍처 선택
- 결정: Cloudflare Pages(프론트) + Cloudflare Workers(API) + Supabase(Auth/DB) + OpenAI(API)
- 이유: 배포 단순성, 엣지 API 응답성, Supabase RLS 기반 데이터 격리 용이성

## 2026-03-05 - MVP/확장 분리 원칙
- 결정: 사용자 핵심 흐름(인증/저장/조회/정리)을 먼저 고정하고 AI는 비동기 작업으로 분리
- 이유: AI 실패/지연이 있어도 저장/조회 흐름 중단 방지

## 2026-03-05 - 삭제 정책
- 결정: 링크는 soft delete(`deleted_at`) 적용, 복원 가능한 휴지통 제공
- 이유: 실사용 중 오삭제 복구성과 신뢰성 확보
