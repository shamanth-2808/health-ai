-- ═══════════════════════════════════════════════════════════════════
-- Health AI — Supabase / PostgreSQL schema, RLS, indexes & seed data
-- ═══════════════════════════════════════════════════════════════════
-- Run this in the Supabase SQL Editor (or `supabase db push`).
-- It is idempotent: uses CREATE TABLE IF NOT EXISTS and DROP ... IF EXISTS.
--
-- Row-Level Security model:
--   • food_items        — readable by all authenticated users (reference data);
--                         writable only via service role (seeding).
--   • food_prices       — readable by all authenticated users; users may add
--                         their own (price intelligence is a shared resource).
--   • All other tables  — strictly private to the owning user (auth.uid() = user_id).
-- ═══════════════════════════════════════════════════════════════════

-- Required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── profiles ───────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  name            text not null default '',
  age             int  check (age between 5 and 120),
  sex             text not null default 'male' check (sex in ('male','female')),
  height_cm       numeric(5,2) check (height_cm between 50 and 300),
  current_weight_kg numeric(6,2) check (current_weight_kg between 20 and 500),
  target_weight_kg  numeric(6,2) check (target_weight_kg between 20 and 500),
  activity_level  text not null default 'sedentary'
                  check (activity_level in ('sedentary','light','moderate','active','very_active')),
  dietary_preference text not null default 'vegetarian'
                  check (dietary_preference in ('vegetarian','vegan','eggetarian','non_vegetarian')),
  allergies       text[] not null default '{}',
  fitness_goal    text not null default 'general'
                  check (fitness_goal in ('fat_loss','maintenance','muscle_gain','general')),
  daily_food_budget_inr numeric(10,2) not null default 300 check (daily_food_budget_inr >= 0),
  preferred_food_sources text[] not null default '{home,grocery}'
                  check (preferred_food_sources::text ~* '^(home|grocery|restaurant|swiggy|zomato|custom)(,(home|grocery|restaurant|swiggy|zomato|custom))*$'),
  gym_access      boolean not null default false,
  training_experience text not null default 'beginner'
                  check (training_experience in ('beginner','intermediate','advanced')),
  workout_days_per_week int not null default 3 check (workout_days_per_week between 0 and 7),
  waist_cm       numeric(5,2),
  sleep_hours    numeric(4,2) check (sleep_hours between 0 and 24),
  bmr_equation   text not null default 'mifflin_st_jeor'
                  check (bmr_equation in ('mifflin_st_jeor','harris_benedict')),
  onboarding_complete boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── goals (snapshots of targets over time) ──────────────────────
create table if not exists public.goals (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  goal_type     text not null check (goal_type in ('fat_loss','maintenance','muscle_gain','general')),
  calorie_target int check (calorie_target between 800 and 6000),
  protein_target_g numeric(6,1) check (protein_target_g >= 0),
  steps_target  int check (steps_target >= 0),
  water_target_glasses int default 8 check (water_target_glasses between 0 and 30),
  sleep_target_hours numeric(4,1) default 8,
  deficit_kcal  numeric(6,1) default 500,
  surplus_kcal numeric(6,1) default 300,
  active_from   date not null default current_date,
  created_at    timestamptz not null default now()
);

-- ── food_items (shared reference data + custom) ─────────────────
create table if not exists public.food_items (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  category        text not null default 'other',
  calories_per_100g numeric(7,2) not null check (calories_per_100g >= 0),
  protein_per_100g  numeric(6,2) not null check (protein_per_100g >= 0),
  carbs_per_100g    numeric(6,2) not null check (carbs_per_100g >= 0),
  fat_per_100g      numeric(6,2) not null check (fat_per_100g >= 0),
  fiber_per_100g    numeric(6,2) not null default 0,
  serving_name   text not null default '1 serving',
  serving_grams  numeric(7,2) not null default 100 check (serving_grams > 0),
  is_vegetarian  boolean not null default true,
  is_vegan       boolean not null default false,
  is_eggetarian  boolean not null default false,
  approximate    boolean not null default false,
  is_custom      boolean not null default false,
  user_id        uuid references auth.users(id) on delete cascade, -- null = shared reference
  created_at     timestamptz not null default now()
);

