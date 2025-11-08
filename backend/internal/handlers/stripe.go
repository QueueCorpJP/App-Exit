package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/yourusername/appexit-backend/config"
	"github.com/yourusername/appexit-backend/internal/services"
	"github.com/yourusername/appexit-backend/pkg/response"
)

type StripeHandler struct {
	cfg            *config.Config
	supabaseService *services.SupabaseService
	stripeService   *services.StripeService
}

func NewStripeHandler(
	cfg *config.Config,
	supabaseService *services.SupabaseService,
	stripeService *services.StripeService,
) *StripeHandler {
	return &StripeHandler{
		cfg:            cfg,
		supabaseService: supabaseService,
		stripeService:   stripeService,
	}
}

// CreateAccountRequest はStripeアカウント作成リクエスト
type CreateAccountRequest struct {
	TosAccepted   bool   `json:"tosAccepted"`
	TosAcceptedIP string `json:"tosAcceptedIp"`
}

// CreateAccountResponse はStripeアカウント作成レスポンス
type CreateAccountResponse struct {
	AccountID           string `json:"accountId"`
	OnboardingCompleted bool   `json:"onboardingCompleted"`
}

// HandleCreateAccount はStripeアカウント作成ハンドラー
func (h *StripeHandler) HandleCreateAccount(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := ctx.Value("user_id").(string)

	// リクエストボディをパース
	var req CreateAccountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// TOS同意チェック
	if !req.TosAccepted {
		response.Error(w, http.StatusBadRequest, "Terms of service must be accepted")
		return
	}

	// ユーザー情報を取得
	var profiles []map[string]interface{}
	_, err := h.supabaseService.GetServiceClient().
		From("profiles").
		Select("*", "", false).
		Eq("id", userID).
		ExecuteTo(&profiles)

	if err != nil || len(profiles) == 0 {
		log.Printf("[STRIPE] Failed to get user profile: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to get user profile")
		return
	}

	profile := profiles[0]

	// 既にStripeアカウントがあるかチェック
	if stripeAccountID, ok := profile["stripe_account_id"].(string); ok && stripeAccountID != "" {
		response.Error(w, http.StatusConflict, "Stripe account already exists")
		return
	}

	// メールアドレスを取得（Supabase Admin APIを使用）
	email := ""
	userMetadata, err := h.supabaseService.GetUserMetadata(userID)
	if err == nil {
		if e, ok := userMetadata["email"].(string); ok {
			email = e
		}
	}

	// partyを取得（個人 or 法人）
	party := "individual"
	if p, ok := profile["party"].(string); ok && p != "" {
		if p == "organization" {
			party = "company"
		}
	}

	// Stripeアカウントを作成
	account, err := h.stripeService.CreateConnectedAccount(
		ctx,
		email,
		party,
		"JP", // 日本
	)

	if err != nil {
		log.Printf("[STRIPE] Failed to create Stripe account: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to create Stripe account")
		return
	}

	// Requirementsを取得
	requirementsJSON, _ := h.stripeService.ConvertRequirementsToJSON(account)

	// プロフィールを更新
	updateData := map[string]interface{}{
		"stripe_account_id":            account.ID,
		"tos_accepted_at":              time.Now(),
		"tos_accepted_ip":              req.TosAcceptedIP,
		"stripe_onboarding_completed":  false,
		"stripe_requirements_due":      string(requirementsJSON),
		"updated_at":                   time.Now(),
	}

	_, err = h.supabaseService.GetServiceClient().
		From("profiles").
		Update(updateData, "", "").
		Eq("id", userID).
		ExecuteTo(nil)

	if err != nil {
		log.Printf("[STRIPE] Failed to update profile with Stripe account ID: %v", err)
		// Stripeアカウントは作成済みなので、エラーを返すがアカウントIDは返す
	}

	// レスポンス
	response.Success(w, http.StatusOK, CreateAccountResponse{
		AccountID:           account.ID,
		OnboardingCompleted: false,
	})
}

// CreateOnboardingLinkRequest はオンボーディングリンク作成リクエスト
type CreateOnboardingLinkRequest struct {
	AccountType string `json:"account_type"` // "buyer" or "seller"
	ReturnURL   string `json:"return_url"`
	RefreshURL  string `json:"refresh_url"`
}

// CreateOnboardingLinkResponse はオンボーディングリンクレスポンス
type CreateOnboardingLinkResponse struct {
	URL string `json:"url"`
}

