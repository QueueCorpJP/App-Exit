package handlers

import (
	"net/http"
	"strconv"
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

func (s *Server) GetUserByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Extract ID from path
	idStr := strings.TrimPrefix(r.URL.Path, "/api/users/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// TODO: Fetch user from database
	user := models.User{
		ID:    strconv.Itoa(id),
		Email: "user@example.com",
		Name:  "Sample User",
	}

	response.Success(w, http.StatusOK, user)
}
