package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/yourusername/appexit-backend/config"
	"github.com/yourusername/appexit-backend/internal/middleware"
	"github.com/yourusername/appexit-backend/internal/services"
)

type Server struct {
	config   *config.Config
	supabase *services.SupabaseService
}

func NewServer(cfg *config.Config) *Server {
	return &Server{
		config:   cfg,
		supabase: services.NewSupabaseService(cfg),
	}
}

func SetupRoutes(cfg *config.Config) http.Handler {
	server := NewServer(cfg)
	mux := http.NewServeMux()

	fmt.Println("[ROUTES] Setting up routes...")

	// Create auth middleware with Supabase JWT secret and SupabaseService (will be recreated as needed)

	// Health check
	mux.HandleFunc("/health", server.HealthCheck)
	fmt.Println("[ROUTES] Registered: /health")

	// Auth routes
	mux.HandleFunc("/api/auth/register", server.Register)
	mux.HandleFunc("/api/auth/register/step1", server.RegisterStep1)
	// 進捗確認（Cookieベース認証）
	mux.HandleFunc("/api/auth/register/progress", server.GetRegistrationProgress)
	mux.HandleFunc("/api/auth/login", server.Login)
	mux.HandleFunc("/api/auth/login/oauth", server.LoginWithOAuth)
	mux.HandleFunc("/api/auth/logout", server.Logout)
	mux.HandleFunc("/api/auth/session", server.CheckSession)
	mux.HandleFunc("/api/auth/refresh", server.RefreshToken)
	mux.HandleFunc("/api/auth/profile", server.HandleProfileRoute)

	// Create auth middleware with Supabase JWT secret and SupabaseService
	auth := middleware.AuthWithSupabase(cfg.SupabaseJWTSecret, server.supabase)

	mux.HandleFunc("/api/auth/register/step2", auth(server.RegisterStep2))
	mux.HandleFunc("/api/auth/register/step3", auth(server.RegisterStep3))
	mux.HandleFunc("/api/auth/register/step4", auth(server.RegisterStep4))
	mux.HandleFunc("/api/auth/register/step5", auth(server.RegisterStep5))

	// User routes (must be registered AFTER /api/auth/profile to avoid matching conflicts)
	mux.HandleFunc("/api/users", auth(server.GetUsers))       // List users (protected)
	mux.HandleFunc("/api/users/", server.HandleUserByIDRoute) // Get user profile by ID (public)

	// User links routes
	mux.HandleFunc("/api/user-links", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			server.GetUserLinks(w, r)
		case http.MethodPost:
			auth(server.CreateUserLink)(w, r)
		case http.MethodPut:
			auth(server.UpdateUserLink)(w, r)
		case http.MethodDelete:
			auth(server.DeleteUserLink)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	fmt.Println("[ROUTES] Registered: /api/user-links")

	// Product routes
	mux.HandleFunc("/api/products", server.HandleProducts)
	mux.HandleFunc("/api/products/", server.HandleProductByID)

	// Message routes (protected)
	fmt.Println("[ROUTES] Registering message routes with auth middleware...")
	mux.HandleFunc("/api/threads", func(w http.ResponseWriter, r *http.Request) {
		fmt.Printf("\n========== ROUTER: /api/threads ==========\n")
		fmt.Printf("[ROUTER] Request received: %s %s\n", r.Method, r.URL.Path)
		fmt.Printf("[ROUTER] Full URL: %s\n", r.URL.String())
		fmt.Printf("[ROUTER] Remote Addr: %s\n", r.RemoteAddr)
		fmt.Printf("[ROUTER] Headers: %v\n", r.Header)
		fmt.Printf("[ROUTER] Calling auth middleware...\n")
		auth(server.HandleThreads)(w, r)
		fmt.Printf("========== ROUTER END ==========\n\n")
	})
	fmt.Println("[ROUTES] Registered: /api/threads (with auth)")
	mux.HandleFunc("/api/threads/", auth(server.HandleThreadByID))
	fmt.Println("[ROUTES] Registered: /api/threads/ (with auth)")
	mux.HandleFunc("/api/messages", auth(server.HandleMessages))
	fmt.Println("[ROUTES] Registered: /api/messages (with auth)")
	mux.HandleFunc("/api/messages/upload-image", auth(server.UploadMessageImage))
	fmt.Println("[ROUTES] Registered: /api/messages/upload-image (with auth)")

	// Post routes
	mux.HandleFunc("/api/posts", server.HandlePostsRoute)
	mux.HandleFunc("/api/posts/", server.HandlePostByIDRoute)
	fmt.Println("[ROUTES] Registered: /api/posts")
	fmt.Println("[ROUTES] Registered: /api/posts/")

	// Comment routes
	mux.HandleFunc("/api/comments/", server.HandleCommentRoute)
	mux.HandleFunc("/api/replies/", auth(server.HandleReplyByID))
	fmt.Println("[ROUTES] Registered: /api/posts/*/comments (handled by /api/posts/)")
	fmt.Println("[ROUTES] Registered: /api/comments/*")
	fmt.Println("[ROUTES] Registered: /api/replies/*")
	fmt.Println("[ROUTES] Registered: /api/comments/*/likes")

	// Apply global middleware (order matters: Recovery -> CORS -> Logger)
	handler := middleware.Recovery(mux)
	handler = middleware.CORSWithConfig(cfg.AllowedOrigins)(handler)
	handler = middleware.Logger(handler)

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
	// Check if path matches /api/posts/:id/comments
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) >= 4 && parts[3] == "comments" {
		// This is a comment route
		auth := middleware.AuthWithSupabase(s.config.SupabaseJWTSecret, s.supabase)
		if r.Method == http.MethodPost {
			auth(s.HandlePostComments)(w, r)
		} else {
			s.HandlePostComments(w, r)
		}
		return
	}

	// Regular post route
	if r.Method == http.MethodGet {
		// GET is public
		s.HandlePostByID(w, r)
	} else {
		// PUT, DELETE require authentication
		auth := middleware.AuthWithSupabase(s.config.SupabaseJWTSecret, s.supabase)
		auth(s.HandlePostByID)(w, r)
	}
}

