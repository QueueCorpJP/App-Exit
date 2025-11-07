-- Fix messages and threads RLS policies
-- 
-- Ensure messages table has proper RLS policies that don't cause recursion

-- Step 1: Drop existing policies if they exist
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_delete" ON public.messages;

-- Step 2: Create new policies for messages

-- SELECT policy: Users can view messages in threads they are part of
CREATE POLICY "messages_select" 
ON public.messages
FOR SELECT
USING (
  thread_id IN (
    SELECT thread_id 
    FROM public.thread_participants 
    WHERE user_id = (select auth.uid())
  )
);

-- INSERT policy: Users can send messages to threads they are part of
CREATE POLICY "messages_insert" 
ON public.messages
FOR INSERT
WITH CHECK (
  sender_user_id = (select auth.uid())
  AND
  thread_id IN (
    SELECT thread_id 
    FROM public.thread_participants 
    WHERE user_id = (select auth.uid())
  )
);

-- DELETE policy: Users can delete their own messages
CREATE POLICY "messages_delete" 
ON public.messages
FOR DELETE
USING (
  sender_user_id = (select auth.uid())
);

-- Step 3: Fix threads policies

DROP POLICY IF EXISTS "threads_select" ON public.threads;
DROP POLICY IF EXISTS "threads_insert" ON public.threads;
DROP POLICY IF EXISTS "threads_delete" ON public.threads;

-- SELECT policy: Users can view threads they created or are part of
CREATE POLICY "threads_select" 
ON public.threads
FOR SELECT
USING (
  created_by = (select auth.uid())
  OR
  id IN (
    SELECT thread_id 
    FROM public.thread_participants 
    WHERE user_id = (select auth.uid())
  )
);

-- INSERT policy: Any authenticated user can create a thread
CREATE POLICY "threads_insert" 
ON public.threads
FOR INSERT
WITH CHECK (
  created_by = (select auth.uid())
);

-- DELETE policy: Only thread creator can delete
CREATE POLICY "threads_delete" 
ON public.threads
FOR DELETE
USING (
  created_by = (select auth.uid())
);

-- Step 4: Ensure RLS is enabled
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;

-- Step 5: Verification queries
-- SELECT * FROM pg_policies WHERE tablename IN ('messages', 'threads', 'thread_participants');

