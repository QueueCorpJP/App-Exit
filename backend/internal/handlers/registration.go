package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/yourusername/appexit-backend/internal/models"
    "github.com/yourusername/appexit-backend/internal/middleware"
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

		s.setAuthCookies(w, authResp.AccessToken, authResp.RefreshToken, &authResp.User, nil)

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

		// リダイレクト先はバックエンドのコールバックURL
		backendCallbackURL := fmt.Sprintf("%s/api/auth/callback", s.config.BackendURL)

		builder, err := url.Parse(fmt.Sprintf("%s/auth/v1/authorize", s.config.SupabaseURL))
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "OAuth URLの生成に失敗しました")
			return
		}

		query := builder.Query()
		query.Set("provider", provider)
		query.Set("redirect_to", backendCallbackURL)
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

    // Step2でprofilesにロール行を作成（partyはNULL許可なので後で埋める）
    impersonateJWT, ok := r.Context().Value("impersonate_jwt").(string)
    if !ok || strings.TrimSpace(impersonateJWT) == "" {
        response.Error(w, http.StatusUnauthorized, "Unauthorized")
        return
    }
    impersonateClient := s.supabase.GetAuthenticatedClient(impersonateJWT)

    payloads := make([]models.ProfileUpsert, 0, len(roles))
    for _, role := range roles {
        payloads = append(payloads, models.ProfileUpsert{
            ID:   userID,
            Role: role,
            // party, display_nameはStep3で設定
        })
    }
    if len(payloads) > 0 {
        if _, _, err := impersonateClient.From("profiles").Insert(payloads, true, "id,role", "minimal", "").Execute(); err != nil {
            response.Error(w, http.StatusInternalServerError, fmt.Sprintf("ロール行の保存に失敗しました: %v", err))
            return
        }
        // 配列カラムrolesも同期
        if _, _, err := impersonateClient.From("profiles").Update(map[string]interface{}{"roles": roles}, "", "").Eq("id", userID).Execute(); err != nil {
            response.Error(w, http.StatusInternalServerError, fmt.Sprintf("ロール配列の保存に失敗しました: %v", err))
            return
        }
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

	// 🔒 SECURITY: 表示名をサニタイズ
	displayNameResult := utils.SanitizeText(utils.SanitizeInput{
		Value:      req.DisplayName,
		MaxLength:  utils.MaxUsernameLength,
		AllowHTML:  false,
		StrictMode: true,
	})
	if !displayNameResult.IsValid {
		response.Error(w, http.StatusBadRequest, fmt.Sprintf("表示名に不正な文字が含まれています: %s", strings.Join(displayNameResult.Errors, ", ")))
		return
	}
	req.DisplayName = displayNameResult.Sanitized

	if strings.TrimSpace(req.DisplayName) == "" {
		response.Error(w, http.StatusBadRequest, "表示名を入力してください")
		return
	}

	party := strings.ToLower(strings.TrimSpace(req.Party))
	if party != "individual" && party != "organization" {
		response.Error(w, http.StatusBadRequest, "アカウント区分を選択してください")
		return
	}

    impersonateClient := s.supabase.GetAuthenticatedClient(impersonateJWT)
    // ロールはStep3のリクエストから受け取る
    roles := uniqueStrings(req.Roles)
    if len(roles) == 0 {
        response.Error(w, http.StatusBadRequest, "ロール選択が完了していません")
        return
    }
    for _, role := range roles {
        if _, ok := allowedRegistrationRoles[role]; !ok {
            response.Error(w, http.StatusBadRequest, fmt.Sprintf("不正なロールが含まれています: %s", role))
            return
        }
    }

    payloads := make([]models.ProfileUpsert, 0, len(roles))
    displayNamePtr := strings.TrimSpace(req.DisplayName)
    for _, role := range roles {
        payloads = append(payloads, models.ProfileUpsert{
            ID:           userID,
            Role:         role,
            Party:        &party,
            DisplayName:  &displayNamePtr,
            IconURL:      req.IconURL,
            Prefecture:   req.Prefecture,
            CompanyName:  req.CompanyName,
            Introduction: req.Introduction,
        })
    }
    if len(payloads) > 0 {
        if _, _, err := impersonateClient.From("profiles").Insert(payloads, true, "id,role", "minimal", "").Execute(); err != nil {
            response.Error(w, http.StatusInternalServerError, fmt.Sprintf("プロフィール情報の保存に失敗しました: %v", err))
            return
        }
        // 同期: 役割配列カラム（roles）を更新
        if _, _, err := impersonateClient.From("profiles").Update(map[string]interface{}{"roles": roles}, "", "").Eq("id", userID).Execute(); err != nil {
            response.Error(w, http.StatusInternalServerError, fmt.Sprintf("ロール配列の保存に失敗しました: %v", err))
            return
        }
    }

    // ユーザーリンクを保存
    if len(req.Links) > 0 {
        linkPayloads := make([]map[string]interface{}, 0, len(req.Links))
        for i, link := range req.Links {
            if strings.TrimSpace(link.Name) == "" || strings.TrimSpace(link.URL) == "" {
                continue
            }
            linkPayloads = append(linkPayloads, map[string]interface{}{
                "user_id":       userID,
                "name":          strings.TrimSpace(link.Name),
                "url":           strings.TrimSpace(link.URL),
                "display_order": i,
            })
        }
        if len(linkPayloads) > 0 {
            if _, _, err := impersonateClient.From("user_links").Insert(linkPayloads, false, "", "minimal", "").Execute(); err != nil {
                response.Error(w, http.StatusInternalServerError, fmt.Sprintf("リンク情報の保存に失敗しました: %v", err))
                return
            }
        }
    }

    // メタデータ保存は廃止。追加フィールドが必要なら profiles にカラムを追加してください。

    var profiles []models.Profile
    if _, err := impersonateClient.From("profiles").Select("*", "", false).Eq("id", userID).ExecuteTo(&profiles); err != nil || len(profiles) == 0 {
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

    impersonateClient := s.supabase.GetAuthenticatedClient(impersonateJWT)
    // ロールは profiles から取得
    var rowsStep4 []struct{ Role string `json:"role"` }
    if _, err := impersonateClient.From("profiles").Select("role", "", false).Eq("id", userID).ExecuteTo(&rowsStep4); err != nil {
        response.Error(w, http.StatusInternalServerError, "ロール取得に失敗しました")
        return
    }
    roles := make([]string, 0, len(rowsStep4))
    for _, r := range rowsStep4 {
        v := strings.ToLower(strings.TrimSpace(r.Role))
        if v != "" {
            roles = append(roles, v)
        }
    }
    roles = uniqueStrings(roles)
    if len(roles) == 0 {
        response.Error(w, http.StatusBadRequest, "ロール選択が完了していません")
        return
    }

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
			if req.Buyer.DesiredAcquisitionTiming != nil {
				update["desired_purchase_timing"] = strings.TrimSpace(*req.Buyer.DesiredAcquisitionTiming)
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
			if req.Advisor.InvestmentMin != nil {
				update["investment_min"] = *req.Advisor.InvestmentMin
			}
			if req.Advisor.InvestmentMax != nil {
				update["investment_max"] = *req.Advisor.InvestmentMax
			}
			if req.Advisor.TargetCategories != nil {
				update["target_categories"] = req.Advisor.TargetCategories
			}
			if req.Advisor.DesiredAcquisitionTiming != nil {
				update["desired_purchase_timing"] = strings.TrimSpace(*req.Advisor.DesiredAcquisitionTiming)
			}
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
    if _, err := impersonateClient.From("profiles").Select("*", "", false).Eq("id", userID).ExecuteTo(&profiles); err != nil {
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

    impersonateClient := s.supabase.GetAuthenticatedClient(impersonateJWT)
    // ロールは profiles から取得
    var rowsStep5 []struct{ Role string `json:"role"` }
    if _, err := impersonateClient.From("profiles").Select("role", "", false).Eq("id", userID).ExecuteTo(&rowsStep5); err != nil {
        response.Error(w, http.StatusInternalServerError, "ロール取得に失敗しました")
        return
    }
    roles := make([]string, 0, len(rowsStep5))
    for _, r := range rowsStep5 {
        v := strings.ToLower(strings.TrimSpace(r.Role))
        if v != "" {
            roles = append(roles, v)
        }
    }
    roles = uniqueStrings(roles)
    if len(roles) == 0 {
        response.Error(w, http.StatusBadRequest, "ロール選択が完了していません")
        return
    }
	now := time.Now().UTC().Format(time.RFC3339Nano)

    update := map[string]interface{}{
        "nda_flag": req.NDAAgreed,
    }
    if req.TermsAccepted {
        update["terms_accepted_at"] = now
    }
    if req.PrivacyAccepted {
        update["privacy_accepted_at"] = now
    }
    if _, _, err := impersonateClient.From("profiles").Update(update, "", "").Eq("id", userID).Execute(); err != nil {
        response.Error(w, http.StatusInternalServerError, fmt.Sprintf("同意情報の保存に失敗しました: %v", err))
        return
    }

    // メタデータ更新は廃止（profiles を正とする）

	response.Success(w, http.StatusOK, models.RegistrationCompletionResponse{
		Completed: true,
		Roles:     roles,
	})
}

// GetRegistrationProgress はユーザーの登録進捗に応じて次に進むべきステップとパスを返す
// 認証は Cookie(auth_token) を用いたセッション検証で行う（Authorization ヘッダ不要）
func (s *Server) GetRegistrationProgress(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
        response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
        return
    }

    // auth_token クッキーからユーザー特定
    cookie, err := r.Cookie("auth_token")
    if err != nil || strings.TrimSpace(cookie.Value) == "" {
        response.Error(w, http.StatusUnauthorized, "No session found")
        return
    }

    // JWT を検証し userID を取得
    token, err := jwt.ParseWithClaims(cookie.Value, &middleware.SupabaseJWTClaims{}, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
        }
        return []byte(s.config.SupabaseJWTSecret), nil
    })
    if err != nil {
        response.Error(w, http.StatusUnauthorized, "Invalid session")
        return
    }

    claims, ok := token.Claims.(*middleware.SupabaseJWTClaims)
    if !ok || !token.Valid {
        response.Error(w, http.StatusUnauthorized, "Invalid session")
        return
    }

    userID := claims.Sub

    // プロフィールDBのみで進捗判定
    userClient := s.supabase.GetAuthenticatedClient(cookie.Value)
    var profiles []models.Profile
    if _, err := userClient.From("profiles").Select("*", "", false).Eq("id", userID).ExecuteTo(&profiles); err != nil {
        response.Error(w, http.StatusInternalServerError, "プロフィール取得に失敗しました")
        return
    }

    if len(profiles) == 0 {
        response.Success(w, http.StatusOK, map[string]interface{}{
            "step":          2,
            "redirect_path": "/onboarding",
        })
        return
    }

    // 基本プロフィール（display_name, party）: すべてのロールで埋まっているか判定
    needBasic := false
    for _, p := range profiles {
        if strings.TrimSpace(p.DisplayName) == "" || (p.Party != "individual" && p.Party != "organization") {
            needBasic = true
            break
        }
    }
    if needBasic {
        response.Success(w, http.StatusOK, map[string]interface{}{
            "step":          3,
            "redirect_path": "/settings/profile",
        })
        return
    }

    // 同意完了（NDA/規約/プライバシー）: 全ロールで完了していれば完了
    needConsent := false
    for _, p := range profiles {
        if !p.NDAFlag || p.TermsAcceptedAt == nil || p.PrivacyAcceptedAt == nil {
            needConsent = true
            break
        }
    }
    if needConsent {
        response.Success(w, http.StatusOK, map[string]interface{}{
            "step":          5,
            "redirect_path": "/settings/profile",
        })
        return
    }

    // すべて完了
    response.Success(w, http.StatusOK, map[string]interface{}{
        "step":          6,
        "redirect_path": "/dashboard",
    })
}

