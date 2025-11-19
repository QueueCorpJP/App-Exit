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

	// Health check
	mux.HandleFunc("/health", server.HealthCheck)
	fmt.Println("[ROUTES] Registered: /health")

	// Auth routes (register longer paths first to avoid matching issues)
	mux.HandleFunc("/api/auth/register/step1", server.RegisterStep1)
	// 進捗確認（Cookieベース認証）
	mux.HandleFunc("/api/auth/register/progress", server.GetRegistrationProgress)
	mux.HandleFunc("/api/auth/register", server.Register)
	mux.HandleFunc("/api/auth/callback", server.HandleOAuthCallback)
	mux.HandleFunc("/api/auth/login/oauth", server.LoginWithOAuth)
	mux.HandleFunc("/api/auth/login", server.Login)
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

	// Message routes (protected)
	// 注意: より長いパスを先に登録する必要がある（http.ServeMuxの仕様）
	fmt.Println("[ROUTES] Registering message routes with auth middleware...")
	mux.HandleFunc("/api/threads", func(w http.ResponseWriter, r *http.Request) {
		fmt.Printf("\n========== ROUTER: /api/threads ==========\n")
		fmt.Printf("[ROUTER] Request received: %s %s\n", r.Method, r.URL.Path)
		fmt.Printf("[ROUTER] Full URL: %s\n", r.URL.String())
		fmt.Printf("[ROUTER] Remote Addr: %s\n", r.RemoteAddr)
		// Redact sensitive headers before logging
		safeHeaders := make(http.Header)
		for k, v := range r.Header {
			lk := strings.ToLower(k)
			if lk == "authorization" || lk == "cookie" || lk == "set-cookie" || lk == "x-api-key" {
				continue // skip sensitive header
			}
			safeHeaders[k] = v
		}
		// 本番環境ではセキュリティ上の理由でヘッダーを出力しない
		if !cfg.IsProduction() {
			fmt.Printf("[ROUTER] Headers: %v\n", safeHeaders)
		}
		fmt.Printf("[ROUTER] Calling auth middleware...\n")
		auth(server.HandleThreads)(w, r)
		fmt.Printf("========== ROUTER END ==========\n\n")
	})
	fmt.Println("[ROUTES] Registered: /api/threads (with auth)")
	mux.HandleFunc("/api/threads/", auth(server.HandleThreadByID))
	fmt.Println("[ROUTES] Registered: /api/threads/ (with auth)")
	// より長いパスを先に登録（重要: http.ServeMuxの仕様）
	mux.HandleFunc("/api/messages/upload-contract", auth(server.UploadContractDocument))
	fmt.Println("[ROUTES] Registered: /api/messages/upload-contract (with auth)")
	mux.HandleFunc("/api/messages/upload-image", auth(server.UploadMessageImage))
	fmt.Println("[ROUTES] Registered: /api/messages/upload-image (with auth)")
	mux.HandleFunc("/api/messages", auth(server.HandleMessages))
	fmt.Println("[ROUTES] Registered: /api/messages (with auth)")

	// Contract routes (protected)
	mux.HandleFunc("/api/contracts/", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if strings.HasSuffix(path, "/update") && r.Method == http.MethodPut {
			auth(server.UpdateContract)(w, r)
		} else if strings.HasSuffix(path, "/sign") && r.Method == http.MethodPost {
			auth(server.AddContractSignature)(w, r)
		} else {
			http.NotFound(w, r)
		}
	})
	fmt.Println("[ROUTES] Registered: /api/contracts/ (with auth)")

	// Sale request routes (protected)
	mux.HandleFunc("/api/sale-requests/confirm", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			auth(server.ConfirmSaleRequest)(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/sale-requests/refund", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			auth(server.RefundSaleRequest)(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/sale-requests", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			auth(server.GetSaleRequests)(w, r)
		case http.MethodPost:
			auth(server.CreateSaleRequest)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/sale-requests/verify", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			auth(server.VerifyPayment)(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	fmt.Println("[ROUTES] Registered: /api/sale-requests (with auth)")
	fmt.Println("[ROUTES] Registered: /api/sale-requests/confirm (with auth)")
	fmt.Println("[ROUTES] Registered: /api/sale-requests/refund (with auth)")
	fmt.Println("[ROUTES] Registered: /api/sale-requests/verify (with auth)")

	// Post routes
	// IMPORTANT: Register /api/posts/metadata BEFORE /api/posts/ to prevent it from being treated as an ID
	mux.HandleFunc("/api/posts/metadata", func(w http.ResponseWriter, r *http.Request) {
		// Explicitly check path to avoid ServeMux routing issues
		if r.URL.Path == "/api/posts/metadata" {
			server.HandlePostsMetadataRoute(w, r)
		} else {
			http.Error(w, "Not found", http.StatusNotFound)
		}
	})
	// Board sidebar endpoint (must be registered before /api/posts/)
	mux.HandleFunc("/api/posts/board/sidebar", server.HandleBoardSidebar)
	mux.HandleFunc("/api/posts", server.HandlePostsRoute)
	mux.HandleFunc("/api/posts/", server.HandlePostByIDRoute)
	fmt.Println("[ROUTES] Registered: /api/posts/metadata (with optional auth)")
	fmt.Println("[ROUTES] Registered: /api/posts")
	fmt.Println("[ROUTES] Registered: /api/posts/")

	// Active views routes (protected)
	mux.HandleFunc("/api/posts/active-views", func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "Invalid path", http.StatusBadRequest)
	})
	fmt.Println("[ROUTES] Registered: /api/posts/*/active-views (handled by /api/posts/)")

	// Comment routes
	mux.HandleFunc("/api/comments/", server.HandleCommentRoute)
	mux.HandleFunc("/api/replies/", auth(server.HandleReplyByID))
	fmt.Println("[ROUTES] Registered: /api/posts/*/comments (handled by /api/posts/)")
	fmt.Println("[ROUTES] Registered: /api/comments/*")
	fmt.Println("[ROUTES] Registered: /api/replies/*")
	fmt.Println("[ROUTES] Registered: /api/comments/*/likes")

	// Storage routes (protected)
	mux.HandleFunc("/api/storage/upload", auth(server.UploadFile))
	mux.HandleFunc("/api/storage/signed-url", server.GetSignedURL)      // 公開（画像表示用）
	mux.HandleFunc("/api/storage/signed-urls", server.GetSignedURLs)    // 公開（複数画像表示用）
	fmt.Println("[ROUTES] Registered: /api/storage/upload (with auth)")
	fmt.Println("[ROUTES] Registered: /api/storage/signed-url")
	fmt.Println("[ROUTES] Registered: /api/storage/signed-urls")

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
		// GET: Check if author_user_id is specified - if so, require auth
		authorUserID := r.URL.Query().Get("author_user_id")
		if authorUserID != "" {
			// author_user_id specified - require authentication
			fmt.Println("[ROUTES] ✓ GET request with author_user_id - applying auth middleware")
			auth := middleware.AuthWithSupabase(s.config.SupabaseJWTSecret, s.supabase)
			auth(s.HandlePostsWithAuth)(w, r)
		} else {
			// GET without author_user_id is public
			fmt.Println("[ROUTES] ℹ️ GET request - no auth required")
			s.HandlePosts(w, r)
		}
	}
	fmt.Printf("========== ROUTE HANDLER END ==========\n\n")
}

