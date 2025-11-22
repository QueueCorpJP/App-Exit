-- Add public column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public BOOLEAN DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN profiles.public IS '公式アイコンを表示するかどうかを示すフラグ';

