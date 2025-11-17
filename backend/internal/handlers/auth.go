package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/supabase-community/gotrue-go/types"
	"github.com/yourusername/appexit-backend/internal/middleware"
	"github.com/yourusername/appexit-backend/internal/models"
	"github.com/yourusername/appexit-backend/internal/utils"
	"github.com/yourusername/appexit-backend/pkg/response"
)

func (s *Server) signupWithEmail(req models.CreateUserRequest) (*models.AuthResponse, int, error) {
	anonClient := s.supabase.GetAnonClient()

	fmt.Printf("[DEBUG] RegisterStep1: Attempting Supabase signup for email: %s\n", req.Email)
	authResp, err := anonClient.Auth.Signup(types.SignupRequest{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		errStr := err.Error()
		fmt.Printf("[ERROR] signupWithEmail: Supabase signup failed: %v\n", err)

		if strings.Contains(errStr, "already registered") || strings.Contains(errStr, "already exists") {
			return nil, http.StatusConflict, fmt.Errorf("このメールアドレスは既に登録されています。")
		}

		return nil, http.StatusBadRequest, fmt.Errorf("アカウント作成に失敗しました: %v", err)
	}

	if authResp.User.ID == [16]byte{} {
		fmt.Printf("[ERROR] signupWithEmail: User ID is empty\n")
		return nil, http.StatusInternalServerError, fmt.Errorf("User creation failed")
	}

	userID := fmt.Sprintf("%x-%x-%x-%x-%x",
		authResp.User.ID[0:4],
		authResp.User.ID[4:6],
		authResp.User.ID[6:8],
		authResp.User.ID[8:10],
		authResp.User.ID[10:16])
	fmt.Printf("[DEBUG] signupWithEmail: Generated userID: %s\n", userID)

	user := models.User{
		ID:        userID,
		Email:     authResp.User.Email,
		Name:      authResp.User.Email,
		CreatedAt: authResp.User.CreatedAt,
		UpdatedAt: authResp.User.UpdatedAt,
	}

	fmt.Printf("[REGISTER] Returning tokens: access_token length=%d, refresh_token length=%d\n",
		len(authResp.AccessToken), len(authResp.RefreshToken))

	return &models.AuthResponse{
		AccessToken:  authResp.AccessToken,
		RefreshToken: authResp.RefreshToken,
		User:         user,
	}, http.StatusCreated, nil
}

func (s *Server) Register(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("[DEBUG] Register: Starting user registration\n")

	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req models.CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fmt.Printf("[ERROR] Register: Failed to decode request: %v\n", err)
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	fmt.Printf("[DEBUG] Register: Request data: %+v\n", req)

	// バリデーション
	if err := utils.ValidateStruct(req); err != nil {
		fmt.Printf("[ERROR] Register: Validation failed: %v\n", err)
		response.Error(w, http.StatusBadRequest, fmt.Sprintf("Validation error: %v", err))
		return
	}

	authResponse, status, err := s.signupWithEmail(req)
	if err != nil {
		response.Error(w, status, err.Error())
		return
	}

	s.setAuthCookies(w, authResponse.AccessToken, authResponse.RefreshToken, &authResponse.User, nil)
	fmt.Printf("[REGISTER] Setting auth cookies\n")
	fmt.Printf("[DEBUG] Register: Registration successful, returning response\n")
	response.Success(w, status, authResponse)
}

func (s *Server) Login(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("\n========== LOGIN START ==========\n")
	fmt.Printf("[LOGIN] Request received from %s\n", r.RemoteAddr)
	
	// 設定の確認
	if s.config.SupabaseURL == "" {
		fmt.Printf("[LOGIN] ❌ ERROR: SUPABASE_URL is not set\n")
		response.Error(w, http.StatusInternalServerError, "Server configuration error")
		return
	}
	if s.config.SupabaseAnonKey == "" {
		fmt.Printf("[LOGIN] ❌ ERROR: SUPABASE_ANON_KEY is not set\n")
		response.Error(w, http.StatusInternalServerError, "Server configuration error")
		return
	}
	fmt.Printf("[LOGIN] Supabase URL: %s\n", s.config.SupabaseURL)
	fmt.Printf("[LOGIN] Supabase Anon Key length: %d\n", len(s.config.SupabaseAnonKey))

	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fmt.Printf("[LOGIN] ❌ ERROR: Failed to decode request body: %v\n", err)
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	fmt.Printf("[LOGIN] ✓ Request decoded successfully for email: %s\n", req.Email)

	// バリデーション
	if err := utils.ValidateStruct(req); err != nil {
		fmt.Printf("[LOGIN] ❌ ERROR: Validation failed: %v\n", err)
		response.Error(w, http.StatusBadRequest, fmt.Sprintf("Validation error: %v", err))
		return
	}
	fmt.Printf("[LOGIN] ✓ Validation passed\n")

	// 1. anon keyで認証（メール・パスワード検証）
	fmt.Printf("[LOGIN] Attempting Supabase authentication...\n")
	fmt.Printf("[LOGIN] Email: %s\n", req.Email)
	anonClient := s.supabase.GetAnonClient()
	authResp, err := anonClient.Auth.SignInWithEmailPassword(req.Email, req.Password)
	if err != nil {
		fmt.Printf("[LOGIN] ❌ ERROR: Supabase authentication failed: %v\n", err)
		fmt.Printf("[LOGIN] Error type: %T\n", err)
		fmt.Printf("[LOGIN] Error details: %+v\n", err)
		
		// エラーメッセージを解析してより詳細な情報を提供
		errMsg := err.Error()
		var errorMessage string
		if strings.Contains(errMsg, "Invalid login credentials") || strings.Contains(errMsg, "invalid_credentials") {
			errorMessage = "メールアドレスまたはパスワードが正しくありません"
		} else if strings.Contains(errMsg, "Email not confirmed") {
			errorMessage = "メールアドレスの確認が完了していません"
		} else if strings.Contains(errMsg, "User not found") {
			errorMessage = "ユーザーが見つかりません"
		} else {
			errorMessage = fmt.Sprintf("ログインに失敗しました: %s", errMsg)
		}
		
		fmt.Printf("[LOGIN] Returning error message: %s\n", errorMessage)
		response.Error(w, http.StatusUnauthorized, errorMessage)
		return
	}
	fmt.Printf("[LOGIN] ✓ Supabase authentication successful\n")

	if authResp.User.ID == [16]byte{} {
		fmt.Printf("[LOGIN] ❌ ERROR: User ID is empty\n")
		fmt.Printf("========== LOGIN END (FAILED) ==========\n\n")
		response.Error(w, http.StatusUnauthorized, "Authentication failed")
		return
	}
	fmt.Printf("[LOGIN] ✓ User ID validated: %x\n", authResp.User.ID)

	// UUIDを文字列に変換
	userID := fmt.Sprintf("%x-%x-%x-%x-%x",
		authResp.User.ID[0:4],
		authResp.User.ID[4:6],
		authResp.User.ID[6:8],
		authResp.User.ID[8:10],
		authResp.User.ID[10:16])

	// 2. ユーザー自身のトークンでプロフィール情報を取得（RLSが自動的にチェック）
	fmt.Printf("[LOGIN] Fetching user profile...\n")
	userClient := s.supabase.GetAuthenticatedClient(authResp.AccessToken)
	var profiles []models.Profile
	_, err = userClient.From("profiles").Select("*", "", false).Eq("id", userID).ExecuteTo(&profiles)

	// プロフィールが存在しない場合はnilを返す（新規登録直後のユーザー）
	var profilePtr *models.Profile
	if err == nil && len(profiles) > 0 {
		profilePtr = &profiles[0]
		fmt.Printf("[LOGIN] ✓ Profile found for user: %s\n", userID)
	} else {
		if err != nil {
			fmt.Printf("[LOGIN] ⚠️ WARNING: Failed to fetch profile: %v\n", err)
		} else {
			fmt.Printf("[LOGIN] ⚠️ No profile found for user (new user?): %s\n", userID)
		}
	}

	// レスポンス用のユーザー情報を作成
	displayName := authResp.User.Email
	if profilePtr != nil {
		displayName = profilePtr.DisplayName
	}

	user := models.User{
		ID:        userID,
		Email:     authResp.User.Email,
		Name:      displayName,
		CreatedAt: authResp.User.CreatedAt,
		UpdatedAt: authResp.User.UpdatedAt,
	}

	// 3. Cookieにトークンを設定（setAuthCookies関数を使用）
	s.setAuthCookies(w, authResp.AccessToken, authResp.RefreshToken, &user, profilePtr)

	// 4. SupabaseのAccessTokenを返す（RefreshTokenはHttpOnly Cookieにのみ保存）
	// セキュリティ: RefreshTokenはフロントエンドのJavaScriptからアクセスできないようにする
	loginResponse := models.LoginResponse{
		Token:        authResp.AccessToken,  // SupabaseのJWTトークンを返す
		RefreshToken: authResp.RefreshToken, // HttpOnly Cookieにのみ保存（JSONレスポンスには含まれない）
		User:         user,
		Profile:      profilePtr, // profileが存在しない場合はnil
	}

	fmt.Printf("[LOGIN] Returning tokens: access_token length=%d, refresh_token length=%d\n",
		len(authResp.AccessToken), len(authResp.RefreshToken))
	fmt.Printf("[LOGIN] Setting auth cookies\n")

	response.Success(w, http.StatusOK, loginResponse)
	fmt.Printf("[LOGIN] ✅ Login completed successfully for user: %s\n", user.ID)
	fmt.Printf("========== LOGIN END (SUCCESS) ==========\n\n")
}

// CreateProfile はJWT認証後にプロフィールを作成する
func (s *Server) CreateProfile(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("[DEBUG] CreateProfile: Starting profile creation\n")

	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// contextからユーザーIDとimpersonate JWTを取得（ミドルウェアで設定済み）
	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		fmt.Printf("[ERROR] CreateProfile: User ID not found in context\n")
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	fmt.Printf("[DEBUG] CreateProfile: UserID from context: %s\n", userID)

	impersonateJWT, ok := r.Context().Value("impersonate_jwt").(string)
	if !ok || impersonateJWT == "" {
		fmt.Printf("[ERROR] CreateProfile: Impersonate JWT not found in context\n")
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	fmt.Printf("[DEBUG] CreateProfile: Using impersonate JWT for RLS operations\n")

	var req models.CreateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fmt.Printf("[ERROR] CreateProfile: Failed to decode request body: %v\n", err)
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	fmt.Printf("[DEBUG] CreateProfile: Request data: %+v\n", req)

	// バリデーション
	if err := utils.ValidateStruct(req); err != nil {
		fmt.Printf("[ERROR] CreateProfile: Validation failed: %v\n", err)
		response.Error(w, http.StatusBadRequest, fmt.Sprintf("Validation error: %v", err))
		return
	}

	// プロフィールを作成（created_atとupdated_atはデータベースのデフォルト値を使用）
	profile := models.Profile{
		ID:          userID,
		Role:        req.Role,
		Party:       req.Party,
		DisplayName: req.DisplayName,
		Age:         req.Age,
		NDAFlag:     false,
	}
	fmt.Printf("[DEBUG] CreateProfile: Profile to insert: %+v\n", profile)

	// impersonate JWTでプロフィールを挿入（RLSが自動的にチェック）
	impersonateClient := s.supabase.GetAuthenticatedClient(impersonateJWT)
	fmt.Printf("[DEBUG] CreateProfile: Attempting to insert profile into database with impersonate JWT\n")
	_, _, err := impersonateClient.From("profiles").Insert(profile, false, "", "", "").Execute()
	if err != nil {
		fmt.Printf("[ERROR] CreateProfile: Failed to insert profile: %v\n", err)
		response.Error(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create profile: %v", err))
		return
	}

	// 作成されたプロフィールを取得（タイムスタンプを含む完全なデータ）
	var profiles []models.Profile
	_, err = impersonateClient.From("profiles").Select("*", "", false).Eq("id", userID).ExecuteTo(&profiles)
	if err != nil || len(profiles) == 0 {
		fmt.Printf("[ERROR] CreateProfile: Failed to fetch created profile: %v\n", err)
		response.Error(w, http.StatusInternalServerError, "Failed to fetch profile")
		return
	}

	fmt.Printf("[DEBUG] CreateProfile: Profile created successfully\n")
	response.Success(w, http.StatusCreated, profiles[0])
}

// UpdateProfile はJWT認証後にプロフィールを更新する
func (s *Server) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("\n========== UPDATE PROFILE START ==========\n")
	fmt.Printf("[UPDATE PROFILE] Request received from %s\n", r.RemoteAddr)

	if r.Method != http.MethodPut {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// contextからユーザーIDとimpersonate JWTを取得（ミドルウェアで設定済み）
	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		fmt.Printf("[UPDATE PROFILE] ❌ ERROR: User ID not found in context\n")
		fmt.Printf("========== UPDATE PROFILE END (FAILED) ==========\n\n")
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	fmt.Printf("[UPDATE PROFILE] ✓ User ID from context: %s\n", userID)

	impersonateJWT, ok := r.Context().Value("impersonate_jwt").(string)
	if !ok || impersonateJWT == "" {
		fmt.Printf("[UPDATE PROFILE] ❌ ERROR: Impersonate JWT not found in context\n")
		fmt.Printf("========== UPDATE PROFILE END (FAILED) ==========\n\n")
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	fmt.Printf("[UPDATE PROFILE] ✓ Impersonate JWT found (length: %d)\n", len(impersonateJWT))

	var req models.UpdateProfileRequest
	fmt.Printf("[UPDATE PROFILE] Decoding request body...\n")
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fmt.Printf("[UPDATE PROFILE] ❌ ERROR: Failed to decode request body: %v\n", err)
		fmt.Printf("========== UPDATE PROFILE END (FAILED) ==========\n\n")
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	fmt.Printf("[UPDATE PROFILE] ✓ Request decoded successfully\n")
	fmt.Printf("[UPDATE PROFILE] Request data: %+v\n", req)

	// バリデーション
	fmt.Printf("[UPDATE PROFILE] Validating request...\n")
	if err := utils.ValidateStruct(req); err != nil {
		fmt.Printf("[UPDATE PROFILE] ❌ ERROR: Validation failed: %v\n", err)
		fmt.Printf("========== UPDATE PROFILE END (FAILED) ==========\n\n")
		response.Error(w, http.StatusBadRequest, fmt.Sprintf("Validation error: %v", err))
		return
	}
	fmt.Printf("[UPDATE PROFILE] ✓ Validation passed\n")

	// 🔒 SECURITY: 入力値をサニタイズ
	if req.DisplayName != nil {
		displayNameResult := utils.SanitizeText(utils.SanitizeInput{
			Value:      *req.DisplayName,
			MaxLength:  utils.MaxUsernameLength,
			AllowHTML:  false,
			StrictMode: true,
		})
		if !displayNameResult.IsValid {
			fmt.Printf("[UPDATE PROFILE] ❌ WARNING: Display name contains malicious content: %v\n", displayNameResult.Errors)
		}
		sanitized := displayNameResult.Sanitized
		req.DisplayName = &sanitized
	}

	if req.IconURL != nil && *req.IconURL != "" {
		iconURLResult := utils.SanitizeURL(*req.IconURL)
		if !iconURLResult.IsValid {
			fmt.Printf("[UPDATE PROFILE] ❌ ERROR: Invalid icon URL: %v\n", iconURLResult.Errors)
			response.Error(w, http.StatusBadRequest, "Invalid icon URL")
			return
		}
		req.IconURL = &iconURLResult.Sanitized
	}

	// 更新データを構築
	updateData := make(map[string]interface{})
	if req.DisplayName != nil {
		updateData["display_name"] = *req.DisplayName
	}
	if req.Age != nil {
		updateData["age"] = *req.Age
	}
	if req.IconURL != nil {
		updateData["icon_url"] = *req.IconURL
	}

	// 更新するフィールドがない場合
	if len(updateData) == 0 {
		fmt.Printf("[UPDATE PROFILE] ⚠️ No fields to update\n")
		// 現在のプロフィールを取得して返す
		impersonateClient := s.supabase.GetAuthenticatedClient(impersonateJWT)
		var profile models.Profile
		_, err := impersonateClient.From("profiles").Select("*", "", false).Eq("id", userID).Single().ExecuteTo(&profile)
		if err != nil {
			fmt.Printf("[UPDATE PROFILE] ❌ ERROR: Failed to fetch profile: %v\n", err)
			fmt.Printf("========== UPDATE PROFILE END (FAILED) ==========\n\n")
			response.Error(w, http.StatusInternalServerError, "Failed to fetch profile")
			return
		}
		response.Success(w, http.StatusOK, profile)
		return
	}

	fmt.Printf("[UPDATE PROFILE] Updating profile with data: %+v\n", updateData)

	// impersonate JWTでプロフィールを更新（RLSが自動的にチェック）
	impersonateClient := s.supabase.GetAuthenticatedClient(impersonateJWT)
	fmt.Printf("[UPDATE PROFILE] Executing update query...\n")
	_, _, err := impersonateClient.From("profiles").
		Update(updateData, "", "").
		Eq("id", userID).
		Execute()

	if err != nil {
		fmt.Printf("[UPDATE PROFILE] ❌ ERROR: Failed to update profile: %v\n", err)
		fmt.Printf("========== UPDATE PROFILE END (FAILED) ==========\n\n")
		response.Error(w, http.StatusInternalServerError, fmt.Sprintf("Failed to update profile: %v", err))
		return
	}

	fmt.Printf("[UPDATE PROFILE] ✓ Profile updated successfully\n")

	// 更新されたプロフィールを取得
	fmt.Printf("[UPDATE PROFILE] Fetching updated profile...\n")
	var profile models.Profile
	_, err = impersonateClient.From("profiles").Select("*", "", false).Eq("id", userID).Single().ExecuteTo(&profile)
	if err != nil {
		fmt.Printf("[UPDATE PROFILE] ❌ ERROR: Failed to fetch updated profile: %v\n", err)
		fmt.Printf("========== UPDATE PROFILE END (FAILED) ==========\n\n")
		response.Error(w, http.StatusInternalServerError, "Failed to fetch updated profile")
		return
	}

	fmt.Printf("[UPDATE PROFILE] ✅ Profile update completed successfully\n")
	fmt.Printf("========== UPDATE PROFILE END (SUCCESS) ==========\n\n")
	response.Success(w, http.StatusOK, profile)
}

// GetProfile はJWT認証後にプロフィールを取得する
func (s *Server) GetProfile(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("\n========== GET PROFILE START ==========\n")
	fmt.Printf("[GET PROFILE] Request received from %s\n", r.RemoteAddr)

	if r.Method != http.MethodGet {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// contextからユーザーIDとimpersonate JWTを取得（ミドルウェアで設定済み）
	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		fmt.Printf("[GET PROFILE] ❌ ERROR: User ID not found in context\n")
		fmt.Printf("========== GET PROFILE END (FAILED) ==========\n\n")
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	fmt.Printf("[GET PROFILE] ✓ User ID from context: %s\n", userID)

	impersonateJWT, ok := r.Context().Value("impersonate_jwt").(string)
	if !ok || impersonateJWT == "" {
		fmt.Printf("[GET PROFILE] ❌ ERROR: Impersonate JWT not found in context\n")
		fmt.Printf("========== GET PROFILE END (FAILED) ==========\n\n")
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// impersonate JWTでプロフィールを取得
	impersonateClient := s.supabase.GetAuthenticatedClient(impersonateJWT)
	fmt.Printf("[GET PROFILE] Fetching profile from database...\n")
	var profiles []models.Profile
	_, err := impersonateClient.From("profiles").Select("*", "", false).Eq("id", userID).ExecuteTo(&profiles)
	if err != nil {
		fmt.Printf("[GET PROFILE] ❌ ERROR: Failed to fetch profile: %v\n", err)
		fmt.Printf("========== GET PROFILE END (FAILED) ==========\n\n")
		response.Error(w, http.StatusNotFound, "Profile not found")
		return
	}

	if len(profiles) == 0 {
		fmt.Printf("[GET PROFILE] ❌ ERROR: No profile found for user %s\n", userID)
		fmt.Printf("========== GET PROFILE END (FAILED) ==========\n\n")
		response.Error(w, http.StatusNotFound, "Profile not found")
		return
	}

	// sellerのプロフィールを優先的に取得（stripe_account_idが設定されている可能性が高い）
	var profile models.Profile
	for _, p := range profiles {
		if p.Role == "seller" {
			profile = p
			break
		}
	}
	// sellerが見つからない場合は最初のプロフィールを使用
	if profile.ID == "" && len(profiles) > 0 {
		profile = profiles[0]
	}

	fmt.Printf("[GET PROFILE] ✅ Profile fetched successfully: %s\n", profile.DisplayName)
	fmt.Printf("[GET PROFILE] stripe_account_id: %v\n", profile.StripeAccountID)
	fmt.Printf("[GET PROFILE] stripe_onboarding_completed: %v\n", profile.StripeOnboardingCompleted)
	fmt.Printf("========== GET PROFILE END (SUCCESS) ==========\n\n")
	response.Success(w, http.StatusOK, profile)
}

// setAuthCookies sets authentication cookies for the client
func (s *Server) setAuthCookies(w http.ResponseWriter, accessToken, refreshToken string, user *models.User, profile *models.Profile) {
	// Domainを明示的に設定（本番環境でクロスオリジン対応）
	// 本番環境のIPアドレスに合わせてドメインを設定
	cookieDomain := ""
	// 同じドメインの異なるポート間での共有を許可するため、Domainは設定しない

	// 環境に応じてSecureフラグを設定（本番環境=HTTPS=true、開発環境=HTTP=false）
	isSecure := s.config.IsSecureCookie()
	fmt.Printf("[DEBUG] setAuthCookies: Environment=%s, Secure=%v\n", s.config.Environment, isSecure)

	// 1. auth_token (HttpOnly) - セッション管理用アクセストークン（30分有効）
	// Supabase JWTの有効期限（30分）に合わせてCookie有効期限も30分に設定
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    accessToken,
		Path:     "/",
		Domain:   cookieDomain,
		HttpOnly: true,
		Secure:   isSecure, // 本番環境ではtrue（HTTPS必須）
		SameSite: http.SameSiteLaxMode,
		MaxAge:   30 * 60, // 30分（Supabase JWTの有効期限と一致）
	})

	// 1.5. access_token (HttpOnly) - バックエンドAPI認証用（30分有効）
	// セキュリティ: HttpOnly=trueに設定してXSS攻撃から保護
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/",
		Domain:   cookieDomain,
		HttpOnly: true, // XSS攻撃から保護（JavaScriptからアクセス不可）
		Secure:   isSecure, // 本番環境ではtrue（HTTPS必須）
		SameSite: http.SameSiteLaxMode,
		MaxAge:   30 * 60, // 30分（Supabase JWTの有効期限と一致）
	})

	// 2. refresh_token (HttpOnly) - リフレッシュトークン（2日間有効）
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/",
		Domain:   cookieDomain,
		HttpOnly: true,
		Secure:   isSecure, // 本番環境ではtrue（HTTPS必須）
		SameSite: http.SameSiteLaxMode,
		MaxAge:   60 * 60 * 24 * 2, // 2日間
	})

	// 3. refresh_token_issued_at (HttpOnly) - リフレッシュトークンの発行時刻（有効期限判定用）
	// セキュリティ: 発行時刻を記録して、2日経過を判定できるようにする
	issuedAt := time.Now().Unix()
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token_issued_at",
		Value:    fmt.Sprintf("%d", issuedAt),
		Path:     "/",
		Domain:   cookieDomain,
		HttpOnly: true,
		Secure:   isSecure, // 本番環境ではtrue（HTTPS必須）
		SameSite: http.SameSiteLaxMode,
		MaxAge:   60 * 60 * 24 * 2, // 2日間（refresh_tokenと同じ）
	})

	fmt.Printf("[DEBUG] setAuthCookies: Set HttpOnly auth cookies for user: %s (Secure=%v)\n", user.ID, isSecure)
}

