package handlers

import (
	"net/http"
	"strings"

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

	// Fetch profile from Supabase using service role key (public read)
	client := s.supabase.GetServiceClient()
	if client == nil {
		response.Error(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	var profile models.Profile
	_, err := client.From("profiles").Select("*", "", false).Eq("id", userID).Single().ExecuteTo(&profile)
	if err != nil {
		// プロフィールが存在しない場合は正常なレスポンスとしてnullを返す
		response.Success(w, http.StatusOK, nil)
		return
	}

	response.Success(w, http.StatusOK, profile)
}
