package handlers

import (
	"encoding/json"
	"fmt"
	"io"
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

	log.Printf("[STRIPE] Created account: %s for user: %s", account.ID, userID)

	// Requirementsを取得
	requirementsJSON, _ := h.stripeService.ConvertRequirementsToJSON(account)

	// プロフィールを更新（即座保存）
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
		log.Printf("[STRIPE] Failed to save stripe_account_id: %v", err)

		// ロールバック: Stripeアカウントを削除
		log.Printf("[STRIPE] Rolling back: deleting Stripe account: %s", account.ID)
		delErr := h.stripeService.DeleteAccount(ctx, account.ID)
		if delErr != nil {
			log.Printf("[STRIPE] CRITICAL: Failed to rollback Stripe account %s: %v", account.ID, delErr)
			log.Printf("[STRIPE] CRITICAL: Orphaned account needs manual cleanup: %s", account.ID)
		} else {
			log.Printf("[STRIPE] Successfully rolled back Stripe account: %s", account.ID)
		}

		response.Error(w, http.StatusInternalServerError, "Failed to save Stripe account ID")
		return
	}

	log.Printf("[STRIPE] Successfully saved stripe_account_id: %s", account.ID)

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

		log.Printf("[STRIPE] Created account: %s for user: %s", account.ID, userID)

		// Requirementsを取得
		requirementsJSON, _ := h.stripeService.ConvertRequirementsToJSON(account)

		// プロフィールを更新（即座保存）
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
			log.Printf("[STRIPE] Failed to save stripe_account_id: %v", err)

			// ロールバック: Stripeアカウントを削除
			log.Printf("[STRIPE] Rolling back: deleting Stripe account: %s", account.ID)
			delErr := h.stripeService.DeleteAccount(ctx, account.ID)
			if delErr != nil {
				log.Printf("[STRIPE] CRITICAL: Failed to rollback Stripe account %s: %v", account.ID, delErr)
				log.Printf("[STRIPE] CRITICAL: Orphaned account needs manual cleanup: %s", account.ID)
			} else {
				log.Printf("[STRIPE] Successfully rolled back Stripe account: %s", account.ID)
			}

			response.Error(w, http.StatusInternalServerError, "Failed to save Stripe account ID")
			return
		}

		log.Printf("[STRIPE] Successfully saved stripe_account_id: %s", account.ID)

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

