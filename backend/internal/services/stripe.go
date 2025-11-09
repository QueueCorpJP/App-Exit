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

