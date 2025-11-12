package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/yourusername/appexit-backend/pkg/response"
)

// UploadFileRequest アップロードリクエスト
type UploadFileRequest struct {
	Bucket   string `json:"bucket"`   // post-images, avatars など
	FilePath string `json:"filePath"` // covers/userId_timestamp.ext など
}

// UploadFileResponse アップロードレスポンス
type UploadFileResponse struct {
	Path string `json:"path"`
}

// GetSignedURLRequest 署名付きURL取得リクエスト
type GetSignedURLRequest struct {
	Bucket    string `json:"bucket"`
	Path      string `json:"path"`
	ExpiresIn int    `json:"expiresIn,omitempty"` // 秒数、デフォルト3600
}

// GetSignedURLResponse 署名付きURLレスポンス
type GetSignedURLResponse struct {
	SignedURL string `json:"signedUrl"`
}

// GetSignedURLsRequest 複数の署名付きURL取得リクエスト
type GetSignedURLsRequest struct {
	Bucket    string   `json:"bucket"`
	Paths     []string `json:"paths"`
	ExpiresIn int      `json:"expiresIn,omitempty"`
}

// GetSignedURLsResponse 複数の署名付きURLレスポンス
type GetSignedURLsResponse struct {
	URLs map[string]string `json:"urls"` // path -> signedUrl
}

// UploadFile ファイルをSupabase Storageにアップロード
func (s *Server) UploadFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// マルチパートフォームをパース
	err := r.ParseMultipartForm(10 << 20) // 10MB max
	if err != nil {
		fmt.Printf("[STORAGE] Failed to parse multipart form: %v\n", err)
		response.Error(w, http.StatusBadRequest, "Failed to parse form")
		return
	}

	// ファイルを取得
	file, header, err := r.FormFile("file")
	if err != nil {
		fmt.Printf("[STORAGE] Failed to get file: %v\n", err)
		response.Error(w, http.StatusBadRequest, "File is required")
		return
	}
	defer file.Close()

	// バケット名とファイルパスを取得
	bucket := r.FormValue("bucket")
	if bucket == "" {
		bucket = "post-images" // デフォルト
	}

	filePath := r.FormValue("filePath")
	if filePath == "" {
		// ファイルパスが指定されていない場合、自動生成
		// contextからユーザーIDを取得
		userID, ok := r.Context().Value("user_id").(string)
		if !ok || userID == "" {
			response.Error(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		// ファイル名を生成（タイムスタンプ + ランダム文字列で衝突を防ぐ）
		timestamp := time.Now().UnixNano() // ナノ秒で精度向上
		randomBytes := make([]byte, 4)
		rand.Read(randomBytes)
		randomStr := hex.EncodeToString(randomBytes)
		fileExt := filepath.Ext(header.Filename)

		if bucket == "avatars" {
			filePath = fmt.Sprintf("%s_%d_%s%s", userID, timestamp, randomStr, fileExt)
		} else {
			filePath = fmt.Sprintf("covers/%s_%d_%s%s", userID, timestamp, randomStr, fileExt)
		}
	}

	fmt.Printf("[STORAGE] Uploading file: bucket=%s, path=%s, size=%d\n", bucket, filePath, header.Size)

	// ファイルを読み込む
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		fmt.Printf("[STORAGE] Failed to read file: %v\n", err)
		response.Error(w, http.StatusInternalServerError, "Failed to read file")
		return
	}

	// Supabase Storageにアップロード
	// ファイルのContent-Typeを検出
	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	_, err = s.supabase.UploadFile("", bucket, filePath, fileBytes, contentType)

	if err != nil {
		fmt.Printf("[STORAGE] Failed to upload to Supabase: %v\n", err)
		response.Error(w, http.StatusInternalServerError, fmt.Sprintf("Failed to upload file: %v", err))
		return
	}

	fmt.Printf("[STORAGE] File uploaded successfully: %s\n", filePath)

	response.Success(w, http.StatusOK, UploadFileResponse{
		Path: filePath,
	})
}

// GetSignedURL 署名付きURLを取得
func (s *Server) GetSignedURL(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req GetSignedURLRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Bucket == "" {
		req.Bucket = "post-images"
	}

	if req.Path == "" {
		response.Error(w, http.StatusBadRequest, "Path is required")
		return
	}

	// 外部URLの場合はそのまま返す
	if strings.HasPrefix(req.Path, "http://") || strings.HasPrefix(req.Path, "https://") {
		fmt.Printf("[STORAGE] Path is external URL, returning as-is: %s\n", req.Path)
		response.Success(w, http.StatusOK, GetSignedURLResponse{
			SignedURL: req.Path,
		})
		return
	}

	if req.ExpiresIn == 0 {
		req.ExpiresIn = 3600 // 1時間
	}

	fmt.Printf("[STORAGE] Getting image URL: bucket=%s, path=%s, expiresIn=%d\n", req.Bucket, req.Path, req.ExpiresIn)

	// Supabase Storageから適切なURLを取得（publicバケットの場合は直接URL、privateバケットの場合はsigned URL）
	imageURL, err := s.supabase.GetImageURL(req.Bucket, req.Path, req.ExpiresIn)
	if err != nil {
		log.Printf("[STORAGE] Failed to get image URL: bucket=%s, path=%s, error=%v\n", req.Bucket, req.Path, err)
		// エラーの詳細を返す（本番環境では詳細を隠すことも検討）
		response.Error(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get image URL for %s/%s: %v", req.Bucket, req.Path, err))
		return
	}

	response.Success(w, http.StatusOK, GetSignedURLResponse{
		SignedURL: imageURL,
	})
}

// GetSignedURLs 複数の署名付きURLを取得
func (s *Server) GetSignedURLs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req GetSignedURLsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Bucket == "" {
		req.Bucket = "post-images"
	}

	if len(req.Paths) == 0 {
		response.Error(w, http.StatusBadRequest, "Paths are required")
		return
	}

	if req.ExpiresIn == 0 {
		req.ExpiresIn = 3600 // 1時間
	}

	fmt.Printf("[STORAGE] Getting signed URLs: bucket=%s, paths=%d, expiresIn=%d\n", req.Bucket, len(req.Paths), req.ExpiresIn)

	urls := make(map[string]string)
	var mu sync.Mutex
	var wg sync.WaitGroup

	// 並列処理で署名付きURLを取得（N+1問題の改善）
	for _, path := range req.Paths {
		// 空のパスはスキップ
		if strings.TrimSpace(path) == "" {
			continue
		}

		// 外部URLの場合はそのまま使用
		if strings.HasPrefix(path, "http://") || strings.HasPrefix(path, "https://") {
			urls[path] = path
			continue
		}

		// goroutineで並列処理
		wg.Add(1)
		go func(p string) {
			defer wg.Done()

			imageURL, err := s.supabase.GetImageURL(req.Bucket, p, req.ExpiresIn)
			if err != nil {
				fmt.Printf("[STORAGE] Warning: Failed to get image URL for %s: %v\n", p, err)
				return
			}

			mu.Lock()
			urls[p] = imageURL
			mu.Unlock()
		}(path)
	}

	// すべてのgoroutineの完了を待つ
	wg.Wait()

	response.Success(w, http.StatusOK, GetSignedURLsResponse{
		URLs: urls,
	})
}