func extractSelectedRoles(metadata map[string]interface{}) []string {
    if metadata == nil {
        return []string{}
    }

    // 1) トップレベル roles 優先
    if rawTop, ok := metadata["roles"]; ok {
        switch v := rawTop.(type) {
        case []interface{}:
            roles := make([]string, 0, len(v))
            for _, item := range v {
                if s, ok := item.(string); ok {
                    s = strings.ToLower(strings.TrimSpace(s))
                    if s != "" {
                        roles = append(roles, s)
                    }
                }
            }
            roles = uniqueStrings(roles)
            if len(roles) > 0 {
                return roles
            }
        case []string:
            roles := make([]string, 0, len(v))
            for _, s := range v {
                s = strings.ToLower(strings.TrimSpace(s))
                if s != "" {
                    roles = append(roles, s)
                }
            }
            roles = uniqueStrings(roles)
            if len(roles) > 0 {
                return roles
            }
        }
    }

    // 2) 互換: profile.selected_roles
    if profileMeta, ok := metadata["profile"].(map[string]interface{}); ok {
        if rawRoles, ok := profileMeta["selected_roles"]; ok {
            switch v := rawRoles.(type) {
            case []interface{}:
                roles := []string{}
                for _, item := range v {
                    if role, ok := item.(string); ok {
                        roles = append(roles, strings.ToLower(strings.TrimSpace(role)))
                    }
                }
                return uniqueStrings(roles)
            case []string:
                normalized := make([]string, 0, len(v))
                for _, role := range v {
                    normalized = append(normalized, strings.ToLower(strings.TrimSpace(role)))
                }
                return uniqueStrings(normalized)
            }
        }
    }

    // 3) 旧: 単数 role（トップレベル or profile 内）
    if rawSingle, ok := metadata["role"]; ok {
        if s, ok := rawSingle.(string); ok {
            s = strings.ToLower(strings.TrimSpace(s))
            if s != "" {
                return []string{s}
            }
        }
    }
    if profileMeta, ok := metadata["profile"].(map[string]interface{}); ok {
        if rawSingle, ok := profileMeta["role"]; ok {
            if s, ok := rawSingle.(string); ok {
                s = strings.ToLower(strings.TrimSpace(s))
                if s != "" {
                    return []string{s}
                }
            }
        }
    }

    return []string{}
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

