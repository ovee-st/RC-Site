-- MXVL manual employer subscription payments.
-- Run after supabase-employer-subscriptions.sql.

alter table public.employer_subscriptions add column if not exists start_date date;
alter table public.employer_subscriptions add column if not exists expiry_date date;

create table if not exists public.subscription_payment_requests (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employers(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  coupon_id uuid references public.coupons(id) on delete set null,
  coupon_code text,
  original_amount numeric(12, 2) not null default 0,
  discount_amount numeric(12, 2) not null default 0,
  final_amount numeric(12, 2) not null default 0,
  payment_method text not null default 'bkash_manual',
  transaction_id text not null unique,
  sender_last_3_digits text not null,
  payment_screenshot text,
  status text not null default 'pending',
  submitted_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_payment_requests_status_check
    check (status in ('pending', 'approved', 'rejected', 'more_info')),
  constraint subscription_payment_requests_amounts_check
    check (original_amount >= 0 and discount_amount >= 0 and final_amount >= 0),
  constraint subscription_payment_requests_sender_digits_check
    check (sender_last_3_digits ~ '^[0-9]{3}$'),
  constraint subscription_payment_requests_transaction_format_check
    check (transaction_id ~ '^[A-Za-z0-9]{6,32}$')
);

create unique index if not exists subscription_payment_requests_one_active_plan_request
on public.subscription_payment_requests(employer_id, plan_id)
where status in ('pending', 'more_info');

create index if not exists subscription_payment_requests_employer_id_idx
on public.subscription_payment_requests(employer_id);

create index if not exists subscription_payment_requests_plan_id_idx
on public.subscription_payment_requests(plan_id);

create index if not exists subscription_payment_requests_status_idx
on public.subscription_payment_requests(status);

create table if not exists public.subscription_invoices (
  id uuid primary key default gen_random_uuid(),
  payment_request_id uuid not null references public.subscription_payment_requests(id) on delete cascade,
  employer_id uuid not null references public.employers(id) on delete cascade,
  subscription_id uuid references public.employer_subscriptions(id) on delete set null,
  invoice_number text not null unique,
  amount numeric(12, 2) not null default 0,
  status text not null default 'paid',
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint subscription_invoices_status_check check (status in ('paid', 'void'))
);

create table if not exists public.subscription_payment_approval_logs (
  id uuid primary key default gen_random_uuid(),
  payment_request_id uuid not null references public.subscription_payment_requests(id) on delete cascade,
  admin_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint subscription_payment_approval_logs_action_check
    check (action in ('approved', 'rejected', 'more_info'))
);

create table if not exists public.email_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  recipient_email text not null,
  subject text not null,
  body text not null,
  status text not null default 'queued',
  related_table text,
  related_id uuid,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  constraint email_notifications_status_check check (status in ('queued', 'sent', 'failed'))
);

alter table public.subscription_payment_requests enable row level security;
alter table public.subscription_invoices enable row level security;
alter table public.subscription_payment_approval_logs enable row level security;
alter table public.email_notifications enable row level security;

drop policy if exists "Employers can read own subscription payment requests" on public.subscription_payment_requests;
create policy "Employers can read own subscription payment requests"
on public.subscription_payment_requests
for select
to authenticated
using (
  exists (
    select 1 from public.employers
    where employers.id = subscription_payment_requests.employer_id
    and employers.user_id = auth.uid()
  )
);

drop policy if exists "Admins can manage subscription payment requests" on public.subscription_payment_requests;
create policy "Admins can manage subscription payment requests"
on public.subscription_payment_requests
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Employers can read own subscription invoices" on public.subscription_invoices;
create policy "Employers can read own subscription invoices"
on public.subscription_invoices
for select
to authenticated
using (
  exists (
    select 1 from public.employers
    where employers.id = subscription_invoices.employer_id
    and employers.user_id = auth.uid()
  )
);

drop policy if exists "Admins can manage subscription invoices" on public.subscription_invoices;
create policy "Admins can manage subscription invoices"
on public.subscription_invoices
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read subscription approval logs" on public.subscription_payment_approval_logs;
create policy "Admins can read subscription approval logs"
on public.subscription_payment_approval_logs
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage email notifications" on public.email_notifications;
create policy "Admins can manage email notifications"
on public.email_notifications
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('subscription-payment-proofs', 'subscription-payment-proofs', false)
on conflict (id) do nothing;

drop policy if exists "Authenticated users can upload own subscription proofs" on storage.objects;
create policy "Authenticated users can upload own subscription proofs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'subscription-payment-proofs'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Authenticated users can read own subscription proofs" on storage.objects;
create policy "Authenticated users can read own subscription proofs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'subscription-payment-proofs'
  and auth.uid()::text = (storage.foldername(name))[1]
);
