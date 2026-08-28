-- Map Practice schema + starter seed data for Supabase
-- Safe to run multiple times.

create extension if not exists pgcrypto;

create table if not exists public.map_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  map_scope text not null check (map_scope in ('india', 'world', 'current')),
  latitude double precision,
  longitude double precision,
  geojson jsonb,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  is_current_affairs boolean default false,
  source_note text,
  created_at timestamptz default now()
);

create unique index if not exists map_locations_name_scope_key
  on public.map_locations (name, map_scope);

create index if not exists idx_map_locations_scope_category
  on public.map_locations (map_scope, category);

create table if not exists public.map_questions (
  id uuid primary key default gen_random_uuid(),
  question_text text not null,
  question_type text not null check (question_type in ('map_click_point', 'map_click_line', 'map_click_polygon', 'drag_label', 'identify_marker')),
  main_topic text not null,
  subtopic text not null,
  map_scope text not null check (map_scope in ('india', 'world', 'current')),
  correct_location_id uuid references public.map_locations(id) on delete set null,
  tolerance_km numeric default 30,
  explanation text,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  exam_tags text[],
  is_current_affairs boolean default false,
  current_affairs_month date,
  created_at timestamptz default now()
);

create unique index if not exists map_questions_text_scope_key
  on public.map_questions (question_text, map_scope);

create index if not exists idx_map_questions_scope_topic
  on public.map_questions (map_scope, main_topic, subtopic);

create index if not exists idx_map_questions_difficulty
  on public.map_questions (difficulty);

alter table public.map_locations enable row level security;
alter table public.map_questions enable row level security;

drop policy if exists "Public read map_locations" on public.map_locations;
drop policy if exists "Public read map_questions" on public.map_questions;
revoke all privileges on table public.map_locations from anon, authenticated;
revoke all privileges on table public.map_questions from anon, authenticated;
grant select, insert, update, delete on table public.map_locations to service_role;
grant select, insert, update, delete on table public.map_questions to service_role;

insert into public.map_locations (name, category, map_scope, latitude, longitude, difficulty, is_current_affairs, source_note)
values
  ('Mumbai Port', 'Port', 'india', 18.95, 72.84, 'easy', false, 'Approximate coordinates'),
  ('Delhi', 'City', 'india', 28.6139, 77.2090, 'easy', false, 'National capital region'),
  ('Varanasi (Ganga)', 'River', 'india', 25.3176, 82.9739, 'medium', false, 'Approximate Ganga location'),
  ('Kaziranga National Park', 'National Park', 'india', 26.5775, 93.1711, 'medium', false, 'Assam'),
  ('Chennai', 'City', 'india', 13.0827, 80.2707, 'easy', false, 'Tamil Nadu coast'),
  ('Kanyakumari', 'Landform', 'india', 8.0883, 77.5385, 'medium', false, 'Southern tip of India'),
  ('Strait of Malacca', 'Strait', 'world', 2.5, 101.0, 'hard', false, 'Approximate center point'),
  ('Suez Canal', 'Canal', 'world', 30.7, 32.35, 'medium', false, 'Approximate midpoint'),
  ('Panama Canal', 'Canal', 'world', 9.08, -79.68, 'medium', false, 'Approximate midpoint'),
  ('Nile River (Cairo stretch)', 'River', 'world', 30.0444, 31.2357, 'medium', false, 'Approximate stretch near Cairo'),
  ('Mount Everest', 'Mountain', 'world', 27.9881, 86.9250, 'hard', false, 'Summit coordinates'),
  ('Red Sea Shipping Route', 'Current Affairs', 'current', 20.0, 38.0, 'hard', true, 'Approximate route marker'),
  ('Baku Climate Summit Venue', 'Current Affairs', 'current', 40.4093, 49.8671, 'medium', true, 'COP summit city')
on conflict (name, map_scope) do update
set
  category = excluded.category,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  difficulty = excluded.difficulty,
  is_current_affairs = excluded.is_current_affairs,
  source_note = excluded.source_note;

