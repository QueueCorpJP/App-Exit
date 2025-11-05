package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/yourusername/appexit-backend/internal/models"
	"github.com/yourusername/appexit-backend/internal/utils"
	"github.com/yourusername/appexit-backend/pkg/response"
)

// GetUserLinks は指定されたユーザーのリンク一覧を取得
func (s *Server) GetUserLinks(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// クエリパラメータからuser_idを取得
	queryUserID := r.URL.Query().Get("user_id")
	if queryUserID == "" {
		response.Error(w, http.StatusBadRequest, "user_id is required")
		return
	}

	// 認証不要で全ユーザーのリンクを閲覧可能（RLSで制御）
	anonClient := s.supabase.GetAnonClient()
	var links []models.UserLink
	if _, err := anonClient.From("user_links").
		Select("*", "", false).
		Eq("user_id", queryUserID).
		ExecuteTo(&links); err != nil {
		response.Error(w, http.StatusInternalServerError, fmt.Sprintf("リンクの取得に失敗しました: %v", err))
		return
	}

	response.Success(w, http.StatusOK, links)
}

// CreateUserLink は新しいリンクを作成
func (s *Server) CreateUserLink(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	accessToken, ok := r.Context().Value("access_token").(string)
	if !ok || accessToken == "" {
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.UserLinkInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// バリデーション
	if err := utils.ValidateStruct(req); err != nil {
		response.Error(w, http.StatusBadRequest, fmt.Sprintf("Validation error: %v", err))
		return
	}

	userClient := s.supabase.GetAuthenticatedClient(accessToken)

	// 現在のリンク数を取得してdisplay_orderを決定
	var existingLinks []models.UserLink
	if _, err := userClient.From("user_links").
		Select("display_order", "", false).
		Eq("user_id", userID).
		Limit(1, "").
		ExecuteTo(&existingLinks); err != nil {
		response.Error(w, http.StatusInternalServerError, fmt.Sprintf("リンク数の取得に失敗しました: %v", err))
		return
	}

	displayOrder := 0
	if len(existingLinks) > 0 {
		// 既存リンクがある場合、最大値を探す
		maxOrder := 0
		for _, link := range existingLinks {
			if link.DisplayOrder > maxOrder {
				maxOrder = link.DisplayOrder
			}
		}
		displayOrder = maxOrder + 1
	}

	payload := map[string]interface{}{
		"user_id":       userID,
		"name":          strings.TrimSpace(req.Name),
		"url":           strings.TrimSpace(req.URL),
		"display_order": displayOrder,
	}

	var createdLinks []models.UserLink
	if _, err := userClient.From("user_links").
		Insert(payload, false, "", "", "").
		ExecuteTo(&createdLinks); err != nil {
		response.Error(w, http.StatusInternalServerError, fmt.Sprintf("リンクの作成に失敗しました: %v", err))
		return
	}

	if len(createdLinks) == 0 {
		response.Error(w, http.StatusInternalServerError, "リンクの作成に失敗しました")
		return
	}

	response.Success(w, http.StatusCreated, createdLinks[0])
}

// UpdateUserLink はリンクを更新
func (s *Server) UpdateUserLink(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	accessToken, ok := r.Context().Value("access_token").(string)
	if !ok || accessToken == "" {
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	linkID := r.URL.Query().Get("id")
	if linkID == "" {
		response.Error(w, http.StatusBadRequest, "link id is required")
		return
	}

	var req models.UserLinkInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// バリデーション
	if err := utils.ValidateStruct(req); err != nil {
		response.Error(w, http.StatusBadRequest, fmt.Sprintf("Validation error: %v", err))
		return
	}

	userClient := s.supabase.GetAuthenticatedClient(accessToken)

	update := map[string]interface{}{
		"name": strings.TrimSpace(req.Name),
		"url":  strings.TrimSpace(req.URL),
	}

	var updatedLinks []models.UserLink
	if _, err := userClient.From("user_links").
		Update(update, "", "").
		Eq("id", linkID).
		Eq("user_id", userID).
		ExecuteTo(&updatedLinks); err != nil {
		response.Error(w, http.StatusInternalServerError, fmt.Sprintf("リンクの更新に失敗しました: %v", err))
		return
	}

	if len(updatedLinks) == 0 {
		response.Error(w, http.StatusNotFound, "リンクが見つかりません")
		return
	}

	response.Success(w, http.StatusOK, updatedLinks[0])
}

// DeleteUserLink はリンクを削除
func (s *Server) DeleteUserLink(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	accessToken, ok := r.Context().Value("access_token").(string)
	if !ok || accessToken == "" {
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	linkID := r.URL.Query().Get("id")
	if linkID == "" {
		response.Error(w, http.StatusBadRequest, "link id is required")
		return
	}

	userClient := s.supabase.GetAuthenticatedClient(accessToken)

	if _, _, err := userClient.From("user_links").
		Delete("", "").
		Eq("id", linkID).
		Eq("user_id", userID).
		Execute(); err != nil {
		response.Error(w, http.StatusInternalServerError, fmt.Sprintf("リンクの削除に失敗しました: %v", err))
		return
	}

	response.Success(w, http.StatusOK, map[string]string{"message": "削除しました"})
}

