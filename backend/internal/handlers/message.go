package handlers

import (
	"fmt"
	"io"
	"log"
	"mime"
	"net/http"
	"path/filepath"
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
		Age               *int    `json:"age"`
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
			if signedURL, ok := signedURLMap[*row.IconURL]; ok {
				iconURL = &signedURL
			} else {
				iconURL = row.IconURL
			}
		}

		profiles = append(profiles, models.Profile{
			ID:                row.ID,
			Role:              row.Role,
			Party:             row.Party,
			DisplayName:       row.DisplayName,
			Age:               row.Age,
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

		var profileRows []profileRow
		_, err = serviceClient.From("profiles").
			Select("id, role, party, display_name, age, icon_url, nda_flag, terms_accepted_at, privacy_accepted_at, stripe_customer_id, created_at, updated_at", "", false).
			In("id", participantIDList).
			ExecuteTo(&profileRows)

		if err == nil {
			var iconPaths []string
			for _, row := range profileRows {
				if row.IconURL != nil && *row.IconURL != "" {
					iconPaths = append(iconPaths, *row.IconURL)
				}
			}

			signedURLMap := s.supabase.GetBatchSignedURLs("profile-icons", iconPaths, 3600)
			profiles := s.buildProfilesFromRows(profileRows, signedURLMap)
			for _, profile := range profiles {
				profilesMap[profile.ID] = profile
			}
		}
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
			}
		}

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
									Select("id, role, party, display_name, age, icon_url, nda_flag, terms_accepted_at, privacy_accepted_at, stripe_customer_id, created_at, updated_at", "", false).
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
									thread.Participants = s.buildProfilesFromRows(profileRows, signedURLMap)
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
					Select("id, role, party, display_name, age, icon_url, nda_flag, terms_accepted_at, privacy_accepted_at, stripe_customer_id, created_at, updated_at", "", false).
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
					threadDetail.Participants = s.buildProfilesFromRows(profileRows, signedURLMap)
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

	var profileRows []profileRow
	_, err = client.From("profiles").
		Select("id, role, party, display_name, age, icon_url, nda_flag, terms_accepted_at, privacy_accepted_at, stripe_customer_id, created_at, updated_at", "", false).
		In("id", participantIDs).
		ExecuteTo(&profileRows)

	if err != nil {
		thread.Participants = []models.Profile{}
		response.Success(w, http.StatusOK, thread)
		return
	}

	var iconPaths []string
	for _, row := range profileRows {
		if row.IconURL != nil && *row.IconURL != "" {
			iconPaths = append(iconPaths, *row.IconURL)
		}
	}

	signedURLMap := s.supabase.GetBatchSignedURLs("profile-icons", iconPaths, 3600)
	thread.Participants = s.buildProfilesFromRows(profileRows, signedURLMap)

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
		Order("created_at", nil).
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
			signedURL, err := s.supabase.GetSignedURL("message-images", filePath, 3600)
			if err == nil {
				msg.ImageURL = &signedURL
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
						message := models.Message{
							ID:           retryResp[0].ID,
							ThreadID:     retryResp[0].ThreadID,
							SenderUserID: retryResp[0].SenderUserID,
							Type:         models.MessageType(retryResp[0].Type),
							Text:         retryResp[0].Text,
							ImageURL:     req.FileURL,
							CreatedAt:    parseTime(retryResp[0].CreatedAt),
						}
						response.Success(w, http.StatusCreated, message)
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

	message := models.Message{
		ID:           messageResp[0].ID,
		ThreadID:     messageResp[0].ThreadID,
		SenderUserID: messageResp[0].SenderUserID,
		Type:         models.MessageType(messageResp[0].Type),
		Text:         messageResp[0].Text,
		CreatedAt:    parseTime(messageResp[0].CreatedAt),
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
			message.ImageURL = req.FileURL
		}
	}

	response.Success(w, http.StatusCreated, message)
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
