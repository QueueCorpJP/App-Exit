package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/appexit-backend/internal/models"
	"github.com/yourusername/appexit-backend/internal/utils"
	"github.com/yourusername/appexit-backend/pkg/response"
)

// parseTime converts ISO8601 string to time.Time
func parseTime(timeStr string) time.Time {
	t, _ := time.Parse(time.RFC3339, timeStr)
	return t
}

// Common struct types used across message handlers
type (
	threadRow struct {
		ID            string  `json:"id"`
		CreatedBy     string  `json:"created_by"`
		RelatedPostID *string `json:"related_post_id"`
		CreatedAt     string  `json:"created_at"`
	}

	participantRow struct {
		ThreadID string `json:"thread_id"`
		UserID   string `json:"user_id"`
	}

	participantCheck struct {
		UserID string `json:"user_id"`
	}

	participantRowSimple struct {
		UserID string `json:"user_id"`
	}

	participantInsert struct {
		ThreadID string `json:"thread_id"`
		UserID   string `json:"user_id"`
	}

	profileRow struct {
		ID                string  `json:"id"`
		Role              string  `json:"role"`
		Party             string  `json:"party"`
		DisplayName       string  `json:"display_name"`
		IconURL           *string `json:"icon_url"`
		NDAFlag           bool    `json:"nda_flag"`
		TermsAcceptedAt   *string `json:"terms_accepted_at"`
		PrivacyAcceptedAt *string `json:"privacy_accepted_at"`
		StripeCustomerID  *string `json:"stripe_customer_id"`
		CreatedAt         string  `json:"created_at"`
		UpdatedAt         string  `json:"updated_at"`
	}

	profileRowSimple struct {
		ID          string  `json:"id"`
		DisplayName string  `json:"display_name"`
		IconURL     *string `json:"icon_url"`
	}

	messageRow struct {
		ID           string  `json:"id"`
		ThreadID     string  `json:"thread_id"`
		SenderUserID string  `json:"sender_user_id"`
		Type         string  `json:"type"`
		Text         *string `json:"text"`
		CreatedAt    string  `json:"created_at"`
	}

	attachmentRow struct {
		MessageID string `json:"message_id"`
		FileURL   string `json:"file_url"`
	}

	messageInsert struct {
		ThreadID     string  `json:"thread_id"`
		SenderUserID string  `json:"sender_user_id"`
		Type         string  `json:"type"`
		Text         *string `json:"text"`
	}

	messageResponse struct {
		ID           string  `json:"id"`
		ThreadID     string  `json:"thread_id"`
		SenderUserID string  `json:"sender_user_id"`
		Type         string  `json:"type"`
		Text         *string `json:"text"`
		CreatedAt    string  `json:"created_at"`
	}

	threadInsert struct {
		CreatedBy     string  `json:"created_by"`
		RelatedPostID *string `json:"related_post_id"`
	}

	threadResponse struct {
		ID            string  `json:"id"`
		CreatedBy     string  `json:"created_by"`
		RelatedPostID *string `json:"related_post_id"`
		CreatedAt     string  `json:"created_at"`
	}
)

// buildProfilesFromRows converts profileRow slice to models.Profile slice with signed URLs
func (s *Server) buildProfilesFromRows(rows []profileRow, signedURLMap map[string]string) []models.Profile {
	log.Printf("[buildProfilesFromRows] Processing %d profiles, signedURLMap has %d entries", len(rows), len(signedURLMap))
	var profiles []models.Profile
	for _, row := range rows {
		var termsAcceptedAt, privacyAcceptedAt *time.Time
		if row.TermsAcceptedAt != nil {
			t := parseTime(*row.TermsAcceptedAt)
			termsAcceptedAt = &t
		}
		if row.PrivacyAcceptedAt != nil {
			t := parseTime(*row.PrivacyAcceptedAt)
			privacyAcceptedAt = &t
		}

		var iconURL *string
		if row.IconURL != nil && *row.IconURL != "" {
			log.Printf("[buildProfilesFromRows] Profile %s: icon_url in DB = %s", row.ID, *row.IconURL)
			if signedURL, ok := signedURLMap[*row.IconURL]; ok {
				log.Printf("[buildProfilesFromRows] Profile %s: Found signed URL = %s", row.ID, signedURL)
				iconURL = &signedURL
			} else {
				log.Printf("[buildProfilesFromRows] Profile %s: No signed URL found, using original path", row.ID)
				iconURL = row.IconURL
			}
		}

		profiles = append(profiles, models.Profile{
			ID:                row.ID,
			Role:              row.Role,
			Party:             row.Party,
			DisplayName:       row.DisplayName,
			IconURL:           iconURL,
			NDAFlag:           row.NDAFlag,
			TermsAcceptedAt:   termsAcceptedAt,
			PrivacyAcceptedAt: privacyAcceptedAt,
			StripeCustomerID:  row.StripeCustomerID,
			CreatedAt:         parseTime(row.CreatedAt),
			UpdatedAt:         parseTime(row.UpdatedAt),
		})
	}
	return profiles
}

