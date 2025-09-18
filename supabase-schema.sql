-- Fresh minimal schema for a new Supabase project

-- 1) Enable UUID generation
create extension if not exists pgcrypto;

-- 2) Enums used in the app
do $$
begin
	if not exists (select 1 from pg_type where typname = 'risk_level') then
		create type risk_level as enum ('low','medium','high','critical');
	end if;
	if not exists (select 1 from pg_type where typname = 'consciousness_level') then
		create type consciousness_level as enum ('alert','verbal','pain','unresponsive');
	end if;
end $$;

create table if not exists public.accounts (
	account_id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	email text unique not null,
	full_name text,
	role text default 'user',
	is_active boolean not null default true,
	password_hash text
);

-- 4) Patients
create table if not exists public.patients (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	patient_id text not null unique,
	medical_record_number text,
	first_name text not null,
	last_name text not null,
	date_of_birth date,
	gender text,
	phone text,
	email text,
	emergency_contact_name text,
	emergency_contact_phone text
);

create table if not exists public.patient_records (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	patient_id uuid not null references public.patients(id) on delete cascade,
	recorded_by uuid references public.accounts(account_id),
	systolic_bp int check (systolic_bp is null or systolic_bp between 70 and 250),
	diastolic_bp int check (diastolic_bp is null or diastolic_bp between 40 and 150),
	heart_rate int check (heart_rate is null or heart_rate between 30 and 200),
	temperature numeric(5,2) check (temperature is null or temperature between 90 and 110),
	respiratory_rate int check (respiratory_rate is null or respiratory_rate between 8 and 40),
	oxygen_saturation int check (oxygen_saturation is null or oxygen_saturation between 70 and 100),
	consciousness_level consciousness_level not null default 'alert',
	pain_scale int check (pain_scale is null or pain_scale between 0 and 10),
	chief_complaint text not null,
	symptoms text,
	allergies text,
	current_medications text,
	medical_history text,
	risk_level risk_level not null default 'low',
	notes text
);

-- 6) Optional ratings per patient
create table if not exists public.patient_ratings (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	patient_id uuid not null references public.patients(id) on delete cascade,
	rating text not null,
	summary text
);

-- 7) Helpful indexes
create index if not exists idx_accounts_created_at on public.accounts(created_at desc);
create index if not exists idx_patients_created_at on public.patients(created_at desc);
create index if not exists idx_patients_name on public.patients(last_name, first_name);
create index if not exists idx_patients_email on public.patients(email);
create index if not exists idx_patient_records_patient_created_at on public.patient_records(patient_id, created_at desc);
create index if not exists idx_patient_ratings_patient_created_at on public.patient_ratings(patient_id, created_at desc);

-- 8) RLS: enable and fully open (won't interfere during development)
alter table public.accounts enable row level security;
alter table public.patients enable row level security;
alter table public.patient_records enable row level security;
alter table public.patient_ratings enable row level security;

do $$
begin
	-- accounts: allow everything
	if not exists (
		select 1 from pg_policies where policyname = 'accounts_all' and schemaname = 'public' and tablename = 'accounts'
	) then
		create policy accounts_all on public.accounts for all using (true) with check (true);
	end if;
	-- patients: allow everything
	if not exists (
		select 1 from pg_policies where policyname = 'patients_all' and schemaname = 'public' and tablename = 'patients'
	) then
		create policy patients_all on public.patients for all using (true) with check (true);
	end if;
	-- patient_records: allow everything
	if not exists (
		select 1 from pg_policies where policyname = 'patient_records_all' and schemaname = 'public' and tablename = 'patient_records'
	) then
		create policy patient_records_all on public.patient_records for all using (true) with check (true);
	end if;
	-- patient_ratings: allow everything
	if not exists (
		select 1 from pg_policies where policyname = 'patient_ratings_all' and schemaname = 'public' and tablename = 'patient_ratings'
	) then
		create policy patient_ratings_all on public.patient_ratings for all using (true) with check (true);
	end if;
end $$;

