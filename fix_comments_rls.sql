-- Fix post_comments and comment_replies RLS policies
-- 
-- Ensure comment tables have proper RLS policies

-- Step 1: Drop existing policies if they exist
DROP POLICY IF EXISTS "post_comments_select" ON public.post_comments;
DROP POLICY IF EXISTS "post_comments_insert" ON public.post_comments;
DROP POLICY IF EXISTS "post_comments_update" ON public.post_comments;
DROP POLICY IF EXISTS "post_comments_delete" ON public.post_comments;

DROP POLICY IF EXISTS "comment_replies_select" ON public.comment_replies;
DROP POLICY IF EXISTS "comment_replies_insert" ON public.comment_replies;
DROP POLICY IF EXISTS "comment_replies_update" ON public.comment_replies;
DROP POLICY IF EXISTS "comment_replies_delete" ON public.comment_replies;

DROP POLICY IF EXISTS "comment_likes_select" ON public.comment_likes;
DROP POLICY IF EXISTS "comment_likes_insert" ON public.comment_likes;
DROP POLICY IF EXISTS "comment_likes_delete" ON public.comment_likes;

-- Step 2: Create policies for post_comments

-- SELECT: Anyone can view comments on posts
CREATE POLICY "post_comments_select" 
ON public.post_comments
FOR SELECT
USING (true);

-- INSERT: Authenticated users can comment
CREATE POLICY "post_comments_insert" 
ON public.post_comments
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
);

-- UPDATE: Users can update their own comments
CREATE POLICY "post_comments_update" 
ON public.post_comments
FOR UPDATE
USING (
  user_id = auth.uid()
);

-- DELETE: Users can delete their own comments
CREATE POLICY "post_comments_delete" 
ON public.post_comments
FOR DELETE
USING (
  user_id = auth.uid()
);

-- Step 3: Create policies for comment_replies

-- SELECT: Anyone can view replies
CREATE POLICY "comment_replies_select" 
ON public.comment_replies
FOR SELECT
USING (true);

-- INSERT: Authenticated users can reply
CREATE POLICY "comment_replies_insert" 
ON public.comment_replies
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
);

-- UPDATE: Users can update their own replies
CREATE POLICY "comment_replies_update" 
ON public.comment_replies
FOR UPDATE
USING (
  user_id = auth.uid()
);

-- DELETE: Users can delete their own replies
CREATE POLICY "comment_replies_delete" 
ON public.comment_replies
FOR DELETE
USING (
  user_id = auth.uid()
);

-- Step 4: Create policies for comment_likes

-- SELECT: Anyone can view likes
CREATE POLICY "comment_likes_select" 
ON public.comment_likes
FOR SELECT
USING (true);

-- INSERT: Users can like comments
CREATE POLICY "comment_likes_insert" 
ON public.comment_likes
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
);

-- DELETE: Users can unlike their own likes
CREATE POLICY "comment_likes_delete" 
ON public.comment_likes
FOR DELETE
USING (
  user_id = auth.uid()
);

-- Step 5: Ensure RLS is enabled
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Note: Make sure post_comments table exists. If not, create it:
-- CREATE TABLE IF NOT EXISTS public.post_comments (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   post_id uuid NOT NULL REFERENCES public.posts(id),
--   user_id uuid NOT NULL REFERENCES auth.users(id),
--   content text NOT NULL,
--   created_at timestamp with time zone NOT NULL DEFAULT now(),
--   updated_at timestamp with time zone NOT NULL DEFAULT now()
-- );

