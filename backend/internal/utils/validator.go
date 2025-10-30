package utils

import (
	"fmt"
	"regexp"

	"github.com/yourusername/appexit-backend/internal/models"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

func ValidateEmail(email string) error {
	if !emailRegex.MatchString(email) {
		return fmt.Errorf("invalid email format")
	}
	return nil
}

func ValidatePassword(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters long")
	}
	return nil
}

func ValidateRequired(field, value string) error {
	if value == "" {
		return fmt.Errorf("%s is required", field)
	}
	return nil
}

func ValidateStruct(s interface{}) error {
	switch v := s.(type) {
	case models.CreateUserRequest:
		return validateCreateUserRequest(v)
	case models.CreateProfileRequest:
		return validateCreateProfileRequest(v)
	case models.LoginRequest:
		return validateLoginRequest(v)
	case models.CreatePostRequest:
		return validateCreatePostRequest(v)
	case models.UpdatePostRequest:
		return validateUpdatePostRequest(v)
	default:
		return fmt.Errorf("validation not implemented for type %T", s)
	}
}

func validateCreateUserRequest(req models.CreateUserRequest) error {
	if err := ValidateRequired("email", req.Email); err != nil {
		return err
	}
	if err := ValidateEmail(req.Email); err != nil {
		return err
	}
	if err := ValidateRequired("password", req.Password); err != nil {
		return err
	}
	if err := ValidatePassword(req.Password); err != nil {
		return err
	}
	return nil
}

func validateCreateProfileRequest(req models.CreateProfileRequest) error {
	if err := ValidateRequired("display_name", req.DisplayName); err != nil {
		return err
	}
	if err := ValidateRequired("role", req.Role); err != nil {
		return err
	}
	if req.Role != "buyer" && req.Role != "seller" {
		return fmt.Errorf("role must be either 'buyer' or 'seller'")
	}
	if err := ValidateRequired("party", req.Party); err != nil {
		return err
	}
	if req.Party != "individual" && req.Party != "organization" {
		return fmt.Errorf("party must be either 'individual' or 'organization'")
	}
	if req.Age != nil && (*req.Age < 13 || *req.Age > 120) {
		return fmt.Errorf("age must be between 13 and 120")
	}
	return nil
}

func validateLoginRequest(req models.LoginRequest) error {
	if err := ValidateRequired("email", req.Email); err != nil {
		return err
	}
	if err := ValidateEmail(req.Email); err != nil {
		return err
	}
	if err := ValidateRequired("password", req.Password); err != nil {
		return err
	}
	return nil
}

func validateCreatePostRequest(req models.CreatePostRequest) error {
	// Validate required fields
	if err := ValidateRequired("type", string(req.Type)); err != nil {
		return err
	}
	if err := ValidateRequired("title", req.Title); err != nil {
		return err
	}

	// Validate post type
	if req.Type != models.PostTypeBoard && req.Type != models.PostTypeTransaction && req.Type != models.PostTypeSecret {
		return fmt.Errorf("type must be one of: board, transaction, secret")
	}

	// Validate title length
	if len(req.Title) < 1 || len(req.Title) > 200 {
		return fmt.Errorf("title must be between 1 and 200 characters")
	}

	// Validate numeric fields if provided
	if req.BudgetMin != nil && *req.BudgetMin < 0 {
		return fmt.Errorf("budget_min must be non-negative")
	}
	if req.BudgetMax != nil && *req.BudgetMax < 0 {
		return fmt.Errorf("budget_max must be non-negative")
	}
	if req.Price != nil && *req.Price < 0 {
		return fmt.Errorf("price must be non-negative")
	}
	if req.MonthlyRevenue != nil && *req.MonthlyRevenue < 0 {
		return fmt.Errorf("monthly_revenue must be non-negative")
	}
	if req.MAU != nil && *req.MAU < 0 {
		return fmt.Errorf("mau must be non-negative")
	}
	if req.DAU != nil && *req.DAU < 0 {
		return fmt.Errorf("dau must be non-negative")
	}

	// Validate budget range
	if req.BudgetMin != nil && req.BudgetMax != nil && *req.BudgetMin > *req.BudgetMax {
		return fmt.Errorf("budget_min cannot be greater than budget_max")
	}

	return nil
}

func validateUpdatePostRequest(req models.UpdatePostRequest) error {
	// Validate title length if provided
	if req.Title != nil && (len(*req.Title) < 1 || len(*req.Title) > 200) {
		return fmt.Errorf("title must be between 1 and 200 characters")
	}

	// Validate numeric fields if provided
	if req.BudgetMin != nil && *req.BudgetMin < 0 {
		return fmt.Errorf("budget_min must be non-negative")
	}
	if req.BudgetMax != nil && *req.BudgetMax < 0 {
		return fmt.Errorf("budget_max must be non-negative")
	}
	if req.Price != nil && *req.Price < 0 {
		return fmt.Errorf("price must be non-negative")
	}
	if req.MonthlyRevenue != nil && *req.MonthlyRevenue < 0 {
		return fmt.Errorf("monthly_revenue must be non-negative")
	}
	if req.MAU != nil && *req.MAU < 0 {
		return fmt.Errorf("mau must be non-negative")
	}
	if req.DAU != nil && *req.DAU < 0 {
		return fmt.Errorf("dau must be non-negative")
	}

	// Validate budget range if both are provided
	if req.BudgetMin != nil && req.BudgetMax != nil && *req.BudgetMin > *req.BudgetMax {
		return fmt.Errorf("budget_min cannot be greater than budget_max")
	}

	return nil
}
