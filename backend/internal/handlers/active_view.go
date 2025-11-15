package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/yourusername/appexit-backend/internal/models"
	"github.com/yourusername/appexit-backend/pkg/response"
)

// HandleActiveViews handles active view operations
func (s *Server) HandleActiveViews(w http.ResponseWriter, r *http.Request) {
	// Extract post ID from URL path
	// Expected path: /api/posts/:post_id/active-views
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 4 {
		response.Error(w, http.StatusBadRequest, "Invalid post ID")
		return
	}
	postID := parts[2]

	switch r.Method {
	case http.MethodPost:
		s.CreateActiveView(w, r, postID)
	case http.MethodDelete:
		s.DeleteActiveView(w, r, postID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// CreateActiveView creates a new active view for a post
func (s *Server) CreateActiveView(w http.ResponseWriter, r *http.Request, postID string) {
	fmt.Printf("\n========== CREATE ACTIVE VIEW ==========\n")
	fmt.Printf("[POST /api/posts/%s/active-views] Request received\n", postID)

	// Get user ID from context (set by auth middleware)
	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		fmt.Println("[CREATE ACTIVE VIEW] ❌ User ID not found in context")
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	fmt.Printf("[CREATE ACTIVE VIEW] User ID: %s\n", userID)

	// Check if post exists
	client := s.supabase.GetServiceClient()
	var posts []models.Post
	_, err := client.From("posts").
		Select("id", "", false).
		Eq("id", postID).
		ExecuteTo(&posts)

	if err != nil {
		fmt.Printf("[CREATE ACTIVE VIEW] ❌ Error checking post: %v\n", err)
		response.Error(w, http.StatusNotFound, "Post not found")
		return
	}

	if len(posts) == 0 {
		fmt.Printf("[CREATE ACTIVE VIEW] ❌ Post not found: %s\n", postID)
		response.Error(w, http.StatusNotFound, "Post not found")
		return
	}

	// Check if active view already exists
	var existingViews []models.ProductActiveView
	_, err = client.From("product_active_views").
		Select("*", "", false).
		Eq("post_id", postID).
		Eq("user_id", userID).
		ExecuteTo(&existingViews)

	if err != nil {
		fmt.Printf("[CREATE ACTIVE VIEW] ❌ Error checking existing view: %v\n", err)
		response.Error(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	if len(existingViews) > 0 {
		fmt.Println("[CREATE ACTIVE VIEW] ❌ Active view already exists")
		response.Error(w, http.StatusConflict, "既にアクティブビューに追加されています")
		return
	}

	// Insert new active view
	newView := map[string]interface{}{
		"post_id": postID,
		"user_id": userID,
	}

	var createdViews []models.ProductActiveView
	_, err = client.From("product_active_views").
		Insert(newView, false, "", "", "").
		ExecuteTo(&createdViews)

	if err != nil {
		fmt.Printf("[CREATE ACTIVE VIEW] ❌ Error creating active view: %v\n", err)
		response.Error(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	if len(createdViews) == 0 {
		fmt.Println("[CREATE ACTIVE VIEW] ❌ No active view created")
		response.Error(w, http.StatusInternalServerError, "Failed to create active view")
		return
	}

	// Get the updated count of active views for this post
	// Use minimal select to reduce data transfer (only fetch IDs)
	type CountRow struct {
		ID string `json:"id"`
	}
	var countRows []CountRow
	_, err = client.From("product_active_views").
		Select("id", "", false).
		Eq("post_id", postID).
		ExecuteTo(&countRows)

	activeViewCount := 0
	if err == nil {
		activeViewCount = len(countRows)
	}

	fmt.Printf("[CREATE ACTIVE VIEW] ✓ Successfully created active view (new count: %d)\n", activeViewCount)
	fmt.Printf("========== CREATE ACTIVE VIEW END ==========\n\n")

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":           true,
		"message":           "アクティブビューを追加しました",
		"data":              createdViews[0],
		"active_view_count": activeViewCount,
	})
}

// DeleteActiveView deletes an active view for a post
func (s *Server) DeleteActiveView(w http.ResponseWriter, r *http.Request, postID string) {
	fmt.Printf("\n========== DELETE ACTIVE VIEW ==========\n")
	fmt.Printf("[DELETE /api/posts/%s/active-views] Request received\n", postID)

	// Get user ID from context (set by auth middleware)
	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		fmt.Println("[DELETE ACTIVE VIEW] ❌ User ID not found in context")
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	fmt.Printf("[DELETE ACTIVE VIEW] User ID: %s\n", userID)

	// Check if active view exists
	client := s.supabase.GetServiceClient()
	var existingViews []models.ProductActiveView
	_, err := client.From("product_active_views").
		Select("*", "", false).
		Eq("post_id", postID).
		Eq("user_id", userID).
		ExecuteTo(&existingViews)

	if err != nil {
		fmt.Printf("[DELETE ACTIVE VIEW] ❌ Error checking existing view: %v\n", err)
		response.Error(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	if len(existingViews) == 0 {
		fmt.Println("[DELETE ACTIVE VIEW] ❌ Active view not found")
		response.Error(w, http.StatusNotFound, "アクティブビューが見つかりません")
		return
	}

	// Delete active view
	var deletedViews []models.ProductActiveView
	_, err = client.From("product_active_views").
		Delete("", "").
		Eq("post_id", postID).
		Eq("user_id", userID).
		ExecuteTo(&deletedViews)

	if err != nil {
		fmt.Printf("[DELETE ACTIVE VIEW] ❌ Error deleting active view: %v\n", err)
		response.Error(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	// Get the updated count of active views for this post
	// Use minimal select to reduce data transfer (only fetch IDs)
	type CountRow struct {
		ID string `json:"id"`
	}
	var countRows []CountRow
	_, err = client.From("product_active_views").
		Select("id", "", false).
		Eq("post_id", postID).
		ExecuteTo(&countRows)

	activeViewCount := 0
	if err == nil {
		activeViewCount = len(countRows)
	}

	fmt.Printf("[DELETE ACTIVE VIEW] ✓ Successfully deleted active view (new count: %d)\n", activeViewCount)
	fmt.Printf("========== DELETE ACTIVE VIEW END ==========\n\n")

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":           true,
		"message":           "アクティブビューを削除しました",
		"active_view_count": activeViewCount,
	})
}

// GetActiveViewStatus checks if the current user has an active view on a post
func (s *Server) GetActiveViewStatus(w http.ResponseWriter, r *http.Request, postID string) {
	fmt.Printf("\n========== GET ACTIVE VIEW STATUS ==========\n")
	fmt.Printf("[GET /api/posts/%s/active-views/status] Request received\n", postID)

	// Get user ID from context (set by auth middleware)
	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		fmt.Println("[GET ACTIVE VIEW STATUS] ❌ User ID not found in context")
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	fmt.Printf("[GET ACTIVE VIEW STATUS] User ID: %s\n", userID)

	// Check if active view exists
	client := s.supabase.GetServiceClient()
	var existingViews []models.ProductActiveView
	_, err := client.From("product_active_views").
		Select("id", "", false).
		Eq("post_id", postID).
		Eq("user_id", userID).
		ExecuteTo(&existingViews)

	if err != nil {
		fmt.Printf("[GET ACTIVE VIEW STATUS] ❌ Error checking status: %v\n", err)
		response.Error(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	isActive := len(existingViews) > 0

	fmt.Printf("[GET ACTIVE VIEW STATUS] ✓ Status: %v\n", isActive)
	fmt.Printf("========== GET ACTIVE VIEW STATUS END ==========\n\n")

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"is_active": isActive,
		},
	})
}

// HandleActiveViewStatus handles status check for active views
func (s *Server) HandleActiveViewStatus(w http.ResponseWriter, r *http.Request) {
	// Extract post ID from URL path
	// Expected path: /api/posts/:post_id/active-views/status
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 4 {
		response.Error(w, http.StatusBadRequest, "Invalid post ID")
		return
	}
	postID := parts[2]

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	s.GetActiveViewStatus(w, r, postID)
}

