use axum::{
    routing::get,
    Router,
    Json,
    extract::Query,
    http::{header, Method, StatusCode, HeaderMap},
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::env;
use tower_http::cors::{CorsLayer, Any};

#[derive(Debug, Deserialize)]
struct ProfileAndPostsQuery {
    user_id: Option<String>,
    limit: Option<u32>,
    offset: Option<u32>,
}

#[derive(Debug, Serialize)]
struct ProfileAndPostsResponse {
    profile: Option<Value>,
    posts: Vec<Value>,
}

#[derive(Debug, Deserialize)]
struct ThreadAndMessagesQuery {
    thread_id: String,
    limit: Option<u32>,
    offset: Option<u32>,
}

#[derive(Debug, Serialize)]
struct ThreadAndMessagesResponse {
    thread: Option<Value>,
    messages: Vec<Value>,
}

#[tokio::main]
async fn main() {
    // 環境変数からGo APIのベースURLを取得（デフォルト: localhost:8081）
    let go_api_url = env::var("GO_API_URL").unwrap_or_else(|_| "http://localhost:8081".to_string());
    println!("📡 Go API URL: {}", go_api_url);

    // CORS設定
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);

    let app = Router::new()
        .route("/bff/health", get(health_check))
        .route("/bff/profile-and-posts", get(get_profile_and_posts))
        .route("/bff/thread-and-messages", get(get_thread_and_messages))
        .layer(cors);

    // ポートを環境変数から取得（デフォルト: 8082）
    // 開発環境: 8080, 本番環境: 8082（Go APIと分離）
    let port = env::var("BFF_PORT").unwrap_or_else(|_| "8082".to_string());
    let addr = format!("0.0.0.0:{}", port);

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .unwrap();

    println!("✅ Rust BFF running on http://{}", listener.local_addr().unwrap());

    axum::serve(listener, app)
        .await
        .unwrap();
}

async fn health_check() -> Json<serde_json::Value> {
    Json(json!({
        "status": "ok",
        "service": "rust-bff"
    }))
}

async fn get_profile_and_posts(
    headers: HeaderMap,
    Query(params): Query<ProfileAndPostsQuery>,
) -> Result<Json<ProfileAndPostsResponse>, StatusCode> {
    let client = reqwest::Client::new();
    let go_api_url = env::var("GO_API_URL").unwrap_or_else(|_| "http://localhost:8081".to_string());

    // 認証ヘッダーを取得
    let auth_header = headers.get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");

    // プロフィールAPIのURLを構築
    let profile_url = if let Some(user_id) = &params.user_id {
        format!("{}/api/profile/{}", go_api_url, user_id)
    } else {
        format!("{}/api/profile", go_api_url)
    };

    // 投稿APIのURLを構築
    let mut posts_url = format!("{}/api/posts", go_api_url);
    let mut query_params = vec![];

    if let Some(user_id) = &params.user_id {
        query_params.push(format!("author_user_id={}", user_id));
    }

    let limit = params.limit.unwrap_or(3);
    let offset = params.offset.unwrap_or(0);
    query_params.push(format!("limit={}", limit));
    query_params.push(format!("offset={}", offset));

    if !query_params.is_empty() {
        posts_url = format!("{}?{}", posts_url, query_params.join("&"));
    }

    println!("🔍 Fetching profile from: {}", profile_url);
    println!("🔍 Fetching posts from: {}", posts_url);

    // プロフィールと投稿を並列で取得（認証ヘッダー付き）
    let mut profile_req = client.get(&profile_url);
    let mut posts_req = client.get(&posts_url);

    // 認証ヘッダーがあれば追加
    if !auth_header.is_empty() {
        profile_req = profile_req.header(header::AUTHORIZATION, auth_header);
        posts_req = posts_req.header(header::AUTHORIZATION, auth_header);
    }

    let profile_fut = profile_req.send();
    let posts_fut = posts_req.send();

    let (profile_res, posts_res) = tokio::join!(profile_fut, posts_fut);

    // プロフィールの処理
    let profile: Option<Value> = match profile_res {
        Ok(res) => {
            if res.status().is_success() {
                match res.json().await {
                    Ok(data) => {
                        println!("✅ Profile fetched successfully");
                        Some(data)
                    }
                    Err(e) => {
                        eprintln!("❌ Failed to parse profile JSON: {}", e);
                        None
                    }
                }
            } else {
                eprintln!("❌ Profile API returned status: {}", res.status());
                None
            }
        }
        Err(e) => {
            eprintln!("❌ Failed to fetch profile: {}", e);
            None
        }
    };

    // 投稿の処理
    let posts: Vec<Value> = match posts_res {
        Ok(res) => {
            if res.status().is_success() {
                match res.json().await {
                    Ok(data) => {
                        println!("✅ Posts fetched successfully");
                        data
                    }
                    Err(e) => {
                        eprintln!("❌ Failed to parse posts JSON: {}", e);
                        vec![]
                    }
                }
            } else {
                eprintln!("❌ Posts API returned status: {}", res.status());
                vec![]
            }
        }
        Err(e) => {
            eprintln!("❌ Failed to fetch posts: {}", e);
            vec![]
        }
    };

    Ok(Json(ProfileAndPostsResponse { profile, posts }))
}

