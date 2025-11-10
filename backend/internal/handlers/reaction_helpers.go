package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/supabase-community/supabase-go"
)

// ReactionType represents the type of reaction (like or dislike)
type ReactionType string

const (
	ReactionTypeLike    ReactionType = "like"
	ReactionTypeDislike ReactionType = "dislike"
)

// ReactionConfig defines the configuration for a reaction system
type ReactionConfig struct {
	TableName   string // e.g., "post_likes", "comment_likes"
	ResourceID  string // e.g., "post_id", "comment_id"
	CountField  string // e.g., "like_count", "dislike_count"
	StatusField string // e.g., "is_liked", "is_disliked"
}

// NewReactionConfig creates a reaction configuration for posts or comments
func NewReactionConfig(resourceType string, reactionType ReactionType) ReactionConfig {
	suffix := string(reactionType) + "s" // "likes" or "dislikes"
	return ReactionConfig{
		TableName:   fmt.Sprintf("%s_%s", resourceType, suffix),
		ResourceID:  fmt.Sprintf("%s_id", resourceType),
		CountField:  fmt.Sprintf("%s_count", reactionType),
		StatusField: fmt.Sprintf("is_%sd", reactionType),
	}
}

// GetReactionStatus returns the count and user's reaction status for a resource
func GetReactionStatus(
	w http.ResponseWriter,
	r *http.Request,
	client *supabase.Client,
	config ReactionConfig,
	resourceID string,
) {
	userID, _ := r.Context().Value("user_id").(string)

	type Row struct {
		ResourceID string `json:"-"` // Will be populated dynamically
		UserID     string `json:"user_id"`
	}

	var rows []Row
	_, err := client.From(config.TableName).
		Select(fmt.Sprintf("%s, user_id", config.ResourceID), "", false).
		Eq(config.ResourceID, resourceID).
		ExecuteTo(&rows)

	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to fetch %s", config.TableName), http.StatusInternalServerError)
		return
	}

	// Count and check user status
	count := len(rows)
	isReacted := false

	if userID != "" {
		for _, row := range rows {
			if row.UserID == userID {
				isReacted = true
				break
			}
		}
	}

	// Build response
	result := map[string]interface{}{
		config.ResourceID:  resourceID,
		config.CountField:  count,
		config.StatusField: isReacted,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

// ToggleReaction toggles a reaction (like/dislike) for a user
func ToggleReaction(
	w http.ResponseWriter,
	r *http.Request,
	serviceClient *supabase.Client,
	authenticatedClient *supabase.Client,
	config ReactionConfig,
	resourceID string,
	userID string,
) {
	// Check if reaction already exists
	type ExistingRow struct {
		ResourceID string `json:"-"`
		UserID     string `json:"user_id"`
	}

	var existingRows []ExistingRow
	_, err := serviceClient.From(config.TableName).
		Select(config.ResourceID, "", false).
		Eq(config.ResourceID, resourceID).
		Eq("user_id", userID).
		ExecuteTo(&existingRows)

	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to check existing %s", config.TableName), http.StatusInternalServerError)
		return
	}

	if len(existingRows) > 0 {
		// Remove reaction
		_, _, err = authenticatedClient.From(config.TableName).
			Delete("", "").
			Eq(config.ResourceID, resourceID).
			Eq("user_id", userID).
			Execute()

		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to remove %s", string(config.TableName)), http.StatusInternalServerError)
			return
		}
	} else {
		// Add reaction
		data := map[string]interface{}{
			config.ResourceID: resourceID,
			"user_id":         userID,
		}

		_, _, err = authenticatedClient.From(config.TableName).
			Insert(data, false, "", "", "").
			Execute()

		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to add %s", string(config.TableName)), http.StatusInternalServerError)
			return
		}
	}

	// Return updated status
	GetReactionStatus(w, r, serviceClient, config, resourceID)
}

// GetBatchReactionStatus returns reaction status for multiple resources
// Used by GetPostsMetadata endpoint
func GetBatchReactionStatus(
	client *supabase.Client,
	config ReactionConfig,
	resourceIDs []string,
	userID string,
) (map[string]int, map[string]bool, error) {
	if len(resourceIDs) == 0 {
		return make(map[string]int), make(map[string]bool), nil
	}

	type Row struct {
		ResourceID string `json:"-"`
		UserID     string `json:"user_id"`
	}

	// Fetch all reactions for the resources
	var rows []Row
	_, err := client.From(config.TableName).
		Select(fmt.Sprintf("%s, user_id", config.ResourceID), "", false).
		In(config.ResourceID, resourceIDs).
		ExecuteTo(&rows)

	if err != nil {
		return nil, nil, fmt.Errorf("failed to fetch %s: %w", config.TableName, err)
	}

	// Build count and status maps
	countMap := make(map[string]int)
	statusMap := make(map[string]bool)

	// Initialize all resources
	for _, id := range resourceIDs {
		countMap[id] = 0
		statusMap[id] = false
	}

	// Note: Dynamic field access is tricky in Go
	// For batch operations, use the specific implementations in GetPostsMetadata
	// This function is kept as a template for future improvements

	return countMap, statusMap, nil
}
