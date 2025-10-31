package middleware

import (
	"log"
	"net/http"
	"time"
)

type responseWriter struct {
	http.ResponseWriter
	status int
	size   int
}

func (rw *responseWriter) WriteHeader(status int) {
	rw.status = status
	rw.ResponseWriter.WriteHeader(status)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	size, err := rw.ResponseWriter.Write(b)
	rw.size += size
	return size, err
}

func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("\n========== LOGGER MIDDLEWARE START ==========\n")
		log.Printf("[LOGGER] Request: %s %s", r.Method, r.URL.Path)
		log.Printf("[LOGGER] Full URL: %s", r.URL.String())
		log.Printf("[LOGGER] Remote Addr: %s", r.RemoteAddr)
		log.Printf("[LOGGER] Host: %s", r.Host)
		log.Printf("[LOGGER] Content-Type: %s", r.Header.Get("Content-Type"))
		log.Printf("[LOGGER] Authorization header present: %v", r.Header.Get("Authorization") != "")
		start := time.Now()

		rw := &responseWriter{
			ResponseWriter: w,
			status:         http.StatusOK,
		}

		log.Printf("[LOGGER] Calling next handler...\n")
		next.ServeHTTP(rw, r)

		duration := time.Since(start)
		log.Printf(
			"[LOGGER] %s %s %d %s %d bytes",
			r.Method,
			r.URL.Path,
			rw.status,
			duration,
			rw.size,
		)
		log.Printf("========== LOGGER MIDDLEWARE END ==========\n\n")
	})
}
