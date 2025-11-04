package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/yourusername/appexit-backend/internal/models"
	"github.com/yourusername/appexit-backend/internal/utils"
	"github.com/yourusername/appexit-backend/pkg/response"
)

var allowedRegistrationRoles = map[string]struct{}{
	"seller":  {},
	"buyer":   {},
	"advisor": {},
}

func (s *Server) RegisterStep1(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req models.RegistrationStep1Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "リクエスト形式が不正です")
		return
	}

	method := strings.ToLower(string(req.Method))
	switch method {
	case string(models.RegistrationMethodEmail):
		createReq := models.CreateUserRequest{Email: req.Email, Password: req.Password}
		if err := utils.ValidateStruct(createReq); err != nil {
			response.Error(w, http.StatusBadRequest, fmt.Sprintf("入力内容に誤りがあります: %v", err))
			return
		}

		authResp, status, err := s.signupWithEmail(createReq)
		if err != nil {
			response.Error(w, status, err.Error())
			return
		}

		setAuthCookies(w, authResp.AccessToken, authResp.RefreshToken, &authResp.User, nil)

		response.Success(w, status, models.RegistrationStep1Response{
			Type:           "email",
			Auth:           authResp,
			SelectedMethod: models.RegistrationMethodEmail,
		})
		return

	case string(models.RegistrationMethodGoogle), string(models.RegistrationMethodGithub), string(models.RegistrationMethodX):
		provider := method
		if provider == string(models.RegistrationMethodX) {
			provider = "twitter"
		}

		redirect := strings.TrimSpace(req.RedirectURL)
		builder, err := url.Parse(fmt.Sprintf("%s/auth/v1/authorize", s.config.SupabaseURL))
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "OAuth URLの生成に失敗しました")
			return
		}

		query := builder.Query()
		query.Set("provider", provider)
		if redirect != "" {
			query.Set("redirect_to", redirect)
		}
		builder.RawQuery = query.Encode()

		response.Success(w, http.StatusOK, models.RegistrationStep1Response{
			Type:           "oauth",
			ProviderURL:    builder.String(),
			SelectedMethod: models.RegistrationMethod(method),
		})
		return
	default:
		response.Error(w, http.StatusBadRequest, "サポートされていない登録方法です")
		return
	}
}

func (s *Server) RegisterStep2(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.RegistrationStep2Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "リクエスト形式が不正です")
		return
	}

	roles := uniqueStrings(req.Roles)
	if len(roles) == 0 {
		response.Error(w, http.StatusBadRequest, "少なくとも1つのロールを選択してください")
		return
	}

	for _, role := range roles {
		if _, ok := allowedRegistrationRoles[role]; !ok {
			response.Error(w, http.StatusBadRequest, fmt.Sprintf("不正なロールが含まれています: %s", role))
			return
		}
	}

	updates := map[string]interface{}{
		"profile": map[string]interface{}{
			"selected_roles": roles,
		},
	}

	if _, err := s.supabase.MergeUserMetadata(userID, updates); err != nil {
		response.Error(w, http.StatusInternalServerError, fmt.Sprintf("ロール情報の保存に失敗しました: %v", err))
		return
	}

	response.Success(w, http.StatusOK, models.RegistrationStep2Response{Roles: roles})
}

