package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"

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

	// 3. HTTPOnly Cookieにトークンを設定
	// セキュアなCookie設定（SameSite=Lax、HttpOnly）
	// 開発環境ではSecure: falseにしてHTTPでも動作させる
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    authResp.AccessToken,
		Path:     "/",
		MaxAge:   3600, // 1時間
		HttpOnly: true,
		Secure:   false, // 開発環境用（本番環境ではtrueにすること）
		SameSite: http.SameSiteLaxMode,
	})

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
	fmt.Printf("[LOGIN] Setting auth_token cookie\n")

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
	fmt.Printf("========== GET PROFILE END (SUCCESS) ==========\n\n")
	response.Success(w, http.StatusOK, profile)
}

// setAuthCookies sets authentication cookies for the client (all HttpOnly for security)
func setAuthCookies(w http.ResponseWriter, accessToken, refreshToken string, user *models.User, profile *models.Profile) {
	// 1. auth_token (HttpOnly) - アクセストークン（1時間有効）
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    accessToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // productionではtrueにする
		SameSite: http.SameSiteLaxMode,
		MaxAge:   60 * 60, // 1時間
	})

	// 2. refresh_token (HttpOnly) - リフレッシュトークン（7日間有効）
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // productionではtrueにする
		SameSite: http.SameSiteLaxMode,
		MaxAge:   60 * 60 * 24 * 7, // 7日間
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

	// auth_tokenクッキーを確認
	cookie, err := r.Cookie("auth_token")
	if err != nil || cookie.Value == "" {
		response.Error(w, http.StatusUnauthorized, "No session found")
		return
	}

	// トークンを検証してユーザー情報を取得
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

	// プロフィール情報を取得
	userClient := s.supabase.GetAuthenticatedClient(cookie.Value)
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

	// refresh_tokenクッキーを取得
	refreshCookie, err := r.Cookie("refresh_token")
	if err != nil || refreshCookie.Value == "" {
		response.Error(w, http.StatusUnauthorized, "No refresh token found")
		return
	}

	// Supabaseのリフレッシュトークンで新しいトークンを取得
	anonClient := s.supabase.GetAnonClient()
	authResp, err := anonClient.Auth.RefreshToken(refreshCookie.Value)
	if err != nil {
		fmt.Printf("[ERROR] RefreshToken: Failed to refresh token: %v\n", err)
		response.Error(w, http.StatusUnauthorized, "Failed to refresh token")
		return
	}

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

	response.Success(w, http.StatusOK, map[string]interface{}{
		"token": authResp.AccessToken,
		"user":  user,
	})
}
