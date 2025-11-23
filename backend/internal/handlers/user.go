package handlers

import (
	"net/http"
	"strings"

	supabase "github.com/supabase-community/supabase-go"
	"github.com/yourusername/appexit-backend/internal/models"
	"github.com/yourusername/appexit-backend/pkg/response"
)

func (s *Server) GetUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// TODO: Fetch users from database
	users := []models.User{
		{ID: "1", Email: "user1@example.com", Name: "User One"},
		{ID: "2", Email: "user2@example.com", Name: "User Two"},
	}

	response.Success(w, http.StatusOK, users)
}

// HandleUserByIDRoute handles user profile by ID (public)
func (s *Server) HandleUserByIDRoute(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		s.GetUserByID(w, r)
	} else {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func (s *Server) GetUserByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Extract user ID from path (same pattern as HandlePostByID)
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 3 {
		response.Error(w, http.StatusBadRequest, "Invalid user ID")
		return
	}
	userID := parts[2]

	if userID == "" {
		response.Error(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	if s.supabase == nil {
		response.Error(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	// 🔒 SECURITY: Use access token if authenticated, otherwise use Anon Client to enforce RLS
	// Try to get access token from context (optional authentication)
	var client *supabase.Client
	if accessToken, ok := r.Context().Value("access_token").(string); ok && accessToken != "" {
		// Authenticated user - can see more details based on RLS policies
		client = s.supabase.GetAuthenticatedClient(accessToken)
	} else {
		// Unauthenticated user - can only see public information
		client = s.supabase.GetAnonClient()
	}

	if client == nil {
		response.Error(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	var profiles []models.Profile
	_, err := client.From("profiles").Select("*", "", false).Eq("id", userID).ExecuteTo(&profiles)
	if err != nil || len(profiles) == 0 {
		// プロフィールが存在しない場合は404エラーを返す
		response.Error(w, http.StatusNotFound, "Profile not found")
		return
	}

	// sellerのプロフィールを優先的に取得（stripe_account_idが設定されている可能性が高い）
	var profile models.Profile
	for _, p := range profiles {
		if p.Role == "seller" {
			profile = p
			break
		}
	}
	// sellerが見つからない場合は最初のプロフィールを使用
	if profile.ID == "" && len(profiles) > 0 {
		profile = profiles[0]
	}

	response.Success(w, http.StatusOK, profile)
}
