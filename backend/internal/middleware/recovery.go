package middleware

import (
	"fmt"
	"log"
	"net/http"
	"runtime/debug"

	"github.com/yourusername/appexit-backend/pkg/response"
)

// redactHeaders creates a copy of headers with sensitive values redacted
func redactHeaders(headers http.Header) http.Header {
	redacted := make(http.Header)
	sensitiveHeaders := map[string]bool{
		"Authorization": true,
		"Cookie":        true,
		"X-Api-Key":     true,
	}

	for key, values := range headers {
		if sensitiveHeaders[key] {
			redacted[key] = []string{"[REDACTED]"}
		} else {
			redacted[key] = values
		}
	}
	return redacted
}

// Recovery middleware recovers from panics and returns a proper error response
func Recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("\n========== RECOVERY MIDDLEWARE START ==========\n")
		log.Printf("[RECOVERY] Request: %s %s", r.Method, r.URL.Path)
		log.Printf("[RECOVERY] Request URL: %s", r.URL.String())
		
		defer func() {
			if err := recover(); err != nil {
				// Log the panic
				log.Printf("\n========== PANIC RECOVERED ==========\n")
				log.Printf("[PANIC] Recovered from panic: %v\n", err)
				log.Printf("[PANIC] Stack trace:\n%s\n", debug.Stack())
				
				// Log request details
				log.Printf("[PANIC] Request: %s %s\n", r.Method, r.URL.Path)
				log.Printf("[PANIC] Request URL: %s\n", r.URL.String())
				log.Printf("[PANIC] Remote Addr: %s\n", r.RemoteAddr)
				log.Printf("[PANIC] Headers: %v\n", redactHeaders(r.Header))
				
				// Check if response was already written
				if w.Header().Get("Content-Type") != "" {
					// Response already started, can't change status code
					log.Printf("[PANIC] Response already started, cannot send error response\n")
					log.Printf("========== PANIC RECOVERY END (Response Already Started) ==========\n\n")
					return
				}
				
				// Send error response
				errorMsg := fmt.Sprintf("Internal server error: %v", err)
				log.Printf("[PANIC] Sending error response: %s\n", errorMsg)
				response.Error(w, http.StatusInternalServerError, errorMsg)
				log.Printf("========== PANIC RECOVERY END ==========\n\n")
			} else {
				log.Printf("[RECOVERY] No panic occurred")
				log.Printf("========== RECOVERY MIDDLEWARE END ==========\n\n")
			}
		}()
		
		log.Printf("[RECOVERY] Calling next handler...\n")
		next.ServeHTTP(w, r)
	})
}

