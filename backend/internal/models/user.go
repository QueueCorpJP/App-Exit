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
	ID                 string     `json:"id"`
	Role               string     `json:"role"`
	Party              string     `json:"party"`
	DisplayName        string     `json:"display_name"`
	Age                *int       `json:"age,omitempty"`
	IconURL            *string    `json:"icon_url,omitempty"`
	NDAFlag            bool       `json:"nda_flag"`
	TermsAcceptedAt    *time.Time `json:"terms_accepted_at,omitempty"`
	PrivacyAcceptedAt  *time.Time `json:"privacy_accepted_at,omitempty"`
	StripeCustomerID   *string    `json:"stripe_customer_id,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
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
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// Register時のレスポンス（認証情報のみ）
type AuthResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	User         User   `json:"user"`
}

type LoginResponse struct {
	Token        string   `json:"token"`
	RefreshToken string   `json:"refresh_token"`
	User         User     `json:"user"`
	Profile      *Profile `json:"profile,omitempty"` // プロフィール未作成時はnil
}
