package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/yourusername/appexit-backend/internal/models"
	"github.com/yourusername/appexit-backend/internal/utils"
	"github.com/yourusername/appexit-backend/pkg/response"
)

// HandlePosts handles GET (list) and POST (create) for posts
func (s *Server) HandlePosts(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.ListPosts(w, r)
	case http.MethodPost:
		s.CreatePost(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// HandlePostByID handles GET (retrieve), PUT (update), DELETE for a specific post
func (s *Server) HandlePostByID(w http.ResponseWriter, r *http.Request) {
	// Extract post ID from URL path
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 3 {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}
	postID := parts[2]

	switch r.Method {
	case http.MethodGet:
		s.GetPost(w, r, postID)
	case http.MethodPut:
		s.UpdatePost(w, r, postID)
	case http.MethodDelete:
		s.DeletePost(w, r, postID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// ListPosts retrieves a list of posts with optional filters using Supabase
func (s *Server) ListPosts(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("\n========== LIST POSTS START ==========\n")
	fmt.Printf("[GET /api/posts] Request received from %s\n", r.RemoteAddr)
	fmt.Printf("[GET /api/posts] Query params: %v\n", r.URL.Query())
	
	urlQuery := r.URL.Query()

	// Build query parameters
	params := models.PostQueryParams{
		Limit:  20, // Default limit
		Offset: 0,
	}

	if postType := urlQuery.Get("type"); postType != "" {
		pt := models.PostType(postType)
		params.Type = &pt
	}
	if authorUserID := urlQuery.Get("author_user_id"); authorUserID != "" {
		params.AuthorUserID = &authorUserID
	}
	if authorOrgID := urlQuery.Get("author_org_id"); authorOrgID != "" {
		params.AuthorOrgID = &authorOrgID
	}
	// Default to active posts only if not specified
	if isActiveStr := urlQuery.Get("is_active"); isActiveStr != "" {
		isActive := isActiveStr == "true"
		params.IsActive = &isActive
	} else {
		// Default to active posts only
		isActive := true
		params.IsActive = &isActive
	}
	if limitStr := urlQuery.Get("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 {
			params.Limit = limit
		}
	}
	if offsetStr := urlQuery.Get("offset"); offsetStr != "" {
		if offset, err := strconv.Atoi(offsetStr); err == nil && offset >= 0 {
			params.Offset = offset
		}
	}

	// Use Supabase service client for querying posts
	client := s.supabase.GetServiceClient()
	query := client.From("posts").
		Select("*", "", false).
		Order("created_at", nil)

	// Apply filters
	if params.Type != nil {
		query = query.Eq("type", string(*params.Type))
	}
	if params.AuthorUserID != nil {
		query = query.Eq("author_user_id", *params.AuthorUserID)
	}
	if params.AuthorOrgID != nil {
		query = query.Eq("author_org_id", *params.AuthorOrgID)
	}
	if params.IsActive != nil {
		isActiveStr := "false"
		if *params.IsActive {
			isActiveStr = "true"
		}
		query = query.Eq("is_active", isActiveStr)
	}

	// Apply pagination
	query = query.Range(params.Offset, params.Offset+params.Limit-1, "")

	// Execute query
	var postsData []models.Post
	_, err := query.ExecuteTo(&postsData)
	if err != nil {
		fmt.Printf("[ListPosts] ERROR: Failed to query posts: %v\n", err)
		response.Success(w, http.StatusOK, []models.PostWithDetails{})
		return
	}

	// Get all unique author user IDs
	authorIDs := make(map[string]bool)
	for _, post := range postsData {
		authorIDs[post.AuthorUserID] = true
	}

	// Fetch profiles for all authors
	profilesMap := make(map[string]*models.AuthorProfile)
	if len(authorIDs) > 0 {
		ids := make([]string, 0, len(authorIDs))
		for id := range authorIDs {
			ids = append(ids, id)
		}

		var profiles []models.AuthorProfile
		_, err := client.From("profiles").
			Select("id, display_name, icon_url, role, party", "", false).
			In("id", ids).
			ExecuteTo(&profiles)

		if err != nil {
			fmt.Printf("[ListPosts] WARNING: Failed to query profiles: %v\n", err)
		} else {
			for i := range profiles {
				profilesMap[profiles[i].ID] = &profiles[i]
			}
		}
	}

	// Transform to PostWithDetails
	result := make([]models.PostWithDetails, 0, len(postsData))
	for _, post := range postsData {
		result = append(result, models.PostWithDetails{
			Post:          post,
			AuthorProfile: profilesMap[post.AuthorUserID],
		})
	}

	// 空の配列でも正常に返す
	if result == nil {
		result = []models.PostWithDetails{}
	}
	response.Success(w, http.StatusOK, result)
}

// GetPost retrieves a single post by ID with details using Supabase
func (s *Server) GetPost(w http.ResponseWriter, r *http.Request, postID string) {
	fmt.Printf("[GET /api/posts/%s] Querying post from Supabase...\n", postID)

	// Use Supabase service client for querying post
	client := s.supabase.GetServiceClient()
	var postsData []models.Post

	_, err := client.From("posts").
		Select("*", "", false).
		Eq("id", postID).
		Limit(1, "").
		ExecuteTo(&postsData)

	if err != nil {
		fmt.Printf("[GET /api/posts/%s] ❌ ERROR: Failed to query post: %v\n", postID, err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if len(postsData) == 0 {
		fmt.Printf("[GET /api/posts/%s] ❌ ERROR: Post not found\n", postID)
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	post := postsData[0]
	fmt.Printf("[GET /api/posts/%s] ✓ Post found: %s\n", postID, post.Title)

	// Fetch author profile
	var authorProfilePtr *models.AuthorProfile
	var profiles []models.AuthorProfile
	_, err = client.From("profiles").
		Select("id, display_name, icon_url, role, party", "", false).
		Eq("id", post.AuthorUserID).
		Limit(1, "").
		ExecuteTo(&profiles)

	if err != nil {
		fmt.Printf("[GET /api/posts/%s] ⚠️ Warning: Failed to query author profile: %v\n", postID, err)
	} else if len(profiles) > 0 {
		authorProfilePtr = &profiles[0]
		fmt.Printf("[GET /api/posts/%s] ✓ Author profile found: %s\n", postID, authorProfilePtr.DisplayName)
	} else {
		fmt.Printf("[GET /api/posts/%s] ⚠️ Warning: Author profile not found\n", postID)
	}

	response := models.PostWithDetails{
		Post:          post,
		AuthorProfile: authorProfilePtr,
	}

	fmt.Printf("[GET /api/posts/%s] ✅ Returning post with details and author profile\n", postID)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// CreatePost creates a new post using Supabase
func (s *Server) CreatePost(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("\n========== CREATE POST START ==========\n")
	fmt.Printf("[POST /api/posts] Request received from %s\n", r.RemoteAddr)
	fmt.Printf("[POST /api/posts] Content-Type: %s\n", r.Header.Get("Content-Type"))
	fmt.Printf("[POST /api/posts] Content-Length: %s\n", r.Header.Get("Content-Length"))

	// Get user ID from context (set by auth middleware)
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		fmt.Printf("[POST /api/posts] ❌ ERROR: User ID not found in context\n")
		fmt.Printf("[POST /api/posts] Context values: %v\n", r.Context())
		fmt.Printf("========== CREATE POST END (FAILED) ==========\n\n")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	fmt.Printf("[POST /api/posts] ✓ User ID from context: %s\n", userID)

	// Get impersonate JWT from context (set by auth middleware)
	impersonateJWT, ok := r.Context().Value("impersonate_jwt").(string)
	if !ok || impersonateJWT == "" {
		fmt.Printf("[POST /api/posts] ❌ ERROR: Impersonate JWT not found in context\n")
		fmt.Printf("========== CREATE POST END (FAILED) ==========\n\n")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	fmt.Printf("[POST /api/posts] ✓ Impersonate JWT found (length: %d)\n", len(impersonateJWT))

	var req models.CreatePostRequest
	fmt.Printf("[POST /api/posts] Decoding request body...\n")
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fmt.Printf("[POST /api/posts] ❌ ERROR: Failed to decode request body: %v\n", err)
		fmt.Printf("========== CREATE POST END (FAILED) ==========\n\n")
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	fmt.Printf("[POST /api/posts] ✓ Request decoded successfully\n")
	fmt.Printf("[POST /api/posts] Request payload: type=%s, title=%s, body_length=%d\n",
		req.Type, req.Title, len(*req.Body))

	// Validate request
	fmt.Printf("[POST /api/posts] Validating request...\n")
	if err := utils.ValidateStruct(req); err != nil {
		fmt.Printf("[POST /api/posts] ❌ ERROR: Validation failed: %v\n", err)
		fmt.Printf("========== CREATE POST END (FAILED) ==========\n\n")
		http.Error(w, fmt.Sprintf("Validation error: %v", err), http.StatusBadRequest)
		return
	}
	fmt.Printf("[POST /api/posts] ✓ Validation passed\n")

	// Create a new Supabase client with impersonate JWT (for RLS)
	fmt.Printf("[POST /api/posts] Creating Supabase client with impersonate JWT...\n")
	impersonateClient := s.supabase.GetAuthenticatedClient(impersonateJWT)
	fmt.Printf("[POST /api/posts] ✓ Supabase client created\n")

	// Get user's organization if they have one
	fmt.Printf("[POST /api/posts] Querying user organization...\n")
	type OrgMembership struct {
		OrgID string `json:"org_id"`
	}
	var orgMemberships []OrgMembership
	var authorOrgID *string

	_, err := impersonateClient.From("org_memberships").
		Select("org_id", "", false).
		Eq("user_id", userID).
		Limit(1, "").
		ExecuteTo(&orgMemberships)

	if err != nil {
		fmt.Printf("[POST /api/posts] ⚠️ Warning: Failed to query user organization: %v\n", err)
		fmt.Printf("[POST /api/posts] Continuing without organization...\n")
	} else if len(orgMemberships) > 0 {
		authorOrgID = &orgMemberships[0].OrgID
		fmt.Printf("[POST /api/posts] ✓ User organization ID: %s\n", *authorOrgID)
	} else {
		fmt.Printf("[POST /api/posts] ℹ️ User has no organization\n")
	}

	// Prepare post data
	postData := map[string]interface{}{
		"author_user_id":      userID,
		"author_org_id":       authorOrgID,
		"type":                req.Type,
		"title":               req.Title,
		"body":                req.Body,
		"eyecatch_url":        req.EyecatchURL,
		"dashboard_url":       req.DashboardURL,
		"user_ui_url":         req.UserUIURL,
		"performance_url":     req.PerformanceURL,
		"app_categories":      req.AppCategories,
		"service_urls":        req.ServiceURLs,
		"revenue_models":      req.RevenueModels,
		"monthly_revenue":     req.MonthlyRevenue,
		"monthly_cost":        req.MonthlyCost,
		"appeal_text":         req.AppealText,
		"tech_stack":          req.TechStack,
		"user_count":          req.UserCount,
		"release_date":        req.ReleaseDate,
		"operation_form":      req.OperationForm,
		"operation_effort":    req.OperationEffort,
		"transfer_items":      req.TransferItems,
		"desired_transfer_timing": req.DesiredTransferTiming,
		"growth_potential":    req.GrowthPotential,
		"target_customers":    req.TargetCustomers,
		"marketing_channels":  req.MarketingChannels,
		"media_mentions":      req.MediaMentions,
		"extra_image_urls":    req.ExtraImageURLs,
		"price":               req.Price,
		"secret_visibility":   req.SecretVisibility,
		"is_active":           true,
	}

	// Insert post with impersonate JWT (RLS will automatically check permissions)
	fmt.Printf("[POST /api/posts] Inserting post into database...\n")
	fmt.Printf("[POST /api/posts] Post data: %+v\n", postData)
	var createdPosts []models.Post
	_, err = impersonateClient.From("posts").
		Insert(postData, false, "", "", "").
		ExecuteTo(&createdPosts)

	if err != nil {
		fmt.Printf("[POST /api/posts] ❌ ERROR: Failed to insert post: %v\n", err)
		fmt.Printf("[POST /api/posts] Error type: %T\n", err)
		fmt.Printf("========== CREATE POST END (FAILED) ==========\n\n")
		http.Error(w, fmt.Sprintf("Failed to create post: %v", err), http.StatusInternalServerError)
		return
	}

	fmt.Printf("[POST /api/posts] ✓ Post insert query executed\n")

	if len(createdPosts) == 0 {
		fmt.Printf("[POST /api/posts] ❌ ERROR: No post was created (empty result)\n")
		fmt.Printf("========== CREATE POST END (FAILED) ==========\n\n")
		http.Error(w, "Failed to create post", http.StatusInternalServerError)
		return
	}

	postID := createdPosts[0].ID
	fmt.Printf("[POST /api/posts] ✓ Post created successfully with ID: %s\n", postID)

	response := models.PostWithDetails{
		Post: createdPosts[0],
	}

	fmt.Printf("[POST /api/posts] ✅ CreatePost completed successfully\n")
	fmt.Printf("========== CREATE POST END (SUCCESS) ==========\n\n")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// UpdatePost updates an existing post using Supabase
func (s *Server) UpdatePost(w http.ResponseWriter, r *http.Request, postID string) {
	// Get user ID and impersonate JWT from context
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

	var req models.UpdatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if err := utils.ValidateStruct(req); err != nil {
		http.Error(w, fmt.Sprintf("Validation error: %v", err), http.StatusBadRequest)
		return
	}

	// Use impersonate client (RLS will check permissions automatically)
	client := s.supabase.GetAuthenticatedClient(impersonateJWT)

	// Check if post exists
	type PostInfo struct {
		AuthorUserID string `json:"author_user_id"`
	}
	var postsInfo []PostInfo
	_, err := client.From("posts").
		Select("author_user_id", "", false).
		Eq("id", postID).
		Limit(1, "").
		ExecuteTo(&postsInfo)

	if err != nil {
		http.Error(w, "Failed to query post", http.StatusInternalServerError)
		return
	}
	if len(postsInfo) == 0 {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}
	if postsInfo[0].AuthorUserID != userID {
		http.Error(w, "Forbidden: You are not the author of this post", http.StatusForbidden)
		return
	}

	// Build update data for posts table
	postUpdateData := map[string]interface{}{}
	if req.Title != nil {
		postUpdateData["title"] = *req.Title
	}
	if req.Body != nil {
		postUpdateData["body"] = *req.Body
	}
	if req.EyecatchURL != nil {
		postUpdateData["eyecatch_url"] = *req.EyecatchURL
	}
	if req.DashboardURL != nil {
		postUpdateData["dashboard_url"] = *req.DashboardURL
	}
	if req.UserUIURL != nil {
		postUpdateData["user_ui_url"] = *req.UserUIURL
	}
	if req.PerformanceURL != nil {
		postUpdateData["performance_url"] = *req.PerformanceURL
	}
	if req.AppCategories != nil {
		postUpdateData["app_categories"] = req.AppCategories
	}
	if req.ServiceURLs != nil {
		postUpdateData["service_urls"] = req.ServiceURLs
	}
	if req.RevenueModels != nil {
		postUpdateData["revenue_models"] = req.RevenueModels
	}
	if req.MonthlyRevenue != nil {
		postUpdateData["monthly_revenue"] = *req.MonthlyRevenue
	}
	if req.MonthlyCost != nil {
		postUpdateData["monthly_cost"] = *req.MonthlyCost
	}
	if req.AppealText != nil {
		postUpdateData["appeal_text"] = *req.AppealText
	}
	if req.TechStack != nil {
		postUpdateData["tech_stack"] = req.TechStack
	}
	if req.UserCount != nil {
		postUpdateData["user_count"] = *req.UserCount
	}
	if req.ReleaseDate != nil {
		postUpdateData["release_date"] = *req.ReleaseDate
	}
	if req.OperationForm != nil {
		postUpdateData["operation_form"] = *req.OperationForm
	}
	if req.OperationEffort != nil {
		postUpdateData["operation_effort"] = *req.OperationEffort
	}
	if req.TransferItems != nil {
		postUpdateData["transfer_items"] = req.TransferItems
	}
	if req.DesiredTransferTiming != nil {
		postUpdateData["desired_transfer_timing"] = *req.DesiredTransferTiming
	}
	if req.GrowthPotential != nil {
		postUpdateData["growth_potential"] = *req.GrowthPotential
	}
	if req.TargetCustomers != nil {
		postUpdateData["target_customers"] = *req.TargetCustomers
	}
	if req.MarketingChannels != nil {
		postUpdateData["marketing_channels"] = req.MarketingChannels
	}
	if req.MediaMentions != nil {
		postUpdateData["media_mentions"] = *req.MediaMentions
	}
	if req.ExtraImageURLs != nil {
		postUpdateData["extra_image_urls"] = req.ExtraImageURLs
	}
	if req.Price != nil {
		postUpdateData["price"] = *req.Price
	}
	if req.SecretVisibility != nil {
		postUpdateData["secret_visibility"] = *req.SecretVisibility
	}
	if req.IsActive != nil {
		postUpdateData["is_active"] = *req.IsActive
	}

	// Update post if there are changes
	if len(postUpdateData) > 0 {
		_, _, err = client.From("posts").
			Update(postUpdateData, "", "").
			Eq("id", postID).
			Execute()

		if err != nil {
			http.Error(w, "Failed to update post", http.StatusInternalServerError)
			return
		}
	}

	// Return updated post
	s.GetPost(w, r, postID)
}

// DeletePost deletes a post (soft delete by setting is_active to false) using Supabase
func (s *Server) DeletePost(w http.ResponseWriter, r *http.Request, postID string) {
	// Get user ID and impersonate JWT from context
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

	// Use impersonate client (RLS will check permissions automatically)
	client := s.supabase.GetAuthenticatedClient(impersonateJWT)

	// Check if post exists and user is the author
	type PostInfo struct {
		AuthorUserID string `json:"author_user_id"`
	}
	var postsInfo []PostInfo
	_, err := client.From("posts").
		Select("author_user_id", "", false).
		Eq("id", postID).
		Limit(1, "").
		ExecuteTo(&postsInfo)

	if err != nil {
		http.Error(w, "Failed to query post", http.StatusInternalServerError)
		return
	}
	if len(postsInfo) == 0 {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}
	if postsInfo[0].AuthorUserID != userID {
		http.Error(w, "Forbidden: You are not the author of this post", http.StatusForbidden)
		return
	}

	// Soft delete by setting is_active to false
	updateData := map[string]interface{}{
		"is_active": false,
	}
	_, _, err = client.From("posts").
		Update(updateData, "", "").
		Eq("id", postID).
		Execute()

	if err != nil {
		http.Error(w, "Failed to delete post", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