// Logout ログアウト処理
func (s *Server) Logout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// 環境に応じてSecureフラグを設定（ログイン時と同じ設定にする）
	isSecure := s.config.IsSecureCookie()

	// クッキーを削除
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   isSecure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1, // 即座に削除
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true, // ログイン時と同じ設定にする
		Secure:   isSecure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   isSecure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})

	response.Success(w, http.StatusOK, map[string]string{"message": "Logged out successfully"})
}

// CheckSession セッション確認用のエンドポイント
func (s *Server) CheckSession(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("\n========== CHECK SESSION START ==========\n")
	fmt.Printf("[SESSION] Request received from %s\n", r.RemoteAddr)
	
	if r.Method != http.MethodGet {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// トークンを取得（優先順位: Authorization header > access_token cookie > auth_token cookie）
	var tokenString string

	// 1. Authorization headerをチェック
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" && len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		tokenString = authHeader[7:]
		fmt.Printf("[SESSION] ✓ Token found in Authorization header (length: %d)\n", len(tokenString))
	}

	// 2. access_token cookieをチェック
	if tokenString == "" {
		if cookie, err := r.Cookie("access_token"); err == nil && cookie.Value != "" {
			tokenString = cookie.Value
			fmt.Printf("[SESSION] ✓ Token found in access_token cookie (length: %d)\n", len(tokenString))
		}
	}

	// 3. auth_token cookieをチェック（後方互換性のため）
	if tokenString == "" {
		if cookie, err := r.Cookie("auth_token"); err == nil && cookie.Value != "" {
			tokenString = cookie.Value
			fmt.Printf("[SESSION] ✓ Token found in auth_token cookie (length: %d)\n", len(tokenString))
		}
	}

	// 4. アクセストークンがない場合、リフレッシュトークンを使って自動的にリフレッシュを試みる
	if tokenString == "" {
		fmt.Printf("[SESSION] ⚠️ No access token found, attempting to refresh using refresh_token cookie...\n")
		
		refreshCookie, err := r.Cookie("refresh_token")
		if err != nil || refreshCookie.Value == "" {
			fmt.Printf("[SESSION] ❌ No refresh token found either\n")
			fmt.Printf("========== CHECK SESSION END (NO TOKEN) ==========\n\n")
			response.Error(w, http.StatusUnauthorized, "No session found")
			return
		}

		// リフレッシュトークンの発行時刻を確認（2日以内かどうか）
		// セキュリティ: 発行時刻Cookieがない場合は、リフレッシュトークンが古い可能性があるため、
		// Supabaseにリクエストを送って有効性を確認する（Supabaseが最終的な判定を行う）
		issuedAtCookie, err := r.Cookie("refresh_token_issued_at")
		if err == nil && issuedAtCookie.Value != "" {
			issuedAt, parseErr := strconv.ParseInt(issuedAtCookie.Value, 10, 64)
			if parseErr == nil {
				elapsed := time.Now().Unix() - issuedAt
				twoDaysInSeconds := int64(60 * 60 * 24 * 2)
				if elapsed > twoDaysInSeconds {
					fmt.Printf("[SESSION] ❌ Refresh token expired (issued %d seconds ago, limit is %d seconds)\n", elapsed, twoDaysInSeconds)
					fmt.Printf("========== CHECK SESSION END (REFRESH TOKEN EXPIRED) ==========\n\n")
					response.Error(w, http.StatusUnauthorized, "Session expired")
					return
				}
				fmt.Printf("[SESSION] ✓ Refresh token is still valid (issued %d seconds ago, %d seconds remaining)\n", elapsed, twoDaysInSeconds-elapsed)
			} else {
				fmt.Printf("[SESSION] ⚠️ Failed to parse refresh_token_issued_at cookie, will attempt refresh anyway\n")
			}
		} else {
			// 発行時刻Cookieがない場合（古いセッションやCookieが削除された場合）
			// Supabaseにリクエストを送って有効性を確認する
			fmt.Printf("[SESSION] ⚠️ refresh_token_issued_at cookie not found, will attempt refresh (Supabase will validate)\n")
		}

		// リフレッシュトークンを使って新しいアクセストークンを取得
		anonClient := s.supabase.GetAnonClient()
		authResp, err := anonClient.Auth.RefreshToken(refreshCookie.Value)
		if err != nil {
			fmt.Printf("[SESSION] ❌ Failed to refresh token: %v\n", err)
			fmt.Printf("========== CHECK SESSION END (REFRESH FAILED) ==========\n\n")
			response.Error(w, http.StatusUnauthorized, "Session expired")
			return
		}

		fmt.Printf("[SESSION] ✓ Successfully refreshed token using refresh_token cookie\n")
		
		// 新しいトークンでセッションを検証
		tokenString = authResp.AccessToken
		
		// 新しいCookieを設定
		userID := fmt.Sprintf("%x-%x-%x-%x-%x",
			authResp.User.ID[0:4],
			authResp.User.ID[4:6],
			authResp.User.ID[6:8],
			authResp.User.ID[8:10],
			authResp.User.ID[10:16])

		// プロフィール情報を取得
		userClient := s.supabase.GetAuthenticatedClient(authResp.AccessToken)
		var profiles []models.Profile
		_, err = userClient.From("profiles").Select("*", "", false).Eq("id", userID).ExecuteTo(&profiles)

		var profilePtr *models.Profile
		if err == nil && len(profiles) > 0 {
			profilePtr = &profiles[0]
		}

		user := models.User{
			ID:        userID,
			Email:     authResp.User.Email,
			Name:      authResp.User.Email,
			CreatedAt: authResp.User.CreatedAt,
			UpdatedAt: authResp.User.UpdatedAt,
		}
		if profilePtr != nil {
			user.Name = profilePtr.DisplayName
		}

		// 新しいCookieを設定
		s.setAuthCookies(w, authResp.AccessToken, authResp.RefreshToken, &user, profilePtr)
		fmt.Printf("[SESSION] ✓ Set new auth cookies after refresh\n")
	}

	// JWT Secretの確認
	if s.config.SupabaseJWTSecret == "" {
		fmt.Printf("[SESSION] ❌ ERROR: SUPABASE_JWT_SECRET is not set\n")
		fmt.Printf("========== CHECK SESSION END (CONFIG ERROR) ==========\n\n")
		response.Error(w, http.StatusInternalServerError, "Server configuration error")
		return
	}
	fmt.Printf("[SESSION] JWT Secret length: %d\n", len(s.config.SupabaseJWTSecret))

	// トークンを検証してユーザー情報を取得
	fmt.Printf("[SESSION] Parsing JWT token...\n")
	token, err := jwt.ParseWithClaims(tokenString, &middleware.SupabaseJWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.config.SupabaseJWTSecret), nil
	})

	if err != nil {
		fmt.Printf("[SESSION] ⚠️ Token parsing failed (may be expired): %v\n", err)
		// トークンが期限切れの場合、リフレッシュトークンを使って自動的にリフレッシュを試みる
		refreshCookie, refreshErr := r.Cookie("refresh_token")
		if refreshErr == nil && refreshCookie.Value != "" {
			fmt.Printf("[SESSION] Attempting to refresh using refresh_token cookie...\n")
			anonClient := s.supabase.GetAnonClient()
			authResp, refreshErr := anonClient.Auth.RefreshToken(refreshCookie.Value)
			if refreshErr == nil {
				fmt.Printf("[SESSION] ✓ Successfully refreshed expired token\n")
				tokenString = authResp.AccessToken
				
				// 新しいトークンで再検証
				token, err = jwt.ParseWithClaims(tokenString, &middleware.SupabaseJWTClaims{}, func(token *jwt.Token) (interface{}, error) {
					if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
						return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
					}
					return []byte(s.config.SupabaseJWTSecret), nil
				})
				
				if err == nil {
					// 新しいCookieを設定
					userID := fmt.Sprintf("%x-%x-%x-%x-%x",
						authResp.User.ID[0:4],
						authResp.User.ID[4:6],
						authResp.User.ID[6:8],
						authResp.User.ID[8:10],
						authResp.User.ID[10:16])

					userClient := s.supabase.GetAuthenticatedClient(authResp.AccessToken)
					var profiles []models.Profile
					_, err = userClient.From("profiles").Select("*", "", false).Eq("id", userID).ExecuteTo(&profiles)

					var profilePtr *models.Profile
					if err == nil && len(profiles) > 0 {
						profilePtr = &profiles[0]
					}

					user := models.User{
						ID:        userID,
						Email:     authResp.User.Email,
						Name:      authResp.User.Email,
						CreatedAt: authResp.User.CreatedAt,
						UpdatedAt: authResp.User.UpdatedAt,
					}
					if profilePtr != nil {
						user.Name = profilePtr.DisplayName
					}

					s.setAuthCookies(w, authResp.AccessToken, authResp.RefreshToken, &user, profilePtr)
					fmt.Printf("[SESSION] ✓ Set new auth cookies after refresh\n")
				}
			}
		}
		
		// リフレッシュに失敗した場合、エラーを返す
		if err != nil {
			fmt.Printf("[SESSION] ❌ ERROR: Token parsing failed and refresh failed: %v\n", err)
			tokenPreview := tokenString
			if len(tokenPreview) > 100 {
				tokenPreview = tokenPreview[:100]
			}
			fmt.Printf("[SESSION] Token string (first 100 chars): %s...\n", tokenPreview)
			fmt.Printf("========== CHECK SESSION END (INVALID TOKEN) ==========\n\n")
			response.Error(w, http.StatusUnauthorized, "Invalid session")
			return
		}
	}

	claims, ok := token.Claims.(*middleware.SupabaseJWTClaims)
	if !ok || !token.Valid {
		fmt.Printf("[SESSION] ❌ ERROR: Invalid claims or token not valid\n")
		fmt.Printf("[SESSION] Claims OK: %v, Token Valid: %v\n", ok, token.Valid)
		fmt.Printf("========== CHECK SESSION END (INVALID CLAIMS) ==========\n\n")
		response.Error(w, http.StatusUnauthorized, "Invalid session")
		return
	}

	fmt.Printf("[SESSION] ✓ Token validated for user: %s\n", claims.Sub)

	// プロフィール情報を取得
	userClient := s.supabase.GetAuthenticatedClient(tokenString)
	var profiles []models.Profile
	_, err = userClient.From("profiles").Select("*", "", false).Eq("id", claims.Sub).ExecuteTo(&profiles)

	var profilePtr *models.Profile
	if err == nil && len(profiles) > 0 {
		profilePtr = &profiles[0]
	}

	displayName := claims.Email
	if profilePtr != nil {
		displayName = profilePtr.DisplayName
		fmt.Printf("[SESSION] ✓ Profile found for user: %s\n", claims.Sub)
	} else {
		fmt.Printf("[SESSION] ⚠️ No profile found for user: %s\n", claims.Sub)
	}

	userInfo := map[string]interface{}{
		"id":      claims.Sub,
		"email":   claims.Email,
		"name":    displayName,
		"profile": profilePtr,
	}

	fmt.Printf("[SESSION] ✅ Session check completed successfully\n")
	fmt.Printf("========== CHECK SESSION END (SUCCESS) ==========\n\n")
	response.Success(w, http.StatusOK, userInfo)
}

