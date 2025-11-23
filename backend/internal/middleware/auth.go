package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/yourusername/appexit-backend/internal/services"
	"github.com/yourusername/appexit-backend/internal/utils"
	"github.com/yourusername/appexit-backend/pkg/response"
)

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// SupabaseJWTClaims はSupabaseのJWTトークンのクレーム
type SupabaseJWTClaims struct {
	Sub   string `json:"sub"`   // ユーザーID
	Email string `json:"email"` // メールアドレス
	Role  string `json:"role"`  // ユーザーロール
	jwt.RegisteredClaims
}

func AuthWithSupabase(supabaseJWTSecret string, supabaseService *services.SupabaseService) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			fmt.Printf("\n========== AUTH MIDDLEWARE START ==========\n")
			fmt.Printf("[AUTH] Request: %s %s\n", r.Method, r.URL.Path)
			fmt.Printf("[AUTH] Request URL: %s\n", r.URL.String())
			fmt.Printf("[AUTH] Request URI: %s\n", r.RequestURI)
			fmt.Printf("[AUTH] Remote Addr: %s\n", r.RemoteAddr)
			fmt.Printf("[AUTH] Host: %s\n", r.Host)
			fmt.Printf("[AUTH] Referer: %s\n", r.Header.Get("Referer"))
			fmt.Printf("[AUTH] Origin: %s\n", r.Header.Get("Origin"))
			fmt.Printf("[AUTH] User-Agent: %s\n", r.Header.Get("User-Agent"))
			fmt.Printf("[AUTH] All Headers:\n")
			// List of sensitive headers to redact (case-insensitive)
			sensitiveHeaders := map[string]struct{}{
				"Authorization": {},
				"Cookie":        {},
				"Set-Cookie":    {},
				"X-Api-Key":     {},
				"X-Access-Token": {},
			}
			for key, values := range r.Header {
				for _, value := range values {
					if _, isSensitive := sensitiveHeaders[strings.Title(strings.ToLower(key))]; isSensitive {
						fmt.Printf("[AUTH]   %s: [REDACTED]\n", key)
					} else {
						// 値の長さのみを表示して、実際の値は出力しない（セキュリティ上の理由）
					fmt.Printf("[AUTH]   %s: [value length: %d]\n", key, len(value))
					}
				}
			}

			// トークンを取得（Cookie優先、後方互換でAuthorizationヘッダーもチェック）
			var tokenString string

			// 1. まずCookieをチェック（推奨: HttpOnly Cookieを使用）
			fmt.Printf("[AUTH] Checking for access_token cookie...\n")
			cookie, err := r.Cookie("access_token")
			if err == nil && cookie.Value != "" {
				tokenString = cookie.Value
				fmt.Printf("[AUTH] ✓ Token found in access_token cookie (length: %d)\n", len(tokenString))
			} else {
				// 1.5. access_tokenがない場合はauth_tokenもチェック（後方互換）
				fmt.Printf("[AUTH] access_token cookie not found, checking auth_token cookie...\n")
				authTokenCookie, authTokenErr := r.Cookie("auth_token")
				if authTokenErr == nil && authTokenCookie.Value != "" {
					tokenString = authTokenCookie.Value
					fmt.Printf("[AUTH] ✓ Token found in auth_token cookie (length: %d)\n", len(tokenString))
				}
			}

			// 1.6. r.Cookie()が失敗する場合は、Cookieヘッダーを手動でパース（Nginx経由の場合）
			if tokenString == "" {
				fmt.Printf("[AUTH] r.Cookie() failed, manually parsing Cookie header...\n")
				cookieHeader := r.Header.Get("Cookie")
				if cookieHeader != "" {
					fmt.Printf("[AUTH] Cookie header found (length: %d)\n", len(cookieHeader))
					// Cookie形式: "name1=value1; name2=value2; ..."
					cookies := strings.Split(cookieHeader, ";")
					for _, c := range cookies {
						c = strings.TrimSpace(c)
						parts := strings.SplitN(c, "=", 2)
						if len(parts) == 2 {
							name := strings.TrimSpace(parts[0])
							value := strings.TrimSpace(parts[1])
							if name == "access_token" && value != "" {
								tokenString = value
								fmt.Printf("[AUTH] ✓ Token found in manually parsed access_token (length: %d)\n", len(tokenString))
								break
							} else if name == "auth_token" && value != "" && tokenString == "" {
								tokenString = value
								fmt.Printf("[AUTH] ✓ Token found in manually parsed auth_token (length: %d)\n", len(tokenString))
							}
						}
					}
				}
			}

			// 2. Cookieが両方ない場合はAuthorizationヘッダーをチェック（後方互換）
			if tokenString == "" {
				fmt.Printf("[AUTH] No token found in cookies, checking Authorization header...\n")
				authHeader := r.Header.Get("Authorization")
				if authHeader == "" {
					fmt.Printf("[AUTH] ❌ ERROR: No authentication token found (neither cookie nor header)\n")
					fmt.Printf("[AUTH] Available cookies:\n")
					for _, c := range r.Cookies() {
						fmt.Printf("[AUTH]   - %s\n", c.Name)
					}
					fmt.Printf("========== AUTH MIDDLEWARE END (FAILED - Missing Auth) ==========\n\n")
					response.Error(w, http.StatusUnauthorized, "Missing authentication token")
					return
				}

				if len(authHeader) < 8 || authHeader[:7] != "Bearer " {
					fmt.Printf("[AUTH] ❌ ERROR: Invalid Authorization header format\n")
					fmt.Printf("========== AUTH MIDDLEWARE END (FAILED) ==========\n\n")
					response.Error(w, http.StatusUnauthorized, "Invalid authorization header format")
					return
				}

				tokenString = authHeader[7:]
				fmt.Printf("[AUTH] ✓ Token found in header (length: %d)\n", len(tokenString))
			}

			// メモリ効率的にトークンセグメント数をカウント（CVE-2025-30204対策）
			segmentCount := 1
			for i := 0; i < len(tokenString); i++ {
				if tokenString[i] == '.' {
					segmentCount++
				}
			}
			fmt.Printf("[AUTH] Token segments: %d\n", segmentCount)

			// CVE-2025-30204対策: トークンの構造を事前に検証（過剰なメモリ割り当てを防ぐ）
			if err := utils.ValidateJWTTokenStructure(tokenString); err != nil {
				fmt.Printf("[AUTH] ❌ ERROR: Token structure validation failed: %v\n", err)
				fmt.Printf("========== AUTH MIDDLEWARE END (FAILED) ==========\n\n")
				response.Error(w, http.StatusUnauthorized, "Invalid token format")
				return
			}

			// Verify Supabase JWT token
			fmt.Printf("[AUTH] Parsing JWT token...\n")
			token, err := jwt.ParseWithClaims(tokenString, &SupabaseJWTClaims{}, func(token *jwt.Token) (interface{}, error) {
				// SupabaseはHS256を使用
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return []byte(supabaseJWTSecret), nil
			})

			if err != nil {
				fmt.Printf("[AUTH] ❌ ERROR: Token parsing failed: %v\n", err)
				fmt.Printf("[AUTH] Token string length: %d\n", len(tokenString))
				fmt.Printf("[AUTH] JWT Secret length: %d\n", len(supabaseJWTSecret))
				fmt.Printf("========== AUTH MIDDLEWARE END (FAILED) ==========\n\n")
				response.Error(w, http.StatusUnauthorized, "Token expired or invalid. Please refresh token.")
				return
			}

			fmt.Printf("[AUTH] ✓ JWT token parsed successfully\n")

			claims, ok := token.Claims.(*SupabaseJWTClaims)
			if !ok || !token.Valid {
				fmt.Printf("[AUTH] ❌ ERROR: Invalid claims or token not valid\n")
				fmt.Printf("[AUTH] Claims OK: %v, Token Valid: %v\n", ok, token.Valid)
				fmt.Printf("========== AUTH MIDDLEWARE END (FAILED) ==========\n\n")
				response.Error(w, http.StatusUnauthorized, "Invalid token claims")
				return
			}

			userID := claims.Sub
			fmt.Printf("[AUTH] ✓ Token verified for user: %s (email: %s, role: %s)\n", userID, claims.Email, claims.Role)

			// Extract user info from token and add to context (using original access token)
			ctx := context.WithValue(r.Context(), "user_id", userID)
			ctx = context.WithValue(ctx, "email", claims.Email)
			ctx = context.WithValue(ctx, "role", claims.Role)
			ctx = context.WithValue(ctx, "access_token", tokenString)
			r = r.WithContext(ctx)

			fmt.Printf("[AUTH] ✓ Context populated with user info\n")
			fmt.Printf("========== AUTH MIDDLEWARE END (SUCCESS) ==========\n\n")

			next(w, r)
		}
	}
}