insert into public.map_questions (
  question_text,
  question_type,
  main_topic,
  subtopic,
  map_scope,
  correct_location_id,
  tolerance_km,
  explanation,
  difficulty,
  exam_tags,
  is_current_affairs,
  current_affairs_month
)
select *
from (
  values
    (
      'Map par Mumbai Port ko point out kijiye.',
      'map_click_point',
      'India Mapping',
      'Ports',
      'india',
      (select id from public.map_locations where name = 'Mumbai Port' and map_scope = 'india'),
      40::numeric,
      'Mumbai Port western coast par Arabian Sea ke saath major natural harbor hai.',
      'easy',
      array['UPSC', 'SSC'],
      false,
      null::date
    ),
    (
      'Map par Delhi ko point out kijiye.',
      'map_click_point',
      'India Mapping',
      'Capital Cities',
      'india',
      (select id from public.map_locations where name = 'Delhi' and map_scope = 'india'),
      35::numeric,
      'Delhi India ki national capital hai aur Yamuna ke kinare sthit hai.',
      'easy',
      array['UPSC', 'State PCS'],
      false,
      null::date
    ),
    (
      'Map par Ganga nadi ka Varanasi ke paas sthaan point out kijiye.',
      'map_click_point',
      'India Mapping',
      'Rivers',
      'india',
      (select id from public.map_locations where name = 'Varanasi (Ganga)' and map_scope = 'india'),
      100::numeric,
      'Varanasi Uttar Pradesh mein Ganga ke kinare sthit pracheen nagar hai.',
      'medium',
      array['UPSC', 'Railway'],
      false,
      null::date
    ),
    (
      'Map par Kaziranga National Park ko point out kijiye.',
      'map_click_point',
      'India Mapping',
      'National Parks',
      'india',
      (select id from public.map_locations where name = 'Kaziranga National Park' and map_scope = 'india'),
      50::numeric,
      'Kaziranga Assam mein hai aur one-horned rhino ke liye mashhoor hai.',
      'medium',
      array['UPSC', 'State PCS'],
      false,
      null::date
    ),
    (
      'Map par Chennai ko point out kijiye.',
      'map_click_point',
      'India Mapping',
      'Coastal Cities',
      'india',
      (select id from public.map_locations where name = 'Chennai' and map_scope = 'india'),
      35::numeric,
      'Chennai Bay of Bengal ke coast par ek important metro city hai.',
      'easy',
      array['SSC', 'Banking'],
      false,
      null::date
    ),
    (
      'Map par Kanyakumari ko point out kijiye.',
      'map_click_point',
      'India Mapping',
      'Extreme Points',
      'india',
      (select id from public.map_locations where name = 'Kanyakumari' and map_scope = 'india'),
      50::numeric,
      'Kanyakumari Bharat ka dakshini sirha maana jata hai.',
      'medium',
      array['UPSC', 'SSC'],
      false,
      null::date
    ),
    (
      'Map par Strait of Malacca ko point out kijiye.',
      'map_click_point',
      'World Mapping',
      'Straits',
      'world',
      (select id from public.map_locations where name = 'Strait of Malacca' and map_scope = 'world'),
      75::numeric,
      'Strait of Malacca Hind Mahasagar ko South China Sea se jodta hai.',
      'hard',
      array['UPSC', 'Defence'],
      false,
      null::date
    ),
    (
      'Map par Suez Canal ko point out kijiye.',
      'map_click_point',
      'World Mapping',
      'Canals',
      'world',
      (select id from public.map_locations where name = 'Suez Canal' and map_scope = 'world'),
      75::numeric,
      'Suez Canal Mediterranean Sea aur Red Sea ke beech strategic link hai.',
      'medium',
      array['UPSC', 'State PCS'],
      false,
      null::date
    ),
    (
      'Map par Panama Canal ko point out kijiye.',
      'map_click_point',
      'World Mapping',
      'Canals',
      'world',
      (select id from public.map_locations where name = 'Panama Canal' and map_scope = 'world'),
      75::numeric,
      'Panama Canal Atlantic aur Pacific ocean trade route ko short karta hai.',
      'medium',
      array['UPSC', 'SSC'],
      false,
      null::date
    ),
    (
      'Map par Nile River ka Cairo ke paas wala region point out kijiye.',
      'map_click_point',
      'World Mapping',
      'Rivers',
      'world',
      (select id from public.map_locations where name = 'Nile River (Cairo stretch)' and map_scope = 'world'),
      100::numeric,
      'Nile duniya ki sabse lambi nadiyon mein se ek hai aur Egypt ke liye life-line hai.',
      'medium',
      array['UPSC'],
      false,
      null::date
    ),
    (
      'Map par Mount Everest ko point out kijiye.',
      'map_click_point',
      'World Mapping',
      'Mountains',
      'world',
      (select id from public.map_locations where name = 'Mount Everest' and map_scope = 'world'),
      40::numeric,
      'Mount Everest Himalaya mein Nepal-Tibet border ke paas sthit hai.',
      'hard',
      array['UPSC', 'NDA'],
      false,
      null::date
    ),
    (
      'Current affairs map practice: Red Sea shipping route ka approximate point identify kijiye.',
      'map_click_point',
      'Current Affairs Mapping',
      'Maritime Chokepoints',
      'current',
      (select id from public.map_locations where name = 'Red Sea Shipping Route' and map_scope = 'current'),
      120::numeric,
      'Red Sea route global shipping aur energy security ke liye bahut mahatvapurn hai.',
      'hard',
      array['UPSC', 'Current Affairs'],
      true,
      date_trunc('month', now())::date
    ),
    (
      'Current affairs map practice: Baku climate summit venue ko map par point out kijiye.',
      'map_click_point',
      'Current Affairs Mapping',
      'Climate Summits',
      'current',
      (select id from public.map_locations where name = 'Baku Climate Summit Venue' and map_scope = 'current'),
      60::numeric,
      'Baku, Azerbaijan global climate diplomacy ke recent summits ka host city raha hai.',
      'medium',
      array['UPSC', 'Current Affairs'],
      true,
      date_trunc('month', now())::date
    )
) as seed(
  question_text,
  question_type,
  main_topic,
  subtopic,
  map_scope,
  correct_location_id,
  tolerance_km,
  explanation,
  difficulty,
  exam_tags,
  is_current_affairs,
  current_affairs_month
)
where seed.correct_location_id is not null
on conflict (question_text, map_scope) do update
set
  question_type = excluded.question_type,
  main_topic = excluded.main_topic,
  subtopic = excluded.subtopic,
  correct_location_id = excluded.correct_location_id,
  tolerance_km = excluded.tolerance_km,
  explanation = excluded.explanation,
  difficulty = excluded.difficulty,
  exam_tags = excluded.exam_tags,
  is_current_affairs = excluded.is_current_affairs,
  current_affairs_month = excluded.current_affairs_month;