async fn get_thread_and_messages(
    headers: HeaderMap,
    Query(params): Query<ThreadAndMessagesQuery>,
) -> Result<Json<ThreadAndMessagesResponse>, StatusCode> {
    let client = reqwest::Client::new();
    let go_api_url = env::var("GO_API_URL").unwrap_or_else(|_| "http://localhost:8081".to_string());

    // 認証ヘッダーを取得
    let auth_header = headers.get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");

    // スレッド詳細APIのURLを構築
    let thread_url = format!("{}/api/messages/threads/{}", go_api_url, params.thread_id);

    // メッセージ一覧APIのURLを構築
    let limit = params.limit.unwrap_or(50);
    let offset = params.offset.unwrap_or(0);
    let messages_url = format!(
        "{}/api/messages/threads/{}/messages?limit={}&offset={}",
        go_api_url, params.thread_id, limit, offset
    );

    println!("🔍 Fetching thread from: {}", thread_url);
    println!("🔍 Fetching messages from: {}", messages_url);

    // スレッド詳細とメッセージを並列で取得（認証ヘッダー付き）
    let mut thread_req = client.get(&thread_url);
    let mut messages_req = client.get(&messages_url);

    // 認証ヘッダーがあれば追加
    if !auth_header.is_empty() {
        thread_req = thread_req.header(header::AUTHORIZATION, auth_header);
        messages_req = messages_req.header(header::AUTHORIZATION, auth_header);
    }

    let thread_fut = thread_req.send();
    let messages_fut = messages_req.send();

    let (thread_res, messages_res) = tokio::join!(thread_fut, messages_fut);

    // スレッド詳細の処理
    let thread: Option<Value> = match thread_res {
        Ok(res) => {
            if res.status().is_success() {
                match res.json().await {
                    Ok(data) => {
                        println!("✅ Thread fetched successfully");
                        Some(data)
                    }
                    Err(e) => {
                        eprintln!("❌ Failed to parse thread JSON: {}", e);
                        None
                    }
                }
            } else {
                eprintln!("❌ Thread API returned status: {}", res.status());
                None
            }
        }
        Err(e) => {
            eprintln!("❌ Failed to fetch thread: {}", e);
            None
        }
    };

    // メッセージの処理
    let messages: Vec<Value> = match messages_res {
        Ok(res) => {
            if res.status().is_success() {
                match res.json().await {
                    Ok(data) => {
                        println!("✅ Messages fetched successfully");
                        data
                    }
                    Err(e) => {
                        eprintln!("❌ Failed to parse messages JSON: {}", e);
                        vec![]
                    }
                }
            } else {
                eprintln!("❌ Messages API returned status: {}", res.status());
                vec![]
            }
        }
        Err(e) => {
            eprintln!("❌ Failed to fetch messages: {}", e);
            vec![]
        }
    };

    Ok(Json(ThreadAndMessagesResponse { thread, messages }))
}
