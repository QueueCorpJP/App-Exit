package handlers

import (
	"fmt"
	"log"

	"github.com/supabase-community/supabase-go"
	"github.com/yourusername/appexit-backend/internal/models"
)

// GetProfileByUserID fetches a single profile by user ID
// Returns error if profile not found
// 🔒 SECURITY: Now accepts client as parameter to enforce RLS
func (s *Server) GetProfileByUserID(client *supabase.Client, userID string) (*models.Profile, error) {
	var profiles []models.Profile
	_, err := client.From("profiles").
		Select("*", "", false).
		Eq("id", userID).
		ExecuteTo(&profiles)

	if err != nil {
		return nil, fmt.Errorf("failed to fetch profile: %w", err)
	}

	if len(profiles) == 0 {
		return nil, fmt.Errorf("profile not found for user %s", userID)
	}

	return &profiles[0], nil
}

// GetProfilesByUserIDs fetches multiple profiles by user IDs using a single query
// Returns a map of userID -> Profile for easy lookup
// 🔒 SECURITY: Now accepts client as parameter to enforce RLS
func (s *Server) GetProfilesByUserIDs(client *supabase.Client, userIDs []string) (map[string]*models.Profile, error) {
	if len(userIDs) == 0 {
		return make(map[string]*models.Profile), nil
	}

	var profiles []models.Profile
	_, err := client.From("profiles").
		Select("*", "", false).
		In("id", userIDs).
		ExecuteTo(&profiles)

	if err != nil {
		return nil, fmt.Errorf("failed to fetch profiles: %w", err)
	}

	// Create map for O(1) lookup
	profileMap := make(map[string]*models.Profile)
	for i := range profiles {
		profileMap[profiles[i].ID] = &profiles[i]
	}

	return profileMap, nil
}

// FetchProfilesMapFromItems extracts unique user IDs from items and fetches their profiles
// This is a common pattern used in many handlers
func FetchProfilesMapFromItems[T any](client *supabase.Client, items []T, extractUserID func(T) string) (map[string]*models.Profile, error) {
	// Extract unique user IDs
	userIDSet := make(map[string]bool)
	for _, item := range items {
		userID := extractUserID(item)
		if userID != "" {
			userIDSet[userID] = true
		}
	}

	// Convert to slice
	userIDs := make([]string, 0, len(userIDSet))
	for userID := range userIDSet {
		userIDs = append(userIDs, userID)
	}

	if len(userIDs) == 0 {
		return make(map[string]*models.Profile), nil
	}

	// Fetch profiles
	var profiles []models.Profile
	_, err := client.From("profiles").
		Select("*", "", false).
		In("id", userIDs).
		ExecuteTo(&profiles)

	if err != nil {
		return nil, fmt.Errorf("failed to fetch profiles: %w", err)
	}

	// Create map
	profileMap := make(map[string]*models.Profile)
	for i := range profiles {
		profileMap[profiles[i].ID] = &profiles[i]
	}

	log.Printf("[FetchProfilesMapFromItems] Fetched %d profiles for %d items", len(profileMap), len(items))

	return profileMap, nil
}

// UniqueUserIDs extracts unique user IDs from a slice of items
func UniqueUserIDs[T any](items []T, extractUserID func(T) string) []string {
	userIDSet := make(map[string]bool)
	for _, item := range items {
		userID := extractUserID(item)
		if userID != "" {
			userIDSet[userID] = true
		}
	}

	userIDs := make([]string, 0, len(userIDSet))
	for userID := range userIDSet {
		userIDs = append(userIDs, userID)
	}

	return userIDs
}
