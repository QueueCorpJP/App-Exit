package utils

import (
	"fmt"
	"regexp"

	"github.com/yourusername/appexit-backend/internal/models"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
var phoneRegex = regexp.MustCompile(`^\+?[1-9]\d{1,14}$`) // E.164形式の電話番号

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

func ValidatePhoneNumber(phone string) error {
	if phone == "" {
		return nil // 電話番号は任意
	}
	if !phoneRegex.MatchString(phone) {
		return fmt.Errorf("invalid phone number format (E.164 format required, e.g., +819012345678)")
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
	case *models.CreateUserRequest:
		return validateCreateUserRequest(*v)
	case models.CreateProfileRequest:
		return validateCreateProfileRequest(v)
	case *models.CreateProfileRequest:
		return validateCreateProfileRequest(*v)
	case models.LoginRequest:
		return validateLoginRequest(v)
	case *models.LoginRequest:
		return validateLoginRequest(*v)
	case models.CreatePostRequest:
		return validateCreatePostRequest(v)
	case *models.CreatePostRequest:
		return validateCreatePostRequest(*v)
	case models.UpdatePostRequest:
		return validateUpdatePostRequest(v)
	case *models.UpdatePostRequest:
		return validateUpdatePostRequest(*v)
	case models.CreateThreadRequest:
		return validateCreateThreadRequest(v)
	case *models.CreateThreadRequest:
		return validateCreateThreadRequest(*v)
	case models.CreateMessageRequest:
		return validateCreateMessageRequest(v)
	case *models.CreateMessageRequest:
		return validateCreateMessageRequest(*v)
	case models.CreateCommentRequest:
		return validateCreateCommentRequest(v)
	case *models.CreateCommentRequest:
		return validateCreateCommentRequest(*v)
	case models.UpdateCommentRequest:
		return validateUpdateCommentRequest(v)
	case *models.UpdateCommentRequest:
		return validateUpdateCommentRequest(*v)
	case models.CreateReplyRequest:
		return validateCreateReplyRequest(v)
	case *models.CreateReplyRequest:
		return validateCreateReplyRequest(*v)
	case models.UpdateReplyRequest:
		return validateUpdateReplyRequest(v)
	case *models.UpdateReplyRequest:
		return validateUpdateReplyRequest(*v)
	case models.CreateSaleRequestRequest:
		return validateCreateSaleRequestRequest(v)
	case *models.CreateSaleRequestRequest:
		return validateCreateSaleRequestRequest(*v)
	case models.ConfirmSaleRequestRequest:
		return validateConfirmSaleRequestRequest(v)
	case *models.ConfirmSaleRequestRequest:
		return validateConfirmSaleRequestRequest(*v)
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
	if req.Price != nil && *req.Price < 0 {
		return fmt.Errorf("price must be non-negative")
	}
	if req.MonthlyRevenue != nil && *req.MonthlyRevenue < 0 {
		return fmt.Errorf("monthly_revenue must be non-negative")
	}
	if req.MonthlyCost != nil && *req.MonthlyCost < 0 {
		return fmt.Errorf("monthly_cost must be non-negative")
	}
	if req.UserCount != nil && *req.UserCount < 0 {
		return fmt.Errorf("user_count must be non-negative")
	}

	// Validate transaction type required fields
	if req.Type == models.PostTypeTransaction {
		if req.Price == nil {
			return fmt.Errorf("price is required for transaction type posts")
		}
		if req.AppCategories == nil || len(req.AppCategories) == 0 {
			return fmt.Errorf("app_categories is required for transaction type posts")
		}
		if req.MonthlyRevenue == nil {
			return fmt.Errorf("monthly_revenue is required for transaction type posts")
		}
		if req.MonthlyCost == nil {
			return fmt.Errorf("monthly_cost is required for transaction type posts")
		}
		if req.AppealText == nil || len(*req.AppealText) < 50 {
			return fmt.Errorf("appeal_text is required and must be at least 50 characters for transaction type posts")
		}
		if req.EyecatchURL == nil {
			return fmt.Errorf("eyecatch_url is required for transaction type posts")
		}
		if req.DashboardURL == nil {
			return fmt.Errorf("dashboard_url is required for transaction type posts")
		}
		if req.UserUIURL == nil {
			return fmt.Errorf("user_ui_url is required for transaction type posts")
		}
		if req.PerformanceURL == nil {
			return fmt.Errorf("performance_url is required for transaction type posts")
		}
	}

	return nil
}

func validateUpdatePostRequest(req models.UpdatePostRequest) error {
	// Validate title length if provided
	if req.Title != nil && (len(*req.Title) < 1 || len(*req.Title) > 200) {
		return fmt.Errorf("title must be between 1 and 200 characters")
	}

	// Validate numeric fields if provided
	if req.Price != nil && *req.Price < 0 {
		return fmt.Errorf("price must be non-negative")
	}
	if req.MonthlyRevenue != nil && *req.MonthlyRevenue < 0 {
		return fmt.Errorf("monthly_revenue must be non-negative")
	}
	if req.MonthlyCost != nil && *req.MonthlyCost < 0 {
		return fmt.Errorf("monthly_cost must be non-negative")
	}
	if req.UserCount != nil && *req.UserCount < 0 {
		return fmt.Errorf("user_count must be non-negative")
	}

	// Validate appeal_text length if provided
	if req.AppealText != nil && len(*req.AppealText) < 50 {
		return fmt.Errorf("appeal_text must be at least 50 characters if provided")
	}

	return nil
}

func validateCreateThreadRequest(req models.CreateThreadRequest) error {
	// Validate participant_ids is required and not empty
	if len(req.ParticipantIDs) == 0 {
		return fmt.Errorf("participant_ids is required and must contain at least one participant")
	}

	// Validate each participant ID is not empty
	for i, pid := range req.ParticipantIDs {
		if pid == "" {
			return fmt.Errorf("participant_ids[%d] cannot be empty", i)
		}
	}

	return nil
}

func validateCreateMessageRequest(req models.CreateMessageRequest) error {
	// Validate thread_id is required
	if err := ValidateRequired("thread_id", req.ThreadID); err != nil {
		return err
	}

	// Validate type is required
	if err := ValidateRequired("type", string(req.Type)); err != nil {
		return err
	}

	// Validate message type
	validTypes := []models.MessageType{
		models.MessageTypeText,
		models.MessageTypeImage,
		models.MessageTypeFile,
		models.MessageTypeContract,
		models.MessageTypeNDA,
	}
	validType := false
	for _, t := range validTypes {
		if req.Type == t {
			validType = true
			break
		}
	}
	if !validType {
		return fmt.Errorf("type must be one of: text, image, file, contract, nda")
	}

	// Validate text is required for text type messages
	if req.Type == models.MessageTypeText {
		if req.Text == nil || *req.Text == "" {
			return fmt.Errorf("text is required for text type messages")
		}
	}

	return nil
}

func validateCreateCommentRequest(req models.CreateCommentRequest) error {
	// Validate content is required
	if err := ValidateRequired("content", req.Content); err != nil {
		return err
	}

	// Validate content length (min=1, max=5000)
	if len(req.Content) < 1 {
		return fmt.Errorf("content must be at least 1 character long")
	}
	if len(req.Content) > 5000 {
		return fmt.Errorf("content must be at most 5000 characters long")
	}

	return nil
}

func validateUpdateCommentRequest(req models.UpdateCommentRequest) error {
	// Validate content is required
	if err := ValidateRequired("content", req.Content); err != nil {
		return err
	}

	// Validate content length (min=1, max=5000)
	if len(req.Content) < 1 {
		return fmt.Errorf("content must be at least 1 character long")
	}
	if len(req.Content) > 5000 {
		return fmt.Errorf("content must be at most 5000 characters long")
	}

	return nil
}

func validateCreateReplyRequest(req models.CreateReplyRequest) error {
	// Validate content is required
	if err := ValidateRequired("content", req.Content); err != nil {
		return err
	}

	// Validate content length (min=1, max=5000)
	if len(req.Content) < 1 {
		return fmt.Errorf("content must be at least 1 character long")
	}
	if len(req.Content) > 5000 {
		return fmt.Errorf("content must be at most 5000 characters long")
	}

	return nil
}

func validateUpdateReplyRequest(req models.UpdateReplyRequest) error {
	// Validate content is required
	if err := ValidateRequired("content", req.Content); err != nil {
		return err
	}

	// Validate content length (min=1, max=5000)
	if len(req.Content) < 1 {
		return fmt.Errorf("content must be at least 1 character long")
	}
	if len(req.Content) > 5000 {
		return fmt.Errorf("content must be at most 5000 characters long")
	}

	return nil
}

func validateCreateSaleRequestRequest(req models.CreateSaleRequestRequest) error {
	// Validate thread_id is required
	if err := ValidateRequired("thread_id", req.ThreadID); err != nil {
		return err
	}

	// Validate post_id is required
	if err := ValidateRequired("post_id", req.PostID); err != nil {
		return err
	}

	// Validate price is required and positive
	if req.Price < 1 {
		return fmt.Errorf("price must be at least 1")
	}

	// Validate phone number if provided
	if err := ValidatePhoneNumber(req.PhoneNumber); err != nil {
		return err
	}

	return nil
}

func validateConfirmSaleRequestRequest(req models.ConfirmSaleRequestRequest) error {
	// Validate sale_request_id is required
	if err := ValidateRequired("sale_request_id", req.SaleRequestID); err != nil {
		return err
	}

	return nil
}