// HandleStripeWebhook はStripeからのWebhookを処理
func (h *StripeHandler) HandleStripeWebhook(w http.ResponseWriter, r *http.Request) {
	const MaxBodyBytes = int64(65536)
	r.Body = http.MaxBytesReader(w, r.Body, MaxBodyBytes)

	// リクエストボディを読み取り
	payload, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("[STRIPE WEBHOOK] Error reading request body: %v", err)
		response.Error(w, http.StatusServiceUnavailable, "Error reading request body")
		return
	}

	// Webhook署名を検証
	event, err := h.stripeService.ConstructWebhookEvent(payload, r.Header.Get("Stripe-Signature"))
	if err != nil {
		log.Printf("[STRIPE WEBHOOK] Webhook signature verification failed: %v", err)
		response.Error(w, http.StatusBadRequest, "Webhook signature verification failed")
		return
	}

	log.Printf("[STRIPE WEBHOOK] Received event: %s (ID: %s)", event.Type, event.ID)

	// 🔒 SECURITY: Webhook再送攻撃対策（同じイベントIDの重複処理を防ぐ）
	var existingEvents []struct {
		ID string `json:"id"`
	}
	_, err = h.supabaseService.GetServiceClient().
		From("stripe_webhook_events").
		Select("id", "", false).
		Eq("event_id", event.ID).
		ExecuteTo(&existingEvents)

	if err == nil && len(existingEvents) > 0 {
		log.Printf("[STRIPE WEBHOOK] Duplicate event detected, skipping: %s", event.ID)
		// Stripeには成功を返す（既に処理済み）
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "duplicate"})
		return
	}

	// イベントを記録（重複防止用）
	eventRecord := map[string]interface{}{
		"event_id":   event.ID,
		"event_type": event.Type,
		"processed_at": time.Now(),
		"created_at": time.Now(),
	}

	_, err = h.supabaseService.GetServiceClient().
		From("stripe_webhook_events").
		Insert(eventRecord, false, "", "", "").
		ExecuteTo(nil)

	if err != nil {
		log.Printf("[STRIPE WEBHOOK] Warning: Failed to record event (proceeding anyway): %v", err)
		// エラーでもWebhook処理は続行（重要なイベントを逃さないため）
	}

	// イベントタイプに応じて処理
	switch event.Type {
	// Connect Account イベント
	case "account.updated":
		h.handleAccountUpdated(event)
	case "account.external_account.created":
		h.handleExternalAccountCreated(event)
	case "account.external_account.deleted":
		h.handleExternalAccountDeleted(event)
	case "account.external_account.updated":
		h.handleExternalAccountUpdated(event)

	// Payment Intent イベント（プラットフォームアカウント）
	case "payment_intent.succeeded":
		h.handlePaymentIntentSucceeded(event)
	case "payment_intent.payment_failed":
		h.handlePaymentIntentFailed(event)
	case "payment_intent.canceled":
		h.handlePaymentIntentCanceled(event)
	case "payment_intent.processing":
		h.handlePaymentIntentProcessing(event)
	case "payment_intent.requires_action":
		h.handlePaymentIntentRequiresAction(event)

	// Charge イベント（プラットフォームアカウント）
	case "charge.succeeded":
		h.handleChargeSucceeded(event)
	case "charge.failed":
		h.handleChargeFailed(event)
	case "charge.refunded":
		h.handleChargeRefunded(event)

	// Application Fee イベント（手数料）
	case "application_fee.created":
		h.handleApplicationFeeCreated(event)
	case "application_fee.refunded":
		h.handleApplicationFeeRefunded(event)

	// Transfer イベント
	case "transfer.created":
		h.handleTransferCreated(event)
	case "transfer.updated":
		h.handleTransferUpdated(event)
	case "transfer.failed":
		h.handleTransferFailed(event)

	default:
		log.Printf("[STRIPE WEBHOOK] Unhandled event type: %s", event.Type)
	}

	// Stripeに成功を返す
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

// handleAccountUpdated はaccount.updatedイベントを処理
// 注意: このイベントは売り手（Connect Account）専用です
// 買い手（Customer）にはaccount.updatedイベントは発生しません
func (h *StripeHandler) handleAccountUpdated(event interface{}) {
	// イベントデータをパース
	var acc map[string]interface{}
	eventData, ok := event.(map[string]interface{})
	if !ok {
		log.Printf("[STRIPE WEBHOOK] Failed to parse event data")
		return
	}

	data, ok := eventData["data"].(map[string]interface{})
	if !ok {
		log.Printf("[STRIPE WEBHOOK] Failed to parse event.data")
		return
	}

	object, ok := data["object"].(map[string]interface{})
	if !ok {
		log.Printf("[STRIPE WEBHOOK] Failed to parse event.data.object")
		return
	}

	acc = object
	accountID, ok := acc["id"].(string)
	if !ok {
		log.Printf("[STRIPE WEBHOOK] Account ID not found in event")
		return
	}

	log.Printf("[STRIPE WEBHOOK] Processing account.updated for Connect Account: %s", accountID)

	// chargesEnabled と payoutsEnabled を取得
	chargesEnabled := false
	payoutsEnabled := false

	if val, ok := acc["charges_enabled"].(bool); ok {
		chargesEnabled = val
	}
	if val, ok := acc["payouts_enabled"].(bool); ok {
		payoutsEnabled = val
	}

	onboardingCompleted := chargesEnabled && payoutsEnabled

	// Requirements情報を取得
	requirementsJSON := "{}"
	if requirements, ok := acc["requirements"].(map[string]interface{}); ok {
		reqBytes, err := json.Marshal(requirements)
		if err == nil {
			requirementsJSON = string(reqBytes)
		}
	}

	// Supabaseを更新（本人確認状態のみ更新）
	updateData := map[string]interface{}{
		"stripe_onboarding_completed": onboardingCompleted,
		"stripe_requirements_due":     requirementsJSON,
		"updated_at":                  time.Now(),
	}

	// stripe_account_idでprofileを検索して更新
	_, err := h.supabaseService.GetServiceClient().
		From("profiles").
		Update(updateData, "", "").
		Eq("stripe_account_id", accountID).
		ExecuteTo(nil)

	if err != nil {
		log.Printf("[STRIPE WEBHOOK] Failed to update profiles table: %v", err)
	} else {
		log.Printf("[STRIPE WEBHOOK] Successfully updated seller profile for account: %s (onboarding_completed: %v)", accountID, onboardingCompleted)
	}

	// organizationsテーブルも更新（組織が売り手の場合）
	_, err = h.supabaseService.GetServiceClient().
		From("organizations").
		Update(updateData, "", "").
		Eq("stripe_account_id", accountID).
		ExecuteTo(nil)

	if err != nil {
		log.Printf("[STRIPE WEBHOOK] Failed to update organizations table: %v", err)
	} else {
		log.Printf("[STRIPE WEBHOOK] Successfully updated seller organization for account: %s", accountID)
	}
}

