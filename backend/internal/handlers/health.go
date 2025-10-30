package handlers

import (
	"net/http"

	"github.com/yourusername/appexit-backend/pkg/response"
)

func (s *Server) HealthCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	health := map[string]interface{}{
		"status":  "healthy",
		"message": "Server is running",
	}

	response.Success(w, http.StatusOK, health)
}
