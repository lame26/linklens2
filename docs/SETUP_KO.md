# LinkPocket 생성/연결 가이드 (초기 버전)

## 1) Supabase 프로젝트 생성
1. Supabase 대시보드에서 새 프로젝트 생성
2. `Project Settings > API`에서 아래 값 확인
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. SQL Editor 또는 Supabase CLI로 `supabase/migrations/*.sql` 실행

## 2) OpenAI API 키 준비
1. OpenAI 대시보드에서 API 키 발급
2. Worker 환경변수 `OPENAI_API_KEY`에 저장

## 3) Cloudflare Workers(API) 생성
1. Cloudflare Dashboard에서 Worker 생성 (프로젝트명 예: `linkpocket-api`)
2. `api/wrangler.toml`의 이름/도메인 설정
3. 로컬 개발용 변수 파일 생성
```bash
cp api/.dev.vars.example api/.dev.vars
```
4. `api/.dev.vars`에 아래 값 입력
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`(선택, 기본 `gpt-4o-mini`)
5. Cloudflare 시크릿 등록 (배포 환경)
```bash
cd api
npx wrangler login
echo "$SUPABASE_URL" | npx wrangler secret put SUPABASE_URL
echo "$SUPABASE_ANON_KEY" | npx wrangler secret put SUPABASE_ANON_KEY
echo "$SUPABASE_SERVICE_ROLE_KEY" | npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
echo "$OPENAI_API_KEY" | npx wrangler secret put OPENAI_API_KEY
```
6. `OPENAI_MODEL`은 `api/wrangler.toml`의 `[vars]`에서 관리
7. 배포
```bash
npm --prefix api run deploy
```

### Worker 환경변수 검증 팁
- `GET /api/v1/health` 응답의 `missingEnvKeys`가 비어 있어야 정상
- 필수값 누락 시 API는 `misconfigured_worker`(500)를 반환

## 4) Cloudflare Pages(Web) 생성
1. Pages 프로젝트 생성 (프레임워크: Vite)
2. Build 설정
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `web`
3. Pages 환경변수 설정
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL` (예: `https://linkpocket-api.<account>.workers.dev`)

## 5) 로컬 실행
1. 웹
```bash
npm --prefix web install
npm --prefix web run dev
```
2. API
```bash
npm --prefix api install
npm --prefix api run dev
```

## 6) MVP 검증 체크
1. 이메일 회원가입/로그인/로그아웃
2. 링크 저장 후 목록 즉시 반영
3. 수정(메모/상태/별점/태그), 삭제 후 휴지통 복원
4. 컬렉션/검색/필터/정렬/카드-리스트 전환
5. AI 제목 미리보기/분석 실패 시에도 링크 저장/조회 정상
