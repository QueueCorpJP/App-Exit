package middleware

import (
	"fmt"
	"net/http"
)

// CORSWithConfig creates a CORS middleware with allowed origins
func CORSWithConfig(allowedOrigins []string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			fmt.Printf("\n========== CORS MIDDLEWARE START ==========\n")
			fmt.Printf("[CORS] Request: %s %s\n", r.Method, r.URL.Path)
			fmt.Printf("[CORS] Request URL: %s\n", r.URL.String())
			fmt.Printf("[CORS] Origin header: %s\n", r.Header.Get("Origin"))
			fmt.Printf("[CORS] Allowed origins: %v\n", allowedOrigins)

            // リクエストのオリジンを取得
            requestOrigin := r.Header.Get("Origin")

            // オリジンが許可リストに含まれているかチェック（完全一致のみ）
            allowedOrigin := ""
            if requestOrigin != "" {
                for _, origin := range allowedOrigins {
                    if origin == requestOrigin {
                        allowedOrigin = origin
                        break
                    }
                }
            }

            // キャッシュの安全性向上
            w.Header().Add("Vary", "Origin")

            if allowedOrigin != "" {
                fmt.Printf("[CORS] ✓ Allowing origin: %s\n", allowedOrigin)
                w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
                w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
                w.Header().Set("Access-Control-Allow-Credentials", "true")
                w.Header().Set("Access-Control-Max-Age", "3600")
            } else {
                fmt.Printf("[CORS] ⚠️ Origin not allowed: %s\n", requestOrigin)
            }

			// Handle preflight requests
			if r.Method == http.MethodOptions {
				fmt.Printf("[CORS] ✓ OPTIONS request detected, returning 204\n")
				fmt.Printf("========== CORS MIDDLEWARE END (OPTIONS) ==========\n\n")
				w.WriteHeader(http.StatusNoContent)
				return
			}

			fmt.Printf("[CORS] Calling next handler...\n")
			next.ServeHTTP(w, r)
			fmt.Printf("========== CORS MIDDLEWARE END ==========\n\n")
		})
	}
}

// CORS is a legacy wrapper for backward compatibility
func CORS(next http.Handler) http.Handler {
	// デフォルトの許可オリジン
	defaultOrigins := []string{
		"http://localhost:3000",
		"http://127.0.0.1:3000",
	}
	return CORSWithConfig(defaultOrigins)(next)
}