-- ── food_logs ──────────────────────────────────────────────────
create table if not exists public.food_logs (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  date          date not null,
  meal_category text not null check (meal_category in ('breakfast','lunch','dinner','snacks')),
  food_item_id  uuid references public.food_items(id) on delete set null,
  food_name     text not null,
  quantity_grams numeric(8,2) not null check (quantity_grams > 0),
  servings      numeric(8,2) not null default 1,
  calories      numeric(8,2) not null default 0,
  protein       numeric(8,2) not null default 0,
  carbs         numeric(8,2) not null default 0,
  fat           numeric(8,2) not null default 0,
  fiber         numeric(8,2) not null default 0,
  price_inr     numeric(8,2),
  meal_time     time,
  notes         text,
  created_at    timestamptz not null default now()
);

-- ── food_prices (price intelligence, shared) ───────────────────
create table if not exists public.food_prices (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete set null,
  food_item_id    uuid references public.food_items(id) on delete set null,
  item_name       text not null,
  brand_or_restaurant text,
  source          text not null check (source in ('home','grocery','restaurant','swiggy','zomato','custom')),
  location        text,
  quantity        numeric(10,3) not null check (quantity > 0),
  unit            text not null check (unit in ('g','kg','ml','piece','serving')),
  price_inr       numeric(10,2) not null check (price_inr >= 0),
  observed_at     date not null default current_date,
  serving_grams   numeric(8,2),
  protein_per_100g numeric(6,2),
  calories_per_100g numeric(7,2),
  source_url      text,
  is_sample       boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ── activity_logs ───────────────────────────────────────────────
create table if not exists public.activity_logs (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  date          date not null,
  type          text not null check (type in ('walking','running','cycling','gym','stairs','other')),
  duration_min  int not null check (duration_min > 0),
  distance_km   numeric(7,2),
  steps         int,
  floors        int,
  intensity     text not null default 'moderate' check (intensity in ('low','moderate','high')),
  estimated_calories_burned numeric(8,2) not null default 0,
  notes         text,
  created_at    timestamptz not null default now()
);

-- ── weight_logs ─────────────────────────────────────────────────
create table if not exists public.weight_logs (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  date          date not null,
  weight_kg     numeric(6,2) not null check (weight_kg between 20 and 500),
  waist_cm      numeric(5,2),
  notes         text,
  created_at    timestamptz not null default now()
);

-- ── water_logs ──────────────────────────────────────────────────
create table if not exists public.water_logs (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  date          date not null,
  glasses       int not null default 1 check (glasses between 0 and 50),
  created_at    timestamptz not null default now()
);

-- ── sleep_logs ──────────────────────────────────────────────────
create table if not exists public.sleep_logs (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  date          date not null,
  hours         numeric(4,2) not null check (hours between 0 and 24),
  quality       text not null default 'good' check (quality in ('poor','fair','good','excellent')),
  created_at    timestamptz not null default now()
);

-- ── workout_plans ───────────────────────────────────────────────
create table if not exists public.workout_plans (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  description   text,
  goal          text not null check (goal in ('fat_loss','maintenance','muscle_gain','general')),
  days_per_week int not null default 3 check (days_per_week between 1 and 7),
  split         text not null default 'full_body',
  equipment     text not null default 'both' check (equipment in ('bodyweight','gym','both')),
  created_at    timestamptz not null default now()
);

-- ── workouts ─────────────────────────────────────────────────────
create table if not exists public.workouts (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  date          date not null,
  plan_id       uuid references public.workout_plans(id) on delete set null,
  plan_name     text,
  duration_min  int not null default 0 check (duration_min >= 0),
  estimated_calories_burned numeric(8,2) not null default 0,
  notes         text,
  completed     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ── workout_exercises (between workouts and sets) ───────────────
create table if not exists public.workout_exercises (
  id            uuid primary key default uuid_generate_v4(),
  workout_id    uuid not null references public.workouts(id) on delete cascade,
  exercise_id   text not null,
  exercise_name text not null,
  muscle_group  text,
  created_at    timestamptz not null default now()
);

-- ── workout_sets ────────────────────────────────────────────────
create table if not exists public.workout_sets (
  id            uuid primary key default uuid_generate_v4(),
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  set_number    int not null default 1 check (set_number >= 1),
  reps          int not null default 10 check (reps >= 0),
  load_kg       numeric(6,2) not null default 0 check (load_kg >= 0),
  completed     boolean not null default false,
  notes         text,
  created_at    timestamptz not null default now()
);

-- ── saved_meals ─────────────────────────────────────────────────
create table if not exists public.saved_meals (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  meal_category text not null default 'lunch' check (meal_category in ('breakfast','lunch','dinner','snacks')),
  items         jsonb not null default '[]', -- [{foodItemId, foodName, quantityGrams}]
  created_at    timestamptz not null default now()
);

-- ── daily_summaries (cached aggregates) ─────────────────────────
create table if not exists public.daily_summaries (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  date          date not null,
  calories_consumed numeric(8,2) not null default 0,
  calories_burned_activity numeric(8,2) not null default 0,
  protein       numeric(8,2) not null default 0,
  carbs         numeric(8,2) not null default 0,
  fat           numeric(8,2) not null default 0,
  fiber         numeric(8,2) not null default 0,
  steps         int not null default 0,
  distance_km   numeric(7,2) not null default 0,
  active_minutes int not null default 0,
  floors        int not null default 0,
  water_glasses int not null default 0,
  sleep_hours   numeric(4,2) not null default 0,
  weight_kg     numeric(6,2),
  food_spent_inr numeric(10,2) not null default 0,
  unique (user_id, date),
  created_at    timestamptz not null default now()
);

-- ═════════════════════════════════════════════════════════════════
-- Indexes
-- ═════════════════════════════════════════════════════════════════
create index if not exists idx_goals_user          on public.goals(user_id);
create index if not exists idx_food_items_shared    on public.food_items(is_custom) where is_custom = false;
create index if not exists idx_food_items_user       on public.food_items(user_id) where user_id is not null;
create index if not exists idx_food_logs_user_date   on public.food_logs(user_id, date desc);
create index if not exists idx_food_logs_user_meal   on public.food_logs(user_id, date, meal_category);
create index if not exists idx_food_prices_item      on public.food_prices(food_item_id);
create index if not exists idx_food_prices_source    on public.food_prices(source);
create index if not exists idx_activity_logs_date    on public.activity_logs(user_id, date desc);
create index if not exists idx_weight_logs_date      on public.weight_logs(user_id, date desc);
create index if not exists idx_water_logs_date       on public.water_logs(user_id, date desc);
create index if not exists idx_sleep_logs_date       on public.sleep_logs(user_id, date desc);
create index if not exists idx_workouts_date         on public.workouts(user_id, date desc);
create index if not exists idx_workout_exercises_wk  on public.workout_exercises(workout_id);
create index if not exists idx_workout_sets_ex      on public.workout_sets(workout_exercise_id);
create index if not exists idx_saved_meals_user      on public.saved_meals(user_id);
create index if not exists idx_daily_summaries_date  on public.daily_summaries(user_id, date desc);

-- ═════════════════════════════════════════════════════════════════
-- updated_at trigger for profiles
-- ═════════════════════════════════════════════════════════════════
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Auto-create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═════════════════════════════════════════════════════════════════
-- Row-Level Security
-- ═════════════════════════════════════════════════════════════════
alter table public.profiles          enable row level security;
alter table public.goals             enable row level security;
alter table public.food_items        enable row level security;
alter table public.food_logs         enable row level security;
alter table public.food_prices       enable row level security;
alter table public.activity_logs     enable row level security;
alter table public.weight_logs       enable row level security;
alter table public.water_logs        enable row level security;
alter table public.sleep_logs        enable row level security;
alter table public.workout_plans     enable row level security;
alter table public.workouts          enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets      enable row level security;
alter table public.saved_meals       enable row level security;
alter table public.daily_summaries   enable row level security;

-- profiles: a user sees and edits only their own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- goals: private
drop policy if exists "goals_all_own" on public.goals;
create policy "goals_all_own" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- food_items: shared reference readable by all authenticated; custom private to owner
drop policy if exists "food_items_select_shared_or_own" on public.food_items;
create policy "food_items_select_shared_or_own" on public.food_items
  for select using (is_custom = false or user_id = auth.uid());
drop policy if exists "food_items_insert_own" on public.food_items;
create policy "food_items_insert_own" on public.food_items
  for insert with check (user_id = auth.uid());
drop policy if exists "food_items_update_own" on public.food_items;
create policy "food_items_update_own" on public.food_items
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "food_items_delete_own" on public.food_items;
create policy "food_items_delete_own" on public.food_items
  for delete using (user_id = auth.uid());

-- food_logs: private
drop policy if exists "food_logs_all_own" on public.food_logs;
create policy "food_logs_all_own" on public.food_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- food_prices: shared read, own write (price intelligence is a community resource)
drop policy if exists "food_prices_select_all" on public.food_prices;
create policy "food_prices_select_all" on public.food_prices
  for select using (true);
drop policy if exists "food_prices_insert_own" on public.food_prices;
create policy "food_prices_insert_own" on public.food_prices
  for insert with check (user_id = auth.uid() or user_id is null);
drop policy if exists "food_prices_update_own" on public.food_prices;
create policy "food_prices_update_own" on public.food_prices
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "food_prices_delete_own" on public.food_prices;
create policy "food_prices_delete_own" on public.food_prices
  for delete using (user_id = auth.uid());

-- activity_logs: private
drop policy if exists "activity_logs_all_own" on public.activity_logs;
create policy "activity_logs_all_own" on public.activity_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- weight_logs: private
drop policy if exists "weight_logs_all_own" on public.weight_logs;
create policy "weight_logs_all_own" on public.weight_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- water_logs: private
drop policy if exists "water_logs_all_own" on public.water_logs;
create policy "water_logs_all_own" on public.water_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- sleep_logs: private
drop policy if exists "sleep_logs_all_own" on public.sleep_logs;
create policy "sleep_logs_all_own" on public.sleep_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- workout_plans: private
drop policy if exists "workout_plans_all_own" on public.workout_plans;
create policy "workout_plans_all_own" on public.workout_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- workouts + nested: private (cascade through workout_id)
drop policy if exists "workouts_all_own" on public.workouts;
create policy "workouts_all_own" on public.workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "workout_exercises_via_workout" on public.workout_exercises;
create policy "workout_exercises_via_workout" on public.workout_exercises
  for all using (
    exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid())
  );

drop policy if exists "workout_sets_via_exercise" on public.workout_sets;
create policy "workout_sets_via_exercise" on public.workout_sets
  for all using (
    exists (
      select 1 from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  );

-- saved_meals: private
drop policy if exists "saved_meals_all_own" on public.saved_meals;
create policy "saved_meals_all_own" on public.saved_meals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- daily_summaries: private
drop policy if exists "daily_summaries_all_own" on public.daily_summaries;
create policy "daily_summaries_all_own" on public.daily_summaries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ═════════════════════════════════════════════════════════════════
-- Seed: shared Indian food reference data (per 100 g)
-- Values are approximate, especially for mixed/restaurant dishes.
-- Run with the service-role key so RLS (which restricts inserts to
-- user_id-matched rows) does not block the shared reference seed.
-- ═════════════════════════════════════════════════════════════════
insert into public.food_items
  (name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g,
   serving_name, serving_grams, is_vegetarian, is_vegan, is_eggetarian, approximate)
values
  ('Idli','breakfast',130,3.2,27,0.5,1,'1 idli',40,true,true,false,true),
  ('Plain Dosa','breakfast',168,3.9,28,4,0.8,'1 dosa',80,true,true,false,true),
  ('Masala Dosa','breakfast',170,3.5,26,5,1.4,'1 dosa',120,true,true,false,true),
  ('Rava Idli','breakfast',180,4.5,33,4,1,'1 piece',55,true,true,false,true),
  ('Pongal','breakfast',150,4,25,4,0.8,'1 bowl',200,true,true,false,true),
  ('Upma','breakfast',170,3.5,28,4.5,1,'1 bowl',200,true,true,false,true),
  ('Poha','breakfast',130,2.5,24,3.5,1,'1 bowl',150,true,true,false,true),
  ('Rice (cooked white)','staple',130,2.7,28,0.3,0.4,'1 cup',150,true,true,false,false),
  ('Brown Rice (cooked)','staple',123,2.7,26,1,1.8,'1 cup',150,true,true,false,false),
  ('Sambar','dal',50,2.5,7,1.5,2,'1 bowl',150,true,true,false,false),
  ('Dal (cooked)','dal',116,7,18,2.5,3,'1 bowl',150,true,true,false,false),
  ('Chickpeas (cooked)','dal',164,8.9,27,2.6,7.6,'1 cup',164,true,true,false,false),
  ('Rajma (cooked)','dal',127,8.7,22,0.5,6,'1 bowl',150,true,true,false,false),
  ('Moong Sprouts','dal',80,6,15,0.5,4,'1 bowl',100,true,true,false,false),
  ('Chapati','staple',297,8,46,7,4,'1 chapati',40,true,true,false,false),
  ('Roti','staple',290,7.5,45,7,3.5,'1 roti',40,true,true,false,false),
  ('Paratha (plain)','staple',320,8,42,11,3,'1 paratha',80,true,true,false,true),
  ('Curd (plain yogurt)','dairy',98,11,3.4,4.3,0,'1 cup',150,true,true,false,false),
  ('Milk (whole)','dairy',61,3.2,4.8,3.3,0,'1 glass',244,true,true,false,false),
  ('Paneer','dairy',296,18,4,22,0,'1 piece',40,true,true,false,false),
  ('Tofu','dairy',144,15,2.7,8,0.3,'1 piece',100,true,true,true,false),
  ('Soy Chunks (dry)','protein',345,52,33,0.5,6,'1 serving',25,true,true,true,false),
  ('Soy Chunks (cooked)','protein',170,26,12,2,3,'1 serving',100,true,true,true,true),
  ('Peanuts','protein',567,26,16,49,8.5,'1 handful',30,true,true,true,false),
  ('Almonds','protein',579,21,22,50,12,'10 pieces',12,true,true,true,false),
  ('Egg (whole)','protein',143,13,1.1,9.7,0,'1 egg',50,false,false,true,false),
  ('Egg White','protein',52,11,0.7,0.2,0,'1 white',33,false,false,true,false),
  ('Chicken Breast','protein',165,31,0,3.6,0,'100 g',100,false,false,false,false),
  ('Chicken Curry','protein',180,20,4,9,1,'1 serving',200,false,false,false,true),
  ('Fish (Rohu)','protein',130,22,0,4,0,'1 piece',100,false,false,false,false),
  ('Fish Curry','protein',120,16,3,5,0.5,'1 serving',200,false,false,false,true),
  ('Banana','fruit',89,1.1,23,0.3,2.6,'1 banana',118,true,true,true,false),
  ('Apple','fruit',52,0.3,14,0.2,2.4,'1 apple',182,true,true,true,false),
  ('Papaya','fruit',43,0.5,11,0.3,1.7,'1 cup',140,true,true,true,false),
  ('Guava','fruit',68,2.6,14,1,5.4,'1 guava',55,true,true,true,false),
  ('Orange','fruit',47,0.9,12,0.1,2.4,'1 orange',131,true,true,true,false),
  ('Spinach (cooked)','vegetable',23,3,3.6,0.3,2.4,'1 cup',180,true,true,true,false),
  ('Carrot','vegetable',41,0.9,10,0.2,2.8,'1 carrot',61,true,true,true,false),
  ('Tomato','vegetable',18,0.9,3.9,0.2,1.2,'1 tomato',123,true,true,true,false),
  ('Cucumber','vegetable',15,0.7,3.6,0.1,0.5,'1 cup',100,true,true,true,false),
  ('Coconut Chutney','condiment',210,3,16,16,3,'1 serving',40,true,true,false,true),
  ('Whey Protein (per scoop)','protein',400,80,8,6,0,'1 scoop',30,true,true,true,false)
on conflict do nothing;