// HandleThreads routes thread requests
func (s *Server) HandleThreads(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.GetThreads(w, r)
	case http.MethodPost:
		s.CreateThread(w, r)
	default:
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// HandleThreadByID routes thread by ID requests
func (s *Server) HandleThreadByID(w http.ResponseWriter, r *http.Request) {
	// Check if this is a contract documents request
	if strings.HasSuffix(r.URL.Path, "/contracts") {
		if r.Method == http.MethodGet {
			s.GetThreadContractDocuments(w, r)
		} else {
			response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
		return
	}

	switch r.Method {
	case http.MethodGet:
		s.GetThreadByID(w, r)
	default:
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// HandleMessages routes message requests
func (s *Server) HandleMessages(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.GetMessages(w, r)
	case http.MethodPost:
		s.SendMessage(w, r)
	default:
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// CreateThread creates a new conversation thread
func (s *Server) CreateThread(w http.ResponseWriter, r *http.Request) {
	userID, ok := utils.RequireUserID(r, w)
	if !ok {
		return
	}

	var req models.CreateThreadRequest
	if !utils.DecodeAndValidate(r, w, &req) {
		return
	}

	// Check if user is trying to create a thread with themselves
	for _, pid := range req.ParticipantIDs {
		if pid == userID {
			response.Error(w, http.StatusBadRequest, "Cannot create a thread with yourself")
			return
		}
	}

	client, err := s.supabase.GetImpersonateClient(userID)
	if err != nil {
		log.Printf("[CreateThread] Failed to get impersonate client: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to create thread")
		return
	}

	insertData := threadInsert{
		CreatedBy:     userID,
		RelatedPostID: req.RelatedPostID,
	}

	var threadResponse []threadResponse
	_, err = client.From("threads").
		Insert(insertData, false, "", "", "").
		ExecuteTo(&threadResponse)

	if err != nil {
		log.Printf("[CreateThread] Failed to insert thread: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to create thread")
		return
	}

	if len(threadResponse) == 0 {
		response.Error(w, http.StatusInternalServerError, "Failed to create thread")
		return
	}

	thread := models.Thread{
		ID:            threadResponse[0].ID,
		CreatedBy:     threadResponse[0].CreatedBy,
		RelatedPostID: threadResponse[0].RelatedPostID,
		CreatedAt:     parseTime(threadResponse[0].CreatedAt),
	}

	// Add participants (including creator)
	participantIDs := append(req.ParticipantIDs, userID)
	uniqueParticipants := make(map[string]bool)
	for _, pid := range participantIDs {
		uniqueParticipants[pid] = true
	}

	serviceClient := s.supabase.GetServiceClient()
	
	// Check existing participants
	var existingParticipants []participantCheck
	_, checkErr := serviceClient.From("thread_participants").
		Select("user_id", "", false).
		Eq("thread_id", thread.ID).
		ExecuteTo(&existingParticipants)
	
	existingParticipantMap := make(map[string]bool)
	if checkErr == nil {
		for _, ep := range existingParticipants {
			existingParticipantMap[ep.UserID] = true
		}
	}
	
	// Create batch insert slice
	var participantInserts []participantInsert
	for pid := range uniqueParticipants {
		if !existingParticipantMap[pid] {
			participantInserts = append(participantInserts, participantInsert{
				ThreadID: thread.ID,
				UserID:   pid,
			})
		}
	}

	// Insert participants if any
	if len(participantInserts) > 0 {
		_, _, err = serviceClient.From("thread_participants").
			Insert(participantInserts, false, "", "", "").
			Execute()

		if err != nil {
			log.Printf("[CreateThread] Failed to add participants: %v", err)
			response.Error(w, http.StatusInternalServerError, fmt.Sprintf("Failed to add participants: %v", err))
			return
		}
	}

	response.Success(w, http.StatusCreated, thread)
}

// GetThreads retrieves all threads for the authenticated user
func (s *Server) GetThreads(w http.ResponseWriter, r *http.Request) {
	userID, ok := utils.RequireUserID(r, w)
	if !ok {
		return
	}

	// ページネーションパラメータ
	limit := 50 // デフォルト50件
	offset := 0

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	client, err := s.supabase.GetImpersonateClient(userID)
	if err != nil {
		log.Printf("[GetThreads] Failed to get impersonate client: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to fetch threads")
		return
	}

	var threadParticipantRows []participantRow
	_, err = client.From("thread_participants").
		Select("thread_id, user_id", "", false).
		Eq("user_id", userID).
		ExecuteTo(&threadParticipantRows)

	if err != nil {
		log.Printf("[GetThreads] Failed to query thread_participants: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to fetch threads")
		return
	}

	if len(threadParticipantRows) == 0 {
		response.Success(w, http.StatusOK, []models.ThreadWithLastMessage{})
		return
	}

	threadIDMap := make(map[string]bool)
	for _, p := range threadParticipantRows {
		threadIDMap[p.ThreadID] = true
	}

	threadIDList := make([]string, 0, len(threadIDMap))
	for threadID := range threadIDMap {
		threadIDList = append(threadIDList, threadID)
	}

	serviceClient := s.supabase.GetServiceClient()
	var threadRows []threadRow
	_, err = serviceClient.From("threads").
		Select("id, created_by, related_post_id, created_at", "", false).
		In("id", threadIDList).
		Order("created_at", nil). // 新しいスレッドから取得
		Range(offset, offset+limit-1, "").
		ExecuteTo(&threadRows)

	if err != nil {
		log.Printf("[GetThreads] Failed to query threads: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to fetch threads")
		return
	}

	log.Printf("[GetThreads] Found %d threads", len(threadRows))

	if len(threadRows) == 0 {
		log.Printf("[GetThreads] No threads found, returning empty array")
		response.Success(w, http.StatusOK, []models.ThreadWithLastMessage{})
		return
	}

	threadIDs := make([]string, len(threadRows))
	for i, row := range threadRows {
		threadIDs[i] = row.ID
	}

	var allMessageRows []messageRow
	_, err = serviceClient.From("messages").
		Select("id, thread_id, sender_user_id, type, text, created_at", "", false).
		In("thread_id", threadIDs).
		ExecuteTo(&allMessageRows)

	lastMessageMap := make(map[string]messageRow)
	if err == nil {
		for _, msg := range allMessageRows {
			existing, exists := lastMessageMap[msg.ThreadID]
			if !exists || msg.CreatedAt > existing.CreatedAt {
				lastMessageMap[msg.ThreadID] = msg
			}
		}
	}

	var allParticipantRows []participantRow
	_, err = serviceClient.From("thread_participants").
		Select("thread_id, user_id", "", false).
		In("thread_id", threadIDList).
		ExecuteTo(&allParticipantRows)

	participantsByThread := make(map[string][]string)
	allParticipantIDs := make(map[string]bool)
	if err == nil {
		for _, p := range allParticipantRows {
			participantsByThread[p.ThreadID] = append(participantsByThread[p.ThreadID], p.UserID)
			allParticipantIDs[p.UserID] = true
		}
	}

	profilesMap := make(map[string]models.Profile)
	if len(allParticipantIDs) > 0 {
		participantIDList := make([]string, 0, len(allParticipantIDs))
		for id := range allParticipantIDs {
			participantIDList = append(participantIDList, id)
		}

		log.Printf("[GetThreads] Fetching profiles for %d participant IDs: %v", len(participantIDList), participantIDList)

		var profileRows []profileRow
		_, err = serviceClient.From("profiles").
			Select("id, role, party, display_name, icon_url, nda_flag, terms_accepted_at, privacy_accepted_at, stripe_customer_id, created_at, updated_at", "", false).
			In("id", participantIDList).
			ExecuteTo(&profileRows)

		if err != nil {
			log.Printf("[GetThreads] ❌ ERROR: Failed to fetch profiles: %v", err)
		} else {
			log.Printf("[GetThreads] ✓ Successfully fetched %d profiles from DB", len(profileRows))
			if len(profileRows) == 0 {
				log.Printf("[GetThreads] ⚠️ WARNING: No profiles found for participant IDs: %v", participantIDList)
			} else {
				// プロフィールの内容をログ出力
				for _, row := range profileRows {
					log.Printf("[GetThreads] Profile found: ID=%s, DisplayName=%s, IconURL=%v", row.ID, row.DisplayName, row.IconURL)
				}
			}

			var iconPaths []string
			for _, row := range profileRows {
				if row.IconURL != nil && *row.IconURL != "" {
					iconPaths = append(iconPaths, *row.IconURL)
				}
			}

			log.Printf("[GetThreads] Fetching signed URLs for %d icon paths: %v", len(iconPaths), iconPaths)
			signedURLMap := s.supabase.GetBatchSignedURLs("profile-icons", iconPaths, 3600)
			log.Printf("[GetThreads] GetBatchSignedURLs returned %d URLs", len(signedURLMap))
			profiles := s.buildProfilesFromRows(profileRows, signedURLMap)
			log.Printf("[GetThreads] buildProfilesFromRows returned %d profiles", len(profiles))

			// 同じIDで複数のロールがある場合、最初の1つだけを使用
			for _, profile := range profiles {
				if _, exists := profilesMap[profile.ID]; !exists {
					profilesMap[profile.ID] = profile
					log.Printf("[GetThreads] Added profile to map: ID=%s, DisplayName=%s", profile.ID, profile.DisplayName)
				} else {
					log.Printf("[GetThreads] Skipping duplicate profile: ID=%s, Role=%s (already exists)", profile.ID, profile.Role)
				}
			}
			log.Printf("[GetThreads] profilesMap now contains %d unique profiles", len(profilesMap))
		}
	} else {
		log.Printf("[GetThreads] ⚠️ No participant IDs to fetch profiles for")
	}

	// 空配列を初期化（nilの場合でも確実に空配列を返す）
	threads := make([]models.ThreadWithLastMessage, 0, len(threadRows))
	for _, row := range threadRows {
		thread := models.ThreadWithLastMessage{
			Thread: models.Thread{
				ID:            row.ID,
				CreatedBy:     row.CreatedBy,
				RelatedPostID: row.RelatedPostID,
				CreatedAt:     parseTime(row.CreatedAt),
			},
		}

		if msg, hasMessage := lastMessageMap[row.ID]; hasMessage {
			thread.LastMessage = &models.Message{
				ID:           msg.ID,
				ThreadID:     row.ID,
				SenderUserID: msg.SenderUserID,
				Type:         models.MessageType(msg.Type),
				Text:         msg.Text,
				CreatedAt:    parseTime(msg.CreatedAt),
			}
		}

		thread.ParticipantIDs = participantsByThread[row.ID]

		foundCreator := false
		for _, pid := range thread.ParticipantIDs {
			if pid == row.CreatedBy {
				foundCreator = true
				break
			}
		}
		if !foundCreator {
			thread.ParticipantIDs = append(thread.ParticipantIDs, row.CreatedBy)
		}

		thread.Participants = make([]models.Profile, 0, len(thread.ParticipantIDs))
		for _, pid := range thread.ParticipantIDs {
			if profile, exists := profilesMap[pid]; exists {
				thread.Participants = append(thread.Participants, profile)
			} else {
				log.Printf("[GetThreads] ⚠️ WARNING: No profile found in profilesMap for participant ID: %s", pid)
			}
		}
		log.Printf("[GetThreads] Thread %s: %d participant IDs, %d profiles added", row.ID, len(thread.ParticipantIDs), len(thread.Participants))

		thread.UnreadCount = 0
		threads = append(threads, thread)
	}

	log.Printf("[GetThreads] Returning %d threads with full details", len(threads))
	response.Success(w, http.StatusOK, threads)
}

// GetThreadByID retrieves a specific thread with its details
func (s *Server) GetThreadByID(w http.ResponseWriter, r *http.Request) {
	userID, ok := utils.RequireUserID(r, w)
	if !ok {
		return
	}

	threadID := strings.TrimPrefix(r.URL.Path, "/api/threads/")
	if threadID == "" {
		response.Error(w, http.StatusBadRequest, "Thread ID required")
		return
	}

	client, err := s.supabase.GetImpersonateClient(userID)
	if err != nil {
		log.Printf("[GetThreadByID] Failed to get impersonate client: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to fetch thread")
		return
	}

	var participantCheck []participantCheck
	_, err = client.From("thread_participants").
		Select("user_id", "", false).
		Eq("thread_id", threadID).
		Eq("user_id", userID).
		ExecuteTo(&participantCheck)

	isParticipant := err == nil && len(participantCheck) > 0

	serviceClient := s.supabase.GetServiceClient()
	var threadRows []threadRow
	_, err = serviceClient.From("threads").
		Select("id, created_by, related_post_id, created_at", "", false).
		Eq("id", threadID).
		ExecuteTo(&threadRows)

	if err != nil {
		log.Printf("[GetThreadByID] Failed to query thread: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to fetch thread")
		return
	}

	if len(threadRows) == 0 {
		// Thread not found - check if the ID is actually a user ID
		// If so, check if there's an existing thread with that user, or create a new one
		log.Printf("[GetThreadByID] Thread not found, checking if ID is a user ID: %s", threadID)
		
		// Check if threadID is a valid user ID (exists in profiles table)
		var profileRows []struct {
			ID string `json:"id"`
		}
		_, profileErr := serviceClient.From("profiles").
			Select("id", "", false).
			Eq("id", threadID).
			ExecuteTo(&profileRows)
		
		// If threadID is a valid user ID and it's not the current user, create a thread
		if profileErr == nil && len(profileRows) > 0 && threadID != userID {
			log.Printf("[GetThreadByID] ID is a valid user ID, checking for existing thread or creating new one")
			
			// Check if there's already a thread between these two users
			// Use serviceClient to bypass RLS and check all threads
			var existingThreadParticipants []participantRow
			_, err = serviceClient.From("thread_participants").
				Select("thread_id, user_id", "", false).
				Eq("user_id", userID).
				ExecuteTo(&existingThreadParticipants)
			
			if err == nil {
				// Get all thread IDs where current user is a participant
				userThreadIDs := make(map[string]bool)
				for _, p := range existingThreadParticipants {
					userThreadIDs[p.ThreadID] = true
				}
				
				// Check if any of those threads also have the target user as a participant
				if len(userThreadIDs) > 0 {
					threadIDList := make([]string, 0, len(userThreadIDs))
					for tid := range userThreadIDs {
						threadIDList = append(threadIDList, tid)
					}
					
					var targetUserParticipants []participantRow
					_, err = serviceClient.From("thread_participants").
						Select("thread_id, user_id", "", false).
						In("thread_id", threadIDList).
						Eq("user_id", threadID).
						ExecuteTo(&targetUserParticipants)
					
					if err == nil && len(targetUserParticipants) > 0 {
						// Found existing thread - use it
						existingThreadID := targetUserParticipants[0].ThreadID
						log.Printf("[GetThreadByID] Found existing thread: %s", existingThreadID)
						
						// Recursively call GetThreadByID with the actual thread ID
						// But we need to avoid infinite recursion, so we'll fetch it directly
						var existingThreadRows []threadRow
						_, err = serviceClient.From("threads").
							Select("id, created_by, related_post_id, created_at", "", false).
							Eq("id", existingThreadID).
							ExecuteTo(&existingThreadRows)
						
						if err == nil && len(existingThreadRows) > 0 {
							// Build thread detail response
							thread := models.ThreadDetail{
								Thread: models.Thread{
									ID:            existingThreadRows[0].ID,
									CreatedBy:     existingThreadRows[0].CreatedBy,
									RelatedPostID: existingThreadRows[0].RelatedPostID,
									CreatedAt:     parseTime(existingThreadRows[0].CreatedAt),
								},
							}
							
							// Get participants
							var participantRows []participantRowSimple
							_, queryErr := serviceClient.From("thread_participants").
								Select("user_id", "", false).
								Eq("thread_id", existingThreadID).
								ExecuteTo(&participantRows)
							
							if queryErr == nil && len(participantRows) > 0 {
								participantIDs := make([]string, len(participantRows))
								for i, row := range participantRows {
									participantIDs[i] = row.UserID
								}
								
								var profileRows []profileRow
								_, err = client.From("profiles").
									Select("id, role, party, display_name, icon_url, nda_flag, terms_accepted_at, privacy_accepted_at, stripe_customer_id, created_at, updated_at", "", false).
									In("id", participantIDs).
									ExecuteTo(&profileRows)
								
								if err == nil {
									var iconPaths []string
									for _, row := range profileRows {
										if row.IconURL != nil && *row.IconURL != "" {
											iconPaths = append(iconPaths, *row.IconURL)
										}
									}
									
									signedURLMap := s.supabase.GetBatchSignedURLs("profile-icons", iconPaths, 3600)

									allProfiles := s.buildProfilesFromRows(profileRows, signedURLMap)
									// 同じIDで複数のロールがある場合、最初の1つだけを使用
									uniqueProfilesMap := make(map[string]models.Profile)
									for _, profile := range allProfiles {
										if _, exists := uniqueProfilesMap[profile.ID]; !exists {
											uniqueProfilesMap[profile.ID] = profile
										}
									}
									thread.Participants = make([]models.Profile, 0, len(uniqueProfilesMap))
									for _, profile := range uniqueProfilesMap {
										thread.Participants = append(thread.Participants, profile)
									}
								}
							}
							
							response.Success(w, http.StatusOK, thread)
							return
						}
					}
				}
			}
			
			// No existing thread found - create a new one
			log.Printf("[GetThreadByID] Creating new thread with user: %s", threadID)
			
			insertData := threadInsert{
				CreatedBy:     userID,
				RelatedPostID: nil,
			}
			
			var threadResponse []threadResponse
			_, err = client.From("threads").
				Insert(insertData, false, "", "", "").
				ExecuteTo(&threadResponse)
			
			if err != nil {
				log.Printf("[GetThreadByID] Failed to create thread: %v", err)
				response.Error(w, http.StatusInternalServerError, "Failed to create thread")
				return
			}
			
			if len(threadResponse) == 0 {
				response.Error(w, http.StatusInternalServerError, "Failed to create thread")
				return
			}
			
			newThread := models.Thread{
				ID:            threadResponse[0].ID,
				CreatedBy:     threadResponse[0].CreatedBy,
				RelatedPostID: threadResponse[0].RelatedPostID,
				CreatedAt:     parseTime(threadResponse[0].CreatedAt),
			}
			
			// Add participants
			participantIDs := []string{threadID, userID}
			uniqueParticipants := make(map[string]bool)
			for _, pid := range participantIDs {
				uniqueParticipants[pid] = true
			}
			
			var participantInserts []participantInsert
			for pid := range uniqueParticipants {
				participantInserts = append(participantInserts, participantInsert{
					ThreadID: newThread.ID,
					UserID:   pid,
				})
			}
			
			if len(participantInserts) > 0 {
				_, _, err = serviceClient.From("thread_participants").
					Insert(participantInserts, false, "", "", "").
					Execute()
				
				if err != nil {
					log.Printf("[GetThreadByID] Failed to add participants: %v", err)
					response.Error(w, http.StatusInternalServerError, fmt.Sprintf("Failed to add participants: %v", err))
					return
				}
			}
			
			// Build thread detail response
			threadDetail := models.ThreadDetail{
				Thread: newThread,
			}
			
			// Get participants for response
			var participantRows []participantRowSimple
			_, queryErr := serviceClient.From("thread_participants").
				Select("user_id", "", false).
				Eq("thread_id", newThread.ID).
				ExecuteTo(&participantRows)
			
			if queryErr == nil && len(participantRows) > 0 {
				participantIDsForResponse := make([]string, len(participantRows))
				for i, row := range participantRows {
					participantIDsForResponse[i] = row.UserID
				}
				
				var profileRows []profileRow
				_, err = client.From("profiles").
					Select("id, role, party, display_name, icon_url, nda_flag, terms_accepted_at, privacy_accepted_at, stripe_customer_id, created_at, updated_at", "", false).
					In("id", participantIDsForResponse).
					ExecuteTo(&profileRows)
				
				if err == nil {
					var iconPaths []string
					for _, row := range profileRows {
						if row.IconURL != nil && *row.IconURL != "" {
							iconPaths = append(iconPaths, *row.IconURL)
						}
					}
					
					signedURLMap := s.supabase.GetBatchSignedURLs("profile-icons", iconPaths, 3600)

					allProfiles := s.buildProfilesFromRows(profileRows, signedURLMap)
					// 同じIDで複数のロールがある場合、最初の1つだけを使用
					uniqueProfilesMap := make(map[string]models.Profile)
					for _, profile := range allProfiles {
						if _, exists := uniqueProfilesMap[profile.ID]; !exists {
							uniqueProfilesMap[profile.ID] = profile
						}
					}
					threadDetail.Participants = make([]models.Profile, 0, len(uniqueProfilesMap))
					for _, profile := range uniqueProfilesMap {
						threadDetail.Participants = append(threadDetail.Participants, profile)
					}
				}
			}
			
			response.Success(w, http.StatusCreated, threadDetail)
			return
		}
		
		// Not a valid user ID or is the current user - return 404
		response.Error(w, http.StatusNotFound, "Thread not found")
		return
	}

	isCreator := threadRows[0].CreatedBy == userID
	if !isParticipant && !isCreator {
		response.Error(w, http.StatusForbidden, "Access denied")
		return
	}

	thread := models.ThreadDetail{
		Thread: models.Thread{
			ID:            threadRows[0].ID,
			CreatedBy:     threadRows[0].CreatedBy,
			RelatedPostID: threadRows[0].RelatedPostID,
			CreatedAt:     parseTime(threadRows[0].CreatedAt),
		},
	}

	var participantRows []participantRowSimple
	_, queryErr := serviceClient.From("thread_participants").
		Select("user_id", "", false).
		Eq("thread_id", threadID).
		ExecuteTo(&participantRows)

	if queryErr != nil {
		log.Printf("[GetThreadByID] Failed to fetch participants: %v", queryErr)
		response.Error(w, http.StatusInternalServerError, "Failed to fetch participants")
		return
	}

	if len(participantRows) == 0 {
		thread.Participants = []models.Profile{}
		response.Success(w, http.StatusOK, thread)
		return
	}

	participantIDs := make([]string, len(participantRows))
	for i, row := range participantRows {
		participantIDs[i] = row.UserID
	}

	log.Printf("[GetThreadByID] Fetching profiles for %d participant IDs: %v", len(participantIDs), participantIDs)

	var profileRows []profileRow
	_, err = client.From("profiles").
		Select("id, role, party, display_name, icon_url, nda_flag, terms_accepted_at, privacy_accepted_at, stripe_customer_id, created_at, updated_at", "", false).
		In("id", participantIDs).
		ExecuteTo(&profileRows)

	if err != nil {
		log.Printf("[GetThreadByID] ❌ ERROR: Failed to fetch profiles: %v", err)
		thread.Participants = []models.Profile{}
		response.Success(w, http.StatusOK, thread)
		return
	}

	log.Printf("[GetThreadByID] ✓ Successfully fetched %d profiles from DB", len(profileRows))
	if len(profileRows) == 0 {
		log.Printf("[GetThreadByID] ⚠️ WARNING: No profiles found for participant IDs: %v", participantIDs)
	} else {
		// プロフィールの内容をログ出力
		for _, row := range profileRows {
			log.Printf("[GetThreadByID] Profile found: ID=%s, DisplayName=%s, IconURL=%v", row.ID, row.DisplayName, row.IconURL)
		}
	}

	var iconPaths []string
	for _, row := range profileRows {
		if row.IconURL != nil && *row.IconURL != "" {
			iconPaths = append(iconPaths, *row.IconURL)
		}
	}

	log.Printf("[GetThreadByID] Fetching signed URLs for %d icon paths", len(iconPaths))
	signedURLMap := s.supabase.GetBatchSignedURLs("profile-icons", iconPaths, 3600)
	log.Printf("[GetThreadByID] GetBatchSignedURLs returned %d URLs", len(signedURLMap))

	allProfiles := s.buildProfilesFromRows(profileRows, signedURLMap)

	// 同じIDで複数のロールがある場合、最初の1つだけを使用
	uniqueProfilesMap := make(map[string]models.Profile)
	for _, profile := range allProfiles {
		if _, exists := uniqueProfilesMap[profile.ID]; !exists {
			uniqueProfilesMap[profile.ID] = profile
			log.Printf("[GetThreadByID] Added profile: ID=%s, DisplayName=%s", profile.ID, profile.DisplayName)
		} else {
			log.Printf("[GetThreadByID] Skipping duplicate profile: ID=%s, Role=%s", profile.ID, profile.Role)
		}
	}

	// map から slice に変換
	thread.Participants = make([]models.Profile, 0, len(uniqueProfilesMap))
	for _, profile := range uniqueProfilesMap {
		thread.Participants = append(thread.Participants, profile)
	}
	log.Printf("[GetThreadByID] Final participants count: %d unique profiles", len(thread.Participants))

	response.Success(w, http.StatusOK, thread)
}

// GetMessages retrieves messages for a specific thread
func (s *Server) GetMessages(w http.ResponseWriter, r *http.Request) {
	userID, ok := utils.RequireUserID(r, w)
	if !ok {
		return
	}

	threadID := r.URL.Query().Get("thread_id")
	if threadID == "" {
		response.Error(w, http.StatusBadRequest, "thread_id query parameter required")
		return
	}

	// ページネーションパラメータ
	limit := 50 // デフォルト50件
	offset := 0

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	client, err := s.supabase.GetImpersonateClient(userID)
	if err != nil {
		log.Printf("[GetMessages] Failed to get impersonate client: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to fetch messages")
		return
	}

	var messageRows []messageRow
	_, err = client.From("messages").
		Select("id, thread_id, sender_user_id, type, text, created_at", "", false).
		Eq("thread_id", threadID).
		Order("created_at", nil). // 新しいメッセージから取得
		Range(offset, offset+limit-1, "").
		ExecuteTo(&messageRows)

	if err != nil {
		log.Printf("[GetMessages] Failed to query messages: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to fetch messages")
		return
	}

	// メッセージが空でも正常に処理を続行
	log.Printf("[GetMessages] Messages count: %d", len(messageRows))

	senderIDs := make(map[string]bool)
	for _, row := range messageRows {
		senderIDs[row.SenderUserID] = true
	}

	profilesMap := make(map[string]profileRowSimple)
	if len(senderIDs) > 0 {
		senderIDList := make([]string, 0, len(senderIDs))
		for id := range senderIDs {
			senderIDList = append(senderIDList, id)
		}

		var profileRows []profileRowSimple
		_, err = client.From("profiles").
			Select("id, display_name, icon_url", "", false).
			In("id", senderIDList).
			ExecuteTo(&profileRows)

		if err == nil {
			for _, profile := range profileRows {
				profilesMap[profile.ID] = profile
			}
		}
	}

	messageIDs := make([]string, len(messageRows))
	for i, row := range messageRows {
		messageIDs[i] = row.ID
	}

	attachmentsMap := make(map[string]string)
	if len(messageIDs) > 0 {
		var attachmentRows []attachmentRow
		_, err = client.From("message_attachments").
			Select("message_id, file_url", "", false).
			In("message_id", messageIDs).
			ExecuteTo(&attachmentRows)

		if err == nil {
			for _, att := range attachmentRows {
				attachmentsMap[att.MessageID] = att.FileURL
			}
		}
	}

	// 空配列を初期化（nilの場合でも確実に空配列を返す）
	messages := make([]models.MessageWithSender, 0, len(messageRows))

	for _, row := range messageRows {
		profile, hasProfile := profilesMap[row.SenderUserID]
		msg := models.MessageWithSender{
			Message: models.Message{
				ID:           row.ID,
				ThreadID:     row.ThreadID,
				SenderUserID: row.SenderUserID,
				Type:         models.MessageType(row.Type),
				Text:         row.Text,
				CreatedAt:    parseTime(row.CreatedAt),
			},
			SenderName:    "不明なユーザー",
			SenderIconURL: nil,
			ImageURL:      nil,
		}
		if hasProfile {
			msg.SenderName = profile.DisplayName
			msg.SenderIconURL = profile.IconURL
		}

		if filePath, hasAttachment := attachmentsMap[row.ID]; hasAttachment {
			// 契約書の場合はcontract-documentsバケットから、画像の場合はmessage-imagesバケットからURLを取得
			bucketName := "message-images"
			if row.Type == string(models.MessageTypeContract) || row.Type == string(models.MessageTypeNDA) {
				bucketName = "contract-documents"
			}
			
			log.Printf("[GetMessages] Getting file URL for message %s, bucket=%s, path=%s", row.ID, bucketName, filePath)
			imageURL, err := s.supabase.GetImageURL(bucketName, filePath, 3600)
			if err != nil {
				log.Printf("[GetMessages] ERROR: Failed to get file URL for message %s: %v", row.ID, err)
				// エラーでもメッセージは返す（ファイルなしで）
			} else {
				log.Printf("[GetMessages] Successfully got file URL for message %s: %s", row.ID, imageURL)
				msg.ImageURL = &imageURL
			}
		}

		messages = append(messages, msg)
	}

	log.Printf("[GetMessages] Returning %d messages", len(messages))
	response.Success(w, http.StatusOK, messages)
}

// SendMessage sends a new message in a thread
func (s *Server) SendMessage(w http.ResponseWriter, r *http.Request) {
	userID, ok := utils.RequireUserID(r, w)
	if !ok {
		return
	}

	var req models.CreateMessageRequest
	if !utils.DecodeAndValidate(r, w, &req) {
		return
	}

	client, err := s.supabase.GetImpersonateClient(userID)
	if err != nil {
		log.Printf("[SendMessage] Failed to get impersonate client: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to send message")
		return
	}

	type threadRowSimple struct {
		CreatedBy string `json:"created_by"`
	}
	var threadRows []threadRowSimple
	_, err = client.From("threads").
		Select("created_by", "", false).
		Eq("id", req.ThreadID).
		ExecuteTo(&threadRows)

	if err == nil && len(threadRows) > 0 && threadRows[0].CreatedBy == userID {
		var participantCheck []participantCheck
		_, checkErr := client.From("thread_participants").
			Select("user_id", "", false).
			Eq("thread_id", req.ThreadID).
			Eq("user_id", userID).
			ExecuteTo(&participantCheck)

		if checkErr != nil || len(participantCheck) == 0 {
			participantInsert := participantInsert{
				ThreadID: req.ThreadID,
				UserID:   userID,
			}
			_, _, _ = client.From("thread_participants").
				Insert(participantInsert, false, "", "", "").
				Execute()
		}
	}

	insertData := messageInsert{
		ThreadID:     req.ThreadID,
		SenderUserID: userID,
		Type:         string(req.Type),
		Text:         req.Text,
	}

	var messageResp []messageResponse
	_, err = client.From("messages").
		Insert(insertData, false, "", "", "").
		ExecuteTo(&messageResp)

	if err != nil {
		log.Printf("[SendMessage] Failed to insert message: %v", err)
		errStr := err.Error()
		if strings.Contains(errStr, "new row violates row-level security") ||
			strings.Contains(errStr, "RLS") ||
			strings.Contains(errStr, "policy") ||
			strings.Contains(errStr, "row-level security policy") {
			if len(threadRows) > 0 && threadRows[0].CreatedBy == userID {
				participantInsert := participantInsert{
					ThreadID: req.ThreadID,
					UserID:   userID,
				}
				_, _, insertErr := client.From("thread_participants").
					Insert(participantInsert, false, "", "", "").
					Execute()

				if insertErr == nil {
					var retryResp []messageResponse
					_, retryErr := client.From("messages").
						Insert(insertData, false, "", "", "").
						ExecuteTo(&retryResp)

					if retryErr == nil && len(retryResp) > 0 {
						// プロフィール情報を取得
						var profileRows []profileRowSimple
						_, _ = client.From("profiles").
							Select("id, display_name, icon_url", "", false).
							Eq("id", userID).
							ExecuteTo(&profileRows)

						profile, hasProfile := profileRowSimple{}, false
						if len(profileRows) > 0 {
							profile = profileRows[0]
							hasProfile = true
						}

						message := models.Message{
							ID:           retryResp[0].ID,
							ThreadID:     retryResp[0].ThreadID,
							SenderUserID: retryResp[0].SenderUserID,
							Type:         models.MessageType(retryResp[0].Type),
							Text:         retryResp[0].Text,
							CreatedAt:    parseTime(retryResp[0].CreatedAt),
						}

						messageWithSender := models.MessageWithSender{
							Message:      message,
							SenderName:   "不明なユーザー",
							SenderIconURL: nil,
							ImageURL:     nil,
						}

						if hasProfile {
							messageWithSender.SenderName = profile.DisplayName
							messageWithSender.SenderIconURL = profile.IconURL
						}

						if req.FileURL != nil && *req.FileURL != "" {
							// 画像URLを取得（publicバケットの場合は直接URL、privateバケットの場合はsigned URL）
							imageURL, err := s.supabase.GetImageURL("message-images", *req.FileURL, 3600)
							if err == nil {
								messageWithSender.ImageURL = &imageURL
							} else {
								log.Printf("[SendMessage] Failed to generate image URL: %v", err)
								messageWithSender.ImageURL = req.FileURL
							}
						}

						response.Success(w, http.StatusCreated, messageWithSender)
						return
					}
				}
			}
			response.Error(w, http.StatusForbidden, "Access denied: You are not a participant of this thread")
			return
		}
		response.Error(w, http.StatusInternalServerError, "Failed to send message")
		return
	}

	if len(messageResp) == 0 {
		response.Error(w, http.StatusInternalServerError, "Failed to send message")
		return
	}

	// プロフィール情報を取得
	var profileRows []profileRowSimple
	_, err = client.From("profiles").
		Select("id, display_name, icon_url", "", false).
		Eq("id", userID).
		ExecuteTo(&profileRows)

	profile, hasProfile := profileRowSimple{}, false
	if err == nil && len(profileRows) > 0 {
		profile = profileRows[0]
		hasProfile = true
	}

	message := models.Message{
		ID:           messageResp[0].ID,
		ThreadID:     messageResp[0].ThreadID,
		SenderUserID: messageResp[0].SenderUserID,
		Type:         models.MessageType(messageResp[0].Type),
		Text:         messageResp[0].Text,
		CreatedAt:    parseTime(messageResp[0].CreatedAt),
	}

	messageWithSender := models.MessageWithSender{
		Message:      message,
		SenderName:   "不明なユーザー",
		SenderIconURL: nil,
		ImageURL:     nil,
	}

	if hasProfile {
		messageWithSender.SenderName = profile.DisplayName
		messageWithSender.SenderIconURL = profile.IconURL
	}

	if req.FileURL != nil && *req.FileURL != "" {
		type attachmentInsert struct {
			MessageID string `json:"message_id"`
			FileURL   string `json:"file_url"`
		}

		attachmentData := attachmentInsert{
			MessageID: message.ID,
			FileURL:   *req.FileURL,
		}

		_, _, err := client.From("message_attachments").
			Insert(attachmentData, false, "", "", "").
			Execute()

		if err == nil {
			// 契約書の場合はcontract-documentsバケットから、画像の場合はmessage-imagesバケットからURLを取得
			bucketName := "message-images"
			if req.Type == models.MessageTypeContract || req.Type == models.MessageTypeNDA {
				bucketName = "contract-documents"
			}
			
			// 画像URLを取得（publicバケットの場合は直接URL、privateバケットの場合はsigned URL）
			imageURL, err := s.supabase.GetImageURL(bucketName, *req.FileURL, 3600)
			if err == nil {
				messageWithSender.ImageURL = &imageURL
			} else {
				log.Printf("[SendMessage] Failed to generate image URL: %v", err)
				// エラーが発生してもファイルパスをそのまま設定
				messageWithSender.ImageURL = req.FileURL
			}
		}
	}

	response.Success(w, http.StatusCreated, messageWithSender)
}

// UploadMessageImage handles image upload for messages
func (s *Server) UploadMessageImage(w http.ResponseWriter, r *http.Request) {
	userID, ok := utils.RequireUserID(r, w)
	if !ok {
		return
	}

	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		log.Printf("[UploadMessageImage] Failed to parse form: %v", err)
		response.Error(w, http.StatusBadRequest, "Failed to parse form data")
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		log.Printf("[UploadMessageImage] Failed to get file: %v", err)
		response.Error(w, http.StatusBadRequest, "No image file provided")
		return
	}
	defer file.Close()

	fileData, err := io.ReadAll(file)
	if err != nil {
		log.Printf("[UploadMessageImage] Failed to read file: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to read file")
		return
	}

	contentType := http.DetectContentType(fileData)
	if contentType == "application/octet-stream" || contentType == "application/json" {
		headerContentType := header.Header.Get("Content-Type")
		if headerContentType != "" {
			contentType = headerContentType
		} else {
			ext := filepath.Ext(header.Filename)
			mimeType := mime.TypeByExtension(ext)
			if mimeType != "" {
				contentType = mimeType
			}
		}
	}

	if contentType == "image/jpg" {
		contentType = "image/jpeg"
	}

	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/webp": true,
		"image/gif":  true,
	}

	if !allowedTypes[contentType] {
		response.Error(w, http.StatusBadRequest, "Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed")
		return
	}

	ext := filepath.Ext(header.Filename)
	fileName := fmt.Sprintf("%s/%s%s", userID, uuid.New().String(), ext)

	filePath, err := s.supabase.UploadFile(userID, "message-images", fileName, fileData, contentType)
	if err != nil {
		log.Printf("[UploadMessageImage] Failed to upload to storage: %v", err)
		response.Error(w, http.StatusInternalServerError, fmt.Sprintf("Failed to upload image: %v", err))
		return
	}

	response.Success(w, http.StatusCreated, map[string]string{
		"file_path": filePath,
	})
}

// UploadContractDocument handles contract document upload for messages
func (s *Server) UploadContractDocument(w http.ResponseWriter, r *http.Request) {
	userID, ok := utils.RequireUserID(r, w)
	if !ok {
		return
	}

	err := r.ParseMultipartForm(50 << 20) // 50MB max for contract documents
	if err != nil {
		log.Printf("[UploadContractDocument] Failed to parse form: %v", err)
		response.Error(w, http.StatusBadRequest, "Failed to parse form data")
		return
	}

	// thread_idとcontract_typeを取得
	threadID := r.FormValue("thread_id")
	contractType := r.FormValue("contract_type")
	
	if threadID == "" {
		response.Error(w, http.StatusBadRequest, "thread_id is required")
		return
	}
	if contractType == "" {
		response.Error(w, http.StatusBadRequest, "contract_type is required")
		return
	}

	// contract_typeのバリデーション
	validContractTypes := map[string]bool{
		"nda":      true,
		"loi":      true,
		"dd":       true,
		"transfer": true,
		"handover": true,
		"custom":   true,
	}
	if !validContractTypes[contractType] {
		response.Error(w, http.StatusBadRequest, "Invalid contract_type")
		return
	}

	// スレッドの参加者であることを確認
	client, err := s.supabase.GetImpersonateClient(userID)
	if err != nil {
		log.Printf("[UploadContractDocument] Failed to get impersonate client: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to verify thread access")
		return
	}

	var participantCheck []struct {
		UserID string `json:"user_id"`
	}
	_, err = client.From("thread_participants").
		Select("user_id", "", false).
		Eq("thread_id", threadID).
		Eq("user_id", userID).
		ExecuteTo(&participantCheck)

	if err != nil || len(participantCheck) == 0 {
		log.Printf("[UploadContractDocument] User is not a participant of the thread: %v", err)
		response.Error(w, http.StatusForbidden, "You are not a participant of this thread")
		return
	}

	file, header, err := r.FormFile("contract")
	if err != nil {
		log.Printf("[UploadContractDocument] Failed to get file: %v", err)
		response.Error(w, http.StatusBadRequest, "No contract file provided")
		return
	}
	defer file.Close()

	fileData, err := io.ReadAll(file)
	if err != nil {
		log.Printf("[UploadContractDocument] Failed to read file: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to read file")
		return
	}

	contentType := http.DetectContentType(fileData)
	if contentType == "application/octet-stream" || contentType == "application/json" {
		headerContentType := header.Header.Get("Content-Type")
		if headerContentType != "" {
			contentType = headerContentType
		} else {
			ext := filepath.Ext(header.Filename)
			mimeType := mime.TypeByExtension(ext)
			if mimeType != "" {
				contentType = mimeType
			}
		}
	}

	// 契約書として許可するファイルタイプ（PDF、画像、Word、Excelなど）
	allowedTypes := map[string]bool{
		"application/pdf":                          true,
		"image/jpeg":                               true,
		"image/png":                                true,
		"image/webp":                               true,
		"image/gif":                                true,
		"application/msword":                       true, // .doc
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true, // .docx
		"application/vnd.ms-excel":                  true, // .xls
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": true, // .xlsx
	}

	if !allowedTypes[contentType] {
		response.Error(w, http.StatusBadRequest, "Invalid file type. Only PDF, images, Word, and Excel files are allowed")
		return
	}

	ext := filepath.Ext(header.Filename)
	fileName := fmt.Sprintf("%s/%s%s", userID, uuid.New().String(), ext)

	filePath, err := s.supabase.UploadFile(userID, "contract-documents", fileName, fileData, contentType)
	if err != nil {
		log.Printf("[UploadContractDocument] Failed to upload to storage: %v", err)
		response.Error(w, http.StatusInternalServerError, fmt.Sprintf("Failed to upload contract: %v", err))
		return
	}

	// データベースに契約書情報を保存
	type contractDocumentInsert struct {
		ThreadID    string `json:"thread_id"`
		UploadedBy  string `json:"uploaded_by"`
		ContractType string `json:"contract_type"`
		FilePath    string `json:"file_path"`
		FileName    string `json:"file_name"`
		FileSize    int64  `json:"file_size"`
		ContentType string `json:"content_type"`
	}

	contractDoc := contractDocumentInsert{
		ThreadID:     threadID,
		UploadedBy:   userID,
		ContractType: contractType,
		FilePath:     filePath,
		FileName:     header.Filename,
		FileSize:     int64(len(fileData)),
		ContentType:  contentType,
	}

	_, _, err = client.From("thread_contract_documents").
		Insert(contractDoc, false, "", "", "").
		Execute()

	if err != nil {
		log.Printf("[UploadContractDocument] Failed to save contract document to database: %v", err)
		// ストレージへのアップロードは成功しているが、DB保存に失敗した場合でもエラーを返す
		response.Error(w, http.StatusInternalServerError, "Failed to save contract document information")
		return
	}

	// 署名付きURLを生成してレスポンスに含める
	signedURL, err := s.supabase.GetImageURL("contract-documents", filePath, 3600)
	if err != nil {
		log.Printf("[UploadContractDocument] Failed to generate signed URL: %v", err)
		signedURL = "" // エラーでも続行
	}

	response.Success(w, http.StatusCreated, map[string]string{
		"file_path":  filePath,
		"signed_url": signedURL,
	})
}

// GetThreadContractDocuments retrieves contract documents for a specific thread
func (s *Server) GetThreadContractDocuments(w http.ResponseWriter, r *http.Request) {
	userID, ok := utils.RequireUserID(r, w)
	if !ok {
		return
	}

	threadID := strings.TrimPrefix(r.URL.Path, "/api/threads/")
	threadID = strings.TrimSuffix(threadID, "/contracts")
	threadID = strings.Trim(threadID, "/")
	
	if threadID == "" {
		response.Error(w, http.StatusBadRequest, "Thread ID required")
		return
	}

	client, err := s.supabase.GetImpersonateClient(userID)
	if err != nil {
		log.Printf("[GetThreadContractDocuments] Failed to get impersonate client: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to fetch contract documents")
		return
	}

	// スレッドの参加者であることを確認
	var participantCheck []struct {
		UserID string `json:"user_id"`
	}
	_, err = client.From("thread_participants").
		Select("user_id", "", false).
		Eq("thread_id", threadID).
		Eq("user_id", userID).
		ExecuteTo(&participantCheck)

	if err != nil || len(participantCheck) == 0 {
		log.Printf("[GetThreadContractDocuments] User is not a participant of the thread: %v", err)
		response.Error(w, http.StatusForbidden, "You are not a participant of this thread")
		return
	}

	type contractDocumentRow struct {
		ID           string `json:"id"`
		ThreadID     string `json:"thread_id"`
		UploadedBy   string `json:"uploaded_by"`
		ContractType string `json:"contract_type"`
		FilePath     string `json:"file_path"`
		FileName     string `json:"file_name"`
		FileSize     *int64 `json:"file_size"`
		ContentType  string `json:"content_type"`
		CreatedAt    string `json:"created_at"`
		UpdatedAt    string `json:"updated_at"`
	}

	var contractRows []contractDocumentRow
	_, err = client.From("thread_contract_documents").
		Select("id, thread_id, uploaded_by, contract_type, file_path, file_name, file_size, content_type, created_at, updated_at", "", false).
		Eq("thread_id", threadID).
		Order("created_at", nil).
		ExecuteTo(&contractRows)

	if err != nil {
		log.Printf("[GetThreadContractDocuments] Failed to query contract documents: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to fetch contract documents")
		return
	}

	// 署名情報を取得
	type signatureRow struct {
		ContractID    string `json:"contract_id"`
		UserID        string `json:"user_id"`
		SignatureData string `json:"signature_data"`
		SignedAt      string `json:"signed_at"`
	}

	var signaturesRows []signatureRow
	if len(contractRows) > 0 {
		// すべての契約書の署名を一括取得
		contractIDs := make([]string, len(contractRows))
		for i, row := range contractRows {
			contractIDs[i] = row.ID
		}

		// contract_signaturesテーブルから署名を取得
		_, err = client.From("contract_signatures").
			Select("contract_id, user_id, signature_data, signed_at", "", false).
			In("contract_id", contractIDs).
			Order("signed_at", nil).
			ExecuteTo(&signaturesRows)

		if err != nil {
			log.Printf("[GetThreadContractDocuments] Failed to fetch signatures: %v", err)
			// エラーでも続行（署名なしで返す）
			signaturesRows = []signatureRow{}
		}
	}

	// 署名をcontractIDでマッピング
	signaturesByContract := make(map[string][]signatureRow)
	for _, sig := range signaturesRows {
		signaturesByContract[sig.ContractID] = append(signaturesByContract[sig.ContractID], sig)
	}

	// 署名付きURLを生成してレスポンスを作成
	type signatureResponse struct {
		UserID        string `json:"user_id"`
		SignedAt      string `json:"signed_at"`
		SignatureData string `json:"signature_data,omitempty"`
	}

	type contractDocumentResponse struct {
		ID           string              `json:"id"`
		ThreadID     string              `json:"thread_id"`
		UploadedBy   string              `json:"uploaded_by"`
		ContractType string              `json:"contract_type"`
		FilePath     string              `json:"file_path"`
		FileName     string              `json:"file_name"`
		FileSize     *int64              `json:"file_size"`
		ContentType  string              `json:"content_type"`
		SignedURL    string              `json:"signed_url"`
		CreatedAt    string              `json:"created_at"`
		UpdatedAt    string              `json:"updated_at"`
		Signatures   []signatureResponse `json:"signatures,omitempty"`
	}

	contracts := make([]contractDocumentResponse, 0, len(contractRows))
	for _, row := range contractRows {
		signedURL, err := s.supabase.GetImageURL("contract-documents", row.FilePath, 3600)
		if err != nil {
			log.Printf("[GetThreadContractDocuments] Failed to generate signed URL for %s: %v", row.FilePath, err)
			// エラーでも続行（signedURLは空文字列）
			signedURL = ""
		}

		// 署名情報を追加
		signatures := make([]signatureResponse, 0)
		if sigs, ok := signaturesByContract[row.ID]; ok {
			for _, sig := range sigs {
				signatures = append(signatures, signatureResponse{
					UserID:        sig.UserID,
					SignedAt:      sig.SignedAt,
					SignatureData: sig.SignatureData,
				})
			}
		}

		contracts = append(contracts, contractDocumentResponse{
			ID:           row.ID,
			ThreadID:     row.ThreadID,
			UploadedBy:   row.UploadedBy,
			ContractType: row.ContractType,
			FilePath:     row.FilePath,
			FileName:     row.FileName,
			FileSize:     row.FileSize,
			ContentType:  row.ContentType,
			SignedURL:    signedURL,
			CreatedAt:    row.CreatedAt,
			UpdatedAt:    row.UpdatedAt,
			Signatures:   signatures,
		})
	}

	response.Success(w, http.StatusOK, contracts)
}

// UpdateContract handles contract document update
func (s *Server) UpdateContract(w http.ResponseWriter, r *http.Request) {
	userID, ok := utils.RequireUserID(r, w)
	if !ok {
		return
	}

	// URLからcontract_idを取得
	contractID := strings.TrimPrefix(r.URL.Path, "/api/contracts/")
	contractID = strings.TrimSuffix(contractID, "/update")
	contractID = strings.Trim(contractID, "/")

	if contractID == "" {
		response.Error(w, http.StatusBadRequest, "Contract ID required")
		return
	}

	err := r.ParseMultipartForm(50 << 20) // 50MB max
	if err != nil {
		log.Printf("[UpdateContract] Failed to parse form: %v", err)
		response.Error(w, http.StatusBadRequest, "Failed to parse form data")
		return
	}

	file, header, err := r.FormFile("contract")
	if err != nil {
		log.Printf("[UpdateContract] Failed to get file: %v", err)
		response.Error(w, http.StatusBadRequest, "No contract file provided")
		return
	}
	defer file.Close()

	fileData, err := io.ReadAll(file)
	if err != nil {
		log.Printf("[UpdateContract] Failed to read file: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to read file")
		return
	}

	contentType := http.DetectContentType(fileData)
	if contentType == "application/octet-stream" {
		contentType = "application/pdf" // デフォルトでPDFと仮定
	}

	client, err := s.supabase.GetImpersonateClient(userID)
	if err != nil {
		log.Printf("[UpdateContract] Failed to get impersonate client: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to update contract")
		return
	}

	// 既存の契約書情報を取得
	type contractDoc struct {
		ID         string `json:"id"`
		ThreadID   string `json:"thread_id"`
		UploadedBy string `json:"uploaded_by"`
		FilePath   string `json:"file_path"`
	}

	var existingContract []contractDoc
	_, err = client.From("thread_contract_documents").
		Select("id, thread_id, uploaded_by, file_path", "", false).
		Eq("id", contractID).
		ExecuteTo(&existingContract)

	if err != nil || len(existingContract) == 0 {
		log.Printf("[UpdateContract] Contract not found: %v", err)
		response.Error(w, http.StatusNotFound, "Contract not found")
		return
	}

	contract := existingContract[0]

	// スレッドの参加者であることを確認
	var participantCheck []struct {
		UserID string `json:"user_id"`
	}
	_, err = client.From("thread_participants").
		Select("user_id", "", false).
		Eq("thread_id", contract.ThreadID).
		Eq("user_id", userID).
		ExecuteTo(&participantCheck)

	if err != nil || len(participantCheck) == 0 {
		log.Printf("[UpdateContract] User is not a participant: %v", err)
		response.Error(w, http.StatusForbidden, "You are not a participant of this thread")
		return
	}

	// 新しいファイルをアップロード（既存のファイルパスを上書き）
	ext := filepath.Ext(header.Filename)
	fileName := fmt.Sprintf("%s/%s%s", userID, uuid.New().String(), ext)

	filePath, err := s.supabase.UploadFile(userID, "contract-documents", fileName, fileData, contentType)
	if err != nil {
		log.Printf("[UpdateContract] Failed to upload to storage: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to upload contract")
		return
	}

	// データベースを更新
	type contractUpdate struct {
		FilePath    string `json:"file_path"`
		FileName    string `json:"file_name"`
		FileSize    int64  `json:"file_size"`
		ContentType string `json:"content_type"`
		UpdatedAt   string `json:"updated_at"`
	}

	updateData := contractUpdate{
		FilePath:    filePath,
		FileName:    header.Filename,
		FileSize:    int64(len(fileData)),
		ContentType: contentType,
		UpdatedAt:   time.Now().UTC().Format(time.RFC3339),
	}

	_, _, err = client.From("thread_contract_documents").
		Update(updateData, "", "").
		Eq("id", contractID).
		Execute()

	if err != nil {
		log.Printf("[UpdateContract] Failed to update contract in database: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to update contract")
		return
	}

	response.Success(w, http.StatusOK, map[string]string{
		"message":   "Contract updated successfully",
		"file_path": filePath,
	})
}

// AddContractSignature handles adding a signature to a contract
func (s *Server) AddContractSignature(w http.ResponseWriter, r *http.Request) {
	userID, ok := utils.RequireUserID(r, w)
	if !ok {
		return
	}

	// URLからcontract_idを取得
	contractID := strings.TrimPrefix(r.URL.Path, "/api/contracts/")
	contractID = strings.TrimSuffix(contractID, "/sign")
	contractID = strings.Trim(contractID, "/")

	if contractID == "" {
		response.Error(w, http.StatusBadRequest, "Contract ID required")
		return
	}

	type signatureRequest struct {
		SignatureData string `json:"signature_data"`
	}

	var req signatureRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[AddContractSignature] Failed to decode request: %v", err)
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.SignatureData == "" {
		response.Error(w, http.StatusBadRequest, "signature_data is required")
		return
	}

	client, err := s.supabase.GetImpersonateClient(userID)
	if err != nil {
		log.Printf("[AddContractSignature] Failed to get impersonate client: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to add signature")
		return
	}

	// 既存の契約書情報を取得
	type contractDoc struct {
		ID       string `json:"id"`
		ThreadID string `json:"thread_id"`
	}

	var existingContract []contractDoc
	_, err = client.From("thread_contract_documents").
		Select("id, thread_id", "", false).
		Eq("id", contractID).
		ExecuteTo(&existingContract)

	if err != nil || len(existingContract) == 0 {
		log.Printf("[AddContractSignature] Contract not found: %v", err)
		response.Error(w, http.StatusNotFound, "Contract not found")
		return
	}

	contract := existingContract[0]

	// スレッドの参加者であることを確認
	var participantCheck []struct {
		UserID string `json:"user_id"`
	}
	_, err = client.From("thread_participants").
		Select("user_id", "", false).
		Eq("thread_id", contract.ThreadID).
		Eq("user_id", userID).
		ExecuteTo(&participantCheck)

	if err != nil || len(participantCheck) == 0 {
		log.Printf("[AddContractSignature] User is not a participant: %v", err)
		response.Error(w, http.StatusForbidden, "You are not a participant of this thread")
		return
	}

	// 署名を保存（contract_signaturesテーブルに追加）
	type signatureInsert struct {
		ContractID    string `json:"contract_id"`
		UserID        string `json:"user_id"`
		SignatureData string `json:"signature_data"`
		SignedAt      string `json:"signed_at"`
	}

	signature := signatureInsert{
		ContractID:    contractID,
		UserID:        userID,
		SignatureData: req.SignatureData,
		SignedAt:      time.Now().UTC().Format(time.RFC3339),
	}

	_, _, err = client.From("contract_signatures").
		Insert(signature, false, "", "", "").
		Execute()

	if err != nil {
		log.Printf("[AddContractSignature] Failed to save signature: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to save signature")
		return
	}

	response.Success(w, http.StatusCreated, map[string]string{
		"message": "Signature added successfully",
	})
}

// CreateSaleRequest creates a new sale request
func (s *Server) CreateSaleRequest(w http.ResponseWriter, r *http.Request) {
	userID, ok := utils.RequireUserID(r, w)
	if !ok {
		return
	}

	var req models.CreateSaleRequestRequest
	if !utils.DecodeAndValidate(r, w, &req) {
		return
	}

	client, err := s.supabase.GetImpersonateClient(userID)
	if err != nil {
		log.Printf("[CreateSaleRequest] Failed to get impersonate client: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to create sale request")
		return
	}

	// スレッドの参加者であることを確認
	var participantCheck []struct {
		UserID string `json:"user_id"`
	}
	_, err = client.From("thread_participants").
		Select("user_id", "", false).
		Eq("thread_id", req.ThreadID).
		Eq("user_id", userID).
		ExecuteTo(&participantCheck)

	if err != nil || len(participantCheck) == 0 {
		// スレッド作成者も参加者として扱う
		var threadCheck []struct {
			CreatedBy string `json:"created_by"`
		}
		_, err = client.From("threads").
			Select("created_by", "", false).
			Eq("id", req.ThreadID).
			Eq("created_by", userID).
			ExecuteTo(&threadCheck)

		if err != nil || len(threadCheck) == 0 {
			log.Printf("[CreateSaleRequest] User is not a participant: %v", err)
			response.Error(w, http.StatusForbidden, "You are not a participant of this thread")
			return
		}
	}

	// 投稿がユーザーのものであることを確認
	var postCheck []struct {
		AuthorUserID string `json:"author_user_id"`
	}
	_, err = client.From("posts").
		Select("author_user_id", "", false).
		Eq("id", req.PostID).
		Eq("author_user_id", userID).
		ExecuteTo(&postCheck)

	if err != nil || len(postCheck) == 0 {
		log.Printf("[CreateSaleRequest] Post not found or not owned by user: %v", err)
		response.Error(w, http.StatusForbidden, "Post not found or you don't own this post")
		return
	}

	// 売り手（ユーザー）のStripeアカウントを確認
	var sellerProfile []struct {
		StripeAccountID           string `json:"stripe_account_id"`
		StripeOnboardingCompleted bool   `json:"stripe_onboarding_completed"`
	}
	_, err = client.From("profiles").
		Select("stripe_account_id,stripe_onboarding_completed", "", false).
		Eq("id", userID).
		ExecuteTo(&sellerProfile)

	if err != nil || len(sellerProfile) == 0 {
		log.Printf("[CreateSaleRequest] Failed to get seller profile: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to verify seller account")
		return
	}

	// Stripeアカウントが登録されているか確認
	if sellerProfile[0].StripeAccountID == "" {
		log.Printf("[CreateSaleRequest] Seller does not have a Stripe account")
		response.Error(w, http.StatusBadRequest, "Stripe account not registered. Please complete your payment settings in your profile.")
		return
	}

	// Stripeオンボーディングが完了しているか確認
	if !sellerProfile[0].StripeOnboardingCompleted {
		log.Printf("[CreateSaleRequest] Seller's Stripe onboarding is not completed")
		response.Error(w, http.StatusBadRequest, "Stripe account verification not completed. Please complete the verification process in your payment settings.")
		return
	}

	// 既存の売却リクエストをチェック（同じスレッドとプロダクトの組み合わせ）
	var existingRequest []struct {
		ID string `json:"id"`
	}
	_, err = client.From("sale_requests").
		Select("id", "", false).
		Eq("thread_id", req.ThreadID).
		Eq("post_id", req.PostID).
		ExecuteTo(&existingRequest)

	if err == nil && len(existingRequest) > 0 {
		log.Printf("[CreateSaleRequest] Sale request already exists for this thread and post")
		response.Error(w, http.StatusConflict, "Sale request already exists for this thread and post")
		return
	}

	// Stripe Payment Intentを作成（C2C決済用）
	ctx := r.Context()
	// プラットフォーム手数料: 10%
	applicationFeeAmount := req.Price / 10

	paymentIntent, err := s.stripeService.CreatePaymentIntent(
		ctx,
		req.Price,
		"jpy", // 日本円
		sellerProfile[0].StripeAccountID,
		"", // sale_request_idは後で設定
		applicationFeeAmount,
	)

	if err != nil {
		log.Printf("[CreateSaleRequest] Failed to create Stripe Payment Intent: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to create payment intent")
		return
	}

	log.Printf("[CreateSaleRequest] Created Payment Intent: %s", paymentIntent.ID)

	// 売却リクエストを作成
	type saleRequestInsert struct {
		ThreadID        string `json:"thread_id"`
		UserID          string `json:"user_id"`
		PostID          string `json:"post_id"`
		Price           int64  `json:"price"`
		PhoneNumber     string `json:"phone_number,omitempty"`
		Status          string `json:"status"`
		PaymentIntentID string `json:"payment_intent_id"`
	}

	insertData := saleRequestInsert{
		ThreadID:        req.ThreadID,
		UserID:          userID,
		PostID:          req.PostID,
		Price:           req.Price,
		PhoneNumber:     req.PhoneNumber,
		Status:          string(models.SaleRequestStatusPending),
		PaymentIntentID: paymentIntent.ID,
	}

	var createdRequests []models.SaleRequest
	_, err = client.From("sale_requests").
		Insert(insertData, false, "", "", "").
		ExecuteTo(&createdRequests)

	if err != nil {
		log.Printf("[CreateSaleRequest] Failed to create sale request: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to create sale request")
		return
	}

	if len(createdRequests) == 0 {
		log.Printf("[CreateSaleRequest] No sale request was created")
		response.Error(w, http.StatusInternalServerError, "Failed to create sale request")
		return
	}

	response.Success(w, http.StatusCreated, createdRequests[0])
}

// RefundSaleRequest refunds a sale request
func (s *Server) RefundSaleRequest(w http.ResponseWriter, r *http.Request) {
	userID, ok := utils.RequireUserID(r, w)
	if !ok {
		return
	}

	var req struct {
		SaleRequestID string  `json:"sale_request_id"`
		Amount        *int64  `json:"amount,omitempty"` // nil = 全額返金
		Reason        string  `json:"reason,omitempty"` // "requested_by_customer", "duplicate", "fraudulent"
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.SaleRequestID == "" {
		response.Error(w, http.StatusBadRequest, "sale_request_id is required")
		return
	}

	client, err := s.supabase.GetImpersonateClient(userID)
	if err != nil {
		log.Printf("[RefundSaleRequest] Failed to get impersonate client: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to process refund")
		return
	}

	// 売却リクエストを取得
	var saleRequests []struct {
		ID              string `json:"id"`
		UserID          string `json:"user_id"`
		ThreadID        string `json:"thread_id"`
		PaymentIntentID string `json:"payment_intent_id"`
		Price           int64  `json:"price"`
		Status          string `json:"status"`
	}

	_, err = client.From("sale_requests").
		Select("*", "", false).
		Eq("id", req.SaleRequestID).
		ExecuteTo(&saleRequests)

	if err != nil || len(saleRequests) == 0 {
		log.Printf("[RefundSaleRequest] Sale request not found: %v", err)
		response.Error(w, http.StatusNotFound, "Sale request not found")
		return
	}

	saleRequest := saleRequests[0]

	// 売り手本人または買い手のみ返金可能（権限チェック）
	// スレッドの参加者であることを確認
	var participantCheck []struct {
		UserID string `json:"user_id"`
	}
	_, err = client.From("thread_participants").
		Select("user_id", "", false).
		Eq("thread_id", saleRequest.ThreadID).
		Eq("user_id", userID).
		ExecuteTo(&participantCheck)

	if err != nil || len(participantCheck) == 0 {
		log.Printf("[RefundSaleRequest] User is not authorized: %v", err)
		response.Error(w, http.StatusForbidden, "You are not authorized to refund this sale request")
		return
	}

	// ステータスチェック（activeのみ返金可能）
	if saleRequest.Status != "active" {
		response.Error(w, http.StatusBadRequest, "Only active sale requests can be refunded")
		return
	}

	// Payment Intent IDチェック
	if saleRequest.PaymentIntentID == "" {
		response.Error(w, http.StatusBadRequest, "No payment intent found for this sale request")
		return
	}

	// 返金理由のデフォルト設定
	reason := req.Reason
	if reason == "" {
		reason = "requested_by_customer"
	}

	// Stripe返金を実行
	ctx := r.Context()
	metadata := map[string]string{
		"sale_request_id": req.SaleRequestID,
		"user_id":         userID,
	}

	refund, err := s.stripeService.CreateRefund(
		ctx,
		saleRequest.PaymentIntentID,
		req.Amount, // nil = 全額返金
		reason,
		metadata,
	)

	if err != nil {
		log.Printf("[RefundSaleRequest] Failed to create Stripe refund: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to process refund")
		return
	}

	log.Printf("[RefundSaleRequest] Created refund: %s for sale_request: %s", refund.ID, req.SaleRequestID)

	// sale_requestsテーブルを更新（ステータスをcancelledに）
	updateData := map[string]interface{}{
		"status":     "cancelled",
		"updated_at": time.Now(),
	}

	_, err = client.From("sale_requests").
		Update(updateData, "", "").
		Eq("id", req.SaleRequestID).
		ExecuteTo(nil)

	if err != nil {
		log.Printf("[RefundSaleRequest] Failed to update sale_request status: %v", err)
		// Stripe返金は既に完了しているので、エラーにはしない
	}

	response.Success(w, http.StatusOK, map[string]interface{}{
		"refund_id": refund.ID,
		"amount":    refund.Amount,
		"status":    refund.Status,
		"message":   "Refund processed successfully",
	})
}

// GetSaleRequests retrieves sale requests for a thread
func (s *Server) GetSaleRequests(w http.ResponseWriter, r *http.Request) {
	userID, ok := utils.RequireUserID(r, w)
	if !ok {
		return
	}

	threadID := r.URL.Query().Get("thread_id")
	if threadID == "" {
		response.Error(w, http.StatusBadRequest, "thread_id query parameter required")
		return
	}

	client, err := s.supabase.GetImpersonateClient(userID)
	if err != nil {
		log.Printf("[GetSaleRequests] Failed to get impersonate client: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to fetch sale requests")
		return
	}

	// スレッドの参加者であることを確認
	var participantCheck []struct {
		UserID string `json:"user_id"`
	}
	_, err = client.From("thread_participants").
		Select("user_id", "", false).
		Eq("thread_id", threadID).
		Eq("user_id", userID).
		ExecuteTo(&participantCheck)

	if err != nil || len(participantCheck) == 0 {
		// スレッド作成者も参加者として扱う
		var threadCheck []struct {
			CreatedBy string `json:"created_by"`
		}
		_, err = client.From("threads").
			Select("created_by", "", false).
			Eq("id", threadID).
			Eq("created_by", userID).
			ExecuteTo(&threadCheck)

		if err != nil || len(threadCheck) == 0 {
			log.Printf("[GetSaleRequests] User is not a participant: %v", err)
			response.Error(w, http.StatusForbidden, "You are not a participant of this thread")
			return
		}
	}

	// 売却リクエストを取得
	var saleRequests []models.SaleRequest
	_, err = client.From("sale_requests").
		Select("*", "", false).
		Eq("thread_id", threadID).
		Order("created_at", nil).
		ExecuteTo(&saleRequests)

	if err != nil {
		log.Printf("[GetSaleRequests] Failed to query sale requests: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to fetch sale requests")
		return
	}

	// 投稿情報を取得して結合
	var saleRequestsWithPost []models.SaleRequestWithPost
	for _, sr := range saleRequests {
		var posts []models.Post
		_, err = client.From("posts").
			Select("*", "", false).
			Eq("id", sr.PostID).
			Limit(1, "").
			ExecuteTo(&posts)

		if err != nil || len(posts) == 0 {
			if err != nil {
				log.Printf("[GetSaleRequests] Failed to query post %s: %v", sr.PostID, err)
			}
			// 投稿が見つからない場合はnilとして扱う
			saleRequestsWithPost = append(saleRequestsWithPost, models.SaleRequestWithPost{
				SaleRequest: sr,
				Post:        nil,
			})
		} else {
			saleRequestsWithPost = append(saleRequestsWithPost, models.SaleRequestWithPost{
				SaleRequest: sr,
				Post:        &posts[0],
			})
		}
	}

	response.Success(w, http.StatusOK, saleRequestsWithPost)
}

// ConfirmSaleRequest confirms a sale request and processes payment
func (s *Server) ConfirmSaleRequest(w http.ResponseWriter, r *http.Request) {
	userID, ok := utils.RequireUserID(r, w)
	if !ok {
		return
	}

	var req struct {
		SaleRequestID string `json:"sale_request_id"`
	}
	if !utils.DecodeAndValidate(r, w, &req) {
		return
	}

	client, err := s.supabase.GetImpersonateClient(userID)
	if err != nil {
		log.Printf("[ConfirmSaleRequest] Failed to get impersonate client: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to confirm sale request")
		return
	}

	// 売却リクエストを取得
	var saleRequests []models.SaleRequest
	_, err = client.From("sale_requests").
		Select("*", "", false).
		Eq("id", req.SaleRequestID).
		ExecuteTo(&saleRequests)

	if err != nil || len(saleRequests) == 0 {
		log.Printf("[ConfirmSaleRequest] Sale request not found: %v", err)
		response.Error(w, http.StatusNotFound, "Sale request not found")
		return
	}

	saleRequest := saleRequests[0]

	// 売り手本人でないことを確認（買い手のみが確定できる）
	if saleRequest.UserID == userID {
		log.Printf("[ConfirmSaleRequest] Seller cannot confirm their own sale request")
		response.Error(w, http.StatusForbidden, "You cannot confirm your own sale request")
		return
	}

	// ステータスがpendingであることを確認
	if saleRequest.Status != models.SaleRequestStatusPending {
		log.Printf("[ConfirmSaleRequest] Sale request is not in pending status: %s", saleRequest.Status)
		response.Error(w, http.StatusBadRequest, "Sale request is not in pending status")
		return
	}

	// 買い手（現在のユーザー）のクライアントシークレットを取得して返す
	// フロントエンドでStripe.jsを使って決済を完了させる
	ctx := r.Context()
	paymentIntent, err := s.stripeService.GetPaymentIntent(ctx, saleRequest.PaymentIntentID)
	if err != nil {
		log.Printf("[ConfirmSaleRequest] Failed to get payment intent: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to get payment intent")
		return
	}

	// クライアントシークレットを返す
	response.Success(w, http.StatusOK, map[string]interface{}{
		"client_secret":    paymentIntent.ClientSecret,
		"amount":           paymentIntent.Amount,
		"sale_request_id":  saleRequest.ID,
		"payment_intent_id": saleRequest.PaymentIntentID,
	})
}