// handleExternalAccountCreated は外部アカウント（銀行口座等）追加イベントを処理
func (h *StripeHandler) handleExternalAccountCreated(event interface{}) {
	log.Printf("[STRIPE WEBHOOK] External account created")
	// 必要に応じて処理を追加
}

// handleExternalAccountDeleted は外部アカウント削除イベントを処理
func (h *StripeHandler) handleExternalAccountDeleted(event interface{}) {
	log.Printf("[STRIPE WEBHOOK] External account deleted")
	// 必要に応じて処理を追加
}

// handleExternalAccountUpdated は外部アカウント更新イベントを処理
func (h *StripeHandler) handleExternalAccountUpdated(event interface{}) {
	log.Printf("[STRIPE WEBHOOK] External account updated")
	// 必要に応じて処理を追加
}

// handlePaymentIntentSucceeded は決済成功イベントを処理
func (h *StripeHandler) handlePaymentIntentSucceeded(event interface{}) {
	log.Printf("[STRIPE WEBHOOK] Payment intent succeeded")

	// イベントデータからPayment Intent IDを取得
	eventData, ok := event.(map[string]interface{})
	if !ok {
		log.Printf("[STRIPE WEBHOOK] Failed to parse event data")
		return
	}

	data, ok := eventData["data"].(map[string]interface{})
	if !ok {
		log.Printf("[STRIPE WEBHOOK] Failed to parse event.data")
		return
	}

	object, ok := data["object"].(map[string]interface{})
	if !ok {
		log.Printf("[STRIPE WEBHOOK] Failed to parse event.data.object")
		return
	}

	paymentIntentID, ok := object["id"].(string)
	if !ok {
		log.Printf("[STRIPE WEBHOOK] Payment Intent ID not found")
		return
	}

	log.Printf("[STRIPE WEBHOOK] Processing payment_intent.succeeded: %s", paymentIntentID)

	// sale_requestsテーブルを更新（ステータスをactiveに）
	updateData := map[string]interface{}{
		"status":     "active",
		"updated_at": time.Now(),
	}

	_, err := h.supabaseService.GetServiceClient().
		From("sale_requests").
		Update(updateData, "", "").
		Eq("payment_intent_id", paymentIntentID).
		ExecuteTo(nil)

	if err != nil {
		log.Printf("[STRIPE WEBHOOK] Failed to update sale_request: %v", err)
	} else {
		log.Printf("[STRIPE WEBHOOK] Successfully updated sale_request for payment_intent: %s", paymentIntentID)
	}
}

// handlePaymentIntentFailed は決済失敗イベントを処理
func (h *StripeHandler) handlePaymentIntentFailed(event interface{}) {
	log.Printf("[STRIPE WEBHOOK] Payment intent failed")

	eventData, ok := event.(map[string]interface{})
	if !ok {
		return
	}

	data, ok := eventData["data"].(map[string]interface{})
	if !ok {
		return
	}

	object, ok := data["object"].(map[string]interface{})
	if !ok {
		return
	}

	paymentIntentID, ok := object["id"].(string)
	if !ok {
		return
	}

	log.Printf("[STRIPE WEBHOOK] Processing payment_intent.payment_failed: %s", paymentIntentID)

	// sale_requestsテーブルを更新（ステータスはpendingのまま、エラーログを記録）
	// 実際のアプリでは、エラー通知などを実装する
	log.Printf("[STRIPE WEBHOOK] Payment failed for payment_intent: %s", paymentIntentID)
}

