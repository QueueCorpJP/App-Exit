package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	storage_go "github.com/supabase-community/storage-go"
	"github.com/supabase-community/supabase-go"
	"github.com/yourusername/appexit-backend/config"
)

type SupabaseService struct {
	anonClient    *supabase.Client                // RLSが効くクライアント
	serviceClient *supabase.Client                // RLSを回避するクライアント（admin操作用）
	cfg           *config.Config                  // 設定を保持
	bucketCache   map[string]bool                 // bucketName -> isPublic cache
	bucketCacheMutex sync.RWMutex                 // バケットキャッシュ用のミューテックス
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
		anonClient:      anonClient,
		serviceClient:   serviceClient,
		cfg:             cfg,
		bucketCache:     make(map[string]bool),
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

func (s *SupabaseService) getAdminAuthRequest(method, path string, body io.Reader) (*http.Request, error) {
	url := fmt.Sprintf("%s%s", s.cfg.SupabaseURL, path)
	req, err := http.NewRequest(method, url, body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("apikey", s.cfg.SupabaseServiceKey)
	req.Header.Set("Authorization", "Bearer "+s.cfg.SupabaseServiceKey)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	return req, nil
}

type authUserResponse struct {
	UserMetadata map[string]interface{} `json:"user_metadata"`
}

func (s *SupabaseService) GetUserMetadata(userID string) (map[string]interface{}, error) {
	req, err := s.getAdminAuthRequest(http.MethodGet, fmt.Sprintf("/auth/v1/admin/users/%s", userID), nil)
	if err != nil {
		return nil, fmt.Errorf("failed to build admin auth request: %w", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user metadata: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return map[string]interface{}{}, nil
	}

	if resp.StatusCode >= 400 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to fetch user metadata: status=%d body=%s", resp.StatusCode, string(bodyBytes))
	}

	var result authUserResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode user metadata response: %w", err)
	}

	if result.UserMetadata == nil {
		result.UserMetadata = map[string]interface{}{}
	}

	return result.UserMetadata, nil
}

func cloneMap(src map[string]interface{}) map[string]interface{} {
	if src == nil {
		return map[string]interface{}{}
	}
	dst := make(map[string]interface{}, len(src))
	for k, v := range src {
		if nested, ok := v.(map[string]interface{}); ok {
			dst[k] = cloneMap(nested)
		} else {
			dst[k] = v
		}
	}
	return dst
}

func deepMergeMaps(base, updates map[string]interface{}) map[string]interface{} {
	if base == nil {
		base = map[string]interface{}{}
	}
	for key, val := range updates {
		if valMap, ok := val.(map[string]interface{}); ok {
			if existing, ok := base[key].(map[string]interface{}); ok {
				base[key] = deepMergeMaps(existing, valMap)
			} else {
				base[key] = cloneMap(valMap)
			}
		} else {
			base[key] = val
		}
	}
	return base
}

func (s *SupabaseService) MergeUserMetadata(userID string, updates map[string]interface{}) (map[string]interface{}, error) {
	existing, err := s.GetUserMetadata(userID)
	if err != nil {
		return nil, err
	}

	merged := deepMergeMaps(cloneMap(existing), updates)

	payload := map[string]interface{}{
		"user_metadata": merged,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal metadata payload: %w", err)
	}

    // GoTrue Admin API はユーザー更新を PUT で受け付ける（環境により PATCH は 405 を返す）
    req, err := s.getAdminAuthRequest(http.MethodPut, fmt.Sprintf("/auth/v1/admin/users/%s", userID), bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("failed to build metadata update request: %w", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to update user metadata: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to update user metadata: status=%d body=%s", resp.StatusCode, string(respBody))
	}

	return merged, nil
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

// IsBucketPublic checks if a bucket is public (with caching)
func (s *SupabaseService) IsBucketPublic(bucketName string) (bool, error) {
	// キャッシュをチェック
	s.bucketCacheMutex.RLock()
	if isPublic, exists := s.bucketCache[bucketName]; exists {
		s.bucketCacheMutex.RUnlock()
		return isPublic, nil
	}
	s.bucketCacheMutex.RUnlock()

	// キャッシュにない場合は既知のバケット設定から取得
	// 一時的な解決策: 既知のバケット設定をハードコード
	// 本番環境では、データベースから動的に取得することを推奨
	knownBuckets := map[string]bool{
		"avatars":            true,  // public: アバター画像
		"profile-icons":      true,  // public: プロフィールアイコン
		"message-images":     false, // private: メッセージ添付画像
		"post-images":        false, // private: 投稿画像
		"contract-documents": false, // private: 契約書
	}
	
	isPublic, exists := knownBuckets[bucketName]
	if !exists {
		// 不明なバケットの場合はデフォルトでprivateと仮定
		isPublic = false
	}
	
	// キャッシュに保存
	s.bucketCacheMutex.Lock()
	s.bucketCache[bucketName] = isPublic
	s.bucketCacheMutex.Unlock()
	
	return isPublic, nil
}

// GetImageURL returns the appropriate URL for a file (public URL for public buckets, signed URL for private buckets)
func (s *SupabaseService) GetImageURL(bucketName string, filePath string, expiresIn int) (string, error) {
	// 既に完全なURLの場合はそのまま返す（外部URLや既に署名付きURLの場合）
	if strings.HasPrefix(filePath, "http://") || strings.HasPrefix(filePath, "https://") {
		fmt.Printf("[GetImageURL] Path is already a full URL, returning as-is: %s\n", filePath)
		return filePath, nil
	}

	// パスの先頭のスラッシュを削除
	cleanPath := strings.TrimPrefix(filePath, "/")

	fmt.Printf("[GetImageURL] bucket=%s, filePath=%s, cleanPath=%s\n", bucketName, filePath, cleanPath)

	// バケットがpublicかどうかを確認
	isPublic, err := s.IsBucketPublic(bucketName)
	if err != nil {
		return "", fmt.Errorf("failed to check bucket public status: %w", err)
	}

	fmt.Printf("[GetImageURL] bucket=%s isPublic=%v\n", bucketName, isPublic)

	if isPublic {
		// publicバケットの場合は直接URLを返す
		// URL形式: https://{project_ref}.supabase.co/storage/v1/object/public/{bucket_name}/{file_path}
		publicURL := fmt.Sprintf("%s/storage/v1/object/public/%s/%s", s.cfg.SupabaseURL, bucketName, cleanPath)
		fmt.Printf("[GetImageURL] Returning public URL: %s\n", publicURL)
		return publicURL, nil
	}

	// privateバケットの場合はsigned URLを生成
	signedURL, err := s.GetSignedURL(bucketName, filePath, expiresIn)
	if err != nil {
		fmt.Printf("[GetImageURL] ERROR generating signed URL: %v\n", err)
		return "", err
	}
	fmt.Printf("[GetImageURL] Returning signed URL: %s\n", signedURL)
	return signedURL, nil
}

// GetSignedURL generates a signed URL for accessing a private file
func (s *SupabaseService) GetSignedURL(bucketName string, filePath string, expiresIn int) (string, error) {
	// パスの先頭のスラッシュを削除（Supabase Storageは先頭スラッシュを許可しない）
	cleanPath := strings.TrimPrefix(filePath, "/")

	// storage-goパッケージを直接使用して署名付きURLを生成
	storageClient := storage_go.NewClient(
		fmt.Sprintf("%s/storage/v1", s.cfg.SupabaseURL),
		s.cfg.SupabaseServiceKey,
		nil,
	)

	result, err := storageClient.CreateSignedUrl(bucketName, cleanPath, expiresIn)
	if err != nil {
		return "", fmt.Errorf("failed to create signed URL for bucket=%s path=%s: %w", bucketName, cleanPath, err)
	}

	return result.SignedURL, nil
}

// GetBatchImageURLs generates URLs for multiple files in parallel (public or signed depending on bucket)
// Returns a map of filePath -> URL
func (s *SupabaseService) GetBatchImageURLs(bucketName string, filePaths []string, expiresIn int) map[string]string {
	result := make(map[string]string)
	if len(filePaths) == 0 {
		return result
	}

	// Use channels to collect results
	type urlResult struct {
		path string
		url  string
	}
	resultCh := make(chan urlResult, len(filePaths))

	// Launch goroutines for parallel processing
	var wg sync.WaitGroup
	for _, path := range filePaths {
		wg.Add(1)
		go func(p string) {
			defer wg.Done()
			imageURL, err := s.GetImageURL(bucketName, p, expiresIn)
			if err != nil {
				fmt.Printf("[WARN] Failed to generate URL for %s: %v\n", p, err)
				return
			}
			resultCh <- urlResult{path: p, url: imageURL}
		}(path)
	}

	// Close channel when all goroutines complete
	go func() {
		wg.Wait()
		close(resultCh)
	}()

	// Collect results
	for r := range resultCh {
		result[r.path] = r.url
	}

	return result
}

// GetBatchSignedURLs generates signed URLs for multiple files in parallel
// Returns a map of filePath -> signedURL
// Deprecated: Use GetBatchImageURLs instead
func (s *SupabaseService) GetBatchSignedURLs(bucketName string, filePaths []string, expiresIn int) map[string]string {
	return s.GetBatchImageURLs(bucketName, filePaths, expiresIn)
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

// GetActiveViewCounts calls the PostgreSQL RPC function to get active view counts efficiently
// This solves the N+1 problem by using GROUP BY aggregation in the database
func (s *SupabaseService) GetActiveViewCounts(postIDs []string) (map[string]int, error) {
	if len(postIDs) == 0 {
		return make(map[string]int), nil
	}

	// Call the RPC function using HTTP request
	type ActiveViewCountRow struct {
		PostID string `json:"post_id"`
		Count  int    `json:"count"`
	}

	// Build RPC request
	payload := map[string]interface{}{
		"post_ids": postIDs,
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal RPC payload: %w", err)
	}

	// Make HTTP request to RPC endpoint
	url := fmt.Sprintf("%s/rest/v1/rpc/get_active_view_counts", s.cfg.SupabaseURL)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payloadBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create RPC request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", s.cfg.SupabaseServiceKey)
	req.Header.Set("Authorization", "Bearer "+s.cfg.SupabaseServiceKey)

	httpClient := &http.Client{Timeout: 10 * time.Second}
	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute RPC request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("RPC returned status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var result []ActiveViewCountRow
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode RPC response: %w", err)
	}

	// Convert to map
	countMap := make(map[string]int)
	for _, row := range result {
		countMap[row.PostID] = row.Count
	}

	return countMap, nil
}
