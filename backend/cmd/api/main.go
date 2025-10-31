package main

import (
	"log"
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

	log.Printf("[MAIN] ✓ Server starting on port %s\n", port)
	log.Printf("========== SERVER STARTUP COMPLETE ==========\n\n")

	if err := http.ListenAndServe(":"+port, router); err != nil {
		log.Fatalf("[MAIN] ❌ Server failed to start: %v", err)
	}
}