// OptionalAuthWithSupabase は認証がある場合のみ検証するミドルウェア
// 認証がない場合はそのまま通す（userIDはコンテキストに設定されない）
func OptionalAuthWithSupabase(supabaseJWTSecret string, supabaseService *services.SupabaseService) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			// トークンを取得（Cookie優先、後方互換でAuthorizationヘッダーもチェック）
			var tokenString string

			// 1. まずCookieをチェック
			cookie, err := r.Cookie("access_token")
			if err == nil && cookie.Value != "" {
				tokenString = cookie.Value
			} else {
				// 2. Cookieがない場合はAuthorizationヘッダーをチェック
				authHeader := r.Header.Get("Authorization")
				if authHeader == "" {
					// 認証なし - そのまま通す
					next(w, r)
					return
				}

				// 認証ヘッダーがある場合は検証する
				if len(authHeader) < 8 || authHeader[:7] != "Bearer " {
					// 無効なフォーマットの場合もそのまま通す（エラーにしない）
					next(w, r)
					return
				}

				tokenString = authHeader[7:]
			}

			// CVE-2025-30204対策: トークンの構造を事前に検証（過剰なメモリ割り当てを防ぐ）
			if err := utils.ValidateJWTTokenStructure(tokenString); err != nil {
				// トークンが無効な場合もそのまま通す（エラーにしない）
				next(w, r)
				return
			}

			// Verify Supabase JWT token
			token, err := jwt.ParseWithClaims(tokenString, &SupabaseJWTClaims{}, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return []byte(supabaseJWTSecret), nil
			})

			if err != nil {
				// トークンが無効な場合もそのまま通す（エラーにしない）
				next(w, r)
				return
			}

			claims, ok := token.Claims.(*SupabaseJWTClaims)
			if !ok || !token.Valid {
				// クレームが無効な場合もそのまま通す
				next(w, r)
				return
			}

			userID := claims.Sub

			// 認証成功 - コンテキストにユーザー情報を追加（オリジナルのアクセストークンを使用）
			ctx := context.WithValue(r.Context(), "user_id", userID)
			ctx = context.WithValue(ctx, "email", claims.Email)
			ctx = context.WithValue(ctx, "role", claims.Role)
			ctx = context.WithValue(ctx, "access_token", tokenString)
			r = r.WithContext(ctx)

			next(w, r)
		}
	}
}

// Auth is a convenience wrapper
// Deprecated: Use AuthWithSupabase instead
func Auth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		response.Error(w, http.StatusUnauthorized, "Auth middleware not configured properly")
	}
}
