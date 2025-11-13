package main

import (
	"log"
	"net"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/yourusername/appexit-backend/config"
	"github.com/yourusername/appexit-backend/internal/handlers"
)

func main() {
	log.Printf("\n========== SERVER STARTUP ==========\n")
	log.Printf("[MAIN] Starting server initialization...\n")

	// Load .env file from project root
	if err := godotenv.Load(".env"); err != nil {
		log.Println("[MAIN] Warning: .env file not found, using environment variables")
	} else {
		log.Println("[MAIN] ✓ .env file loaded successfully")
	}

	// Load configuration
	log.Printf("[MAIN] Loading configuration...\n")
	cfg := config.LoadConfig()
	log.Printf("[MAIN] ✓ Configuration loaded\n")
	log.Printf("[MAIN] Server Port: %s\n", cfg.ServerPort)
	log.Printf("[MAIN] Supabase URL: %s\n", cfg.SupabaseURL)
	log.Printf("[MAIN] Supabase JWT Secret length: %d\n", len(cfg.SupabaseJWTSecret))
	log.Printf("[MAIN] Running in Supabase-only mode (no direct PostgreSQL connection)\n")

	// Initialize router with Supabase service only
	log.Printf("[MAIN] Setting up routes...\n")
	router := handlers.SetupRoutes(cfg)
	log.Printf("[MAIN] ✓ Routes setup completed\n")

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = cfg.ServerPort
	}

	log.Printf("[MAIN] ✓ Server starting on port %s (IPv4 + IPv6)\n", port)
	log.Printf("========== SERVER STARTUP COMPLETE ==========\n\n")

	// Start server on both IPv4 and IPv6
	started := make(chan bool, 2)
	errChan := make(chan error, 2)

	// Start IPv4 listener
	go func() {
		ln4, err := net.Listen("tcp4", "0.0.0.0:"+port)
		if err != nil {
			log.Printf("[MAIN] ⚠️  IPv4 listener failed: %v", err)
			errChan <- err
			return
		}
		log.Printf("[MAIN] ✓ IPv4 listener started on 0.0.0.0:%s\n", port)
		started <- true
		if err := http.Serve(ln4, router); err != nil {
			log.Printf("[MAIN] ❌ IPv4 server error: %v", err)
			errChan <- err
		}
	}()

	// Start IPv6 listener
	go func() {
		ln6, err := net.Listen("tcp6", "[::]:"+port)
		if err != nil {
			log.Printf("[MAIN] ⚠️  IPv6 listener failed: %v", err)
			errChan <- err
			return
		}
		log.Printf("[MAIN] ✓ IPv6 listener started on [::]:%s\n", port)
		started <- true
		if err := http.Serve(ln6, router); err != nil {
			log.Printf("[MAIN] ❌ IPv6 server error: %v", err)
			errChan <- err
		}
	}()

	// Wait for at least one listener to start
	startedCount := 0
	for i := 0; i < 2; i++ {
		select {
		case <-started:
			startedCount++
		case err := <-errChan:
			if startedCount == 0 {
				log.Fatalf("[MAIN] ❌ Server failed to start: %v", err)
			}
		}
	}

	if startedCount == 0 {
		log.Fatalf("[MAIN] ❌ Server failed to start: no listeners could be initialized")
	}

	// Wait for servers to run (block forever until error)
	select {
	case err := <-errChan:
		log.Fatalf("[MAIN] ❌ Server error: %v", err)
	}
}
