package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
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

	setAuthCookies(w, authResponse.AccessToken, authResponse.RefreshToken, &authResponse.User, nil)
	fmt.Printf("[REGISTER] Setting auth cookies\n")
	fmt.Printf("[DEBUG] Register: Registration successful, returning response\n")
	response.Success(w, status, authResponse)
}

func (s *Server) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// バリデーション
	if err := utils.ValidateStruct(req); err != nil {
		response.Error(w, http.StatusBadRequest, fmt.Sprintf("Validation error: %v", err))
		return
	}

	// 1. anon keyで認証（メール・パスワード検証）
	anonClient := s.supabase.GetAnonClient()
	authResp, err := anonClient.Auth.SignInWithEmailPassword(req.Email, req.Password)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	if authResp.User.ID == [16]byte{} {
		response.Error(w, http.StatusUnauthorized, "Authentication failed")
		return
	}

	// UUIDを文字列に変換
	userID := fmt.Sprintf("%x-%x-%x-%x-%x",
		authResp.User.ID[0:4],
		authResp.User.ID[4:6],
		authResp.User.ID[6:8],
		authResp.User.ID[8:10],
		authResp.User.ID[10:16])

	// 2. ユーザー自身のトークンでプロフィール情報を取得（RLSが自動的にチェック）
	userClient := s.supabase.GetAuthenticatedClient(authResp.AccessToken)
	var profiles []models.Profile
	_, err = userClient.From("profiles").Select("*", "", false).Eq("id", userID).ExecuteTo(&profiles)

	// プロフィールが存在しない場合はnilを返す（新規登録直後のユーザー）
	var profilePtr *models.Profile
	if err == nil && len(profiles) > 0 {
		profilePtr = &profiles[0]
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
	setAuthCookies(w, authResp.AccessToken, authResp.RefreshToken, &user, profilePtr)

	// 4. SupabaseのAccessTokenとRefreshTokenを返す
	// トークンはフロントエンドのSupabaseセッション（LocalStorage）で管理される
	loginResponse := models.LoginResponse{
		Token:        authResp.AccessToken,  // SupabaseのJWTトークンを返す
		RefreshToken: authResp.RefreshToken, // リフレッシュトークンも返す
		User:         user,
		Profile:      profilePtr, // profileが存在しない場合はnil
	}

	fmt.Printf("[LOGIN] Returning tokens: access_token length=%d, refresh_token length=%d\n",
		len(authResp.AccessToken), len(authResp.RefreshToken))
	fmt.Printf("[LOGIN] Setting auth cookies\n")

	response.Success(w, http.StatusOK, loginResponse)
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
	var profile models.Profile
	_, err := impersonateClient.From("profiles").Select("*", "", false).Eq("id", userID).Single().ExecuteTo(&profile)
	if err != nil {
		fmt.Printf("[GET PROFILE] ❌ ERROR: Failed to fetch profile: %v\n", err)
		fmt.Printf("========== GET PROFILE END (FAILED) ==========\n\n")
		response.Error(w, http.StatusNotFound, "Profile not found")
		return
	}

	fmt.Printf("[GET PROFILE] ✅ Profile fetched successfully: %s\n", profile.DisplayName)
	fmt.Printf("[GET PROFILE] stripe_account_id: %v\n", profile.StripeAccountID)
	fmt.Printf("[GET PROFILE] stripe_onboarding_completed: %v\n", profile.StripeOnboardingCompleted)
	fmt.Printf("========== GET PROFILE END (SUCCESS) ==========\n\n")
	response.Success(w, http.StatusOK, profile)
}

// setAuthCookies sets authentication cookies for the client
func setAuthCookies(w http.ResponseWriter, accessToken, refreshToken string, user *models.User, profile *models.Profile) {
	// Domainを明示的に設定（本番環境でクロスオリジン対応）
	// 本番環境のIPアドレスに合わせてドメインを設定
	cookieDomain := ""
	// 同じドメインの異なるポート間での共有を許可するため、Domainは設定しない

	// 1. auth_token (HttpOnly) - セッション管理用アクセストークン（30分有効）
	// Supabase JWTの有効期限（30分）に合わせてCookie有効期限も30分に設定
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    accessToken,
		Path:     "/",
		Domain:   cookieDomain,
		HttpOnly: true,
		Secure:   false, // HTTPの場合はfalse
		SameSite: http.SameSiteLaxMode,
		MaxAge:   30 * 60, // 30分（Supabase JWTの有効期限と一致）
	})

	// 1.5. access_token (JavaScriptアクセス可能) - Authorization ヘッダー用（30分有効）
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/",
		Domain:   cookieDomain,
		HttpOnly: false, // JavaScriptからアクセス可能
		Secure:   false,
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
		Secure:   false, // HTTPの場合はfalse
		SameSite: http.SameSiteLaxMode,
		MaxAge:   60 * 60 * 24 * 2, // 2日間
	})

	fmt.Printf("[DEBUG] setAuthCookies: Set HttpOnly auth cookies for user: %s\n", user.ID)
}

// Logout ログアウト処理
func (s *Server) Logout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// クッキーを削除
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1, // 即座に削除
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		HttpOnly: false,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})

	response.Success(w, http.StatusOK, map[string]string{"message": "Logged out successfully"})
}

// CheckSession セッション確認用のエンドポイント
func (s *Server) CheckSession(w http.ResponseWriter, r *http.Request) {
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
	}

	// 2. access_token cookieをチェック
	if tokenString == "" {
		if cookie, err := r.Cookie("access_token"); err == nil && cookie.Value != "" {
			tokenString = cookie.Value
		}
	}

	// 3. auth_token cookieをチェック（後方互換性のため）
	if tokenString == "" {
		if cookie, err := r.Cookie("auth_token"); err == nil && cookie.Value != "" {
			tokenString = cookie.Value
		}
	}

	if tokenString == "" {
		response.Error(w, http.StatusUnauthorized, "No session found")
		return
	}

	// トークンを検証してユーザー情報を取得
	token, err := jwt.ParseWithClaims(tokenString, &middleware.SupabaseJWTClaims{}, func(token *jwt.Token) (interface{}, error) {
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
	}

	userInfo := map[string]interface{}{
		"id":      claims.Sub,
		"email":   claims.Email,
		"name":    displayName,
		"profile": profilePtr,
	}

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
	setAuthCookies(w, tokenData.AccessToken, tokenData.RefreshToken, &user, profilePtr)

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
	setAuthCookies(w, authResp.AccessToken, authResp.RefreshToken, &user, profilePtr)

	fmt.Printf("[INFO] RefreshToken: Successfully set new auth cookies for user: %s\n", user.ID)

	response.Success(w, http.StatusOK, map[string]interface{}{
		"token": authResp.AccessToken,
		"user":  user,
	})
}
