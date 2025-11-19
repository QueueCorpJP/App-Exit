-- Create comment_reply_likes table
CREATE TABLE IF NOT EXISTS comment_reply_likes (
    reply_id UUID NOT NULL REFERENCES comment_replies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (reply_id, user_id)
);

-- Create comment_reply_dislikes table
CREATE TABLE IF NOT EXISTS comment_reply_dislikes (
    reply_id UUID NOT NULL REFERENCES comment_replies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (reply_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comment_reply_likes_reply_id ON comment_reply_likes(reply_id);
CREATE INDEX IF NOT EXISTS idx_comment_reply_likes_user_id ON comment_reply_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_reply_dislikes_reply_id ON comment_reply_dislikes(reply_id);
CREATE INDEX IF NOT EXISTS idx_comment_reply_dislikes_user_id ON comment_reply_dislikes(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE comment_reply_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reply_dislikes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment_reply_likes
CREATE POLICY "Anyone can view reply likes" ON comment_reply_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like replies" ON comment_reply_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own reply likes" ON comment_reply_likes
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for comment_reply_dislikes
CREATE POLICY "Anyone can view reply dislikes" ON comment_reply_dislikes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can dislike replies" ON comment_reply_dislikes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reply dislikes" ON comment_reply_dislikes
    FOR DELETE USING (auth.uid() = user_id);
