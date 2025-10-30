[User] 
  ↓ ログイン(email, password)
[Next.js]
  ↓ access_tokenを取得
  ↓ Authorization: Bearer <access_token>
[Goサーバー]
  ↓ access_tokenを検証 → user_id取得
  ↓ service_roleで impersonate JWT 発行（このuser_idで）
  ↓ キャッシュ保存（1h）
  ↓ Authorization: Bearer <impersonation_jwt>
[Supabase DB (RLS)]
  ↓ auth.uid() = user_id が有効
