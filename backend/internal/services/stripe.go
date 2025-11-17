package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/account"
	"github.com/stripe/stripe-go/v76/accountlink"
	"github.com/stripe/stripe-go/v76/balance"
	"github.com/stripe/stripe-go/v76/paymentintent"
	"github.com/stripe/stripe-go/v76/refund"
	"github.com/stripe/stripe-go/v76/transfer"
	"github.com/stripe/stripe-go/v76/webhook"
	"github.com/yourusername/appexit-backend/config"
)

type StripeService struct {
	cfg *config.Config
}

func NewStripeService(cfg *config.Config) *StripeService {
	// Stripe APIキーを設定
	stripe.Key = cfg.StripeSecretKey
	
	return &StripeService{
		cfg: cfg,
	}
}

// CreateConnectedAccount はStripe Custom Connectアカウントを作成
func (s *StripeService) CreateConnectedAccount(
	ctx context.Context,
	email string,
	accountType string, // "individual" or "company"
	country string,
) (*stripe.Account, error) {
	params := &stripe.AccountParams{
		Type:    stripe.String(string(stripe.AccountTypeCustom)),
		Country: stripe.String(country),
		Email:   stripe.String(email),
		Capabilities: &stripe.AccountCapabilitiesParams{
			CardPayments: &stripe.AccountCapabilitiesCardPaymentsParams{
				Requested: stripe.Bool(true),
			},
			Transfers: &stripe.AccountCapabilitiesTransfersParams{
				Requested: stripe.Bool(true),
			},
		},
		BusinessType: stripe.String(accountType), // "individual" or "company"
	}

	// ビジネスプロフィール設定（オプション）
	params.BusinessProfile = &stripe.AccountBusinessProfileParams{
		MCC:                stripe.String("5734"), // ソフトウェアの販売
		ProductDescription: stripe.String("デジタルプロダクトの売買プラットフォーム"),
	}

	// 利用規約同意設定
	// 注意: 日本のプラットフォームが日本のアカウントを作成する場合、
	// service_agreement は "full" を使用する必要がある
	// "recipient" は国際送金の場合のみ使用可能
	params.TOSAcceptance = &stripe.AccountTOSAcceptanceParams{
		ServiceAgreement: stripe.String("full"),
	}

	acc, err := account.New(params)
	if err != nil {
		log.Printf("[STRIPE] Failed to create connected account: %v", err)
		return nil, fmt.Errorf("failed to create Stripe account: %w", err)
	}

	log.Printf("[STRIPE] Created connected account: %s", acc.ID)
	return acc, nil
}

// CreateAccountLink はStripe本人確認フローのリンクを作成
func (s *StripeService) CreateAccountLink(
	ctx context.Context,
	accountID string,
	returnURL string,
	refreshURL string,
) (*stripe.AccountLink, error) {
	params := &stripe.AccountLinkParams{
		Account:    stripe.String(accountID),
		RefreshURL: stripe.String(refreshURL),
		ReturnURL:  stripe.String(returnURL),
		Type:       stripe.String("account_onboarding"),
	}

	link, err := accountlink.New(params)
	if err != nil {
		log.Printf("[STRIPE] Failed to create account link: %v", err)
		return nil, fmt.Errorf("failed to create account link: %w", err)
	}

	log.Printf("[STRIPE] Created account link for: %s", accountID)
	return link, nil
}

// GetAccount はStripeアカウント情報を取得
func (s *StripeService) GetAccount(
	ctx context.Context,
	accountID string,
) (*stripe.Account, error) {
	acc, err := account.GetByID(accountID, nil)
	if err != nil {
		log.Printf("[STRIPE] Failed to get account: %v", err)
		return nil, fmt.Errorf("failed to get Stripe account: %w", err)
	}

	return acc, nil
}

// DeleteAccount はStripeアカウントを削除（ロールバック用）
func (s *StripeService) DeleteAccount(
	ctx context.Context,
	accountID string,
) error {
	_, err := account.Del(accountID, nil)
	if err != nil {
		log.Printf("[STRIPE] Failed to delete account: %v", err)
		return fmt.Errorf("failed to delete Stripe account: %w", err)
	}

	log.Printf("[STRIPE] Deleted account: %s", accountID)
	return nil
}

