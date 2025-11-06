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
	ID                      string            `json:"id"`
	AuthorUserID            string            `json:"author_user_id"`
	AuthorOrgID             *string           `json:"author_org_id,omitempty"`
	Type                    PostType          `json:"type"`
	Title                   string            `json:"title"`
	Body                    *string           `json:"body,omitempty"`
	Price                   *int64            `json:"price,omitempty"`
	SecretVisibility        *SecretVisibility `json:"secret_visibility,omitempty"`
	IsActive                bool              `json:"is_active"`
	CreatedAt               time.Time         `json:"created_at"`
	UpdatedAt               time.Time         `json:"updated_at"`
	EyecatchURL             *string           `json:"eyecatch_url,omitempty"`
	DashboardURL            *string           `json:"dashboard_url,omitempty"`
	UserUIURL               *string           `json:"user_ui_url,omitempty"`
	PerformanceURL          *string           `json:"performance_url,omitempty"`
	AppCategories           []string          `json:"app_categories,omitempty"`
	ServiceURLs             []string          `json:"service_urls,omitempty"`
	RevenueModels           []string          `json:"revenue_models,omitempty"`
	MonthlyRevenue          *int64            `json:"monthly_revenue,omitempty"`
	MonthlyCost             *int64            `json:"monthly_cost,omitempty"`
	AppealText              *string           `json:"appeal_text,omitempty"`
	TechStack               []string          `json:"tech_stack,omitempty"`
	UserCount               *int              `json:"user_count,omitempty"`
	ReleaseDate             *Date             `json:"release_date,omitempty"`
	OperationForm           *string           `json:"operation_form,omitempty"`
	OperationEffort         *string           `json:"operation_effort,omitempty"`
	TransferItems           []string          `json:"transfer_items,omitempty"`
	DesiredTransferTiming   *string           `json:"desired_transfer_timing,omitempty"`
	GrowthPotential         *string           `json:"growth_potential,omitempty"`
	TargetCustomers         *string           `json:"target_customers,omitempty"`
	MarketingChannels       []string          `json:"marketing_channels,omitempty"`
	MediaMentions           *string           `json:"media_mentions,omitempty"`
	ExtraImageURLs          []string          `json:"extra_image_urls,omitempty"`
	MonthlyProfit           *int64            `json:"monthly_profit,omitempty"`
	Subscribe               *bool             `json:"subscribe,omitempty"`
}

// AuthorProfile represents the profile of the post author
type AuthorProfile struct {
	ID          string  `json:"id"`
	DisplayName string  `json:"display_name"`
	IconURL     *string `json:"icon_url,omitempty"`
	Role        string  `json:"role"`
	Party       string  `json:"party"`
}

// PostWithDetails combines Post with author profile
type PostWithDetails struct {
	Post
	AuthorProfile *AuthorProfile `json:"author_profile,omitempty"`
}


// CreatePostRequest represents a request to create a new post
type CreatePostRequest struct {
	Type                  PostType          `json:"type" validate:"required,oneof=board transaction secret"`
	Title                 string            `json:"title" validate:"required,min=1,max=200"`
	Body                  *string           `json:"body,omitempty"`
	Price                 *int64            `json:"price,omitempty" validate:"omitempty,min=0"`
	SecretVisibility      *SecretVisibility `json:"secret_visibility,omitempty"`
	EyecatchURL           *string           `json:"eyecatch_url,omitempty"`
	DashboardURL          *string           `json:"dashboard_url,omitempty"`
	UserUIURL             *string           `json:"user_ui_url,omitempty"`
	PerformanceURL        *string           `json:"performance_url,omitempty"`
	AppCategories         []string          `json:"app_categories,omitempty"`
	ServiceURLs           []string          `json:"service_urls,omitempty"`
	RevenueModels         []string          `json:"revenue_models,omitempty"`
	MonthlyRevenue        *int64            `json:"monthly_revenue,omitempty" validate:"omitempty,min=0"`
	MonthlyCost           *int64            `json:"monthly_cost,omitempty" validate:"omitempty,min=0"`
	AppealText            *string           `json:"appeal_text,omitempty"`
	TechStack             []string          `json:"tech_stack,omitempty"`
	UserCount             *int              `json:"user_count,omitempty" validate:"omitempty,min=0"`
	ReleaseDate           *Date             `json:"release_date,omitempty"`
	OperationForm         *string           `json:"operation_form,omitempty"`
	OperationEffort       *string           `json:"operation_effort,omitempty"`
	TransferItems         []string          `json:"transfer_items,omitempty"`
	DesiredTransferTiming *string           `json:"desired_transfer_timing,omitempty"`
	GrowthPotential       *string           `json:"growth_potential,omitempty"`
	TargetCustomers       *string           `json:"target_customers,omitempty"`
	MarketingChannels     []string          `json:"marketing_channels,omitempty"`
	MediaMentions         *string           `json:"media_mentions,omitempty"`
	ExtraImageURLs        []string          `json:"extra_image_urls,omitempty"`
	Subscribe             *bool             `json:"subscribe,omitempty"`
}

// UpdatePostRequest represents a request to update an existing post
type UpdatePostRequest struct {
	Title                 *string           `json:"title,omitempty" validate:"omitempty,min=1,max=200"`
	Body                  *string           `json:"body,omitempty"`
	Price                 *int64            `json:"price,omitempty" validate:"omitempty,min=0"`
	SecretVisibility      *SecretVisibility `json:"secret_visibility,omitempty"`
	IsActive              *bool             `json:"is_active,omitempty"`
	EyecatchURL           *string           `json:"eyecatch_url,omitempty"`
	DashboardURL          *string           `json:"dashboard_url,omitempty"`
	UserUIURL             *string           `json:"user_ui_url,omitempty"`
	PerformanceURL        *string           `json:"performance_url,omitempty"`
	AppCategories         []string          `json:"app_categories,omitempty"`
	ServiceURLs           []string          `json:"service_urls,omitempty"`
	RevenueModels         []string          `json:"revenue_models,omitempty"`
	MonthlyRevenue        *int64            `json:"monthly_revenue,omitempty" validate:"omitempty,min=0"`
	MonthlyCost           *int64            `json:"monthly_cost,omitempty" validate:"omitempty,min=0"`
	AppealText            *string           `json:"appeal_text,omitempty"`
	TechStack             []string          `json:"tech_stack,omitempty"`
	UserCount             *int              `json:"user_count,omitempty" validate:"omitempty,min=0"`
	ReleaseDate           *Date             `json:"release_date,omitempty"`
	OperationForm         *string           `json:"operation_form,omitempty"`
	OperationEffort       *string           `json:"operation_effort,omitempty"`
	TransferItems         []string          `json:"transfer_items,omitempty"`
	DesiredTransferTiming *string           `json:"desired_transfer_timing,omitempty"`
	GrowthPotential       *string           `json:"growth_potential,omitempty"`
	TargetCustomers       *string           `json:"target_customers,omitempty"`
	MarketingChannels     []string          `json:"marketing_channels,omitempty"`
	MediaMentions         *string           `json:"media_mentions,omitempty"`
	ExtraImageURLs        []string          `json:"extra_image_urls,omitempty"`
	Subscribe             *bool             `json:"subscribe,omitempty"`
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