// HandleCommentRoute handles comment routes
func (s *Server) HandleCommentRoute(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) >= 4 {
		if parts[3] == "replies" {
			// /api/comments/:id/replies
			auth := middleware.AuthWithSupabase(s.config.SupabaseJWTSecret, s.supabase)
			if r.Method == http.MethodPost {
				auth(s.HandleCommentReplies)(w, r)
			} else {
				s.HandleCommentReplies(w, r)
			}
		} else if parts[3] == "likes" {
			// /api/comments/:id/likes
			auth := middleware.AuthWithSupabase(s.config.SupabaseJWTSecret, s.supabase)
			if r.Method == http.MethodPost {
				auth(s.HandleCommentLikes)(w, r)
			} else {
				s.HandleCommentLikes(w, r)
			}
		} else {
			http.Error(w, "Invalid path", http.StatusBadRequest)
		}
	} else {
		// /api/comments/:id
		auth := middleware.AuthWithSupabase(s.config.SupabaseJWTSecret, s.supabase)
		if r.Method == http.MethodGet {
			s.HandleCommentByID(w, r)
		} else {
			auth(s.HandleCommentByID)(w, r)
		}
	}
}

// HandleProfileRoute handles profile with conditional auth
func (s *Server) HandleProfileRoute(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("\n========== ROUTE HANDLER: /api/auth/profile ==========\n")
	fmt.Printf("[ROUTES] Method: %s, Path: %s\n", r.Method, r.URL.Path)
	fmt.Printf("[ROUTES] Remote Addr: %s\n", r.RemoteAddr)
	fmt.Printf("[ROUTES] Request URL: %s\n", r.URL.String())
	fmt.Printf("[ROUTES] Request URI: %s\n", r.RequestURI)
	fmt.Printf("[ROUTES] Full URL: %s\n", r.URL.String())

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