// HandleOAuthCallback OAuthコールバックを処理
func (s *Server) HandleOAuthCallback(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// クエリパラメータからアクセストークンとリフレッシュトークンを取得
	// Supabaseは認証後にaccess_token, refresh_token, expires_inなどをフラグメント(#)で返すが、
	// バックエンドではフラグメントを受け取れないため、クエリパラメータ(?)で受け取る設定が必要
	// または、フロントエンドの一時ページで受け取ってバックエンドに送る

	code := r.URL.Query().Get("code")
	if code == "" {
		// エラーの場合
		errorDesc := r.URL.Query().Get("error_description")
		if errorDesc == "" {
			errorDesc = "OAuth認証に失敗しました"
		}
		redirectURL := fmt.Sprintf("%s/login?error=%s", s.config.FrontendURL, url.QueryEscape(errorDesc))
		fmt.Printf("[ERROR] OAuth callback: No code found, redirecting to %s\n", redirectURL)
		http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
		return
	}

	// 認証コードをトークンに交換
	// Supabaseのトークンエンドポイントに直接リクエスト
	tokenURL := fmt.Sprintf("%s/auth/v1/token?grant_type=authorization_code", s.config.SupabaseURL)
	reqBody := map[string]string{
		"auth_code": code,
	}
	reqBodyJSON, _ := json.Marshal(reqBody)

	tokenReq, err := http.NewRequest("POST", tokenURL, bytes.NewBuffer(reqBodyJSON))
	if err != nil {
		fmt.Printf("[ERROR] OAuth callback: Failed to create token request: %v\n", err)
		redirectURL := fmt.Sprintf("%s/login?error=%s", s.config.FrontendURL, url.QueryEscape("OAuth認証に失敗しました"))
		http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
		return
	}
	tokenReq.Header.Set("Content-Type", "application/json")
	tokenReq.Header.Set("apikey", s.config.SupabaseAnonKey)

	client := &http.Client{}
	tokenResp, err := client.Do(tokenReq)
	if err != nil {
		fmt.Printf("[ERROR] OAuth callback: Failed to exchange code: %v\n", err)
		redirectURL := fmt.Sprintf("%s/login?error=%s", s.config.FrontendURL, url.QueryEscape("OAuth認証に失敗しました"))
		http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
		return
	}
	defer tokenResp.Body.Close()

	if tokenResp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(tokenResp.Body)
		fmt.Printf("[ERROR] OAuth callback: Token exchange failed with status %d: %s\n", tokenResp.StatusCode, string(bodyBytes))
		redirectURL := fmt.Sprintf("%s/login?error=%s", s.config.FrontendURL, url.QueryEscape("OAuth認証に失敗しました"))
		http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
		return
	}

	var tokenData struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		User         struct {
			ID string `json:"id"`
		} `json:"user"`
	}
	if err := json.NewDecoder(tokenResp.Body).Decode(&tokenData); err != nil {
		fmt.Printf("[ERROR] OAuth callback: Failed to decode token response: %v\n", err)
		redirectURL := fmt.Sprintf("%s/login?error=%s", s.config.FrontendURL, url.QueryEscape("OAuth認証に失敗しました"))
		http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
		return
	}

	// ユーザーIDは既に文字列形式で返される
	userID := tokenData.User.ID

	// プロフィールを取得
	userClient := s.supabase.GetAuthenticatedClient(tokenData.AccessToken)
	var profiles []models.Profile
	_, err = userClient.From("profiles").Select("*", "", false).Eq("id", userID).ExecuteTo(&profiles)

	var profilePtr *models.Profile
	if err == nil && len(profiles) > 0 {
		profilePtr = &profiles[0]
	}

	// ユーザー情報を取得（Supabase Auth APIから）
	userInfoURL := fmt.Sprintf("%s/auth/v1/user", s.config.SupabaseURL)
	userReq, _ := http.NewRequest("GET", userInfoURL, nil)
	userReq.Header.Set("apikey", s.config.SupabaseAnonKey)
	userReq.Header.Set("Authorization", "Bearer "+tokenData.AccessToken)

	userResp, err := client.Do(userReq)
	var userEmail string
	var userCreatedAt, userUpdatedAt time.Time

	if err == nil && userResp.StatusCode == http.StatusOK {
		var userInfo struct {
			Email     string `json:"email"`
			CreatedAt string `json:"created_at"`
			UpdatedAt string `json:"updated_at"`
		}
		json.NewDecoder(userResp.Body).Decode(&userInfo)
		userResp.Body.Close()
		userEmail = userInfo.Email

		// Parse timestamps
		if userInfo.CreatedAt != "" {
			userCreatedAt, _ = time.Parse(time.RFC3339, userInfo.CreatedAt)
		}
		if userInfo.UpdatedAt != "" {
			userUpdatedAt, _ = time.Parse(time.RFC3339, userInfo.UpdatedAt)
		}
	}

	displayName := userEmail
	if profilePtr != nil {
		displayName = profilePtr.DisplayName
	}

	user := models.User{
		ID:        userID,
		Email:     userEmail,
		Name:      displayName,
		CreatedAt: userCreatedAt,
		UpdatedAt: userUpdatedAt,
	}

	// HTTPOnly Cookieにトークンを設定
	s.setAuthCookies(w, tokenData.AccessToken, tokenData.RefreshToken, &user, profilePtr)

	// プロフィールがあればダッシュボード、なければ登録フローへ
	if profilePtr != nil {
		redirectURL := fmt.Sprintf("%s/", s.config.FrontendURL)
		fmt.Printf("[INFO] OAuth callback: Success, redirecting to %s\n", redirectURL)
		http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
	} else {
		redirectURL := fmt.Sprintf("%s/register", s.config.FrontendURL)
		fmt.Printf("[INFO] OAuth callback: Success (no profile), redirecting to %s\n", redirectURL)
		http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
	}
}

