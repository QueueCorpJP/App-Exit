package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/yourusername/appexit-backend/config"
	"github.com/yourusername/appexit-backend/internal/database"
	"github.com/yourusername/appexit-backend/internal/handlers"
)

func main() {
	// Load .env file from project root
	if err := godotenv.Load(".env"); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// Load configuration
	cfg := config.LoadConfig()

	var db *sql.DB
	var err error

	// Initialize database connection only if DATABASE_URL is provided and not using Supabase-only mode
	if cfg.DatabaseURL != "" && os.Getenv("SUPABASE_ONLY") != "true" {
		db, err = database.Connect(cfg.DatabaseURL)
		if err != nil {
			log.Printf("Warning: Failed to connect to database: %v", err)
			log.Println("Running in Supabase-only mode")
			db = nil
		} else {
			defer db.Close()
			log.Println("Database connected successfully")
		}
	} else {
		log.Println("Running in Supabase-only mode")
		db = nil
	}

	// Initialize router
	router := handlers.SetupRoutes(db, cfg)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = cfg.ServerPort
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, router); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
