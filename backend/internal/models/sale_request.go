package models

import "time"

// SaleRequestStatus represents the status of a sale request
type SaleRequestStatus string

const (
	SaleRequestStatusPending   SaleRequestStatus = "pending"
	SaleRequestStatusActive    SaleRequestStatus = "active"
	SaleRequestStatusCompleted SaleRequestStatus = "completed"
	SaleRequestStatusCancelled SaleRequestStatus = "cancelled"
)

// SaleRequest represents a sale request in the sale_requests table
type SaleRequest struct {
	ID              string            `json:"id"`
	ThreadID        string            `json:"thread_id"`
	UserID          string            `json:"user_id"`
	PostID          string            `json:"post_id"`
	Price           int64             `json:"price"`
	PhoneNumber     string            `json:"phone_number,omitempty"`
	Status          SaleRequestStatus `json:"status"`
	PaymentIntentID string            `json:"payment_intent_id,omitempty"`
	CreatedAt       time.Time         `json:"created_at"`
	UpdatedAt       time.Time         `json:"updated_at"`
}

// CreateSaleRequestRequest is used to create a new sale request
type CreateSaleRequestRequest struct {
	ThreadID    string `json:"thread_id" validate:"required"`
	PostID      string `json:"post_id" validate:"required"`
	Price       int64  `json:"price" validate:"required,min=1"`
	PhoneNumber string `json:"phone_number,omitempty" validate:"omitempty,e164"`
}

// ConfirmSaleRequestRequest is used to confirm a sale request
type ConfirmSaleRequestRequest struct {
	SaleRequestID string `json:"sale_request_id" validate:"required"`
}

// SaleRequestWithPost includes sale request with post information
type SaleRequestWithPost struct {
	SaleRequest
	Post *Post `json:"post,omitempty"`
}