func (s *Server) RegisterStep3(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	impersonateJWT, ok := r.Context().Value("impersonate_jwt").(string)
	if !ok || impersonateJWT == "" {
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.RegistrationStep3Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "リクエスト形式が不正です")
		return
	}

	if strings.TrimSpace(req.DisplayName) == "" {
		response.Error(w, http.StatusBadRequest, "表示名を入力してください")
		return
	}

	party := strings.ToLower(strings.TrimSpace(req.Party))
	if party != "individual" && party != "organization" {
		response.Error(w, http.StatusBadRequest, "アカウント区分を選択してください")
		return
	}

	metadata, err := s.supabase.GetUserMetadata(userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, fmt.Sprintf("ユーザーメタデータの取得に失敗しました: %v", err))
		return
	}

	roles := extractSelectedRoles(metadata)
	if len(roles) == 0 {
		response.Error(w, http.StatusBadRequest, "ロール選択が完了していません")
		return
	}

	impersonateClient := s.supabase.GetAuthenticatedClient(impersonateJWT)

	payloads := make([]models.ProfileUpsert, 0, len(roles))
	for _, role := range roles {
		payloads = append(payloads, models.ProfileUpsert{
			ID:          userID,
			Role:        role,
			Party:       party,
			DisplayName: strings.TrimSpace(req.DisplayName),
			IconURL:     req.IconURL,
		})
	}

	if len(payloads) > 0 {
		_, _, err = impersonateClient.From("profiles").Insert(payloads, true, "id,role", "minimal", "").Execute()
		if err != nil {
			response.Error(w, http.StatusInternalServerError, fmt.Sprintf("プロフィール情報の保存に失敗しました: %v", err))
			return
		}
	}

	profileUpdates := map[string]interface{}{
		"profile": map[string]interface{}{
			"display_name": req.DisplayName,
			"party":        party,
		},
	}

	if req.Prefecture != nil {
		profileUpdates["profile"].(map[string]interface{})["prefecture"] = strings.TrimSpace(*req.Prefecture)
	}
	if req.CompanyName != nil {
		profileUpdates["profile"].(map[string]interface{})["company_name"] = strings.TrimSpace(*req.CompanyName)
	}
	if req.Introduction != nil {
		profileUpdates["profile"].(map[string]interface{})["introduction"] = strings.TrimSpace(*req.Introduction)
	}
	if len(req.Links) > 0 {
		cleanedLinks := make([]string, 0, len(req.Links))
		for _, link := range req.Links {
			l := strings.TrimSpace(link)
			if l != "" {
				cleanedLinks = append(cleanedLinks, l)
			}
		}
		if len(cleanedLinks) > 0 {
			profileUpdates["profile"].(map[string]interface{})["links"] = cleanedLinks
		}
	}

	if _, err := s.supabase.MergeUserMetadata(userID, profileUpdates); err != nil {
		response.Error(w, http.StatusInternalServerError, fmt.Sprintf("プロフィール基本情報の保存に失敗しました: %v", err))
		return
	}

	var profiles []models.Profile
	_, err = impersonateClient.From("profiles").Select("*", "", false).Eq("id", userID).ExecuteTo(&profiles)
	if err != nil || len(profiles) == 0 {
		response.Error(w, http.StatusInternalServerError, "プロフィール情報の取得に失敗しました")
		return
	}

	response.Success(w, http.StatusOK, models.RegistrationStep3Response{
		Roles:   roles,
		Profile: profiles[0],
	})
}

func (s *Server) RegisterStep4(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	impersonateJWT, ok := r.Context().Value("impersonate_jwt").(string)
	if !ok || impersonateJWT == "" {
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.RegistrationStep4Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "リクエスト形式が不正です")
		return
	}

	metadata, err := s.supabase.GetUserMetadata(userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, fmt.Sprintf("ユーザーメタデータの取得に失敗しました: %v", err))
		return
	}

	roles := extractSelectedRoles(metadata)
	if len(roles) == 0 {
		response.Error(w, http.StatusBadRequest, "ロール選択が完了していません")
		return
	}

	impersonateClient := s.supabase.GetAuthenticatedClient(impersonateJWT)

	if req.Seller != nil {
		if contains(roles, "seller") {
			update := map[string]interface{}{}
			if req.Seller.ListingCount != nil {
				update["listing_count"] = *req.Seller.ListingCount
			}
			if req.Seller.ServiceCategories != nil {
				update["service_categories"] = req.Seller.ServiceCategories
			}
			if req.Seller.DesiredExitTiming != nil {
				update["desired_exit_timing"] = strings.TrimSpace(*req.Seller.DesiredExitTiming)
			}
			if len(update) > 0 {
				if _, _, err := impersonateClient.From("profiles").Update(update, "", "").Eq("id", userID).Eq("role", "seller").Execute(); err != nil {
					response.Error(w, http.StatusInternalServerError, fmt.Sprintf("売り手情報の更新に失敗しました: %v", err))
					return
				}
			}
		} else {
			response.Error(w, http.StatusBadRequest, "売り手ロールが選択されていません")
			return
		}
	}

	if req.Buyer != nil {
		if contains(roles, "buyer") {
			update := map[string]interface{}{}
			if req.Buyer.InvestmentMin != nil {
				update["investment_min"] = *req.Buyer.InvestmentMin
			}
			if req.Buyer.InvestmentMax != nil {
				update["investment_max"] = *req.Buyer.InvestmentMax
			}
			if req.Buyer.TargetCategories != nil {
				update["target_categories"] = req.Buyer.TargetCategories
			}
			if req.Buyer.OperationType != nil {
				update["operation_type"] = strings.TrimSpace(*req.Buyer.OperationType)
			}
			if len(update) > 0 {
				if _, _, err := impersonateClient.From("profiles").Update(update, "", "").Eq("id", userID).Eq("role", "buyer").Execute(); err != nil {
					response.Error(w, http.StatusInternalServerError, fmt.Sprintf("買い手情報の更新に失敗しました: %v", err))
					return
				}
			}
		} else {
			response.Error(w, http.StatusBadRequest, "買い手ロールが選択されていません")
			return
		}
	}

	if req.Advisor != nil {
		if contains(roles, "advisor") {
			update := map[string]interface{}{}
			if req.Advisor.Expertise != nil {
				update["expertise"] = req.Advisor.Expertise
			}
			if req.Advisor.PortfolioSummary != nil {
				update["portfolio_summary"] = strings.TrimSpace(*req.Advisor.PortfolioSummary)
			}
			if req.Advisor.ProposalStyle != nil {
				update["proposal_style"] = strings.TrimSpace(*req.Advisor.ProposalStyle)
			}
			if len(update) > 0 {
				if _, _, err := impersonateClient.From("profiles").Update(update, "", "").Eq("id", userID).Eq("role", "advisor").Execute(); err != nil {
					response.Error(w, http.StatusInternalServerError, fmt.Sprintf("提案者情報の更新に失敗しました: %v", err))
					return
				}
			}
		} else {
			response.Error(w, http.StatusBadRequest, "提案者ロールが選択されていません")
			return
		}
	}

	var profiles []models.Profile
	_, err = impersonateClient.From("profiles").Select("*", "", false).Eq("id", userID).ExecuteTo(&profiles)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "プロフィール情報の取得に失敗しました")
		return
	}

	response.Success(w, http.StatusOK, profiles)
}