// LoginWithOAuth OAuth経由でログインを開始
func (s *Server) LoginWithOAuth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req models.OAuthLoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "リクエスト形式が不正です")
		return
	}

	method := strings.ToLower(string(req.Method))
	switch method {
	case "google", "github", "x":
		provider := method
		if provider == "x" {
			provider = "twitter"
		}

		// リダイレクト先はバックエンドのコールバックURL
		// フロントエンドのURLは使用せず、バックエンドで処理
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

		response.Success(w, http.StatusOK, models.OAuthLoginResponse{
			Type:        "oauth",
			ProviderURL: builder.String(),
		})
		return
	default:
		response.Error(w, http.StatusBadRequest, "サポートされていないログイン方法です")
		return
	}
}

// RefreshToken リフレッシュトークンを使って新しいアクセストークンを取得
func (s *Server) RefreshToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	fmt.Printf("[INFO] RefreshToken: Starting token refresh process\n")

	// refresh_tokenクッキーを取得
	refreshCookie, err := r.Cookie("refresh_token")
	if err != nil || refreshCookie.Value == "" {
		fmt.Printf("[ERROR] RefreshToken: No refresh token found in cookies: %v\n", err)
		response.Error(w, http.StatusUnauthorized, "No refresh token found")
		return
	}

	fmt.Printf("[DEBUG] RefreshToken: Found refresh token cookie (length: %d)\n", len(refreshCookie.Value))

	// Supabaseのリフレッシュトークンで新しいトークンを取得
	anonClient := s.supabase.GetAnonClient()
	authResp, err := anonClient.Auth.RefreshToken(refreshCookie.Value)
	if err != nil {
		fmt.Printf("[ERROR] RefreshToken: Supabase refresh failed: %v\n", err)
		response.Error(w, http.StatusUnauthorized, "Failed to refresh token")
		return
	}

	fmt.Printf("[INFO] RefreshToken: Successfully refreshed Supabase token for user: %s\n", authResp.User.Email)

	// UUIDを文字列に変換
	userID := fmt.Sprintf("%x-%x-%x-%x-%x",
		authResp.User.ID[0:4],
		authResp.User.ID[4:6],
		authResp.User.ID[6:8],
		authResp.User.ID[8:10],
		authResp.User.ID[10:16])

	// プロフィール情報を取得
	userClient := s.supabase.GetAuthenticatedClient(authResp.AccessToken)
	var profiles []models.Profile
	_, err = userClient.From("profiles").Select("*", "", false).Eq("id", userID).ExecuteTo(&profiles)

	var profilePtr *models.Profile
	if err == nil && len(profiles) > 0 {
		profilePtr = &profiles[0]
	}

	displayName := authResp.User.Email
	if profilePtr != nil {
		displayName = profilePtr.DisplayName
	}

	user := models.User{
		ID:        userID,
		Email:     authResp.User.Email,
		Name:      displayName,
		CreatedAt: authResp.User.CreatedAt,
		UpdatedAt: authResp.User.UpdatedAt,
	}

	// 新しいクッキーを設定
	s.setAuthCookies(w, authResp.AccessToken, authResp.RefreshToken, &user, profilePtr)

	fmt.Printf("[INFO] RefreshToken: Successfully set new auth cookies for user: %s\n", user.ID)

	response.Success(w, http.StatusOK, map[string]interface{}{
		"token": authResp.AccessToken,
		"user":  user,
	})
}
