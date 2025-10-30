package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/yourusername/appexit-backend/internal/models"
	"github.com/yourusername/appexit-backend/internal/utils"
	"github.com/yourusername/appexit-backend/pkg/response"
)

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
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.CreateThreadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if err := utils.ValidateStruct(req); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	// Start transaction
	tx, err := s.db.Begin()
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Failed to create thread")
		return
	}
	defer tx.Rollback()

	// Create thread
	var thread models.Thread
	err = tx.QueryRow(`
		INSERT INTO threads (created_by, related_post_id)
		VALUES ($1, $2)
		RETURNING id, created_by, related_post_id, created_at
	`, userID, req.RelatedPostID).Scan(&thread.ID, &thread.CreatedBy, &thread.RelatedPostID, &thread.CreatedAt)

	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Failed to create thread")
		return
	}

	// Add participants (including creator)
	participantIDs := append(req.ParticipantIDs, userID)
	uniqueParticipants := make(map[string]bool)
	for _, pid := range participantIDs {
		uniqueParticipants[pid] = true
	}

	for pid := range uniqueParticipants {
		_, err = tx.Exec(`
			INSERT INTO thread_participants (thread_id, user_id)
			VALUES ($1, $2)
			ON CONFLICT DO NOTHING
		`, thread.ID, pid)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "Failed to add participants")
			return
		}
	}

	if err = tx.Commit(); err != nil {
		response.Error(w, http.StatusInternalServerError, "Failed to create thread")
		return
	}

	response.Success(w, http.StatusCreated, thread)
}

