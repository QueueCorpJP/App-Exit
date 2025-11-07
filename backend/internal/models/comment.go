package models

import "time"

// PostComment represents a comment on a post
type PostComment struct {
	ID        string    `json:"id"`
	PostID    string    `json:"post_id"`
	UserID    string    `json:"user_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// CommentReply represents a reply to a comment
type CommentReply struct {
	ID        string    `json:"id"`
	CommentID string    `json:"comment_id"`
	UserID    string    `json:"user_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// CommentLike represents a like on a comment
type CommentLike struct {
	CommentID string    `json:"comment_id"`
	UserID    string    `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
}

// PostCommentWithDetails includes author profile and related data
type PostCommentWithDetails struct {
	PostComment
	AuthorProfile *AuthorProfile `json:"author_profile,omitempty"`
	LikeCount     int             `json:"like_count"`
	IsLiked       bool            `json:"is_liked"`
	ReplyCount    int             `json:"reply_count"`
	Replies       []CommentReplyWithDetails `json:"replies,omitempty"`
}

// CommentReplyWithDetails includes author profile
type CommentReplyWithDetails struct {
	CommentReply
	AuthorProfile *AuthorProfile `json:"author_profile,omitempty"`
}

// CreateCommentRequest represents a request to create a new comment
type CreateCommentRequest struct {
	Content string `json:"content" validate:"required,min=1,max=5000"`
}

// UpdateCommentRequest represents a request to update a comment
type UpdateCommentRequest struct {
	Content string `json:"content" validate:"required,min=1,max=5000"`
}

// CreateReplyRequest represents a request to create a new reply
type CreateReplyRequest struct {
	Content string `json:"content" validate:"required,min=1,max=5000"`
}

// UpdateReplyRequest represents a request to update a reply
type UpdateReplyRequest struct {
	Content string `json:"content" validate:"required,min=1,max=5000"`
}





