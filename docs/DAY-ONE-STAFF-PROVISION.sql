-- GABA FNB Day One: execute ONLY inside verified Supabase project cdjtcvuwlwebckrfczbe
-- AFTER creating two distinct confirmed test accounts in Authentication > Users.
-- Replace exact placeholders below locally; DO NOT COMMIT REAL EMAIL ADDRESSES OR PASSWORDS.
do $$
declare
  operator_email text := 'REPLACE_WITH_CONFIRMED_TEST_OPERATOR_EMAIL';
  reviewer_email text := 'REPLACE_WITH_CONFIRMED_TEST_REVIEWER_EMAIL';
  operator_id uuid;
  reviewer_id uuid;
begin
  if operator_email like 'REPLACE_%' or reviewer_email like 'REPLACE_%' then
    raise exception 'Replace both test email placeholders before execution';
  end if;
  select id into operator_id from auth.users
   where lower(email)=lower(operator_email) and email_confirmed_at is not null;
  select id into reviewer_id from auth.users
   where lower(email)=lower(reviewer_email) and email_confirmed_at is not null;
  if operator_id is null or reviewer_id is null then
    raise exception 'One or both confirmed test users do not exist in this Supabase project';
  end if;
  if operator_id=reviewer_id then raise exception 'Operator and reviewer must be distinct users'; end if;
  insert into public.fnb_staff_roles (user_id,role)
   values (operator_id,'operator'),(reviewer_id,'demo_reviewer')
   on conflict (user_id) do update set role=excluded.role;
end $$;
-- Inspect role counts only. Do not print user email addresses or secrets.
select role, count(*) as assigned_users from public.fnb_staff_roles
 group by role order by role;
