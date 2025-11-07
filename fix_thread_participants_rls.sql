-- Fix thread_participants RLS policies to prevent infinite recursion
-- 
-- Issue: Infinite recursion detected in policy for relation "thread_participants"
-- Cause: RLS policies were likely checking thread_participants table within their own policy
--
-- Solution: Use simpler, non-recursive policies

-- Step 1: Drop existing policies if they exist
DROP POLICY IF EXISTS "thread_participants_select" ON public.thread_participants;
DROP POLICY IF EXISTS "thread_participants_insert" ON public.thread_participants;
DROP POLICY IF EXISTS "thread_participants_delete" ON public.thread_participants;

-- Step 2: Create new non-recursive policies

-- SELECT policy: Users can view participants of threads they are part of
-- Simple check: either the user_id matches auth.uid() OR the user is the thread creator
CREATE POLICY "thread_participants_select" 
ON public.thread_participants
FOR SELECT
USING (
  user_id = (select auth.uid())
  OR
  thread_id IN (
    SELECT id FROM public.threads WHERE created_by = (select auth.uid())
  )
);

-- INSERT policy: Allow service role to insert any participant
-- Regular users can only insert themselves as participants in threads they created
CREATE POLICY "thread_participants_insert" 
ON public.thread_participants
FOR INSERT
WITH CHECK (
  -- Service role can insert anyone (for thread creation)
  auth.jwt() ->> 'role' = 'service_role'
  OR
  -- Regular users can only add themselves to threads they created
  (
    user_id = (select auth.uid())
    AND
    thread_id IN (
      SELECT id FROM public.threads WHERE created_by = (select auth.uid())
    )
  )
);

-- DELETE policy: Users can leave threads (delete their own participation)
-- Thread creators can remove any participant
CREATE POLICY "thread_participants_delete" 
ON public.thread_participants
FOR DELETE
USING (
  user_id = (select auth.uid())
  OR
  thread_id IN (
    SELECT id FROM public.threads WHERE created_by = (select auth.uid())
  )
);

-- Step 3: Ensure RLS is enabled
ALTER TABLE public.thread_participants ENABLE ROW LEVEL SECURITY;

-- Step 4: Verification queries (run these to check the policies)
-- SELECT * FROM pg_policies WHERE tablename = 'thread_participants';

