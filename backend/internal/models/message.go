package models

import "time"

// Message types
type MessageType string

const (
	MessageTypeText       MessageType = "text"
	MessageTypeImage      MessageType = "image"
	MessageTypeFile       MessageType = "file"
	MessageTypeContract   MessageType = "contract"
	MessageTypeNDA        MessageType = "nda"
)

// Thread represents a conversation thread
type Thread struct {
	ID            string    `json:"id"`
	CreatedBy     string    `json:"created_by"`
	RelatedPostID *string   `json:"related_post_id,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

// Message represents a message in a thread
type Message struct {
	ID           string      `json:"id"`
	ThreadID     string      `json:"thread_id"`
	SenderUserID string      `json:"sender_user_id"`
	Type         MessageType `json:"type"`
	Text         *string     `json:"text,omitempty"`
	ImageURL     *string     `json:"image_url,omitempty"`
	CreatedAt    time.Time   `json:"created_at"`
}

// MessageAttachment represents an attachment to a message
type MessageAttachment struct {
	ID        string    `json:"id"`
	MessageID string    `json:"message_id"`
	FileURL   string    `json:"file_url"`
	CreatedAt time.Time `json:"created_at"`
}

// ThreadParticipant represents a user participating in a thread
type ThreadParticipant struct {
	ThreadID string `json:"thread_id"`
	UserID   string `json:"user_id"`
}

// Request/Response models

// CreateThreadRequest is used to create a new thread
type CreateThreadRequest struct {
	RelatedPostID *string  `json:"related_post_id,omitempty"`
	ParticipantIDs []string `json:"participant_ids" validate:"required,min=1"`
}

// CreateMessageRequest is used to send a new message
type CreateMessageRequest struct {
	ThreadID string      `json:"thread_id" validate:"required"`
	Type     MessageType `json:"type" validate:"required,oneof=text image file contract nda"`
	Text     *string     `json:"text,omitempty" validate:"required_if=Type text"`
	FileURL  *string     `json:"file_url,omitempty"`
}

// ThreadWithLastMessage includes thread info with the last message
type ThreadWithLastMessage struct {
	Thread
	LastMessage     *Message  `json:"last_message,omitempty"`
	ParticipantIDs  []string  `json:"participant_ids"`
	Participants    []Profile `json:"participants"`
	UnreadCount     int       `json:"unread_count"`
}

// MessageWithSender includes message with sender info
type MessageWithSender struct {
	Message
	SenderName    string  `json:"sender_name"`
	SenderIconURL *string `json:"sender_icon_url,omitempty"`
	ImageURL      *string `json:"image_url,omitempty"` // Signed URL for image attachments
}

// ThreadDetail includes full thread information with participants
type ThreadDetail struct {
	Thread
	Participants []Profile `json:"participants"`
}