// handlePaymentIntentCanceled は決済キャンセルイベントを処理
func (h *StripeHandler) handlePaymentIntentCanceled(event interface{}) {
	log.Printf("[STRIPE WEBHOOK] Payment intent canceled")

	eventData, ok := event.(map[string]interface{})
	if !ok {
		return
	}

	data, ok := eventData["data"].(map[string]interface{})
	if !ok {
		return
	}

	object, ok := data["object"].(map[string]interface{})
	if !ok {
		return
	}

	paymentIntentID, ok := object["id"].(string)
	if !ok {
		return
	}

	log.Printf("[STRIPE WEBHOOK] Processing payment_intent.canceled: %s", paymentIntentID)

	// sale_requestsテーブルを更新（ステータスをcancelledに）
	updateData := map[string]interface{}{
		"status":     "cancelled",
		"updated_at": time.Now(),
	}

	_, err := h.supabaseService.GetServiceClient().
		From("sale_requests").
		Update(updateData, "", "").
		Eq("payment_intent_id", paymentIntentID).
		ExecuteTo(nil)

	if err != nil {
		log.Printf("[STRIPE WEBHOOK] Failed to update sale_request: %v", err)
	} else {
		log.Printf("[STRIPE WEBHOOK] Successfully cancelled sale_request for payment_intent: %s", paymentIntentID)
	}
}

// handlePaymentIntentProcessing は決済処理中イベントを処理
// 🔒 SECURITY: 3Dセキュアなどの確認中の状態を記録
func (h *StripeHandler) handlePaymentIntentProcessing(event interface{}) {
	log.Printf("[STRIPE WEBHOOK] Payment intent processing")

	eventData, ok := event.(map[string]interface{})
	if !ok {
		return
	}

	data, ok := eventData["data"].(map[string]interface{})
	if !ok {
		return
	}

	object, ok := data["object"].(map[string]interface{})
	if !ok {
		return
	}

	paymentIntentID, ok := object["id"].(string)
	if !ok {
		return
	}

	log.Printf("[STRIPE WEBHOOK] Processing payment_intent.processing: %s", paymentIntentID)

	// sale_requestsテーブルを更新（ステータスはprocessingに）
	updateData := map[string]interface{}{
		"status":     "processing",
		"updated_at": time.Now(),
	}

	_, err := h.supabaseService.GetServiceClient().
		From("sale_requests").
		Update(updateData, "", "").
		Eq("payment_intent_id", paymentIntentID).
		ExecuteTo(nil)

	if err != nil {
		log.Printf("[STRIPE WEBHOOK] Failed to update sale_request: %v", err)
	} else {
		log.Printf("[STRIPE WEBHOOK] Successfully updated sale_request to processing for payment_intent: %s", paymentIntentID)
	}
}

// handlePaymentIntentRequiresAction は追加認証必要イベントを処理
// 🔒 SECURITY: 3Dセキュアなどの追加認証が必要な状態を記録
func (h *StripeHandler) handlePaymentIntentRequiresAction(event interface{}) {
	log.Printf("[STRIPE WEBHOOK] Payment intent requires action")

	eventData, ok := event.(map[string]interface{})
	if !ok {
		return
	}

	data, ok := eventData["data"].(map[string]interface{})
	if !ok {
		return
	}

	object, ok := data["object"].(map[string]interface{})
	if !ok {
		return
	}

	paymentIntentID, ok := object["id"].(string)
	if !ok {
		return
	}

	log.Printf("[STRIPE WEBHOOK] Processing payment_intent.requires_action: %s", paymentIntentID)

	// sale_requestsテーブルを更新（ステータスはrequires_actionに）
	updateData := map[string]interface{}{
		"status":     "requires_action",
		"updated_at": time.Now(),
	}

	_, err := h.supabaseService.GetServiceClient().
		From("sale_requests").
		Update(updateData, "", "").
		Eq("payment_intent_id", paymentIntentID).
		ExecuteTo(nil)

	if err != nil {
		log.Printf("[STRIPE WEBHOOK] Failed to update sale_request: %v", err)
	} else {
		log.Printf("[STRIPE WEBHOOK] Successfully updated sale_request to requires_action for payment_intent: %s", paymentIntentID)
	}
}

