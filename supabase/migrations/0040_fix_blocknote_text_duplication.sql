-- blocknote_text() was counting every run of text twice.
--
-- 0038 derived the flat `body` column from the block document with
-- `jsonb_path_query(doc, '$.**.text')`. In lax mode, which is the default, two
-- things happen at once: `$.**` matches the `content` array as well as each
-- element inside it, and a member accessor applied to an array is silently
-- unwrapped over its elements. So `content.text` resolves to the same string
-- the more obvious `content[0].text` already found, and every run of text is
-- collected once per level.
--
-- The visible symptom was a note reading "Everyone can write here. Everyone
-- can write here." in the /brain list, and a search vector carrying every
-- phrase at double weight.
--
-- `strict` turns off the array unwrapping, which is the only part of lax mode
-- this expression was relying on by accident. Verified against an empty
-- document, a document with no text at all, and one with nested children:
-- strict mode returns no rows rather than raising for all of them.
create or replace function blocknote_text(doc jsonb)
returns text
language sql
immutable
as $$
  select coalesce(
    (
      select string_agg(node #>> '{}', ' ' order by ord)
      from jsonb_path_query(doc, 'strict $.**.text') with ordinality as parts(node, ord)
      where jsonb_typeof(node) = 'string'
    ),
    ''
  )
$$;

-- Rewrite the bodies that were derived by the old expression. The trigger from
-- 0038 fires on `update of content`, so assigning the column to itself is
-- enough to re-derive `body` and, through it, the generated search vector.
update brain_notes set content = content where content is not null;
