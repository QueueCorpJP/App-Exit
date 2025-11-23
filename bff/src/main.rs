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
use tower_http::cors::CorsLayer;

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
struct ApiResponse {
    success: bool,
    data: Value,
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
    // .envファイルを読み込む
    dotenv::dotenv().ok();

    // 環境変数からGo APIのベースURLを取得（デフォルト: localhost:8080）
    let go_api_url = env::var("GO_API_URL").unwrap_or_else(|_| "http://localhost:8080".to_string());
    println!("📡 Go API URL: {}", go_api_url);

    // 環境変数から許可するオリジンを取得（デフォルト: localhost:3000）
    let allowed_origin = env::var("ALLOWED_ORIGIN")
        .unwrap_or_else(|_| "http://localhost:3000".to_string());
    println!("🔒 Allowed Origin: {}", allowed_origin);

    // CORS設定
    let cors = CorsLayer::new()
        .allow_origin(allowed_origin.parse::<axum::http::HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION, header::COOKIE])
        .allow_credentials(true);

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
    println!("\n========== NEW REQUEST ==========");
    println!("📥 Endpoint: /bff/profile-and-posts");
    println!("📋 User-Agent: {:?}", headers.get(header::USER_AGENT));
    println!("📋 Referer: {:?}", headers.get(header::REFERER));
    println!("📋 Origin: {:?}", headers.get(header::ORIGIN));

    let client = reqwest::Client::new();
    let go_api_url = env::var("GO_API_URL").unwrap_or_else(|_| "http://localhost:8080".to_string());

    // 認証ヘッダーを取得
    let auth_header = headers.get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");
    println!("🔑 Authorization header present: {}", !auth_header.is_empty());

    // Cookieヘッダーを取得（Go APIはCookie優先）
    let cookie_header = headers.get(header::COOKIE)
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");
    println!("🍪 Cookie header present: {}", !cookie_header.is_empty());
    if !cookie_header.is_empty() {
        // Cookie内容を簡略表示（セキュリティのため値は非表示）
        let cookies: Vec<&str> = cookie_header.split(';').map(|s| s.trim().split('=').next().unwrap_or("")).collect();
        println!("🍪 Cookie names: {:?}", cookies);
    }

    // プロフィールAPIのURLを構築
    let profile_url = if let Some(user_id) = &params.user_id {
        format!("{}/api/users/{}", go_api_url, user_id)
    } else {
        format!("{}/api/auth/profile", go_api_url)
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

    // プロフィールと投稿を並列で取得（認証ヘッダー・Cookie付き）
    let mut profile_req = client.get(&profile_url);
    let mut posts_req = client.get(&posts_url);

    // Cookieがあれば追加（Go APIはCookie優先）
    if !cookie_header.is_empty() {
        profile_req = profile_req.header(header::COOKIE, cookie_header);
        posts_req = posts_req.header(header::COOKIE, cookie_header);
    }

    // 認証ヘッダーがあれば追加（後方互換）
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
            let status = res.status();
            if status.is_success() {
                match res.text().await {
                    Ok(text) => {
                        println!("📄 Profile response body (first 300 chars): {}",
                            if text.len() > 300 { &text[..300] } else { &text });

                        // Go APIの標準レスポンス形式をパース
                        match serde_json::from_str::<ApiResponse>(&text) {
                            Ok(api_response) => {
                                if api_response.success {
                                    println!("✅ Profile fetched successfully");
                                    Some(api_response.data)
                                } else {
                                    eprintln!("⚠️ Profile API returned success=false");
                                    None
                                }
                            }
                            Err(e) => {
                                eprintln!("❌ Failed to parse profile JSON: {}", e);
                                eprintln!("📄 Full response: {}", text);
                                None
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("❌ Failed to read profile response body: {}", e);
                        None
                    }
                }
            } else {
                eprintln!("❌ Profile API returned status: {}", status);
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
            let status = res.status();
            if status.is_success() {
                // レスポンスボディをテキストとして取得してログ出力
                match res.text().await {
                    Ok(text) => {
                        println!("📄 Posts response body (first 500 chars): {}",
                            if text.len() > 500 { &text[..500] } else { &text });

                        // JSONとしてパース - Go APIの標準レスポンス形式 {"success":true,"data":[...]}
                        match serde_json::from_str::<ApiResponse>(&text) {
                            Ok(api_response) => {
                                if api_response.success {
                                    // dataフィールドが配列の場合
                                    if let Some(posts_array) = api_response.data.as_array() {
                                        println!("✅ Posts fetched successfully (count: {})", posts_array.len());
                                        posts_array.clone()
                                    } else {
                                        eprintln!("⚠️ Posts data is not an array");
                                        vec![]
                                    }
                                } else {
                                    eprintln!("⚠️ Posts API returned success=false");
                                    vec![]
                                }
                            }
                            Err(e) => {
                                eprintln!("❌ Failed to parse posts JSON: {}", e);
                                eprintln!("📄 Full response: {}", text);
                                vec![]
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("❌ Failed to read posts response body: {}", e);
                        vec![]
                    }
                }
            } else {
                eprintln!("❌ Posts API returned status: {}", status);
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
    let go_api_url = env::var("GO_API_URL").unwrap_or_else(|_| "http://localhost:8080".to_string());

    // 認証ヘッダーを取得
    let auth_header = headers.get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");

    // Cookieヘッダーを取得（Go APIはCookie優先）
    let cookie_header = headers.get(header::COOKIE)
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

    // スレッド詳細とメッセージを並列で取得（認証ヘッダー・Cookie付き）
    let mut thread_req = client.get(&thread_url);
    let mut messages_req = client.get(&messages_url);

    // Cookieがあれば追加（Go APIはCookie優先）
    if !cookie_header.is_empty() {
        thread_req = thread_req.header(header::COOKIE, cookie_header);
        messages_req = messages_req.header(header::COOKIE, cookie_header);
    }

    // 認証ヘッダーがあれば追加（後方互換）
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
            let status = res.status();
            if status.is_success() {
                match res.text().await {
                    Ok(text) => {
                        println!("📄 Thread response body (first 300 chars): {}",
                            if text.len() > 300 { &text[..300] } else { &text });

                        // Go APIの標準レスポンス形式をパース
                        match serde_json::from_str::<ApiResponse>(&text) {
                            Ok(api_response) => {
                                if api_response.success {
                                    println!("✅ Thread fetched successfully");
                                    Some(api_response.data)
                                } else {
                                    eprintln!("⚠️ Thread API returned success=false");
                                    None
                                }
                            }
                            Err(e) => {
                                eprintln!("❌ Failed to parse thread JSON: {}", e);
                                eprintln!("📄 Full response: {}", text);
                                None
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("❌ Failed to read thread response body: {}", e);
                        None
                    }
                }
            } else {
                eprintln!("❌ Thread API returned status: {}", status);
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
            let status = res.status();
            if status.is_success() {
                match res.text().await {
                    Ok(text) => {
                        println!("📄 Messages response body (first 500 chars): {}",
                            if text.len() > 500 { &text[..500] } else { &text });

                        // Go APIの標準レスポンス形式をパース
                        match serde_json::from_str::<ApiResponse>(&text) {
                            Ok(api_response) => {
                                if api_response.success {
                                    // dataフィールドが配列の場合
                                    if let Some(messages_array) = api_response.data.as_array() {
                                        println!("✅ Messages fetched successfully (count: {})", messages_array.len());
                                        messages_array.clone()
                                    } else {
                                        eprintln!("⚠️ Messages data is not an array");
                                        vec![]
                                    }
                                } else {
                                    eprintln!("⚠️ Messages API returned success=false");
                                    vec![]
                                }
                            }
                            Err(e) => {
                                eprintln!("❌ Failed to parse messages JSON: {}", e);
                                eprintln!("📄 Full response: {}", text);
                                vec![]
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("❌ Failed to read messages response body: {}", e);
                        vec![]
                    }
                }
            } else {
                eprintln!("❌ Messages API returned status: {}", status);
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
