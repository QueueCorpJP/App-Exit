✅ Promise.allSettled を Rust BFF に移行する手順（Next.js + Go）
🎯 目的

次のようなフロント側並列処理を…

Promise.allSettled([
  profileApi.getProfile(),
  postApi.getPosts(...)
])


Rust の BFF に移行し、

Next.js → Rust BFF → Go API


の構造に変更する。

これにより以下を実現する：

フロントのロジック削減

API 呼び出しの 1本化

将来の拡張・キャッシュ・権限管理の土台作り

Step 1. フロント側の役割を整理する

あなたの現在やっている処理：

処理	内容
①	プロフィール取得
②	自分の投稿一覧取得
③	結果をそれぞれ state に入れる

これを BFF では：

✅ 1つの API にまとめる

GET /bff/profile-and-posts


レスポンス例：

{
  "profile": {...},
  "posts": [...]
}

Step 2. Rust BFF 側の実装
Cargo.toml
[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
reqwest = { version = "0.12", features = ["json"] }

src/main.rs
use axum::{routing::get, Router, Json};
use serde_json::Value;
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/bff/profile-and-posts", get(get_profile_and_posts));

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    println!("BFF running on {}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn get_profile_and_posts() -> Json<Value> {
    let client = reqwest::Client::new();

    let profile_fut = client
        .get("http://localhost:8081/api/profile")
        .send();

    let posts_fut = client
        .get("http://localhost:8081/api/posts?limit=10&offset=0")
        .send();

    let (profile_res, posts_res) = tokio::join!(profile_fut, posts_fut);

    let profile: Option<Value> = match profile_res {
        Ok(res) => res.json().await.ok(),
        Err(_) => None,
    };

    let posts: Vec<Value> = match posts_res {
        Ok(res) => res.json().await.unwrap_or(vec![]),
        Err(_) => vec![],
    };

    Json(serde_json::json!({
        "profile": profile,
        "posts": posts
    }))
}


起動：

cargo run


アクセス：

http://localhost:8080/bff/profile-and-posts

Step 3. フロントの書き換え
Before（現在）
const [profileResult, postsResult] = await Promise.allSettled([
  profileApi.getProfile(),
  postApi.getPosts({
    author_user_id: currentUser.id,
    limit: INITIAL_POSTS,
    offset: 0
  })
]);

if (profileResult.status === 'fulfilled' && profileResult.value) {
  setProfile(profileResult.value);
}

if (postsResult.status === 'fulfilled') {
  const postsArray = Array.isArray(postsResult.value) ? postsResult.value : [];
  setPosts(postsArray);
}

After（BFF経由）
const res = await fetch("http://localhost:8080/bff/profile-and-posts");
const data = await res.json();

if (data.profile) {
  setProfile(data.profile);
}

if (Array.isArray(data.posts)) {
  setPosts(data.posts);
}


✅ 並列処理の消失
✅ エラー処理シンプル
✅ BFFにロジック集約

Step 4. 変換テンプレ（コピペ用メモ）

フロントにこの形があれば BFF にする

Promise.all(...)
Promise.allSettled(...)
useQueries(...)
複数fetch(...)


↓

Rust側にこう作る

GET /bff/〇〇
tokio::join!(...)
結果を JSON にまとめる


↓

フロントではこうする

fetch("/bff/〇〇")
setState(...)

✅ あなたのこのコードはBFF化「大成功パターン」です

これに当てはまる数が多ければ多いほど
あなたのアプリは👇

構造がきれいになる

セキュリティが上がる

事業的に強くなる

拡張しやすくなる