// HandleCreateOnboardingLink はroleに応じたStripeアカウント作成とオンボーディングリンク取得ハンドラー
func (h *StripeHandler) HandleCreateOnboardingLink(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := ctx.Value("user_id").(string)

	// リクエストボディをパース
	var req CreateOnboardingLinkRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// account_typeのバリデーション
	if req.AccountType != "buyer" && req.AccountType != "seller" {
		response.Error(w, http.StatusBadRequest, "account_type must be 'buyer' or 'seller'")
		return
	}

	// ユーザー情報とプロフィールを取得
	var profiles []map[string]interface{}
	_, err := h.supabaseService.GetServiceClient().
		From("profiles").
		Select("*", "", false).
		Eq("id", userID).
		ExecuteTo(&profiles)

	if err != nil || len(profiles) == 0 {
		log.Printf("[STRIPE] Failed to get user profile: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to get user profile")
		return
	}

	profile := profiles[0]

	// ユーザーのroleを確認
	var userRoles []string
	if roles, ok := profile["roles"].([]interface{}); ok {
		for _, role := range roles {
			if roleStr, ok := role.(string); ok {
				userRoles = append(userRoles, roleStr)
			}
		}
	} else if role, ok := profile["role"].(string); ok && role != "" {
		userRoles = []string{role}
	}

	// roleの検証: リクエストされたaccount_typeに対応するroleを持っているか確認
	hasPermission := false
	for _, role := range userRoles {
		if role == "advisor" {
			// advisorはbuyerとsellerの両方を作成可能
			hasPermission = true
			break
		} else if role == req.AccountType {
			// 自分のroleと一致する
			hasPermission = true
			break
		}
	}

	if !hasPermission {
		response.Error(w, http.StatusForbidden, fmt.Sprintf("You don't have permission to create a %s account", req.AccountType))
		return
	}

	// 既に該当タイプのStripeアカウントがあるかチェック
	var stripeAccountIDField string
	if req.AccountType == "buyer" {
		stripeAccountIDField = "stripe_customer_id" // buyerはCustomer ID
	} else {
		stripeAccountIDField = "stripe_account_id" // sellerはConnect Account ID
	}

	if existingAccountID, ok := profile[stripeAccountIDField].(string); ok && existingAccountID != "" {
		// 既にアカウントが存在する場合は、そのアカウントのオンボーディングリンクを返す
		if req.AccountType == "seller" {
			link, err := h.stripeService.CreateAccountLink(ctx, existingAccountID, req.ReturnURL, req.RefreshURL)
			if err != nil {
				log.Printf("[STRIPE] Failed to create account link: %v", err)
				response.Error(w, http.StatusInternalServerError, "Failed to create onboarding link")
				return
			}
			response.Success(w, http.StatusOK, CreateOnboardingLinkResponse{URL: link.URL})
			return
		} else {
			// buyerの場合は既に作成済みなので、そのまま成功を返す（buyerは特別なオンボーディング不要）
			response.Error(w, http.StatusConflict, "Buyer account already exists")
			return
		}
	}

	// メールアドレスを取得
	email := ""
	userMetadata, err := h.supabaseService.GetUserMetadata(userID)
	if err == nil {
		if e, ok := userMetadata["email"].(string); ok {
			email = e
		}
	}

	// partyを取得（個人 or 法人）
	party := "individual"
	if p, ok := profile["party"].(string); ok && p != "" {
		if p == "organization" {
			party = "company"
		}
	}

	// account_typeに応じてStripeアカウントを作成
	if req.AccountType == "seller" {
		// Seller: Stripe Connect Accountを作成
		account, err := h.stripeService.CreateConnectedAccount(ctx, email, party, "JP")
		if err != nil {
			log.Printf("[STRIPE] Failed to create Stripe account: %v", err)
			response.Error(w, http.StatusInternalServerError, "Failed to create Stripe account")
			return
		}

		// Requirementsを取得
		requirementsJSON, _ := h.stripeService.ConvertRequirementsToJSON(account)

		// プロフィールを更新
		updateData := map[string]interface{}{
			"stripe_account_id":            account.ID,
			"stripe_onboarding_completed":  false,
			"stripe_requirements_due":      string(requirementsJSON),
			"updated_at":                   time.Now(),
		}

		_, err = h.supabaseService.GetServiceClient().
			From("profiles").
			Update(updateData, "", "").
			Eq("id", userID).
			ExecuteTo(nil)

		if err != nil {
			log.Printf("[STRIPE] Failed to update profile with Stripe account ID: %v", err)
		}

		// オンボーディングリンクを作成
		link, err := h.stripeService.CreateAccountLink(ctx, account.ID, req.ReturnURL, req.RefreshURL)
		if err != nil {
			log.Printf("[STRIPE] Failed to create account link: %v", err)
			response.Error(w, http.StatusInternalServerError, "Failed to create onboarding link")
			return
		}

		response.Success(w, http.StatusOK, CreateOnboardingLinkResponse{URL: link.URL})

	} else {
		// Buyer: Stripe Customerを作成（簡易版、実際の決済時に作成してもOK）
		// 現時点では特別なオンボーディングは不要なので、Customer IDだけ保存
		// 実際の決済時にSetupIntentやPaymentMethodを設定する

		// TODO: Stripe Customerを作成するサービスメソッドを実装
		// 現時点では、buyerは決済時に作成する方針なので、ここではエラーを返す
		response.Error(w, http.StatusNotImplemented, "Buyer account creation is handled during first purchase")
	}
}

