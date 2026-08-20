insert into onecite.user_roles (user_id, role)
select id, 'admin'::onecite.app_role from auth.users where lower(email) in ('bora@1cite.com','bora.kurum@gmail.com')
on conflict (user_id, role) do nothing;
