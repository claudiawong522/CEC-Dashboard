-- A sent-back coffee chat is resubmitted by putting the rejected row back to
-- pending (lib/actions/coffeeChats.ts, resubmitRejected). Members cannot
-- update their own chats, since that would let them approve themselves, so
-- that one write goes through the service role. Local stacks do not grant
-- service_role table privileges by default (see 0019 and 0043), so pin the
-- two it needs here rather than relying on Supabase Cloud's defaults.
grant select, update on coffee_chats to service_role;
