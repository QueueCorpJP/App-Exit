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

// HandlePostComments handles GET (list) and POST (create) for post comments
func (s *Server) HandlePostComments(w http.ResponseWriter, r *http.Request) {
	// Extract post ID from URL path: /api/posts/:id/comments
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 4 || parts[3] != "comments" {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	postID := parts[2]

	switch r.Method {
	case http.MethodGet:
		s.ListPostComments(w, r, postID)
	case http.MethodPost:
		s.CreatePostComment(w, r, postID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// HandleCommentByID handles GET, PUT, DELETE for a specific comment
func (s *Server) HandleCommentByID(w http.ResponseWriter, r *http.Request) {
	// Extract comment ID from URL path: /api/comments/:id
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 3 {
		http.Error(w, "Invalid comment ID", http.StatusBadRequest)
		return
	}
	commentID := parts[2]

	switch r.Method {
	case http.MethodGet:
		s.GetComment(w, r, commentID)
	case http.MethodPut:
		s.UpdateComment(w, r, commentID)
	case http.MethodDelete:
		s.DeleteComment(w, r, commentID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// HandleCommentReplies handles GET (list) and POST (create) for comment replies
func (s *Server) HandleCommentReplies(w http.ResponseWriter, r *http.Request) {
	// Extract comment ID from URL path: /api/comments/:id/replies
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 4 || parts[3] != "replies" {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	commentID := parts[2]

	switch r.Method {
	case http.MethodGet:
		s.ListCommentReplies(w, r, commentID)
	case http.MethodPost:
		s.CreateCommentReply(w, r, commentID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// HandleReplyByID handles PUT and DELETE for a specific reply
func (s *Server) HandleReplyByID(w http.ResponseWriter, r *http.Request) {
	// Extract reply ID from URL path: /api/replies/:id
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 3 {
		http.Error(w, "Invalid reply ID", http.StatusBadRequest)
		return
	}
	replyID := parts[2]

	switch r.Method {
	case http.MethodPut:
		s.UpdateReply(w, r, replyID)
	case http.MethodDelete:
		s.DeleteReply(w, r, replyID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// HandleCommentLikes handles GET (list) and POST (toggle) for comment likes
func (s *Server) HandleCommentLikes(w http.ResponseWriter, r *http.Request) {
	// Extract comment ID from URL path: /api/comments/:id/likes
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 4 || parts[3] != "likes" {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	commentID := parts[2]

	switch r.Method {
	case http.MethodGet:
		s.GetCommentLikes(w, r, commentID)
	case http.MethodPost:
		s.ToggleCommentLike(w, r, commentID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// HandleCommentDislikes handles GET (list) and POST (toggle) for comment dislikes
func (s *Server) HandleCommentDislikes(w http.ResponseWriter, r *http.Request) {
	// Extract comment ID from URL path: /api/comments/:id/dislikes
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 4 || parts[3] != "dislikes" {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	commentID := parts[2]

	switch r.Method {
	case http.MethodGet:
		s.GetCommentDislikes(w, r, commentID)
	case http.MethodPost:
		s.ToggleCommentDislike(w, r, commentID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// ListPostComments retrieves all comments for a post
func (s *Server) ListPostComments(w http.ResponseWriter, r *http.Request, postID string) {
	fmt.Printf("[GET /api/posts/%s/comments] Listing comments\n", postID)

	// Get user ID if authenticated (for checking likes)
	userID, _ := r.Context().Value("user_id").(string)

	client := s.supabase.GetServiceClient()

	// Fetch comments
	var comments []models.PostComment
	_, err := client.From("post_comments").
		Select("*", "", false).
		Eq("post_id", postID).
		Order("created_at", nil).
		ExecuteTo(&comments)

	if err != nil {
		fmt.Printf("[ListPostComments] ERROR: Failed to query comments: %v\n", err)
		http.Error(w, "Failed to fetch comments", http.StatusInternalServerError)
		return
	}

	// Get all user IDs for profiles
	userIDs := make(map[string]bool)
	for _, comment := range comments {
		userIDs[comment.UserID] = true
	}

	// Fetch profiles
	profilesMap := make(map[string]*models.AuthorProfile)
	if len(userIDs) > 0 {
		ids := make([]string, 0, len(userIDs))
		for id := range userIDs {
			ids = append(ids, id)
		}

		var profiles []models.AuthorProfile
		_, err := client.From("profiles").
			Select("id, display_name, icon_url, role, party", "", false).
			In("id", ids).
			ExecuteTo(&profiles)

		if err != nil {
			fmt.Printf("[ListPostComments] WARNING: Failed to query profiles: %v\n", err)
		} else {
			for i := range profiles {
				profilesMap[profiles[i].ID] = &profiles[i]
			}
		}
	}

	// Get like counts and user's likes
	commentIDs := make([]string, len(comments))
	for i, comment := range comments {
		commentIDs[i] = comment.ID
	}

	likeCounts := make(map[string]int)
	userLikes := make(map[string]bool)
	dislikeCounts := make(map[string]int)
	userDislikes := make(map[string]bool)
	if len(commentIDs) > 0 {
		// Count likes for each comment
		type LikeRow struct {
			CommentID string `json:"comment_id"`
		}
		var likes []LikeRow
		_, err := client.From("comment_likes").
			Select("comment_id", "", false).
			In("comment_id", commentIDs).
			ExecuteTo(&likes)

		if err == nil {
			for _, like := range likes {
				likeCounts[like.CommentID]++
			}
		}

		// Count dislikes
		type DislikeRow struct {
			CommentID string `json:"comment_id"`
		}
		var dislikes []DislikeRow
		_, err = client.From("comment_dislikes").
			Select("comment_id", "", false).
			In("comment_id", commentIDs).
			ExecuteTo(&dislikes)
		if err == nil {
			for _, d := range dislikes {
				dislikeCounts[d.CommentID]++
			}
		}

		// Check if current user liked each comment
		if userID != "" {
			type UserLikeRow struct {
				CommentID string `json:"comment_id"`
			}
			var userLikesData []UserLikeRow
			_, err := client.From("comment_likes").
				Select("comment_id", "", false).
				In("comment_id", commentIDs).
				Eq("user_id", userID).
				ExecuteTo(&userLikesData)

			if err == nil {
				for _, like := range userLikesData {
					userLikes[like.CommentID] = true
				}
			}

			// Check if current user disliked each comment
			type UserDislikeRow struct {
				CommentID string `json:"comment_id"`
			}
			var userDislikesData []UserDislikeRow
			_, err = client.From("comment_dislikes").
				Select("comment_id", "", false).
				In("comment_id", commentIDs).
				Eq("user_id", userID).
				ExecuteTo(&userDislikesData)

			if err == nil {
				for _, d := range userDislikesData {
					userDislikes[d.CommentID] = true
				}
			}
		}
	}

	// Get reply counts
	replyCounts := make(map[string]int)
	if len(commentIDs) > 0 {
		type ReplyRow struct {
			CommentID string `json:"comment_id"`
		}
		var replies []ReplyRow
		_, err := client.From("comment_replies").
			Select("comment_id", "", false).
			In("comment_id", commentIDs).
			ExecuteTo(&replies)

		if err == nil {
			for _, reply := range replies {
				replyCounts[reply.CommentID]++
			}
		}
	}

	// Build response
	result := make([]models.PostCommentWithDetails, 0, len(comments))
	for _, comment := range comments {
		likeCount := likeCounts[comment.ID]
		isLiked := userLikes[comment.ID]
		dislikeCount := dislikeCounts[comment.ID]
		isDisliked := userDislikes[comment.ID]
		replyCount := replyCounts[comment.ID]

		result = append(result, models.PostCommentWithDetails{
			PostComment:   comment,
			AuthorProfile: profilesMap[comment.UserID],
			LikeCount:     likeCount,
			IsLiked:       isLiked,
			DislikeCount:  dislikeCount,
			IsDisliked:    isDisliked,
			ReplyCount:    replyCount,
			Replies:       []models.CommentReplyWithDetails{},
		})
	}

	response.Success(w, http.StatusOK, result)
}

// CreatePostComment creates a new comment on a post
func (s *Server) CreatePostComment(w http.ResponseWriter, r *http.Request, postID string) {
	fmt.Printf("[POST /api/posts/%s/comments] Creating comment\n", postID)

	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	impersonateJWT, ok := r.Context().Value("impersonate_jwt").(string)
	if !ok || impersonateJWT == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req models.CreateCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := utils.ValidateStruct(req); err != nil {
		http.Error(w, fmt.Sprintf("Validation error: %v", err), http.StatusBadRequest)
		return
	}

	// 🔒 SECURITY: コメント内容をサニタイズ（XSS攻撃防止）
	contentResult := utils.SanitizeText(utils.SanitizeInput{
		Value:      req.Content,
		MaxLength:  utils.MaxTextareaLength,
		AllowHTML:  false,
		StrictMode: false,
	})

	if !contentResult.IsValid {
		fmt.Printf("[CreatePostComment] WARNING: Comment contains malicious content: %v\n", contentResult.Errors)
	}

	client := s.supabase.GetAuthenticatedClient(impersonateJWT)

	commentData := map[string]interface{}{
		"post_id":  postID,
		"user_id":  userID,
		"content":  contentResult.Sanitized,
	}

	var createdComments []models.PostComment
	_, err := client.From("post_comments").
		Insert(commentData, false, "", "", "").
		ExecuteTo(&createdComments)

	if err != nil {
		fmt.Printf("[CreatePostComment] ERROR: Failed to insert comment: %v\n", err)
		http.Error(w, "Failed to create comment", http.StatusInternalServerError)
		return
	}

	if len(createdComments) == 0 {
		http.Error(w, "Failed to create comment", http.StatusInternalServerError)
		return
	}

	// Fetch author profile
	var authorProfile *models.AuthorProfile
	var profiles []models.AuthorProfile
	_, err = client.From("profiles").
		Select("id, display_name, icon_url, role, party", "", false).
		Eq("id", userID).
		Limit(1, "").
		ExecuteTo(&profiles)

	if err == nil && len(profiles) > 0 {
		authorProfile = &profiles[0]
	}

	result := models.PostCommentWithDetails{
		PostComment:   createdComments[0],
		AuthorProfile: authorProfile,
		LikeCount:     0,
		IsLiked:       false,
		ReplyCount:    0,
		Replies:       []models.CommentReplyWithDetails{},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(result)
}

// GetComment retrieves a single comment by ID
func (s *Server) GetComment(w http.ResponseWriter, r *http.Request, commentID string) {
	client := s.supabase.GetServiceClient()

	var comments []models.PostComment
	_, err := client.From("post_comments").
		Select("*", "", false).
		Eq("id", commentID).
		Limit(1, "").
		ExecuteTo(&comments)

	if err != nil || len(comments) == 0 {
		http.Error(w, "Comment not found", http.StatusNotFound)
		return
	}

	// Fetch author profile
	var authorProfile *models.AuthorProfile
	var profiles []models.AuthorProfile
	_, err = client.From("profiles").
		Select("id, display_name, icon_url, role, party", "", false).
		Eq("id", comments[0].UserID).
		Limit(1, "").
		ExecuteTo(&profiles)

	if err == nil && len(profiles) > 0 {
		authorProfile = &profiles[0]
	}

	// Get like count
	type LikeRow struct {
		CommentID string `json:"comment_id"`
	}
	var likes []LikeRow
	likeCount := 0
	_, err = client.From("comment_likes").
		Select("comment_id", "", false).
		Eq("comment_id", commentID).
		ExecuteTo(&likes)

	if err == nil {
		likeCount = len(likes)
	}

	// Get reply count
	type ReplyRow struct {
		CommentID string `json:"comment_id"`
	}
	var replies []ReplyRow
	replyCount := 0
	_, err = client.From("comment_replies").
		Select("comment_id", "", false).
		Eq("comment_id", commentID).
		ExecuteTo(&replies)

	if err == nil {
		replyCount = len(replies)
	}

	// Get dislike count
	type DislikeRow struct {
		CommentID string `json:"comment_id"`
	}
	var dislikes []DislikeRow
	dislikeCount := 0
	_, err = client.From("comment_dislikes").
		Select("comment_id", "", false).
		Eq("comment_id", commentID).
		ExecuteTo(&dislikes)
	if err == nil {
		dislikeCount = len(dislikes)
	}

	result := models.PostCommentWithDetails{
		PostComment:   comments[0],
		AuthorProfile: authorProfile,
		LikeCount:     likeCount,
		IsLiked:       false,
		DislikeCount:  dislikeCount,
		IsDisliked:    false,
		ReplyCount:    replyCount,
		Replies:       []models.CommentReplyWithDetails{},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

// UpdateComment updates an existing comment
func (s *Server) UpdateComment(w http.ResponseWriter, r *http.Request, commentID string) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	impersonateJWT, ok := r.Context().Value("impersonate_jwt").(string)
	if !ok || impersonateJWT == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req models.UpdateCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := utils.ValidateStruct(req); err != nil {
		http.Error(w, fmt.Sprintf("Validation error: %v", err), http.StatusBadRequest)
		return
	}

	client := s.supabase.GetAuthenticatedClient(impersonateJWT)

	// Check if comment exists and user is the author
	type CommentInfo struct {
		UserID string `json:"user_id"`
	}
	var commentsInfo []CommentInfo
	_, err := client.From("post_comments").
		Select("user_id", "", false).
		Eq("id", commentID).
		Limit(1, "").
		ExecuteTo(&commentsInfo)

	if err != nil || len(commentsInfo) == 0 {
		http.Error(w, "Comment not found", http.StatusNotFound)
		return
	}

	if commentsInfo[0].UserID != userID {
		http.Error(w, "Forbidden: You are not the author of this comment", http.StatusForbidden)
		return
	}

	// 🔒 SECURITY: コメント内容をサニタイズ
	contentResult := utils.SanitizeText(utils.SanitizeInput{
		Value:      req.Content,
		MaxLength:  utils.MaxTextareaLength,
		AllowHTML:  false,
		StrictMode: false,
	})

	if !contentResult.IsValid {
		fmt.Printf("[UpdateComment] WARNING: Comment contains malicious content: %v\n", contentResult.Errors)
	}

	updateData := map[string]interface{}{
		"content": contentResult.Sanitized,
	}

	_, _, err = client.From("post_comments").
		Update(updateData, "", "").
		Eq("id", commentID).
		Execute()

	if err != nil {
		http.Error(w, "Failed to update comment", http.StatusInternalServerError)
		return
	}

	s.GetComment(w, r, commentID)
}

// DeleteComment deletes a comment
func (s *Server) DeleteComment(w http.ResponseWriter, r *http.Request, commentID string) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	impersonateJWT, ok := r.Context().Value("impersonate_jwt").(string)
	if !ok || impersonateJWT == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	client := s.supabase.GetAuthenticatedClient(impersonateJWT)

	// Check if comment exists and user is the author
	type CommentInfo struct {
		UserID string `json:"user_id"`
	}
	var commentsInfo []CommentInfo
	_, err := client.From("post_comments").
		Select("user_id", "", false).
		Eq("id", commentID).
		Limit(1, "").
		ExecuteTo(&commentsInfo)

	if err != nil || len(commentsInfo) == 0 {
		http.Error(w, "Comment not found", http.StatusNotFound)
		return
	}

	if commentsInfo[0].UserID != userID {
		http.Error(w, "Forbidden: You are not the author of this comment", http.StatusForbidden)
		return
	}

	_, _, err = client.From("post_comments").
		Delete("", "").
		Eq("id", commentID).
		Execute()

	if err != nil {
		http.Error(w, "Failed to delete comment", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ListCommentReplies retrieves all replies for a comment
func (s *Server) ListCommentReplies(w http.ResponseWriter, r *http.Request, commentID string) {
	client := s.supabase.GetServiceClient()

	var replies []models.CommentReply
	_, err := client.From("comment_replies").
		Select("*", "", false).
		Eq("comment_id", commentID).
		Order("created_at", nil).
		ExecuteTo(&replies)

	if err != nil {
		fmt.Printf("[ListCommentReplies] ERROR: Failed to query replies: %v\n", err)
		http.Error(w, "Failed to fetch replies", http.StatusInternalServerError)
		return
	}

	// Get all user IDs for profiles
	userIDs := make(map[string]bool)
	for _, reply := range replies {
		userIDs[reply.UserID] = true
	}

	// Fetch profiles
	profilesMap := make(map[string]*models.AuthorProfile)
	if len(userIDs) > 0 {
		ids := make([]string, 0, len(userIDs))
		for id := range userIDs {
			ids = append(ids, id)
		}

		var profiles []models.AuthorProfile
		_, err := client.From("profiles").
			Select("id, display_name, icon_url, role, party", "", false).
			In("id", ids).
			ExecuteTo(&profiles)

		if err != nil {
			fmt.Printf("[ListCommentReplies] WARNING: Failed to query profiles: %v\n", err)
		} else {
			for i := range profiles {
				profilesMap[profiles[i].ID] = &profiles[i]
			}
		}
	}

	// Build response
	result := make([]models.CommentReplyWithDetails, 0, len(replies))
	for _, reply := range replies {
		result = append(result, models.CommentReplyWithDetails{
			CommentReply:   reply,
			AuthorProfile:  profilesMap[reply.UserID],
		})
	}

	response.Success(w, http.StatusOK, result)
}

// CreateCommentReply creates a new reply to a comment
func (s *Server) CreateCommentReply(w http.ResponseWriter, r *http.Request, commentID string) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	impersonateJWT, ok := r.Context().Value("impersonate_jwt").(string)
	if !ok || impersonateJWT == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req models.CreateReplyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := utils.ValidateStruct(req); err != nil {
		http.Error(w, fmt.Sprintf("Validation error: %v", err), http.StatusBadRequest)
		return
	}

	// 🔒 SECURITY: 返信内容をサニタイズ
	contentResult := utils.SanitizeText(utils.SanitizeInput{
		Value:      req.Content,
		MaxLength:  utils.MaxTextareaLength,
		AllowHTML:  false,
		StrictMode: false,
	})

	if !contentResult.IsValid {
		fmt.Printf("[CreateCommentReply] WARNING: Reply contains malicious content: %v\n", contentResult.Errors)
	}

	client := s.supabase.GetAuthenticatedClient(impersonateJWT)

	replyData := map[string]interface{}{
		"comment_id": commentID,
		"user_id":    userID,
		"content":    contentResult.Sanitized,
	}

	var createdReplies []models.CommentReply
	_, err := client.From("comment_replies").
		Insert(replyData, false, "", "", "").
		ExecuteTo(&createdReplies)

	if err != nil {
		fmt.Printf("[CreateCommentReply] ERROR: Failed to insert reply: %v\n", err)
		http.Error(w, "Failed to create reply", http.StatusInternalServerError)
		return
	}

	if len(createdReplies) == 0 {
		http.Error(w, "Failed to create reply", http.StatusInternalServerError)
		return
	}

	// Fetch author profile
	var authorProfile *models.AuthorProfile
	var profiles []models.AuthorProfile
	_, err = client.From("profiles").
		Select("id, display_name, icon_url, role, party", "", false).
		Eq("id", userID).
		Limit(1, "").
		ExecuteTo(&profiles)

	if err == nil && len(profiles) > 0 {
		authorProfile = &profiles[0]
	}

	result := models.CommentReplyWithDetails{
		CommentReply:  createdReplies[0],
		AuthorProfile: authorProfile,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(result)
}

// UpdateReply updates an existing reply
func (s *Server) UpdateReply(w http.ResponseWriter, r *http.Request, replyID string) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	impersonateJWT, ok := r.Context().Value("impersonate_jwt").(string)
	if !ok || impersonateJWT == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req models.UpdateReplyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := utils.ValidateStruct(req); err != nil {
		http.Error(w, fmt.Sprintf("Validation error: %v", err), http.StatusBadRequest)
		return
	}

	client := s.supabase.GetAuthenticatedClient(impersonateJWT)

	// Check if reply exists and user is the author
	type ReplyInfo struct {
		UserID string `json:"user_id"`
	}
	var repliesInfo []ReplyInfo
	_, err := client.From("comment_replies").
		Select("user_id", "", false).
		Eq("id", replyID).
		Limit(1, "").
		ExecuteTo(&repliesInfo)

	if err != nil || len(repliesInfo) == 0 {
		http.Error(w, "Reply not found", http.StatusNotFound)
		return
	}

	if repliesInfo[0].UserID != userID {
		http.Error(w, "Forbidden: You are not the author of this reply", http.StatusForbidden)
		return
	}

	// 🔒 SECURITY: 返信内容をサニタイズ
	contentResult := utils.SanitizeText(utils.SanitizeInput{
		Value:      req.Content,
		MaxLength:  utils.MaxTextareaLength,
		AllowHTML:  false,
		StrictMode: false,
	})

	if !contentResult.IsValid {
		fmt.Printf("[UpdateReply] WARNING: Reply contains malicious content: %v\n", contentResult.Errors)
	}

	updateData := map[string]interface{}{
		"content": contentResult.Sanitized,
	}

	_, _, err = client.From("comment_replies").
		Update(updateData, "", "").
		Eq("id", replyID).
		Execute()

	if err != nil {
		http.Error(w, "Failed to update reply", http.StatusInternalServerError)
		return
	}

	// Fetch updated reply
	var updatedReplies []models.CommentReply
	_, err = client.From("comment_replies").
		Select("*", "", false).
		Eq("id", replyID).
		Limit(1, "").
		ExecuteTo(&updatedReplies)

	if err != nil || len(updatedReplies) == 0 {
		http.Error(w, "Failed to fetch updated reply", http.StatusInternalServerError)
		return
	}

	// Fetch author profile
	var authorProfile *models.AuthorProfile
	var profiles []models.AuthorProfile
	_, err = client.From("profiles").
		Select("id, display_name, icon_url, role, party", "", false).
		Eq("id", userID).
		Limit(1, "").
		ExecuteTo(&profiles)

	if err == nil && len(profiles) > 0 {
		authorProfile = &profiles[0]
	}

	result := models.CommentReplyWithDetails{
		CommentReply:  updatedReplies[0],
		AuthorProfile: authorProfile,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

// DeleteReply deletes a reply
func (s *Server) DeleteReply(w http.ResponseWriter, r *http.Request, replyID string) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	impersonateJWT, ok := r.Context().Value("impersonate_jwt").(string)
	if !ok || impersonateJWT == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	client := s.supabase.GetAuthenticatedClient(impersonateJWT)

	// Check if reply exists and user is the author
	type ReplyInfo struct {
		UserID string `json:"user_id"`
	}
	var repliesInfo []ReplyInfo
	_, err := client.From("comment_replies").
		Select("user_id", "", false).
		Eq("id", replyID).
		Limit(1, "").
		ExecuteTo(&repliesInfo)

	if err != nil || len(repliesInfo) == 0 {
		http.Error(w, "Reply not found", http.StatusNotFound)
		return
	}

	if repliesInfo[0].UserID != userID {
		http.Error(w, "Forbidden: You are not the author of this reply", http.StatusForbidden)
		return
	}

	_, _, err = client.From("comment_replies").
		Delete("", "").
		Eq("id", replyID).
		Execute()

	if err != nil {
		http.Error(w, "Failed to delete reply", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetCommentLikes retrieves like count and user's like status for a comment
func (s *Server) GetCommentLikes(w http.ResponseWriter, r *http.Request, commentID string) {
	userID, _ := r.Context().Value("user_id").(string)

	client := s.supabase.GetServiceClient()

	// Count total likes
	type LikeRow struct {
		CommentID string `json:"comment_id"`
	}
	var likes []LikeRow
	_, err := client.From("comment_likes").
		Select("comment_id", "", false).
		Eq("comment_id", commentID).
		ExecuteTo(&likes)

	if err != nil {
		http.Error(w, "Failed to fetch likes", http.StatusInternalServerError)
		return
	}

	likeCount := len(likes)
	isLiked := false

	// Check if current user liked this comment
	if userID != "" {
		var userLikes []LikeRow
		_, err := client.From("comment_likes").
			Select("comment_id", "", false).
			Eq("comment_id", commentID).
			Eq("user_id", userID).
			Limit(1, "").
			ExecuteTo(&userLikes)

		if err == nil && len(userLikes) > 0 {
			isLiked = true
		}
	}

	result := map[string]interface{}{
		"comment_id": commentID,
		"like_count": likeCount,
		"is_liked":   isLiked,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

// ToggleCommentLike toggles a like on a comment
func (s *Server) ToggleCommentLike(w http.ResponseWriter, r *http.Request, commentID string) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	impersonateJWT, ok := r.Context().Value("impersonate_jwt").(string)
	if !ok || impersonateJWT == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	client := s.supabase.GetAuthenticatedClient(impersonateJWT)

	// Check if like already exists
	type LikeRow struct {
		CommentID string `json:"comment_id"`
		UserID    string `json:"user_id"`
	}
	var existingLikes []LikeRow
	_, err := client.From("comment_likes").
		Select("comment_id, user_id", "", false).
		Eq("comment_id", commentID).
		Eq("user_id", userID).
		Limit(1, "").
		ExecuteTo(&existingLikes)

	if err == nil && len(existingLikes) > 0 {
		// Unlike: delete the like
		_, _, err = client.From("comment_likes").
			Delete("", "").
			Eq("comment_id", commentID).
			Eq("user_id", userID).
			Execute()

		if err != nil {
			http.Error(w, "Failed to unlike comment", http.StatusInternalServerError)
			return
		}
	} else {
		// Like: create the like
		likeData := map[string]interface{}{
			"comment_id": commentID,
			"user_id":    userID,
		}

		_, _, err = client.From("comment_likes").
			Insert(likeData, false, "", "", "").
			Execute()

		if err != nil {
			http.Error(w, "Failed to like comment", http.StatusInternalServerError)
			return
		}
	}

	s.GetCommentLikes(w, r, commentID)
}

// GetCommentDislikes retrieves dislike count and user's dislike status for a comment
func (s *Server) GetCommentDislikes(w http.ResponseWriter, r *http.Request, commentID string) {
	userID, _ := r.Context().Value("user_id").(string)

	client := s.supabase.GetServiceClient()

	// Count total dislikes
	type Row struct {
		CommentID string `json:"comment_id"`
	}
	var rows []Row
	_, err := client.From("comment_dislikes").
		Select("comment_id", "", false).
		Eq("comment_id", commentID).
		ExecuteTo(&rows)
	if err != nil {
		http.Error(w, "Failed to fetch dislikes", http.StatusInternalServerError)
		return
	}

	count := len(rows)
	isDisliked := false

	// Check if current user disliked this comment
	if userID != "" {
		var userRows []Row
		_, err := client.From("comment_dislikes").
			Select("comment_id", "", false).
			Eq("comment_id", commentID).
			Eq("user_id", userID).
			Limit(1, "").
			ExecuteTo(&userRows)
		if err == nil && len(userRows) > 0 {
			isDisliked = true
		}
	}

	result := map[string]interface{}{
		"comment_id":     commentID,
		"dislike_count":  count,
		"is_disliked":    isDisliked,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

// ToggleCommentDislike toggles a dislike on a comment
func (s *Server) ToggleCommentDislike(w http.ResponseWriter, r *http.Request, commentID string) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	impersonateJWT, ok := r.Context().Value("impersonate_jwt").(string)
	if !ok || impersonateJWT == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	client := s.supabase.GetAuthenticatedClient(impersonateJWT)

	// Check if dislike already exists
	type Row struct {
		CommentID string `json:"comment_id"`
		UserID    string `json:"user_id"`
	}
	var existing []Row
	_, err := client.From("comment_dislikes").
		Select("comment_id, user_id", "", false).
		Eq("comment_id", commentID).
		Eq("user_id", userID).
		Limit(1, "").
		ExecuteTo(&existing)

	if err == nil && len(existing) > 0 {
		// Remove dislike
		_, _, err = client.From("comment_dislikes").
			Delete("", "").
			Eq("comment_id", commentID).
			Eq("user_id", userID).
			Execute()
		if err != nil {
			http.Error(w, "Failed to remove dislike", http.StatusInternalServerError)
			return
		}
	} else {
		// Add dislike
		data := map[string]interface{}{
			"comment_id": commentID,
			"user_id":    userID,
		}
		_, _, err = client.From("comment_dislikes").
			Insert(data, false, "", "", "").
			Execute()
		if err != nil {
			http.Error(w, "Failed to add dislike", http.StatusInternalServerError)
			return
		}
	}

	s.GetCommentDislikes(w, r, commentID)
}

