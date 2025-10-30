package handlers

import (
	"database/sql"
	"fmt"
	"net/http"

	"github.com/yourusername/appexit-backend/config"
	"github.com/yourusername/appexit-backend/internal/middleware"
	"github.com/yourusername/appexit-backend/internal/services"
)

type Server struct {
	db       *sql.DB
	config   *config.Config
	supabase *services.SupabaseService
}

func NewServer(db *sql.DB, cfg *config.Config) *Server {
	return &Server{
		db:       db,
		config:   cfg,
		supabase: services.NewSupabaseService(cfg),
	}
}

func SetupRoutes(db *sql.DB, cfg *config.Config) http.Handler {
	server := NewServer(db, cfg)
	mux := http.NewServeMux()

	fmt.Println("[ROUTES] Setting up routes...")

	// Create auth middleware with Supabase JWT secret and SupabaseService
	auth := middleware.AuthWithSupabase(cfg.SupabaseJWTSecret, server.supabase)

	// Health check
	mux.HandleFunc("/health", server.HealthCheck)
	fmt.Println("[ROUTES] Registered: /health")

	// Auth routes
	mux.HandleFunc("/api/auth/register", server.Register)
	mux.HandleFunc("/api/auth/login", server.Login)
	mux.HandleFunc("/api/auth/logout", server.Logout)
	mux.HandleFunc("/api/auth/session", server.CheckSession)
	mux.HandleFunc("/api/auth/refresh", server.RefreshToken)
	mux.HandleFunc("/api/auth/profile", server.HandleProfileRoute)

	// User routes (protected)
	mux.HandleFunc("/api/users", auth(server.GetUsers))
	mux.HandleFunc("/api/users/", auth(server.GetUserByID))

	// Product routes
	mux.HandleFunc("/api/products", server.HandleProducts)
	mux.HandleFunc("/api/products/", server.HandleProductByID)

	// Message routes (protected)
	mux.HandleFunc("/api/threads", auth(server.HandleThreads))
	mux.HandleFunc("/api/threads/", auth(server.HandleThreadByID))
	mux.HandleFunc("/api/messages", auth(server.HandleMessages))

	// Post routes
	mux.HandleFunc("/api/posts", server.HandlePostsRoute)
	mux.HandleFunc("/api/posts/", server.HandlePostByIDRoute)
	fmt.Println("[ROUTES] Registered: /api/posts")
	fmt.Println("[ROUTES] Registered: /api/posts/")

	// Apply global middleware
	handler := middleware.Logger(mux)
	handler = middleware.CORS(handler)

	fmt.Println("[ROUTES] All routes registered successfully")
	return handler
}

// HandlePostsRoute handles posts with conditional auth
func (s *Server) HandlePostsRoute(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("\n========== ROUTE HANDLER: /api/posts ==========\n")
	fmt.Printf("[ROUTES] Method: %s, Path: %s\n", r.Method, r.URL.Path)
	fmt.Printf("[ROUTES] Remote Addr: %s\n", r.RemoteAddr)
	fmt.Printf("[ROUTES] Content-Type: %s\n", r.Header.Get("Content-Type"))

	if r.Method == http.MethodPost {
		// POST requires authentication
		fmt.Println("[ROUTES] ✓ POST request detected - applying auth middleware")
		auth := middleware.AuthWithSupabase(s.config.SupabaseJWTSecret, s.supabase)
		auth(s.HandlePosts)(w, r)
	} else {
		// GET is public
		fmt.Println("[ROUTES] ℹ️ GET request - no auth required")
		s.HandlePosts(w, r)
	}
	fmt.Printf("========== ROUTE HANDLER END ==========\n\n")
}

// HandlePostByIDRoute handles post by ID with conditional auth
func (s *Server) HandlePostByIDRoute(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		// GET is public
		s.HandlePostByID(w, r)
	} else {
		// PUT, DELETE require authentication
		auth := middleware.AuthWithSupabase(s.config.SupabaseJWTSecret, s.supabase)
		auth(s.HandlePostByID)(w, r)
	}
}

// HandleProfileRoute handles profile with conditional auth
func (s *Server) HandleProfileRoute(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("\n========== ROUTE HANDLER: /api/auth/profile ==========\n")
	fmt.Printf("[ROUTES] Method: %s, Path: %s\n", r.Method, r.URL.Path)
	fmt.Printf("[ROUTES] Remote Addr: %s\n", r.RemoteAddr)

	// Create auth middleware
	auth := middleware.AuthWithSupabase(s.config.SupabaseJWTSecret, s.supabase)

	switch r.Method {
	case http.MethodPost:
		// POST: Create profile (requires auth)
		fmt.Println("[ROUTES] ✓ POST request - creating profile")
		auth(s.CreateProfile)(w, r)
	case http.MethodGet:
		// GET: Get profile (requires auth)
		fmt.Println("[ROUTES] ✓ GET request - retrieving profile")
		auth(s.GetProfile)(w, r)
	case http.MethodPut:
		// PUT: Update profile (requires auth)
		fmt.Println("[ROUTES] ✓ PUT request - updating profile")
		auth(s.UpdateProfile)(w, r)
	default:
		fmt.Printf("[ROUTES] ❌ Method not allowed: %s\n", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
	fmt.Printf("========== ROUTE HANDLER END ==========\n\n")
}