// HandlePostByIDRoute handles post by ID with conditional auth
func (s *Server) HandlePostByIDRoute(w http.ResponseWriter, r *http.Request) {
	// Check if path matches /api/posts/:id/comments
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")

	// Check for /api/posts/metadata (should not be handled here)
	if len(parts) >= 3 && parts[2] == "metadata" {
		s.HandlePostsMetadataRoute(w, r)
		return
	}

	// Check for /api/posts/:id/active-views
	if len(parts) >= 4 && parts[3] == "active-views" {
		auth := middleware.AuthWithSupabase(s.config.SupabaseJWTSecret, s.supabase)
		
		// Check for /api/posts/:id/active-views/status
		if len(parts) >= 5 && parts[4] == "status" {
			auth(s.HandleActiveViewStatus)(w, r)
		} else {
			// POST or DELETE /api/posts/:id/active-views
			auth(s.HandleActiveViews)(w, r)
		}
		return
	}
	
	// /api/posts/:id/likes or /api/posts/:id/dislikes
	if len(parts) >= 4 && (parts[3] == "likes" || parts[3] == "dislikes") {
		auth := middleware.AuthWithSupabase(s.config.SupabaseJWTSecret, s.supabase)
		if parts[3] == "likes" {
			if r.Method == http.MethodPost {
				auth(s.HandlePostLikes)(w, r)
			} else {
				s.HandlePostLikes(w, r)
			}
		} else {
			if r.Method == http.MethodPost {
				auth(s.HandlePostDislikes)(w, r)
			} else {
				s.HandlePostDislikes(w, r)
			}
		}
		return
	}
	
	if len(parts) >= 4 && parts[3] == "comments" {
		// This is a comment route
		auth := middleware.AuthWithSupabase(s.config.SupabaseJWTSecret, s.supabase)
		optionalAuth := middleware.OptionalAuthWithSupabase(s.config.SupabaseJWTSecret, s.supabase)
		if r.Method == http.MethodPost {
			auth(s.HandlePostComments)(w, r)
		} else {
			// GET: optional auth for user-specific like states
			optionalAuth(s.HandlePostComments)(w, r)
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
		} else if parts[3] == "dislikes" {
			// /api/comments/:id/dislikes
			auth := middleware.AuthWithSupabase(s.config.SupabaseJWTSecret, s.supabase)
			if r.Method == http.MethodPost {
				auth(s.HandleCommentDislikes)(w, r)
			} else {
				s.HandleCommentDislikes(w, r)
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

// HandlePostsMetadataRoute handles metadata with optional auth
func (s *Server) HandlePostsMetadataRoute(w http.ResponseWriter, r *http.Request) {
	// Try to get auth header, but don't fail if it's missing
	optionalAuth := middleware.OptionalAuthWithSupabase(s.config.SupabaseJWTSecret, s.supabase)
	optionalAuth(s.GetPostsMetadata)(w, r)
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
