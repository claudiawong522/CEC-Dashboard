-- Everybody in the club gets to edit.
--
-- `view` was the safe default while the dashboard was being handed out, and it
-- is what every invite so far was created with. The club has since decided
-- that a member is a member: nobody should be sitting at read-only.
--
-- This moves the people who already exist. The invite form's default moves
-- with it, otherwise the next invite quietly recreates the problem.
--
-- The role itself is deliberately left in place rather than dropped from the
-- check constraint. It costs nothing to keep, and it is the obvious answer the
-- first time somebody wants an alum or an outside collaborator to be able to
-- look without touching anything.

update profiles set role = 'edit' where role = 'view';