// OnboardingLinkResponse は本人確認リンクレスポンス
type OnboardingLinkResponse struct {
	URL string `json:"url"`
}

// HandleGetOnboardingLink は本人確認リンク取得ハンドラー
func (h *StripeHandler) HandleGetOnboardingLink(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := ctx.Value("user_id").(string)

	// プロフィールからStripeアカウントIDを取得
	var profiles []map[string]interface{}
	_, err := h.supabaseService.GetServiceClient().
		From("profiles").
		Select("stripe_account_id", "", false).
		Eq("id", userID).
		ExecuteTo(&profiles)

	if err != nil || len(profiles) == 0 {
		log.Printf("[STRIPE] Failed to get profile: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to get profile")
		return
	}

	profile := profiles[0]
	stripeAccountID, ok := profile["stripe_account_id"].(string)
	if !ok || stripeAccountID == "" {
		response.Error(w, http.StatusBadRequest, "Stripe account not found")
		return
	}

	// Account Linkを作成
	returnURL := fmt.Sprintf("%s/settings/payment?success=true", h.cfg.FrontendURL)
	refreshURL := fmt.Sprintf("%s/settings/payment", h.cfg.FrontendURL)

	link, err := h.stripeService.CreateAccountLink(
		ctx,
		stripeAccountID,
		returnURL,
		refreshURL,
	)

	if err != nil {
		log.Printf("[STRIPE] Failed to create account link: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to create onboarding link")
		return
	}

	response.Success(w, http.StatusOK, OnboardingLinkResponse{
		URL: link.URL,
	})
}

// AccountStatusResponse はアカウント状態レスポンス
type AccountStatusResponse struct {
	HasAccount            bool     `json:"hasAccount"`
	AccountID             string   `json:"accountId,omitempty"`
	OnboardingCompleted   bool     `json:"onboardingCompleted"`
	ChargesEnabled        bool     `json:"chargesEnabled"`
	PayoutsEnabled        bool     `json:"payoutsEnabled"`
	RequirementsDue       []string `json:"requirementsDue"`
	TosAcceptedAt         *string  `json:"tosAcceptedAt,omitempty"`
	TosAcceptedIP         *string  `json:"tosAcceptedIp,omitempty"`
}

