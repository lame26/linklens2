begin;

-- Replace legacy "done" status with "archived" and tighten allowed status set.
update public.links
set status = 'archived'
where status = 'done';

alter table public.links
drop constraint if exists links_status_check;

alter table public.links
add constraint links_status_check
check (status in ('unread', 'reading', 'archived'));

-- Normalize legacy categories into the new 7-category taxonomy.
update public.links
set category = case
  when category is null or btrim(category) = '' then null
  when btrim(category) in ('정치', '정치/사회') then '정치'
  when btrim(category) in ('경제', '비즈니스/금융', '비즈니스/경제', '경제/정책', '투자/금융') then '경제'
  when btrim(category) in ('사회', '사회/정책', '교육/커리어', '기타') then '사회'
  when btrim(category) in ('생활/문화', '라이프/문화', '문화/라이프') then '생활/문화'
  when btrim(category) in ('IT/과학', '인공지능/개발', 'AI/개발', 'AI/머신러닝', '개발/프로그래밍', '데이터/인프라', '데이터/분석', '보안/인프라', '과학/헬스', '과학/기술', '헬스/바이오') then 'IT/과학'
  when btrim(category) in ('세계', '국제') then '세계'
  when btrim(category) in ('사설/칼럼', '사설', '칼럼') then '사설/칼럼'
  when lower(btrim(category)) like '%opinion%' or lower(btrim(category)) like '%editorial%' or lower(btrim(category)) like '%column%' then '사설/칼럼'
  when lower(btrim(category)) like '%world%' or lower(btrim(category)) like '%global%' or lower(btrim(category)) like '%international%' then '세계'
  when lower(btrim(category)) like '%politic%' or lower(btrim(category)) like '%election%' then '정치'
  when lower(btrim(category)) like '%finance%' or lower(btrim(category)) like '%business%' or lower(btrim(category)) like '%market%' then '경제'
  when lower(btrim(category)) like '%lifestyle%' or lower(btrim(category)) like '%culture%' then '생활/문화'
  when lower(btrim(category)) like '%ai%' or lower(btrim(category)) like '%software%' or lower(btrim(category)) like '%tech%' or lower(btrim(category)) like '%data%' or lower(btrim(category)) like '%science%' then 'IT/과학'
  else '사회'
end
where category is not null;

commit;
