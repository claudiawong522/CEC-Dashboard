-- 0019 gave guest_signins an admin-only write policy, which was right when the
-- only writer was the service-role sign in. The food override is different: it
-- is used by whoever is working the door, and that is an 'edit' member, not
-- necessarily an admin. Without this, setFoodClaimed passes its requireRole
-- check and is then refused by RLS, so the button does nothing.
--
-- Consistent with `attendance`, which has let edit-or-admin write since 0010 on
-- the same reasoning: recording who turned up is ordinary member work.
create policy "guest_signins_update_edit_or_admin"
  on guest_signins for update to authenticated
  using (app_user_role() in ('edit', 'admin'))
  with check (app_user_role() in ('edit', 'admin'));