// HandleGetAccountStatus はアカウント状態取得ハンドラー
func (h *StripeHandler) HandleGetAccountStatus(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := ctx.Value("user_id").(string)

	// プロフィールを取得
	var profiles []map[string]interface{}
	_, err := h.supabaseService.GetServiceClient().
		From("profiles").
		Select("*", "", false).
		Eq("id", userID).
		ExecuteTo(&profiles)

	if err != nil || len(profiles) == 0 {
		log.Printf("[STRIPE] Failed to get profile: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to get profile")
		return
	}

	profile := profiles[0]
	stripeAccountID, hasAccount := profile["stripe_account_id"].(string)
	if !hasAccount || stripeAccountID == "" {
		// Stripeアカウント未作成
		response.Success(w, http.StatusOK, AccountStatusResponse{
			HasAccount:            false,
			OnboardingCompleted:   false,
			ChargesEnabled:        false,
			PayoutsEnabled:        false,
			RequirementsDue:       []string{},
		})
		return
	}

	// Stripeからアカウント情報を取得
	account, err := h.stripeService.GetAccount(ctx, stripeAccountID)
	if err != nil {
		log.Printf("[STRIPE] Failed to get Stripe account: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to get Stripe account")
		return
	}

	// 本人確認完了状態をチェック
	onboardingCompleted := h.stripeService.IsOnboardingCompleted(account)

	// Requirements（不足情報）を取得
	requirementsDue := h.stripeService.GetRequirementsDueList(account)

	// Requirements JSONを更新
	requirementsJSON, _ := h.stripeService.ConvertRequirementsToJSON(account)
	updateData := map[string]interface{}{
		"stripe_onboarding_completed": onboardingCompleted,
		"stripe_requirements_due":     string(requirementsJSON),
		"updated_at":                  time.Now(),
	}

	// DBを更新（非同期的に実行してレスポンス遅延を防ぐ）
	go func() {
		_, _ = h.supabaseService.GetServiceClient().
			From("profiles").
			Update(updateData, "", "").
			Eq("id", userID).
			ExecuteTo(nil)
	}()

	// TOS同意情報を取得
	var tosAcceptedAt *string
	var tosAcceptedIP *string
	if t, ok := profile["tos_accepted_at"].(string); ok && t != "" {
		tosAcceptedAt = &t
	}
	if ip, ok := profile["tos_accepted_ip"].(string); ok && ip != "" {
		tosAcceptedIP = &ip
	}

	response.Success(w, http.StatusOK, AccountStatusResponse{
		HasAccount:            true,
		AccountID:             stripeAccountID,
		OnboardingCompleted:   onboardingCompleted,
		ChargesEnabled:        account.ChargesEnabled,
		PayoutsEnabled:        account.PayoutsEnabled,
		RequirementsDue:       requirementsDue,
		TosAcceptedAt:         tosAcceptedAt,
		TosAcceptedIP:         tosAcceptedIP,
	})
}

// PayoutInfoResponse は精算情報レスポンス
type PayoutInfoResponse struct {
	TotalEarnings   int64  `json:"totalEarnings"`
	PendingAmount   int64  `json:"pendingAmount"`
	AvailableAmount int64  `json:"availableAmount"`
	LastPayoutDate  string `json:"lastPayoutDate,omitempty"`
	NextPayoutDate  string `json:"nextPayoutDate,omitempty"`
}

// HandleGetPayoutInfo は精算情報取得ハンドラー
func (h *StripeHandler) HandleGetPayoutInfo(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := ctx.Value("user_id").(string)

	// プロフィールからStripeアカウントIDを取得
	var profiles []map[string]interface{}
	_, err := h.supabaseService.GetServiceClient().
		From("profiles").
		Select("stripe_account_id", "", false).
		Eq("id", userID).
		ExecuteTo(&profiles)

	if err != nil || len(profiles) == 0 {
		log.Printf("[STRIPE] Failed to get profile: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to get profile")
		return
	}

	profile := profiles[0]
	stripeAccountID, ok := profile["stripe_account_id"].(string)
	if !ok || stripeAccountID == "" {
		response.Error(w, http.StatusBadRequest, "Stripe account not found")
		return
	}

	// Stripe残高を取得
	balance, err := h.stripeService.GetBalance(ctx, stripeAccountID)
	if err != nil {
		log.Printf("[STRIPE] Failed to get balance: %v", err)
		response.Error(w, http.StatusInternalServerError, "Failed to get balance")
		return
	}

	// Available（出金可能額）とPending（保留中）を計算
	availableAmount := int64(0)
	pendingAmount := int64(0)

	for _, balanceItem := range balance.Available {
		availableAmount += balanceItem.Amount
	}

	for _, balanceItem := range balance.Pending {
		pendingAmount += balanceItem.Amount
	}

	// 総売上を計算（DBから取得）
	// TODO: orders テーブルから売り手として受け取った総額を集計
	totalEarnings := int64(0)

	response.Success(w, http.StatusOK, PayoutInfoResponse{
		TotalEarnings:   totalEarnings,
		PendingAmount:   pendingAmount,
		AvailableAmount: availableAmount,
		LastPayoutDate:  "",  // TODO: 最終出金日を取得
		NextPayoutDate:  "",  // TODO: 次回出金予定日を計算
	})
}