// handleChargeSucceeded は課金成功イベントを処理
func (h *StripeHandler) handleChargeSucceeded(event interface{}) {
	log.Printf("[STRIPE WEBHOOK] Charge succeeded")
	// 必要に応じて処理を追加（例：メール通知など）
}

// handleChargeFailed は課金失敗イベントを処理
func (h *StripeHandler) handleChargeFailed(event interface{}) {
	log.Printf("[STRIPE WEBHOOK] Charge failed")
	// 必要に応じて処理を追加（例：エラー通知など）
}

// handleChargeRefunded は返金イベントを処理
func (h *StripeHandler) handleChargeRefunded(event interface{}) {
	log.Printf("[STRIPE WEBHOOK] Charge refunded")

	eventData, ok := event.(map[string]interface{})
	if !ok {
		return
	}

	data, ok := eventData["data"].(map[string]interface{})
	if !ok {
		return
	}

	object, ok := data["object"].(map[string]interface{})
	if !ok {
		return
	}

	// Payment Intent IDを取得
	paymentIntentID := ""
	if paymentIntent, ok := object["payment_intent"].(string); ok {
		paymentIntentID = paymentIntent
	}

	if paymentIntentID == "" {
		log.Printf("[STRIPE WEBHOOK] No payment_intent in charge.refunded event")
		return
	}

	log.Printf("[STRIPE WEBHOOK] Processing charge.refunded for payment_intent: %s", paymentIntentID)

	// sale_requestsテーブルを更新（ステータスをcancelledに）
	updateData := map[string]interface{}{
		"status":     "cancelled",
		"updated_at": time.Now(),
	}

	_, err := h.supabaseService.GetServiceClient().
		From("sale_requests").
		Update(updateData, "", "").
		Eq("payment_intent_id", paymentIntentID).
		ExecuteTo(nil)

	if err != nil {
		log.Printf("[STRIPE WEBHOOK] Failed to update sale_request: %v", err)
	} else {
		log.Printf("[STRIPE WEBHOOK] Successfully cancelled sale_request for refunded payment_intent: %s", paymentIntentID)
	}
}

// handleApplicationFeeCreated は手数料作成イベントを処理
func (h *StripeHandler) handleApplicationFeeCreated(event interface{}) {
	eventData, ok := event.(map[string]interface{})
	if !ok {
		return
	}

	data, ok := eventData["data"].(map[string]interface{})
	if !ok {
		return
	}

	object, ok := data["object"].(map[string]interface{})
	if !ok {
		return
	}

	amount, _ := object["amount"].(float64)
	currency, _ := object["currency"].(string)

	log.Printf("[STRIPE WEBHOOK] Application fee created: %.0f %s", amount, currency)
	// 必要に応じて手数料の記録を保存
}

// handleApplicationFeeRefunded は手数料返金イベントを処理
func (h *StripeHandler) handleApplicationFeeRefunded(event interface{}) {
	log.Printf("[STRIPE WEBHOOK] Application fee refunded")
	// 必要に応じて処理を追加
}

// handleTransferCreated は送金作成イベントを処理
func (h *StripeHandler) handleTransferCreated(event interface{}) {
	log.Printf("[STRIPE WEBHOOK] Transfer created")
	// 必要に応じて処理を追加
}

// handleTransferUpdated は送金更新イベントを処理
func (h *StripeHandler) handleTransferUpdated(event interface{}) {
	log.Printf("[STRIPE WEBHOOK] Transfer updated")
	// 必要に応じて処理を追加
}

// handleTransferFailed は送金失敗イベントを処理
func (h *StripeHandler) handleTransferFailed(event interface{}) {
	log.Printf("[STRIPE WEBHOOK] Transfer failed")
	// 必要に応じて処理を追加（例：エラー通知など）
}