// GetBalance はStripeアカウントの残高を取得
func (s *StripeService) GetBalance(
	ctx context.Context,
	accountID string,
) (*stripe.Balance, error) {
	params := &stripe.BalanceParams{}
	params.SetStripeAccount(accountID)

	bal, err := balance.Get(params)
	if err != nil {
		log.Printf("[STRIPE] Failed to get balance: %v", err)
		return nil, fmt.Errorf("failed to get balance: %w", err)
	}

	return bal, nil
}

// CreateTransfer は運営アカウントから売り手へ送金を実行
func (s *StripeService) CreateTransfer(
	ctx context.Context,
	amount int64,
	currency string,
	destinationAccountID string,
	orderID string,
	transferGroup string,
) (*stripe.Transfer, error) {
	params := &stripe.TransferParams{
		Amount:      stripe.Int64(amount),
		Currency:    stripe.String(currency),
		Destination: stripe.String(destinationAccountID),
		Metadata: map[string]string{
			"order_id": orderID,
		},
	}

	// Transfer Groupを設定（同じ注文の送金をグループ化）
	if transferGroup != "" {
		params.TransferGroup = stripe.String(transferGroup)
	}

	// Idempotency Keyを設定（二重送金防止）
	params.SetIdempotencyKey(fmt.Sprintf("transfer_%s", orderID))

	trans, err := transfer.New(params)
	if err != nil {
		log.Printf("[STRIPE] Failed to create transfer: %v", err)
		return nil, fmt.Errorf("failed to create transfer: %w", err)
	}

	log.Printf("[STRIPE] Created transfer: %s -> %s (amount: %d %s)",
		trans.ID, destinationAccountID, amount, currency)
	return trans, nil
}

// ParseRequirements はStripeアカウントの不足情報を抽出
func (s *StripeService) ParseRequirements(acc *stripe.Account) map[string]interface{} {
	requirements := make(map[string]interface{})

	if acc.Requirements != nil {
		requirements["currently_due"] = acc.Requirements.CurrentlyDue
		requirements["eventually_due"] = acc.Requirements.EventuallyDue
		requirements["past_due"] = acc.Requirements.PastDue
		requirements["pending_verification"] = acc.Requirements.PendingVerification
		
		if acc.Requirements.CurrentDeadline > 0 {
			requirements["current_deadline"] = acc.Requirements.CurrentDeadline
		}
		
		if acc.Requirements.DisabledReason != "" {
			requirements["disabled_reason"] = acc.Requirements.DisabledReason
		}
	}

	return requirements
}

// ConvertRequirementsToJSON はRequirementsをJSON形式に変換
func (s *StripeService) ConvertRequirementsToJSON(acc *stripe.Account) ([]byte, error) {
	requirements := s.ParseRequirements(acc)
	return json.Marshal(requirements)
}

// IsOnboardingCompleted はアカウントの本人確認が完了しているか確認
func (s *StripeService) IsOnboardingCompleted(acc *stripe.Account) bool {
	// charges_enabled と payouts_enabled の両方がtrueなら完了
	return acc.ChargesEnabled && acc.PayoutsEnabled
}

// GetRequirementsDueList は不足項目のリストを取得
func (s *StripeService) GetRequirementsDueList(acc *stripe.Account) []string {
	if acc.Requirements == nil {
		return []string{}
	}
	return acc.Requirements.CurrentlyDue
}

// ConstructWebhookEvent はWebhookペイロードを検証してイベントを構築
func (s *StripeService) ConstructWebhookEvent(payload []byte, signature string) (stripe.Event, error) {
	webhookSecret := s.cfg.StripeWebhookSecret

	event, err := webhook.ConstructEvent(payload, signature, webhookSecret)
	if err != nil {
		log.Printf("[STRIPE] Webhook signature verification failed: %v", err)
		return event, fmt.Errorf("webhook signature verification failed: %w", err)
	}

	return event, nil
}

