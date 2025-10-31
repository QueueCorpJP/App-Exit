package models

import "time"

// PostType represents the type of post
type PostType string

const (
	PostTypeBoard       PostType = "board"
	PostTypeTransaction PostType = "transaction"
	PostTypeSecret      PostType = "secret"
)

// SecretVisibility represents the visibility level for secret posts
type SecretVisibility string

const (
	SecretVisibilityFull      SecretVisibility = "full"
	SecretVisibilityPriceOnly SecretVisibility = "price_only"
	SecretVisibilityHidden    SecretVisibility = "hidden"
)

// Post represents a post in the posts table (partitioned view)
type Post struct {
	ID               string            `json:"id"`
	AuthorUserID     string            `json:"author_user_id"`
	AuthorOrgID      *string           `json:"author_org_id,omitempty"`
	Type             PostType          `json:"type"`
	Title            string            `json:"title"`
	Body             *string           `json:"body,omitempty"`
	CoverImageURL    *string           `json:"cover_image_url,omitempty"`
	BudgetMin        *int64            `json:"budget_min,omitempty"`
	BudgetMax        *int64            `json:"budget_max,omitempty"`
	Price            *int64            `json:"price,omitempty"`
	SecretVisibility *SecretVisibility `json:"secret_visibility,omitempty"`
	IsActive         bool              `json:"is_active"`
	CreatedAt        time.Time         `json:"created_at"`
	UpdatedAt        time.Time         `json:"updated_at"`
}

// PostDetail represents additional details for transaction/secret posts
type PostDetail struct {
	PostID         string  `json:"post_id"`
	AppName        *string `json:"app_name,omitempty"`
	AppCategory    *string `json:"app_category,omitempty"`
	MonthlyRevenue *int64  `json:"monthly_revenue,omitempty"`
	MonthlyProfit  *int64  `json:"monthly_profit,omitempty"`
	MAU            *int64  `json:"mau,omitempty"`
	DAU            *int64  `json:"dau,omitempty"`
	StoreURL       *string `json:"store_url,omitempty"`
	TechStack      *string `json:"tech_stack,omitempty"`
	Notes          *string `json:"notes,omitempty"`
}

// AuthorProfile represents the profile of the post author
type AuthorProfile struct {
	ID          string  `json:"id"`
	DisplayName string  `json:"display_name"`
	IconURL     *string `json:"icon_url,omitempty"`
	Role        string  `json:"role"`
	Party       string  `json:"party"`
}

// PostWithDetails combines Post and PostDetail
type PostWithDetails struct {
	Post
	Details       *PostDetail    `json:"details,omitempty"`
	AuthorProfile *AuthorProfile `json:"author_profile,omitempty"`
}

// CreatePostRequest represents a request to create a new post
type CreatePostRequest struct {
	Type             PostType          `json:"type" validate:"required,oneof=board transaction secret"`
	Title            string            `json:"title" validate:"required,min=1,max=200"`
	Body             *string           `json:"body,omitempty"`
	CoverImageURL    *string           `json:"cover_image_url,omitempty"`
	BudgetMin        *int64            `json:"budget_min,omitempty" validate:"omitempty,min=0"`
	BudgetMax        *int64            `json:"budget_max,omitempty" validate:"omitempty,min=0"`
	Price            *int64            `json:"price,omitempty" validate:"omitempty,min=0"`
	SecretVisibility *SecretVisibility `json:"secret_visibility,omitempty"`

	// Post details (for transaction/secret posts)
	AppName        *string `json:"app_name,omitempty"`
	AppCategory    *string `json:"app_category,omitempty"`
	MonthlyRevenue *int64  `json:"monthly_revenue,omitempty" validate:"omitempty,min=0"`
	MonthlyProfit  *int64  `json:"monthly_profit,omitempty"`
	MAU            *int64  `json:"mau,omitempty" validate:"omitempty,min=0"`
	DAU            *int64  `json:"dau,omitempty" validate:"omitempty,min=0"`
	StoreURL       *string `json:"store_url,omitempty"`
	TechStack      *string `json:"tech_stack,omitempty"`
	Notes          *string `json:"notes,omitempty"`
}

// UpdatePostRequest represents a request to update an existing post
type UpdatePostRequest struct {
	Title            *string           `json:"title,omitempty" validate:"omitempty,min=1,max=200"`
	Body             *string           `json:"body,omitempty"`
	CoverImageURL    *string           `json:"cover_image_url,omitempty"`
	BudgetMin        *int64            `json:"budget_min,omitempty" validate:"omitempty,min=0"`
	BudgetMax        *int64            `json:"budget_max,omitempty" validate:"omitempty,min=0"`
	Price            *int64            `json:"price,omitempty" validate:"omitempty,min=0"`
	SecretVisibility *SecretVisibility `json:"secret_visibility,omitempty"`
	IsActive         *bool             `json:"is_active,omitempty"`

	// Post details (for transaction/secret posts)
	AppName        *string `json:"app_name,omitempty"`
	AppCategory    *string `json:"app_category,omitempty"`
	MonthlyRevenue *int64  `json:"monthly_revenue,omitempty" validate:"omitempty,min=0"`
	MonthlyProfit  *int64  `json:"monthly_profit,omitempty"`
	MAU            *int64  `json:"mau,omitempty" validate:"omitempty,min=0"`
	DAU            *int64  `json:"dau,omitempty" validate:"omitempty,min=0"`
	StoreURL       *string `json:"store_url,omitempty"`
	TechStack      *string `json:"tech_stack,omitempty"`
	Notes          *string `json:"notes,omitempty"`
}

// PostQueryParams represents query parameters for listing posts
type PostQueryParams struct {
	Type         *PostType `json:"type,omitempty"`
	AuthorUserID *string   `json:"author_user_id,omitempty"`
	AuthorOrgID  *string   `json:"author_org_id,omitempty"`
	IsActive     *bool     `json:"is_active,omitempty"`
	Limit        int       `json:"limit,omitempty"`
	Offset       int       `json:"offset,omitempty"`
}
