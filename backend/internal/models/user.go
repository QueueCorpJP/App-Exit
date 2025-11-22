package models

import "time"

type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Password  string    `json:"-"` // Never expose password in JSON
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Profile represents the user profile in the profiles table
type Profile struct {
	ID                string     `json:"id"`
    Role              string     `json:"role"`
    Roles             []string   `json:"roles,omitempty"`
	Party             string     `json:"party"`
	DisplayName       string     `json:"display_name"`
	Age               *int       `json:"age,omitempty"`
	IconURL           *string    `json:"icon_url,omitempty"`
	NDAFlag           bool       `json:"nda_flag"`
	TermsAcceptedAt   *time.Time `json:"terms_accepted_at,omitempty"`
	PrivacyAcceptedAt *time.Time `json:"privacy_accepted_at,omitempty"`
	StripeCustomerID  *string    `json:"stripe_customer_id,omitempty"`
	StripeAccountID   *string    `json:"stripe_account_id,omitempty"`
	StripeOnboardingCompleted *bool  `json:"stripe_onboarding_completed,omitempty"`
	ListingCount      *int       `json:"listing_count,omitempty"`
	ServiceCategories []string   `json:"service_categories,omitempty"`
	DesiredExitTiming *string    `json:"desired_exit_timing,omitempty"`
	InvestmentMin            *int       `json:"investment_min,omitempty"`
	InvestmentMax            *int       `json:"investment_max,omitempty"`
	TargetCategories         []string   `json:"target_categories,omitempty"`
	OperationType            *string    `json:"operation_type,omitempty"`
	DesiredAcquisitionTiming *string    `json:"desired_acquisition_timing,omitempty"`
	Expertise                []string   `json:"expertise,omitempty"`
	PortfolioSummary         *string    `json:"portfolio_summary,omitempty"`
	ProposalStyle            *string    `json:"proposal_style,omitempty"`
	Public                   bool       `json:"public"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

// UserLink represents a user's SNS/Web link
type UserLink struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	Name         string    `json:"name"`
	URL          string    `json:"url"`
	DisplayOrder int       `json:"display_order"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// UserLinkInput represents input for creating/updating a link
type UserLinkInput struct {
	Name string `json:"name" validate:"required"`
	URL  string `json:"url" validate:"required,url"`
}

// Register時は認証情報のみ
type CreateUserRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

// プロフィール作成用のリクエスト
type CreateProfileRequest struct {
	DisplayName string `json:"display_name" validate:"required"`
	Role        string `json:"role" validate:"required,oneof=buyer seller"`
	Party       string `json:"party" validate:"required,oneof=individual organization"`
	Age         *int   `json:"age,omitempty" validate:"omitempty,min=13,max=120"`
}

// プロフィール更新用のリクエスト（すべてのフィールドがオプショナル）
type UpdateProfileRequest struct {
	DisplayName *string `json:"display_name,omitempty"`
	Age         *int    `json:"age,omitempty" validate:"omitempty,min=13,max=120"`
	IconURL     *string `json:"icon_url,omitempty"`
	NDAFlag     *bool   `json:"nda_flag,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type LoginMethod string

const (
	LoginMethodEmail  LoginMethod = "email"
	LoginMethodGoogle LoginMethod = "google"
	LoginMethodGithub LoginMethod = "github"
	LoginMethodX      LoginMethod = "x"
)

type OAuthLoginRequest struct {
	Method      LoginMethod `json:"method"`
	RedirectURL string      `json:"redirect_url,omitempty"`
}

type OAuthLoginResponse struct {
	Type        string `json:"type"`
	ProviderURL string `json:"provider_url"`
}

// Register時のレスポンス（認証情報のみ）
// セキュリティ: RefreshTokenはHttpOnly Cookieにのみ保存され、JSONレスポンスには含めない
type AuthResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"-"` // セキュリティ: フロントエンドに送信しない（HttpOnly Cookieのみ）
	User         User   `json:"user"`
}

type LoginResponse struct {
	Token        string   `json:"token"`
	RefreshToken string   `json:"-"` // セキュリティ: フロントエンドに送信しない（HttpOnly Cookieのみ）
	User         User     `json:"user"`
	Profile      *Profile `json:"profile,omitempty"` // プロフィール未作成時はnil
}

type RegistrationMethod string

const (
	RegistrationMethodEmail  RegistrationMethod = "email"
	RegistrationMethodGoogle RegistrationMethod = "google"
	RegistrationMethodGithub RegistrationMethod = "github"
	RegistrationMethodX      RegistrationMethod = "x"
)

type RegistrationStep1Request struct {
	Method      RegistrationMethod `json:"method"`
	Email       string             `json:"email,omitempty"`
	Password    string             `json:"password,omitempty"`
	RedirectURL string             `json:"redirect_url,omitempty"`
}

type RegistrationStep1Response struct {
	Type           string             `json:"type"`
	Auth           *AuthResponse      `json:"auth,omitempty"`
	ProviderURL    string             `json:"provider_url,omitempty"`
	SelectedMethod RegistrationMethod `json:"selected_method"`
}

type RegistrationStep2Request struct {
	Roles []string `json:"roles"`
}

type RegistrationStep2Response struct {
	Roles []string `json:"roles"`
}

type RegistrationStep3Request struct {
	DisplayName  string          `json:"display_name"`
	Party        string          `json:"party"`
	IconURL      *string         `json:"icon_url,omitempty"`
	Prefecture   *string         `json:"prefecture,omitempty"`
	CompanyName  *string         `json:"company_name,omitempty"`
	Introduction *string         `json:"introduction,omitempty"`
	Links        []UserLinkInput `json:"links,omitempty"`
    Roles        []string        `json:"roles"`
}

type RegistrationStep3Response struct {
	Roles   []string `json:"roles"`
	Profile Profile  `json:"profile"`
}

type SellerProfileInput struct {
	ListingCount      *int     `json:"listing_count,omitempty"`
	ServiceCategories []string `json:"service_categories,omitempty"`
	DesiredExitTiming *string  `json:"desired_exit_timing,omitempty"`
}

type BuyerProfileInput struct {
	InvestmentMin            *int     `json:"investment_min,omitempty"`
	InvestmentMax            *int     `json:"investment_max,omitempty"`
	TargetCategories         []string `json:"target_categories,omitempty"`
	OperationType            *string  `json:"operation_type,omitempty"`
	DesiredAcquisitionTiming *string  `json:"desired_acquisition_timing,omitempty"`
}

type AdvisorProfileInput struct {
	InvestmentMin            *int     `json:"investment_min,omitempty"`
	InvestmentMax            *int     `json:"investment_max,omitempty"`
	TargetCategories         []string `json:"target_categories,omitempty"`
	DesiredAcquisitionTiming *string  `json:"desired_acquisition_timing,omitempty"`
	Expertise                []string `json:"expertise,omitempty"`
	PortfolioSummary         *string  `json:"portfolio_summary,omitempty"`
	ProposalStyle            *string  `json:"proposal_style,omitempty"`
}

type RegistrationStep4Request struct {
	Seller  *SellerProfileInput  `json:"seller,omitempty"`
	Buyer   *BuyerProfileInput   `json:"buyer,omitempty"`
	Advisor *AdvisorProfileInput `json:"advisor,omitempty"`
}

type RegistrationStep5Request struct {
	NDAAgreed       bool `json:"nda_agreed"`
	TermsAccepted   bool `json:"terms_accepted"`
	PrivacyAccepted bool `json:"privacy_accepted"`
}

type RegistrationCompletionResponse struct {
	Completed bool     `json:"completed"`
	Roles     []string `json:"roles"`
}

type ProfileUpsert struct {
	ID           string  `json:"id"`
	Role         string  `json:"role"`
	Party        *string `json:"party,omitempty"`
	DisplayName  *string `json:"display_name,omitempty"`
	IconURL      *string `json:"icon_url,omitempty"`
	Prefecture   *string `json:"prefecture,omitempty"`
	CompanyName  *string `json:"company_name,omitempty"`
	Introduction *string `json:"introduction,omitempty"`
}