// CreatePaymentIntent はC2C決済用のPayment Intentを作成
// 売り手のStripe Connectアカウントに自動的に送金されるように設定
func (s *StripeService) CreatePaymentIntent(
	ctx context.Context,
	amount int64,
	currency string,
	sellerAccountID string,
	saleRequestID string,
	applicationFeeAmount int64, // プラットフォーム手数料
	metadata map[string]string, // 🔒 拡張メタデータ（追跡・監査用）
) (*stripe.PaymentIntent, error) {
	// デフォルトメタデータを設定
	if metadata == nil {
		metadata = make(map[string]string)
	}
	metadata["sale_request_id"] = saleRequestID
	metadata["platform"] = "appexit"

	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(amount),
		Currency: stripe.String(currency),
		Metadata: metadata,
		// 自動的な支払い方法の確認を有効化
		AutomaticPaymentMethods: &stripe.PaymentIntentAutomaticPaymentMethodsParams{
			Enabled: stripe.Bool(true),
		},
		// 売り手のConnect Accountに転送
		TransferData: &stripe.PaymentIntentTransferDataParams{
			Destination: stripe.String(sellerAccountID),
		},
	}

	// プラットフォーム手数料を設定（オプション）
	if applicationFeeAmount > 0 {
		params.ApplicationFeeAmount = stripe.Int64(applicationFeeAmount)
	}

	// 🔒 SECURITY: Idempotency Keyを設定（二重課金防止）
	// sale_request_idをベースにして一意なキーを生成
	if saleRequestID != "" {
		idempotencyKey := fmt.Sprintf("payment_intent_%s", saleRequestID)
		params.SetIdempotencyKey(idempotencyKey)
		log.Printf("[STRIPE] Using idempotency key: %s", idempotencyKey)
	}

	pi, err := paymentintent.New(params)
	if err != nil {
		log.Printf("[STRIPE] Failed to create payment intent: %v", err)
		return nil, fmt.Errorf("failed to create payment intent: %w", err)
	}

	log.Printf("[STRIPE] Created payment intent: %s (amount: %d %s, seller: %s)",
		pi.ID, amount, currency, sellerAccountID)
	return pi, nil
}

// GetPaymentIntent はPayment Intentを取得
func (s *StripeService) GetPaymentIntent(
	ctx context.Context,
	paymentIntentID string,
) (*stripe.PaymentIntent, error) {
	pi, err := paymentintent.Get(paymentIntentID, nil)
	if err != nil {
		log.Printf("[STRIPE] Failed to get payment intent: %v", err)
		return nil, fmt.Errorf("failed to get payment intent: %w", err)
	}

	return pi, nil
}

// CreateRefund は返金を作成
// amount: 返金額（nil = 全額返金）
// reason: 返金理由（"duplicate", "fraudulent", "requested_by_customer"）
func (s *StripeService) CreateRefund(
	ctx context.Context,
	paymentIntentID string,
	amount *int64,
	reason string,
	metadata map[string]string,
) (*stripe.Refund, error) {
	params := &stripe.RefundParams{
		PaymentIntent: stripe.String(paymentIntentID),
	}

	// 部分返金の場合
	if amount != nil {
		params.Amount = stripe.Int64(*amount)
	}

	// 返金理由
	if reason != "" {
		params.Reason = stripe.String(reason)
	}

	// メタデータ
	if metadata != nil {
		params.Metadata = metadata
	}

	// Idempotency Keyを設定（二重返金防止）
	params.SetIdempotencyKey(fmt.Sprintf("refund_%s", paymentIntentID))

	ref, err := refund.New(params)
	if err != nil {
		log.Printf("[STRIPE] Failed to create refund: %v", err)
		return nil, fmt.Errorf("failed to create refund: %w", err)
	}

	log.Printf("[STRIPE] Created refund: %s for payment_intent: %s (amount: %d)",
		ref.ID, paymentIntentID, ref.Amount)
	return ref, nil
}

// GetRefund は返金情報を取得
func (s *StripeService) GetRefund(
	ctx context.Context,
	refundID string,
) (*stripe.Refund, error) {
	ref, err := refund.Get(refundID, nil)
	if err != nil {
		log.Printf("[STRIPE] Failed to get refund: %v", err)
		return nil, fmt.Errorf("failed to get refund: %w", err)
	}

	return ref, nil
}

