-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New Query)

create table if not exists reports (
  id                     uuid        default gen_random_uuid() primary key,
  slug                   text        unique not null,
  app_id                 text        not null,
  app_name               text        not null,
  generated_at           timestamptz not null,
  total_reviews_scraped  integer     default 0,
  total_reviews_analysed integer     default 0,
  avg_rating             numeric(3,1) default 0,
  pain_points            jsonb       default '[]',
  screen_analyses        jsonb       default '[]',
  has_screenshots        boolean     default false,
  focus_area             text        default 'all',
  platform               text        default 'both',
  time_filter            text        default 'all',
  competitors            jsonb       default '[]',
  competitor_sentiments  jsonb       default '[]',
  competitive_insights   jsonb       default '[]',
  expires_at             timestamptz,
  created_at             timestamptz default now()
);

create index if not exists reports_slug_idx       on reports (slug);
create index if not exists reports_app_id_idx     on reports (app_id);
create index if not exists reports_created_at_idx on reports (created_at desc);

-- If you already ran the old schema, run these to add the new columns:
-- alter table reports add column if not exists platform text default 'both';
-- alter table reports add column if not exists time_filter text default 'all';
-- alter table reports add column if not exists competitors jsonb default '[]';
-- alter table reports add column if not exists competitor_sentiments jsonb default '[]';
-- alter table reports add column if not exists competitive_insights jsonb default '[]';
-- alter table reports add column if not exists paytm_sentiment jsonb;
