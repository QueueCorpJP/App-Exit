package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/yourusername/appexit-backend/internal/services"
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
			for key, values := range r.Header {
				for _, value := range values {
					if key == "Authorization" {
						if len(value) > 20 {
							fmt.Printf("[AUTH]   %s: %s...\n", key, value[:20])
						} else {
							fmt.Printf("[AUTH]   %s: %s\n", key, value)
						}
					} else {
						fmt.Printf("[AUTH]   %s: %s\n", key, value)
					}
				}
			}

			// Authorizationヘッダーからトークンを取得
			// 統一戦略: Authorizationヘッダーのみを使用（Cookieは使用しない）
			fmt.Printf("[AUTH] Checking for Authorization header...\n")
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				fmt.Printf("[AUTH] ❌ ERROR: Missing Authorization header\n")
				fmt.Printf("[AUTH] Checking all header keys:\n")
				for key := range r.Header {
					fmt.Printf("[AUTH]   - %s\n", key)
				}
				fmt.Printf("[AUTH] Available headers: %v\n", r.Header)
				fmt.Printf("[AUTH] Request URL: %s\n", r.URL.String())
				fmt.Printf("[AUTH] Request Method: %s\n", r.Method)
				fmt.Printf("========== AUTH MIDDLEWARE END (FAILED - Missing Auth Header) ==========\n\n")
				response.Error(w, http.StatusUnauthorized, "Missing authentication token")
				return
			}

			fmt.Printf("[AUTH] ✓ Authorization header found: %s...\n", authHeader[:min(50, len(authHeader))])

			if len(authHeader) < 8 || authHeader[:7] != "Bearer " {
				fmt.Printf("[AUTH] ❌ ERROR: Invalid Authorization header format\n")
				fmt.Printf("[AUTH] Header value: %s\n", authHeader)
				fmt.Printf("========== AUTH MIDDLEWARE END (FAILED) ==========\n\n")
				response.Error(w, http.StatusUnauthorized, "Invalid authorization header format")
				return
			}

			tokenString := authHeader[7:]
			fmt.Printf("[AUTH] ✓ Token extracted (length: %d, segments: %d)\n", len(tokenString), len(strings.Split(tokenString, ".")))

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
				fmt.Printf("[AUTH] Token string (first 100 chars): %s...\n", tokenString[:min(100, len(tokenString))])
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

			// Generate impersonate JWT for RLS operations
			fmt.Printf("[AUTH] Generating impersonate JWT for RLS operations...\n")
			impersonateJWT, err := supabaseService.GenerateImpersonateJWT(userID)
			if err != nil {
				fmt.Printf("[AUTH] ❌ ERROR: Failed to generate impersonate JWT: %v\n", err)
				fmt.Printf("========== AUTH MIDDLEWARE END (FAILED) ==========\n\n")
				response.Error(w, http.StatusInternalServerError, "Failed to generate authentication token")
				return
			}

			fmt.Printf("[AUTH] ✓ Generated impersonate JWT (length: %d)\n", len(impersonateJWT))

			// Extract user info from token and add to context (including impersonate JWT)
			ctx := context.WithValue(r.Context(), "user_id", userID)
			ctx = context.WithValue(ctx, "email", claims.Email)
			ctx = context.WithValue(ctx, "role", claims.Role)
			ctx = context.WithValue(ctx, "impersonate_jwt", impersonateJWT)
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
			// Authorizationヘッダーからトークンを取得
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

			tokenString := authHeader[7:]

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

			// Generate impersonate JWT for RLS operations
			impersonateJWT, err := supabaseService.GenerateImpersonateJWT(userID)
			if err != nil {
				// JWT生成失敗の場合もそのまま通す（ユーザーIDは設定しない）
				next(w, r)
				return
			}

			// 認証成功 - コンテキストにユーザー情報を追加
			ctx := context.WithValue(r.Context(), "user_id", userID)
			ctx = context.WithValue(ctx, "email", claims.Email)
			ctx = context.WithValue(ctx, "role", claims.Role)
			ctx = context.WithValue(ctx, "impersonate_jwt", impersonateJWT)
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