func (s *Server) RegisterStep5(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	impersonateJWT, ok := r.Context().Value("impersonate_jwt").(string)
	if !ok || impersonateJWT == "" {
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.RegistrationStep5Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "リクエスト形式が不正です")
		return
	}

	metadata, err := s.supabase.GetUserMetadata(userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, fmt.Sprintf("ユーザーメタデータの取得に失敗しました: %v", err))
		return
	}

	roles := extractSelectedRoles(metadata)
	if len(roles) == 0 {
		response.Error(w, http.StatusBadRequest, "ロール選択が完了していません")
		return
	}

	impersonateClient := s.supabase.GetAuthenticatedClient(impersonateJWT)
	now := time.Now().UTC().Format(time.RFC3339Nano)

	for _, role := range roles {
		update := map[string]interface{}{
			"nda_flag": req.NDAAgreed,
		}
		if req.TermsAccepted {
			update["terms_accepted_at"] = now
		}
		if req.PrivacyAccepted {
			update["privacy_accepted_at"] = now
		}

		if _, _, err := impersonateClient.From("profiles").Update(update, "", "").Eq("id", userID).Eq("role", role).Execute(); err != nil {
			response.Error(w, http.StatusInternalServerError, fmt.Sprintf("同意情報の保存に失敗しました: %v", err))
			return
		}
	}

	completionUpdates := map[string]interface{}{
		"profile": map[string]interface{}{
			"nda_agreed":           req.NDAAgreed,
			"terms_accepted":       req.TermsAccepted,
			"privacy_accepted":     req.PrivacyAccepted,
			"onboarding_completed": true,
		},
	}

	if _, err := s.supabase.MergeUserMetadata(userID, completionUpdates); err != nil {
		response.Error(w, http.StatusInternalServerError, fmt.Sprintf("メタデータの更新に失敗しました: %v", err))
		return
	}

	response.Success(w, http.StatusOK, models.RegistrationCompletionResponse{
		Completed: true,
		Roles:     roles,
	})
}

func extractSelectedRoles(metadata map[string]interface{}) []string {
	if metadata == nil {
		return []string{}
	}

	profileMeta, ok := metadata["profile"].(map[string]interface{})
	if !ok {
		return []string{}
	}

	rawRoles, ok := profileMeta["selected_roles"]
	if !ok {
		return []string{}
	}

	switch v := rawRoles.(type) {
	case []interface{}:
		roles := []string{}
		for _, item := range v {
			if role, ok := item.(string); ok {
				roles = append(roles, strings.ToLower(role))
			}
		}
		return uniqueStrings(roles)
	case []string:
		normalized := make([]string, 0, len(v))
		for _, role := range v {
			normalized = append(normalized, strings.ToLower(role))
		}
		return uniqueStrings(normalized)
	default:
		return []string{}
	}
}

func uniqueStrings(values []string) []string {
	seen := make(map[string]struct{}, len(values))
	result := make([]string, 0, len(values))
	for _, v := range values {
		key := strings.ToLower(strings.TrimSpace(v))
		if key == "" {
			continue
		}
		if _, exists := seen[key]; !exists {
			seen[key] = struct{}{}
			result = append(result, key)
		}
	}
	return result
}

func contains(list []string, target string) bool {
	for _, item := range list {
		if item == target {
			return true
		}
	}
	return false
}