// GetThreads retrieves all threads for the authenticated user
func (s *Server) GetThreads(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	rows, err := s.db.Query(`
		SELECT
			t.id, t.created_by, t.related_post_id, t.created_at,
			m.id, m.sender_user_id, m.type, m.text, m.created_at
		FROM threads t
		INNER JOIN thread_participants tp ON t.id = tp.thread_id
		LEFT JOIN LATERAL (
			SELECT id, sender_user_id, type, text, created_at
			FROM messages
			WHERE thread_id = t.id
			ORDER BY created_at DESC
			LIMIT 1
		) m ON true
		WHERE tp.user_id = $1
		ORDER BY COALESCE(m.created_at, t.created_at) DESC
	`, userID)

	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Failed to fetch threads")
		return
	}
	defer rows.Close()

	var threads []models.ThreadWithLastMessage
	for rows.Next() {
		var thread models.ThreadWithLastMessage
		var lastMsg models.Message
		var msgID, msgSenderID, msgText sql.NullString
		var msgCreatedAt sql.NullTime
		var msgType string

		err := rows.Scan(
			&thread.ID, &thread.CreatedBy, &thread.RelatedPostID, &thread.CreatedAt,
			&msgID, &msgSenderID, &msgType, &msgText, &msgCreatedAt,
		)
		if err != nil {
			continue
		}

		if msgID.Valid {
			lastMsg.ID = msgID.String
			lastMsg.SenderUserID = msgSenderID.String
			lastMsg.Type = models.MessageType(msgType)
			if msgText.Valid {
				lastMsg.Text = &msgText.String
			}
			lastMsg.CreatedAt = msgCreatedAt.Time
			thread.LastMessage = &lastMsg
		}

		// Get participant IDs
		participantRows, err := s.db.Query(`
			SELECT user_id FROM thread_participants WHERE thread_id = $1
		`, thread.ID)
		if err == nil {
			var participantIDs []string
			for participantRows.Next() {
				var pid string
				if err := participantRows.Scan(&pid); err == nil {
					participantIDs = append(participantIDs, pid)
				}
			}
			participantRows.Close()
			thread.ParticipantIDs = participantIDs
		}

		thread.UnreadCount = 0 // TODO: Implement unread count logic
		threads = append(threads, thread)
	}

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

	// Check if user is participant
	var exists bool
	err := s.db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM thread_participants
			WHERE thread_id = $1 AND user_id = $2
		)
	`, threadID, userID).Scan(&exists)

	if err != nil || !exists {
		response.Error(w, http.StatusForbidden, "Access denied")
		return
	}

	var thread models.ThreadDetail
	err = s.db.QueryRow(`
		SELECT id, created_by, related_post_id, created_at
		FROM threads
		WHERE id = $1
	`, threadID).Scan(&thread.ID, &thread.CreatedBy, &thread.RelatedPostID, &thread.CreatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			response.Error(w, http.StatusNotFound, "Thread not found")
		} else {
			response.Error(w, http.StatusInternalServerError, "Failed to fetch thread")
		}
		return
	}

	// Get participants
	rows, err := s.db.Query(`
		SELECT p.id, p.role, p.party, p.display_name, p.age, p.icon_url,
		       p.nda_flag, p.terms_accepted_at, p.privacy_accepted_at,
		       p.stripe_customer_id, p.created_at, p.updated_at
		FROM profiles p
		INNER JOIN thread_participants tp ON p.id = tp.user_id
		WHERE tp.thread_id = $1
	`, threadID)

	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Failed to fetch participants")
		return
	}
	defer rows.Close()

	var participants []models.Profile
	for rows.Next() {
		var p models.Profile
		err := rows.Scan(
			&p.ID, &p.Role, &p.Party, &p.DisplayName, &p.Age, &p.IconURL,
			&p.NDAFlag, &p.TermsAcceptedAt, &p.PrivacyAcceptedAt,
			&p.StripeCustomerID, &p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			continue
		}
		participants = append(participants, p)
	}
	thread.Participants = participants

	response.Success(w, http.StatusOK, thread)
}

// GetMessages retrieves messages for a specific thread
func (s *Server) GetMessages(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	threadID := r.URL.Query().Get("thread_id")
	if threadID == "" {
		response.Error(w, http.StatusBadRequest, "thread_id query parameter required")
		return
	}

	// Check if user is participant
	var exists bool
	err := s.db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM thread_participants
			WHERE thread_id = $1 AND user_id = $2
		)
	`, threadID, userID).Scan(&exists)

	if err != nil || !exists {
		response.Error(w, http.StatusForbidden, "Access denied")
		return
	}

	rows, err := s.db.Query(`
		SELECT
			m.id, m.thread_id, m.sender_user_id, m.type, m.text, m.created_at,
			p.display_name, p.icon_url
		FROM messages m
		INNER JOIN profiles p ON m.sender_user_id = p.id
		WHERE m.thread_id = $1
		ORDER BY m.created_at ASC
	`, threadID)

	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Failed to fetch messages")
		return
	}
	defer rows.Close()

	var messages []models.MessageWithSender
	for rows.Next() {
		var msg models.MessageWithSender
		err := rows.Scan(
			&msg.ID, &msg.ThreadID, &msg.SenderUserID, &msg.Type, &msg.Text, &msg.CreatedAt,
			&msg.SenderName, &msg.SenderIconURL,
		)
		if err != nil {
			continue
		}
		messages = append(messages, msg)
	}

	if messages == nil {
		messages = []models.MessageWithSender{}
	}

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
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if err := utils.ValidateStruct(req); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	// Check if user is participant
	var exists bool
	err := s.db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM thread_participants
			WHERE thread_id = $1 AND user_id = $2
		)
	`, req.ThreadID, userID).Scan(&exists)

	if err != nil || !exists {
		response.Error(w, http.StatusForbidden, "Access denied")
		return
	}

	// Insert message
	var message models.Message
	err = s.db.QueryRow(`
		INSERT INTO messages (thread_id, sender_user_id, type, text)
		VALUES ($1, $2, $3, $4)
		RETURNING id, thread_id, sender_user_id, type, text, created_at
	`, req.ThreadID, userID, req.Type, req.Text).Scan(
		&message.ID, &message.ThreadID, &message.SenderUserID,
		&message.Type, &message.Text, &message.CreatedAt,
	)

	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Failed to send message")
		return
	}

	// TODO: Add file attachment handling if FileURL is provided

	response.Success(w, http.StatusCreated, message)
}
