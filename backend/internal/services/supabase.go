package services

import (
	"bytes"
	"fmt"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/supabase-community/supabase-go"
	storage_go "github.com/supabase-community/storage-go"
	"github.com/yourusername/appexit-backend/config"
)

// ImpersonateJWTCache はimpersonate JWTのキャッシュエントリ
type ImpersonateJWTCache struct {
	Token     string
	ExpiresAt time.Time
}

type SupabaseService struct {
	anonClient    *supabase.Client                // RLSが効くクライアント
	serviceClient *supabase.Client                // RLSを回避するクライアント（admin操作用）
	cfg           *config.Config                  // 設定を保持
	jwtCache      map[string]*ImpersonateJWTCache // userID -> impersonate JWT cache
	cacheMutex    sync.RWMutex                    // キャッシュ用のミューテックス
}

func NewSupabaseService(cfg *config.Config) *SupabaseService {
	// Anon key クライアント（通常のユーザー操作、RLSが効く）
	anonClient, err := supabase.NewClient(cfg.SupabaseURL, cfg.SupabaseAnonKey, &supabase.ClientOptions{})
	if err != nil {
		panic("Failed to initialize Supabase anon client: " + err.Error())
	}

	// Service role key クライアント（管理者操作、RLS回避）
	serviceClient, err := supabase.NewClient(cfg.SupabaseURL, cfg.SupabaseServiceKey, &supabase.ClientOptions{})
	if err != nil {
		panic("Failed to initialize Supabase service client: " + err.Error())
	}

	return &SupabaseService{
		anonClient:    anonClient,
		serviceClient: serviceClient,
		cfg:           cfg,
		jwtCache:      make(map[string]*ImpersonateJWTCache),
	}
}

// GetAnonClient はRLSが効くクライアントを返す（認証用）
func (s *SupabaseService) GetAnonClient() *supabase.Client {
	return s.anonClient
}

// GetServiceClient はRLSを回避するクライアントを返す（トークン取得用）
func (s *SupabaseService) GetServiceClient() *supabase.Client {
	return s.serviceClient
}

// GetClient は後方互換性のために残す（非推奨）
// Deprecated: Use GetAnonClient or GetServiceClient instead
func (s *SupabaseService) GetClient() *supabase.Client {
	return s.anonClient
}

// GetClientWithToken creates a new client with user token for RLS
func (s *SupabaseService) GetClientWithToken(cfg *config.Config, userToken string) (*supabase.Client, error) {
	return supabase.NewClient(cfg.SupabaseURL, cfg.SupabaseAnonKey, &supabase.ClientOptions{
		Headers: map[string]string{
			"Authorization": "Bearer " + userToken,
		},
	})
}

// GetAuthenticatedClient creates a client with user's JWT token for RLS-protected operations
func (s *SupabaseService) GetAuthenticatedClient(token string) *supabase.Client {
	client, err := supabase.NewClient(s.cfg.SupabaseURL, s.cfg.SupabaseAnonKey, &supabase.ClientOptions{
		Headers: map[string]string{
			"Authorization": "Bearer " + token,
		},
	})
	if err != nil {
		panic("Failed to create authenticated client: " + err.Error())
	}
	return client
}

// GenerateImpersonateJWT generates an impersonate JWT for the given user ID
// This JWT will be used for RLS-protected operations and cached for 1 hour
func (s *SupabaseService) GenerateImpersonateJWT(userID string) (string, error) {
	// キャッシュをチェック
	s.cacheMutex.RLock()
	cached, exists := s.jwtCache[userID]
	s.cacheMutex.RUnlock()

	if exists && time.Now().Before(cached.ExpiresAt) {
		fmt.Printf("[DEBUG] Using cached impersonate JWT for user: %s\n", userID)
		return cached.Token, nil
	}

	// キャッシュが無効またはなければ新規生成
	fmt.Printf("[DEBUG] Generating new impersonate JWT for user: %s\n", userID)

	// 有効期限は1時間
	expiresAt := time.Now().Add(1 * time.Hour)
	claims := jwt.MapClaims{
		"sub":  userID,
		"role": "authenticated",
		"iat":  time.Now().Unix(),
		"exp":  expiresAt.Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.cfg.SupabaseJWTSecret))
	if err != nil {
		return "", fmt.Errorf("failed to sign impersonate JWT: %w", err)
	}

	// キャッシュに保存
	s.cacheMutex.Lock()
	s.jwtCache[userID] = &ImpersonateJWTCache{
		Token:     tokenString,
		ExpiresAt: expiresAt,
	}
	s.cacheMutex.Unlock()

	fmt.Printf("[DEBUG] Generated and cached impersonate JWT for user: %s (expires: %s)\n", userID, expiresAt)
	return tokenString, nil
}

// GetImpersonateClient creates a client with impersonate JWT for RLS-protected operations
func (s *SupabaseService) GetImpersonateClient(userID string) (*supabase.Client, error) {
	impersonateJWT, err := s.GenerateImpersonateJWT(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate impersonate JWT: %w", err)
	}

	client, err := supabase.NewClient(s.cfg.SupabaseURL, s.cfg.SupabaseAnonKey, &supabase.ClientOptions{
		Headers: map[string]string{
			"Authorization": "Bearer " + impersonateJWT,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create impersonate client: %w", err)
	}

	return client, nil
}

// UploadFile uploads a file to Supabase Storage
// Returns the file path in storage (not the full URL)
func (s *SupabaseService) UploadFile(userID string, bucketName string, filePath string, fileData []byte, contentType string) (string, error) {
	client := s.GetServiceClient()

	// Convert byte slice to io.Reader
	reader := bytes.NewReader(fileData)

	// Upload file using UploadFile method with FileOptions containing Content-Type
	options := storage_go.FileOptions{
		ContentType: &contentType,
	}
	_, err := client.Storage.UploadFile(bucketName, filePath, reader, options)
	if err != nil {
		return "", fmt.Errorf("failed to upload file: %w", err)
	}

	return filePath, nil
}

// GetSignedURL generates a signed URL for accessing a private file
func (s *SupabaseService) GetSignedURL(bucketName string, filePath string, expiresIn int) (string, error) {
	client := s.GetServiceClient()

	result, err := client.Storage.CreateSignedUrl(bucketName, filePath, expiresIn)
	if err != nil {
		return "", fmt.Errorf("failed to create signed URL: %w", err)
	}

	return result.SignedURL, nil
}

// DeleteFile deletes a file from Supabase Storage
func (s *SupabaseService) DeleteFile(bucketName string, filePath string) error {
	client := s.GetServiceClient()

	_, err := client.Storage.RemoveFile(bucketName, []string{filePath})
	if err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	return nil
}

