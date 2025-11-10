package handlers

import (
	"encoding/json"
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



// HandleThreads routes thread requests
func (s *Server) HandleThreads(w http.ResponseWriter, r *http.Request) {
	log.Printf("\n========== HandleThreads START ==========\n")
	log.Printf("[HandleThreads] Request Method: %s", r.Method)
	log.Printf("[HandleThreads] Request URL: %s", r.URL.String())
	log.Printf("[HandleThreads] Request Path: %s", r.URL.Path)
	log.Printf("[HandleThreads] Remote Addr: %s", r.RemoteAddr)
	log.Printf("[HandleThreads] All Headers: %v", r.Header)

	switch r.Method {
	case http.MethodGet:
		log.Printf("[HandleThreads] ✓ Routing to GetThreads")
		s.GetThreads(w, r)
	case http.MethodPost:
		log.Printf("[HandleThreads] ✓ Routing to CreateThread")
		s.CreateThread(w, r)
	default:
		log.Printf("[HandleThreads] ❌ ERROR: Method not allowed: %s", r.Method)
		log.Printf("========== HandleThreads END (Method Not Allowed) ==========\n\n")
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
	log.Printf("\n========== HandleMessages START ==========\n")
	log.Printf("[HandleMessages] Request Method: %s", r.Method)
	log.Printf("[HandleMessages] Request URL: %s", r.URL.String())
	log.Printf("[HandleMessages] Request Path: %s", r.URL.Path)
	
	switch r.Method {
	case http.MethodGet:
		log.Printf("[HandleMessages] ✓ Routing to GetMessages")
		s.GetMessages(w, r)
	case http.MethodPost:
		log.Printf("[HandleMessages] ✓ Routing to SendMessage")
		s.SendMessage(w, r)
	default:
		log.Printf("[HandleMessages] ❌ ERROR: Method not allowed: %s", r.Method)
		log.Printf("========== HandleMessages END (Method Not Allowed) ==========\n\n")
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// CreateThread creates a new conversation thread
func (s *Server) CreateThread(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, ok := utils.RequireUserID(r, w)
	if !ok {
		return
	}

	var req models.CreateThreadRequest
	if !utils.DecodeAndValidate(r, w, &req) {
		return
	}

	log.Printf("[CreateThread] Request decoded: RelatedPostID=%v, ParticipantIDs=%v", req.RelatedPostID, req.ParticipantIDs)

	// Check if user is trying to create a thread with themselves
	for _, pid := range req.ParticipantIDs {
		if pid == userID {
			log.Printf("[CreateThread] User %s attempted to create thread with themselves", userID)
			response.Error(w, http.StatusBadRequest, "Cannot create a thread with yourself")
			return
		}
	}

	// Get Supabase client with impersonate JWT for RLS
	client, err := s.supabase.GetImpersonateClient(userID)
	if err != nil {
		log.Printf("[CreateThread] Failed to get impersonate client: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to create thread")
		return
	}

	// Create thread
	type ThreadInsert struct {
		CreatedBy     string  `json:"created_by"`
		RelatedPostID *string `json:"related_post_id"`
	}

	threadInsert := ThreadInsert{
		CreatedBy:     userID,
		RelatedPostID: req.RelatedPostID,
	}

	type ThreadResponse struct {
		ID            string  `json:"id"`
		CreatedBy     string  `json:"created_by"`
		RelatedPostID *string `json:"related_post_id"`
		CreatedAt     string  `json:"created_at"`
	}

	var threadResponse []ThreadResponse
	_, err = client.From("threads").
		Insert(threadInsert, false, "", "", "").
		ExecuteTo(&threadResponse)

	if err != nil {
		log.Printf("[CreateThread] Failed to insert thread: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to create thread")
		return
	}

	if len(threadResponse) == 0 {
		log.Printf("[CreateThread] No thread returned after insert")
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
	// 重要: thread_participantsへの挿入はserviceClientを使用してRLSを回避する
	// これにより、messages_insert_participantsポリシーが正しく機能する
	participantIDs := append(req.ParticipantIDs, userID)
	uniqueParticipants := make(map[string]bool)
	for _, pid := range participantIDs {
		uniqueParticipants[pid] = true
	}

	type ParticipantInsert struct {
		ThreadID string `json:"thread_id"`
		UserID   string `json:"user_id"`
	}

	// Service clientを使用して参加者を追加（RLSを回避）
	// これにより、messages_insert_participantsポリシーが正しく機能する
	serviceClient := s.supabase.GetServiceClient()
	log.Printf("[CreateThread] Adding %d participants to thread %s using service client", len(uniqueParticipants), thread.ID)
	
	// 既存の参加者を事前にチェック
	type ParticipantCheck struct {
		UserID string `json:"user_id"`
	}
	var existingParticipants []ParticipantCheck
	_, checkErr := serviceClient.From("thread_participants").
		Select("user_id", "", false).
		Eq("thread_id", thread.ID).
		ExecuteTo(&existingParticipants)
	
	existingParticipantMap := make(map[string]bool)
	if checkErr == nil {
		for _, ep := range existingParticipants {
			existingParticipantMap[ep.UserID] = true
		}
		log.Printf("[CreateThread] Found %d existing participants", len(existingParticipants))
	}
	
	// 一括挿入用のスライスを作成
	var participantInserts []ParticipantInsert
	for pid := range uniqueParticipants {
		// 既に参加者として登録されている場合はスキップ
		if existingParticipantMap[pid] {
			log.Printf("[CreateThread] Participant %s already exists, skipping", pid)
			continue
		}

		participantInserts = append(participantInserts, ParticipantInsert{
			ThreadID: thread.ID,
			UserID:   pid,
		})
		log.Printf("[CreateThread] Will insert participant: thread_id=%s, user_id=%s", thread.ID, pid)
	}

	// 挿入するデータがある場合のみ実行
	if len(participantInserts) > 0 {
		log.Printf("[CreateThread] Inserting %d participants in batch", len(participantInserts))
		_, _, err = serviceClient.From("thread_participants").
			Insert(participantInserts, false, "", "", "").
			Execute()

		if err != nil {
			log.Printf("[CreateThread] Failed to add participants to thread %s: %v", thread.ID, err)
			log.Printf("[CreateThread] Thread created_by: %s, Current userID: %s", thread.CreatedBy, userID)
			response.Error(w, http.StatusInternalServerError, fmt.Sprintf("Failed to add participants: %v", err))
			return
		}
		log.Printf("[CreateThread] Successfully added %d participants", len(participantInserts))
	}
	log.Printf("[CreateThread] Successfully added all participants to thread %s", thread.ID)

	response.Success(w, http.StatusCreated, thread)
}

// GetThreads retrieves all threads for the authenticated user
func (s *Server) GetThreads(w http.ResponseWriter, r *http.Request) {
	log.Printf("\n========== GetThreads START ==========\n")

	if r.Method != http.MethodGet {
		log.Printf("[GetThreads] ERROR: Method not allowed: %s", r.Method)
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		log.Printf("[GetThreads] ERROR: user_id not found in context")
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	log.Printf("[GetThreads] Authenticated user: %s", userID)

	// Get Supabase client with impersonate JWT for RLS
	client, err := s.supabase.GetImpersonateClient(userID)
	if err != nil {
		log.Printf("[GetThreads] ERROR: Failed to get impersonate client: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to fetch threads")
		return
	}

	// Query thread_participants using user_id = auth.uid() condition
	// This uses the first part of thread_participants_select policy (user_id = auth.uid())
	// which doesn't query threads table, avoiding recursion
	type ThreadParticipantRow struct {
		ThreadID string `json:"thread_id"`
		UserID   string `json:"user_id"`
	}

	var threadParticipantRows []ThreadParticipantRow
	_, err = client.From("thread_participants").
		Select("thread_id, user_id", "", false).
		Eq("user_id", userID).
		ExecuteTo(&threadParticipantRows)

	if err != nil {
		log.Printf("[GetThreads] ERROR: Failed to query thread_participants: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to fetch threads")
		return
	}

	if len(threadParticipantRows) == 0 {
		log.Printf("[GetThreads] No threads found for user")
		response.Success(w, http.StatusOK, []models.ThreadWithLastMessage{})
		return
	}

	// Extract unique thread IDs
	threadIDMap := make(map[string]bool)
	for _, p := range threadParticipantRows {
		threadIDMap[p.ThreadID] = true
	}

	// Extract unique thread IDs to query
	threadIDList := make([]string, 0, len(threadIDMap))
	for threadID := range threadIDMap {
		threadIDList = append(threadIDList, threadID)
	}

	// Query all threads in a single batch using IN clause
	// Note: Use service client to bypass RLS for thread details since we already verified
	// user is a participant via thread_participants query
	type ThreadRow struct {
		ID            string  `json:"id"`
		CreatedBy     string  `json:"created_by"`
		RelatedPostID *string `json:"related_post_id"`
		CreatedAt     string  `json:"created_at"`
	}

	// Use service client to avoid RLS recursion issues with IN queries
	serviceClient := s.supabase.GetServiceClient()
	var threadRows []ThreadRow
	_, err = serviceClient.From("threads").
		Select("id, created_by, related_post_id, created_at", "", false).
		In("id", threadIDList).
		ExecuteTo(&threadRows)

	if err != nil {
		log.Printf("[GetThreads] ERROR: Failed to query threads: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to fetch threads")
		return
	}

	if len(threadRows) == 0 {
		log.Printf("[GetThreads] No threads found for user")
		response.Success(w, http.StatusOK, []models.ThreadWithLastMessage{})
		return
	}

	log.Printf("[GetThreads] Found %d threads", len(threadRows))

	// Get last messages for all threads in a single query
	type MessageRow struct {
		ID           string  `json:"id"`
		ThreadID     string  `json:"thread_id"`
		SenderUserID string  `json:"sender_user_id"`
		Type         string  `json:"type"`
		Text         *string `json:"text"`
		CreatedAt    string  `json:"created_at"`
	}

	// Collect all thread IDs
	threadIDs := make([]string, len(threadRows))
	for i, row := range threadRows {
		threadIDs[i] = row.ID
	}

	// Query all messages for these threads and group by thread_id
	var allMessageRows []MessageRow
	_, err = serviceClient.From("messages").
		Select("id, thread_id, sender_user_id, type, text, created_at", "", false).
		In("thread_id", threadIDs).
		ExecuteTo(&allMessageRows)

	// Group messages by thread_id and keep only the latest
	lastMessageMap := make(map[string]MessageRow)
	if err == nil {
		for _, msg := range allMessageRows {
			existing, exists := lastMessageMap[msg.ThreadID]
			if !exists || msg.CreatedAt > existing.CreatedAt {
				lastMessageMap[msg.ThreadID] = msg
			}
		}
	}

	// Get all participants for all threads in a single query
	type ParticipantRow struct {
		ThreadID string `json:"thread_id"`
		UserID   string `json:"user_id"`
	}

	var allParticipantRows []ParticipantRow
	_, err = serviceClient.From("thread_participants").
		Select("thread_id, user_id", "", false).
		In("thread_id", threadIDList).
		ExecuteTo(&allParticipantRows)

	// Group participants by thread_id
	participantsByThread := make(map[string][]string)
	allParticipantIDs := make(map[string]bool)
	if err == nil {
		for _, p := range allParticipantRows {
			participantsByThread[p.ThreadID] = append(participantsByThread[p.ThreadID], p.UserID)
			allParticipantIDs[p.UserID] = true
		}
	}

	// Get all participant profiles in a single query
	type ProfileRow struct {
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

	profilesMap := make(map[string]models.Profile)
	if len(allParticipantIDs) > 0 {
		participantIDList := make([]string, 0, len(allParticipantIDs))
		for id := range allParticipantIDs {
			participantIDList = append(participantIDList, id)
		}

		log.Printf("[GetThreads] Fetching profiles for %d participants: %v", len(participantIDList), participantIDList)

		// Use service client to bypass RLS and get all participant profiles
		var profileRows []ProfileRow
		_, err = serviceClient.From("profiles").
			Select("id, role, party, display_name, age, icon_url, nda_flag, terms_accepted_at, privacy_accepted_at, stripe_customer_id, created_at, updated_at", "", false).
			In("id", participantIDList).
			ExecuteTo(&profileRows)

		if err != nil {
			log.Printf("[GetThreads] ERROR: Failed to fetch profiles: %v", err)
		} else {
			log.Printf("[GetThreads] Successfully fetched %d profiles", len(profileRows))

			// Collect all icon paths for batch signed URL generation
			var iconPaths []string
			for _, row := range profileRows {
				if row.IconURL != nil && *row.IconURL != "" {
					iconPaths = append(iconPaths, *row.IconURL)
				}
			}

			// Generate signed URLs in batch
			signedURLMap := s.supabase.GetBatchSignedURLs("profile-icons", iconPaths, 3600)
			log.Printf("[GetThreads] Generated %d signed URLs in batch", len(signedURLMap))

			for _, row := range profileRows {
				log.Printf("[GetThreads] Profile: id=%s, display_name=%s, icon_url=%v", row.ID, row.DisplayName, row.IconURL)

				var termsAcceptedAt, privacyAcceptedAt *time.Time
				if row.TermsAcceptedAt != nil {
					t := parseTime(*row.TermsAcceptedAt)
					termsAcceptedAt = &t
				}
				if row.PrivacyAcceptedAt != nil {
					t := parseTime(*row.PrivacyAcceptedAt)
					privacyAcceptedAt = &t
				}

				// Get signed URL from batch result
				var iconURL *string
				if row.IconURL != nil && *row.IconURL != "" {
					if signedURL, ok := signedURLMap[*row.IconURL]; ok {
						iconURL = &signedURL
						log.Printf("[GetThreads] Using batch-generated signed URL for icon: %s", signedURL)
					} else {
						log.Printf("[GetThreads] Warning: No signed URL found for icon %s", *row.IconURL)
						iconURL = row.IconURL
					}
				}

				profilesMap[row.ID] = models.Profile{
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
				}
			}
		}
	}

	// Build response with last message and participant IDs
	var threads []models.ThreadWithLastMessage
	for _, row := range threadRows {
		thread := models.ThreadWithLastMessage{
			Thread: models.Thread{
				ID:            row.ID,
				CreatedBy:     row.CreatedBy,
				RelatedPostID: row.RelatedPostID,
				CreatedAt:     parseTime(row.CreatedAt),
			},
		}

		// Get last message from map
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

		// Get participant IDs from grouped map
		thread.ParticipantIDs = participantsByThread[row.ID]

		// Always include creator if not already in list
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

		// Build participants list with profile information
		thread.Participants = make([]models.Profile, 0, len(thread.ParticipantIDs))
		for _, pid := range thread.ParticipantIDs {
			if profile, exists := profilesMap[pid]; exists {
				thread.Participants = append(thread.Participants, profile)
			} else {
				log.Printf("[GetThreads] WARNING: Profile not found for participant %s in thread %s", pid, thread.ID)
			}
		}

		log.Printf("[GetThreads] Thread %s: %d participant_ids, %d participants with profiles", thread.ID, len(thread.ParticipantIDs), len(thread.Participants))

		thread.UnreadCount = 0 // TODO: Implement unread count logic
		threads = append(threads, thread)
	}

	log.Printf("[GetThreads] SUCCESS: Returning %d threads", len(threads))
	response.Success(w, http.StatusOK, threads)
}

// GetThreadByID retrieves a specific thread with its details
func (s *Server) GetThreadByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	threadID := strings.TrimPrefix(r.URL.Path, "/api/threads/")
	if threadID == "" {
		response.Error(w, http.StatusBadRequest, "Thread ID required")
		return
	}

	log.Printf("[GetThreadByID] Request: userID=%s, threadID=%s", userID, threadID)

	// Get Supabase client with impersonate JWT for RLS
	client, err := s.supabase.GetImpersonateClient(userID)
	if err != nil {
		log.Printf("[GetThreadByID] Failed to get impersonate client: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to fetch thread")
		return
	}

	// Check if user is participant first
	type ParticipantCheck struct {
		UserID string `json:"user_id"`
	}
	var participantCheck []ParticipantCheck
	_, err = client.From("thread_participants").
		Select("user_id", "", false).
		Eq("thread_id", threadID).
		Eq("user_id", userID).
		ExecuteTo(&participantCheck)

	isParticipant := err == nil && len(participantCheck) > 0

	// Use service client to get thread details (bypass RLS since we already checked participant)
	serviceClient := s.supabase.GetServiceClient()
	type ThreadRow struct {
		ID            string  `json:"id"`
		CreatedBy     string  `json:"created_by"`
		RelatedPostID *string `json:"related_post_id"`
		CreatedAt     string  `json:"created_at"`
	}

	var threadRows []ThreadRow
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
		log.Printf("[GetThreadByID] Thread not found: %s", threadID)
		response.Error(w, http.StatusNotFound, "Thread not found")
		return
	}

	// Check access: user must be participant or creator
	isCreator := threadRows[0].CreatedBy == userID
	if !isParticipant && !isCreator {
		log.Printf("[GetThreadByID] Access denied: user %s is not a participant or creator of thread %s", userID, threadID)
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

	// Get all participants using service client (we already verified access)
	type ParticipantRow struct {
		UserID string `json:"user_id"`
	}

	var participantRows []ParticipantRow
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
		log.Printf("[GetThreadByID] No participants found for thread %s", threadID)
		// Empty participants list is valid
		thread.Participants = []models.Profile{}
		response.Success(w, http.StatusOK, thread)
		return
	}

	// Collect participant user IDs
	participantIDs := make([]string, len(participantRows))
	for i, row := range participantRows {
		participantIDs[i] = row.UserID
	}

	// Fetch all participant profiles in a single query
	type ProfileRow struct {
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

	var profileRows []ProfileRow
	_, err = client.From("profiles").
		Select("id, role, party, display_name, age, icon_url, nda_flag, terms_accepted_at, privacy_accepted_at, stripe_customer_id, created_at, updated_at", "", false).
		In("id", participantIDs).
		ExecuteTo(&profileRows)

	if err != nil {
		log.Printf("[GetThreadByID] Failed to fetch profiles: %v", err)
		// Return empty profiles rather than error
		thread.Participants = []models.Profile{}
		response.Success(w, http.StatusOK, thread)
		return
	}

	// Collect all icon paths for batch signed URL generation
	var iconPaths []string
	for _, row := range profileRows {
		if row.IconURL != nil && *row.IconURL != "" {
			iconPaths = append(iconPaths, *row.IconURL)
		}
	}

	// Generate signed URLs in batch
	signedURLMap := s.supabase.GetBatchSignedURLs("profile-icons", iconPaths, 3600)
	log.Printf("[GetThreadByID] Generated %d signed URLs in batch", len(signedURLMap))

	var participants []models.Profile
	for _, row := range profileRows {
		var termsAcceptedAt, privacyAcceptedAt *time.Time
		if row.TermsAcceptedAt != nil {
			t := parseTime(*row.TermsAcceptedAt)
			termsAcceptedAt = &t
		}
		if row.PrivacyAcceptedAt != nil {
			t := parseTime(*row.PrivacyAcceptedAt)
			privacyAcceptedAt = &t
		}

		// Get signed URL from batch result
		var iconURL *string
		if row.IconURL != nil && *row.IconURL != "" {
			if signedURL, ok := signedURLMap[*row.IconURL]; ok {
				iconURL = &signedURL
				log.Printf("[GetThreadByID] Using batch-generated signed URL for icon: %s", signedURL)
			} else {
				log.Printf("[GetThreadByID] Warning: No signed URL found for icon %s", *row.IconURL)
				iconURL = row.IconURL
			}
		}

		p := models.Profile{
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
		}
		participants = append(participants, p)
	}
	thread.Participants = participants

	response.Success(w, http.StatusOK, thread)
}

// GetMessages retrieves messages for a specific thread
func (s *Server) GetMessages(w http.ResponseWriter, r *http.Request) {
	log.Printf("\n========== GetMessages START ==========\n")
	log.Printf("[GetMessages] Request Method: %s", r.Method)
	log.Printf("[GetMessages] Request URL: %s", r.URL.String())
	log.Printf("[GetMessages] Request Path: %s", r.URL.Path)

	if r.Method != http.MethodGet {
		log.Printf("[GetMessages] ERROR: Method not allowed: %s", r.Method)
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := utils.RequireUserID(r, w)
	if !ok {
		log.Printf("[GetMessages] ERROR: user_id not found in context")
		return
	}
	log.Printf("[GetMessages] Authenticated user: %s", userID)

	threadID := r.URL.Query().Get("thread_id")
	if threadID == "" {
		log.Printf("[GetMessages] ERROR: thread_id query parameter missing")
		response.Error(w, http.StatusBadRequest, "thread_id query parameter required")
		return
	}
	log.Printf("[GetMessages] Thread ID: %s", threadID)

	// Get Supabase client with impersonate JWT for RLS
	// RLSポリシー（messages_select_participants）が自動的にアクセスチェックを行う
	client, err := s.supabase.GetImpersonateClient(userID)
	if err != nil {
		log.Printf("[GetMessages] Failed to get impersonate client: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to fetch messages")
		return
	}

	// Query messages
	// RLSポリシーが thread_participants をチェックしてアクセスを制御する
	type MessageRow struct {
		ID           string  `json:"id"`
		ThreadID     string  `json:"thread_id"`
		SenderUserID string  `json:"sender_user_id"`
		Type         string  `json:"type"`
		Text         *string `json:"text"`
		CreatedAt    string  `json:"created_at"`
	}

	var messageRows []MessageRow
	_, err = client.From("messages").
		Select("id, thread_id, sender_user_id, type, text, created_at", "", false).
		Eq("thread_id", threadID).
		Order("created_at", nil). // データベース側でソート（昇順）
		ExecuteTo(&messageRows)

	if err != nil {
		log.Printf("[GetMessages] Failed to query messages: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to fetch messages")
		return
	}

	log.Printf("[GetMessages] Found %d messages for thread %s", len(messageRows), threadID)

	// Get sender profiles
	senderIDs := make(map[string]bool)
	for _, row := range messageRows {
		senderIDs[row.SenderUserID] = true
	}

	type ProfileRow struct {
		ID          string  `json:"id"`
		DisplayName string  `json:"display_name"`
		IconURL     *string `json:"icon_url"`
	}

	profilesMap := make(map[string]ProfileRow)
	if len(senderIDs) > 0 {
		senderIDList := make([]string, 0, len(senderIDs))
		for id := range senderIDs {
			senderIDList = append(senderIDList, id)
		}

		// Query all profiles in a single query using IN clause
		var profileRows []ProfileRow
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

	// Get message IDs for attachment lookup
	messageIDs := make([]string, len(messageRows))
	for i, row := range messageRows {
		messageIDs[i] = row.ID
	}

	// Get attachments for all messages
	type AttachmentRow struct {
		MessageID string `json:"message_id"`
		FileURL   string `json:"file_url"`
	}

	attachmentsMap := make(map[string]string)
	if len(messageIDs) > 0 {
		var attachmentRows []AttachmentRow
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

	var messages []models.MessageWithSender
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

		// If message has attachment, generate signed URL
		if filePath, hasAttachment := attachmentsMap[row.ID]; hasAttachment {
			signedURL, err := s.supabase.GetSignedURL("message-images", filePath, 3600) // 1 hour expiry
			if err == nil {
				msg.ImageURL = &signedURL
			} else {
				log.Printf("[GetMessages] Warning: Failed to generate signed URL for %s: %v", filePath, err)
			}
		}

		messages = append(messages, msg)
	}

	if messages == nil {
		messages = []models.MessageWithSender{}
	}

	log.Printf("[GetMessages] SUCCESS: Returning %d messages", len(messages))
	log.Printf("========== GetMessages END ==========\n\n")
	response.Success(w, http.StatusOK, messages)
}

// SendMessage sends a new message in a thread
func (s *Server) SendMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.CreateMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[SendMessage] Error decoding request body: %v", err)
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	log.Printf("[SendMessage] Request: thread_id=%s, user_id=%s, type=%s", req.ThreadID, userID, req.Type)

	// Validate request
	if err := utils.ValidateStruct(req); err != nil {
		log.Printf("[SendMessage] Validation error: %v", err)
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	// Get Supabase client with impersonate JWT for RLS
	client, err := s.supabase.GetImpersonateClient(userID)
	if err != nil {
		log.Printf("[SendMessage] Failed to get impersonate client: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to send message")
		return
	}

	// スレッド作成者を確認（後でRLSエラー時に使用するため）
	type ThreadRow struct {
		CreatedBy string `json:"created_by"`
	}
	var threadRows []ThreadRow
	_, err = client.From("threads").
		Select("created_by", "", false).
		Eq("id", req.ThreadID).
		ExecuteTo(&threadRows)

	// スレッド作成者の場合、必要に応じて参加者として追加
	if err == nil && len(threadRows) > 0 {
		threadCreator := threadRows[0].CreatedBy
		if threadCreator == userID {
			// 参加者として既に登録されているか確認
			type ParticipantCheck struct {
				UserID string `json:"user_id"`
			}
			var participantCheck []ParticipantCheck
			_, checkErr := client.From("thread_participants").
				Select("user_id", "", false).
				Eq("thread_id", req.ThreadID).
				Eq("user_id", userID).
				ExecuteTo(&participantCheck)

			// 参加者として登録されていない場合、追加する
			if checkErr != nil || len(participantCheck) == 0 {
				log.Printf("[SendMessage] User %s is thread creator but not registered as participant, adding...", userID)
				type ParticipantInsert struct {
					ThreadID string `json:"thread_id"`
					UserID   string `json:"user_id"`
				}
				participantInsert := ParticipantInsert{
					ThreadID: req.ThreadID,
					UserID:   userID,
				}
				_, _, insertErr := client.From("thread_participants").
					Insert(participantInsert, false, "", "", "").
					Execute()

				if insertErr != nil {
					log.Printf("[SendMessage] Failed to add participant (creator): %v", insertErr)
				} else {
					log.Printf("[SendMessage] Successfully added thread creator %s as participant", userID)
				}
			}
		}
	}

	// Insert message using Supabase SDK
	// RLSポリシーが thread_participants をチェックしてアクセスを制御する
	type MessageInsert struct {
		ThreadID     string  `json:"thread_id"`
		SenderUserID string  `json:"sender_user_id"`
		Type         string  `json:"type"`
		Text         *string `json:"text"`
	}

	insertData := MessageInsert{
		ThreadID:     req.ThreadID,
		SenderUserID: userID,
		Type:         string(req.Type),
		Text:         req.Text,
	}

	type MessageResponse struct {
		ID           string  `json:"id"`
		ThreadID     string  `json:"thread_id"`
		SenderUserID string  `json:"sender_user_id"`
		Type         string  `json:"type"`
		Text         *string `json:"text"`
		CreatedAt    string  `json:"created_at"`
	}

	var messageResponse []MessageResponse
	_, err = client.From("messages").
		Insert(insertData, false, "", "", "").
		ExecuteTo(&messageResponse)

	if err != nil {
		log.Printf("[SendMessage] Failed to insert message: %v", err)
		// RLSポリシーによるアクセス拒否の可能性をチェック
		errStr := err.Error()
		if strings.Contains(errStr, "new row violates row-level security") || 
		   strings.Contains(errStr, "RLS") ||
		   strings.Contains(errStr, "policy") ||
		   strings.Contains(errStr, "row-level security policy") {
			log.Printf("[SendMessage] Access denied by RLS policy: user %s may not be a participant of thread %s", userID, req.ThreadID)
			
			// スレッド作成者の場合、参加者として追加して再試行
			if len(threadRows) > 0 && threadRows[0].CreatedBy == userID {
				log.Printf("[SendMessage] User is thread creator, attempting to add as participant and retry...")
				type ParticipantInsert struct {
					ThreadID string `json:"thread_id"`
					UserID   string `json:"user_id"`
				}
				participantInsert := ParticipantInsert{
					ThreadID: req.ThreadID,
					UserID:   userID,
				}
				_, _, insertErr := client.From("thread_participants").
					Insert(participantInsert, false, "", "", "").
					Execute()

				if insertErr == nil {
					log.Printf("[SendMessage] Successfully added participant, retrying message insert...")
					// 再試行
					var retryResponse []MessageResponse
					_, retryErr := client.From("messages").
						Insert(insertData, false, "", "", "").
						ExecuteTo(&retryResponse)

					if retryErr == nil && len(retryResponse) > 0 {
						message := models.Message{
							ID:           retryResponse[0].ID,
							ThreadID:     retryResponse[0].ThreadID,
							SenderUserID: retryResponse[0].SenderUserID,
							Type:         models.MessageType(retryResponse[0].Type),
							Text:         retryResponse[0].Text,
							ImageURL:     req.FileURL,
							CreatedAt:    parseTime(retryResponse[0].CreatedAt),
						}
						log.Printf("[SendMessage] Success: message_id=%s (after retry)", message.ID)
						response.Success(w, http.StatusCreated, message)
						return
					}
					log.Printf("[SendMessage] Retry failed: %v", retryErr)
				} else {
					log.Printf("[SendMessage] Failed to add participant: %v", insertErr)
				}
			}
			
			response.Error(w, http.StatusForbidden, "Access denied: You are not a participant of this thread")
			return
		}
		response.Error(w, http.StatusInternalServerError, "Failed to send message")
		return
	}

	if len(messageResponse) == 0 {
		log.Printf("[SendMessage] No message returned after insert")
		response.Error(w, http.StatusInternalServerError, "Failed to send message")
		return
	}

	message := models.Message{
		ID:           messageResponse[0].ID,
		ThreadID:     messageResponse[0].ThreadID,
		SenderUserID: messageResponse[0].SenderUserID,
		Type:         models.MessageType(messageResponse[0].Type),
		Text:         messageResponse[0].Text,
		CreatedAt:    parseTime(messageResponse[0].CreatedAt),
	}

	// If file_url is provided, save it to message_attachments and add to response
	var imageURL *string
	if req.FileURL != nil && *req.FileURL != "" {
		type AttachmentInsert struct {
			MessageID string `json:"message_id"`
			FileURL   string `json:"file_url"`
		}

		attachmentInsert := AttachmentInsert{
			MessageID: message.ID,
			FileURL:   *req.FileURL,
		}

		_, _, err := client.From("message_attachments").
			Insert(attachmentInsert, false, "", "", "").
			Execute()

		if err != nil {
			log.Printf("[SendMessage] Warning: Failed to insert attachment: %v", err)
			// Don't fail the entire request if attachment insert fails
		} else {
			log.Printf("[SendMessage] Successfully added attachment: %s", *req.FileURL)
			message.ImageURL = req.FileURL
			imageURL = req.FileURL
		}
	}

	log.Printf("[SendMessage] Success: message_id=%s, image_url=%v", message.ID, imageURL)
	response.Success(w, http.StatusCreated, message)
}

// UploadMessageImage handles image upload for messages
func (s *Server) UploadMessageImage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Parse multipart form (max 10MB)
	err := r.ParseMultipartForm(10 << 20) // 10 MB
	if err != nil {
		log.Printf("[UploadMessageImage] Failed to parse form: %v", err)
		response.Error(w, http.StatusBadRequest, "Failed to parse form data")
		return
	}

	// Get file from form
	file, header, err := r.FormFile("image")
	if err != nil {
		log.Printf("[UploadMessageImage] Failed to get file: %v", err)
		response.Error(w, http.StatusBadRequest, "No image file provided")
		return
	}
	defer file.Close()

	// Read file data first (needed for content type detection)
	fileData, err := io.ReadAll(file)
	if err != nil {
		log.Printf("[UploadMessageImage] Failed to read file: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to read file")
		return
	}

	// Detect content type from file content
	contentType := http.DetectContentType(fileData)
	
	// If content type detection fails or returns generic type, try from header
	if contentType == "application/octet-stream" || contentType == "application/json" {
		headerContentType := header.Header.Get("Content-Type")
		if headerContentType != "" {
			contentType = headerContentType
		} else {
			// Fallback to extension-based detection
			ext := filepath.Ext(header.Filename)
			mimeType := mime.TypeByExtension(ext)
			if mimeType != "" {
				contentType = mimeType
			}
		}
	}

	log.Printf("[UploadMessageImage] Detected content type: %s (filename: %s)", contentType, header.Filename)

	// Normalize content type (jpeg/jpg)
	if contentType == "image/jpg" {
		contentType = "image/jpeg"
	}

	// Validate file type
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/webp": true,
		"image/gif":  true,
	}

	if !allowedTypes[contentType] {
		log.Printf("[UploadMessageImage] Invalid file type: %s (filename: %s)", contentType, header.Filename)
		response.Error(w, http.StatusBadRequest, "Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed")
		return
	}

	// Generate unique filename
	ext := filepath.Ext(header.Filename)
	fileName := fmt.Sprintf("%s/%s%s", userID, uuid.New().String(), ext)

	// Upload to Supabase Storage
	filePath, err := s.supabase.UploadFile(userID, "message-images", fileName, fileData, contentType)
	if err != nil {
		log.Printf("[UploadMessageImage] Failed to upload to storage: %v", err)
		log.Printf("[UploadMessageImage] Content-Type: %s, File size: %d bytes, File path: %s", contentType, len(fileData), fileName)
		response.Error(w, http.StatusInternalServerError, fmt.Sprintf("Failed to upload image: %v", err))
		return
	}

	log.Printf("[UploadMessageImage] Successfully uploaded image: %s", filePath)

	// Return the file path (not the full URL)
	response.Success(w, http.StatusCreated, map[string]string{
		"file_path": filePath,
	})
}
