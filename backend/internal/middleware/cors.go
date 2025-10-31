package middleware

import (
	"fmt"
	"net/http"
)

func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Printf("\n========== CORS MIDDLEWARE START ==========\n")
		fmt.Printf("[CORS] Request: %s %s\n", r.Method, r.URL.Path)
		fmt.Printf("[CORS] Request URL: %s\n", r.URL.String())
		fmt.Printf("[CORS] Origin header: %s\n", r.Header.Get("Origin"))
		fmt.Printf("[CORS] Referer header: %s\n", r.Header.Get("Referer"))

		// フロントエンドのオリジンを取得（開発環境用）
		origin := r.Header.Get("Origin")
		if origin == "" {
			origin = "http://localhost:3000" // デフォルト
			fmt.Printf("[CORS] No Origin header found, using default: %s\n", origin)
		} else {
			fmt.Printf("[CORS] ✓ Using Origin from header: %s\n", origin)
		}

		// Set CORS headers
		// credentials: 'include'を使う場合、Access-Control-Allow-Origin: * は使えない
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		// Note: Content-Type header is not needed for multipart/form-data as browser sets it automatically
		// But we allow it for other requests
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true") // Cookieを許可
		w.Header().Set("Access-Control-Max-Age", "3600")
		fmt.Printf("[CORS] ✓ CORS headers set\n")

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
