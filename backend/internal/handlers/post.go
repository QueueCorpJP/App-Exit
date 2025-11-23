package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	supabase "github.com/supabase-community/supabase-go"
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

// HandlePostsWithAuth handles GET (list) with authentication - ensures user can only see their own posts when author_user_id is specified
func (s *Server) HandlePostsWithAuth(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		s.ListPostsWithAuth(w, r)
	} else {
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

	// Safety check: reject "metadata" as post ID (should be handled by metadata route)
	if postID == "metadata" {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

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

// ListPostsWithAuth retrieves a list of posts with authentication - ensures user can only see their own posts
func (s *Server) ListPostsWithAuth(w http.ResponseWriter, r *http.Request) {
	userID, ok := utils.RequireUserID(r, w)
	if !ok {
		return
	}

	urlQuery := r.URL.Query()
	authorUserID := urlQuery.Get("author_user_id")

	// If author_user_id is specified, ensure it matches the authenticated user
	if authorUserID != "" && authorUserID != userID {
		fmt.Printf("[ListPostsWithAuth] ❌ ERROR: User %s attempted to access posts from user %s\n", userID, authorUserID)
		response.Error(w, http.StatusForbidden, "You can only view your own posts")
		return
	}

	// If author_user_id is not specified but user is authenticated, default to their own posts
	if authorUserID == "" {
		authorUserID = userID
		urlQuery.Set("author_user_id", userID)
		r.URL.RawQuery = urlQuery.Encode()
	}

	// Call the regular ListPosts function
	s.ListPosts(w, r)
}

// checkNDAAgreement checks if the user/organization has signed NDA with the seller
// 🔒 SECURITY: Now accepts client as parameter to enforce RLS
func (s *Server) checkNDAAgreement(client *supabase.Client, buyerUserID string, sellerUserID string, sellerOrgID *string) (bool, error) {
	if buyerUserID == "" {
		return false, nil
	}

	// Check if buyer user has signed NDA with seller (user-level)
	var ndaAgreements []struct {
		ID          string  `json:"id"`
		BuyerUserID *string `json:"buyer_user_id"`
		Status      string  `json:"status"`
	}

	query := client.From("nda_agreements").
		Select("id, buyer_user_id, status", "", false).
		Eq("status", "signed").
		Eq("buyer_user_id", buyerUserID)

	if sellerOrgID != nil && *sellerOrgID != "" {
		query = query.Eq("seller_org_id", *sellerOrgID)
	} else {
		query = query.Eq("seller_user_id", sellerUserID)
	}

	_, err := query.ExecuteTo(&ndaAgreements)
	if err == nil && len(ndaAgreements) > 0 {
		return true, nil
	}

	// Check organization-level NDA
	var orgMemberships []struct {
		OrgID string `json:"org_id"`
	}
	_, err = client.From("org_memberships").
		Select("org_id", "", false).
		Eq("user_id", buyerUserID).
		ExecuteTo(&orgMemberships)

	if err == nil && len(orgMemberships) > 0 {
		for _, membership := range orgMemberships {
			var orgNDAAgreements []struct {
				ID         string `json:"id"`
				BuyerOrgID string `json:"buyer_org_id"`
				Status     string `json:"status"`
			}
			orgQuery := client.From("nda_agreements").
				Select("id, buyer_org_id, status", "", false).
				Eq("status", "signed").
				Eq("buyer_org_id", membership.OrgID)

			if sellerOrgID != nil && *sellerOrgID != "" {
				orgQuery = orgQuery.Eq("seller_org_id", *sellerOrgID)
			} else {
				orgQuery = orgQuery.Eq("seller_user_id", sellerUserID)
			}

			_, err = orgQuery.ExecuteTo(&orgNDAAgreements)
			if err == nil && len(orgNDAAgreements) > 0 {
				return true, nil
			}
		}
	}

	return false, nil
}

// ListPosts retrieves a list of posts with optional filters using Supabase
func (s *Server) ListPosts(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("\n========== LIST POSTS START ==========\n")
	fmt.Printf("[GET /api/posts] Request received from %s\n", r.RemoteAddr)
	fmt.Printf("[GET /api/posts] Query params: %v\n", r.URL.Query())
	
	urlQuery := r.URL.Query()

	// Get user ID from context if available (for NDA check)
	var currentUserID string
	if userID, ok := r.Context().Value("user_id").(string); ok {
		currentUserID = userID
		fmt.Printf("[ListPosts] Current user ID: %s\n", currentUserID)
	}

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

	// Search parameters
	if searchKeyword := urlQuery.Get("search_keyword"); searchKeyword != "" {
		params.SearchKeyword = &searchKeyword
	}
	if categoriesStr := urlQuery.Get("categories"); categoriesStr != "" {
		var categories []string
		if err := json.Unmarshal([]byte(categoriesStr), &categories); err == nil {
			params.Categories = categories
		}
	}
	if postTypesStr := urlQuery.Get("post_types"); postTypesStr != "" {
		var postTypes []string
		if err := json.Unmarshal([]byte(postTypesStr), &postTypes); err == nil {
			params.PostTypes = postTypes
		}
	}
	if priceMinStr := urlQuery.Get("price_min"); priceMinStr != "" {
		if priceMin, err := strconv.ParseInt(priceMinStr, 10, 64); err == nil {
			params.PriceMin = &priceMin
		}
	}
	if priceMaxStr := urlQuery.Get("price_max"); priceMaxStr != "" {
		if priceMax, err := strconv.ParseInt(priceMaxStr, 10, 64); err == nil {
			params.PriceMax = &priceMax
		}
	}
	if revenueMinStr := urlQuery.Get("revenue_min"); revenueMinStr != "" {
		if revenueMin, err := strconv.ParseInt(revenueMinStr, 10, 64); err == nil {
			params.RevenueMin = &revenueMin
		}
	}
	if revenueMaxStr := urlQuery.Get("revenue_max"); revenueMaxStr != "" {
		if revenueMax, err := strconv.ParseInt(revenueMaxStr, 10, 64); err == nil {
			params.RevenueMax = &revenueMax
		}
	}
	if techStacksStr := urlQuery.Get("tech_stacks"); techStacksStr != "" {
		var techStacks []string
		if err := json.Unmarshal([]byte(techStacksStr), &techStacks); err == nil {
			params.TechStacks = techStacks
		}
	}

	// Check for sort parameter
	sortBy := urlQuery.Get("sort")
	fmt.Printf("[ListPosts] Search params: keyword=%v, categories=%v, postTypes=%v, price=%v-%v, revenue=%v-%v, techStacks=%v\n",
		params.SearchKeyword, params.Categories, params.PostTypes, params.PriceMin, params.PriceMax, params.RevenueMin, params.RevenueMax, params.TechStacks)

	// 🔒 SECURITY: Use access token if authenticated, otherwise use Anon Client to enforce RLS
	var client *supabase.Client
	if accessToken, ok := r.Context().Value("access_token").(string); ok && accessToken != "" {
		// Authenticated user - can see more posts based on RLS policies
		client = s.supabase.GetAuthenticatedClient(accessToken)
	} else {
		// Unauthenticated user - can only see public posts
		client = s.supabase.GetAnonClient()
	}
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

	// Search keyword - search in title and body
	if params.SearchKeyword != nil && *params.SearchKeyword != "" {
		keyword := *params.SearchKeyword
		// Use OR condition to search in title or body
		query = query.Or(fmt.Sprintf("title.ilike.%%25%s%%25,body.ilike.%%25%s%%25", keyword, keyword), "")
	}

	// Categories filter - check if any category matches
	if len(params.Categories) > 0 {
		// Use overlaps to check if app_categories array has any overlap with specified categories
		categoriesJSON, _ := json.Marshal(params.Categories)
		query = query.Filter("app_categories", "ov", string(categoriesJSON))
	}

	// Post types filter
	if len(params.PostTypes) > 0 {
		query = query.In("type", params.PostTypes)
	}

	// Price range filter
	if params.PriceMin != nil {
		query = query.Gte("price", strconv.FormatInt(*params.PriceMin, 10))
	}
	if params.PriceMax != nil {
		query = query.Lte("price", strconv.FormatInt(*params.PriceMax, 10))
	}

	// Revenue range filter
	if params.RevenueMin != nil {
		query = query.Gte("monthly_revenue", strconv.FormatInt(*params.RevenueMin, 10))
	}
	if params.RevenueMax != nil {
		query = query.Lte("monthly_revenue", strconv.FormatInt(*params.RevenueMax, 10))
	}

	// Tech stacks filter - check if any tech stack matches
	if len(params.TechStacks) > 0 {
		// Use overlaps to check if tech_stack array has any overlap with specified tech stacks
		techStacksJSON, _ := json.Marshal(params.TechStacks)
		query = query.Filter("tech_stack", "ov", string(techStacksJSON))
	}

	// For recommended sort, fetch more data to allow proper sorting by watch count
	// ウォッチ数でソートするため、より多くのデータを取得してからソート
	fetchLimit := params.Limit
	if sortBy == "recommended" {
		// ウォッチ数でソートするため、十分なデータを取得（最大100件）
		fetchLimit = 100
		if fetchLimit < params.Limit {
			fetchLimit = params.Limit
		}
		// ページネーションを一時的に無効化（ソート後に適用）
		query = query.Range(0, fetchLimit-1, "")
	} else {
		// Apply pagination
		query = query.Range(params.Offset, params.Offset+params.Limit-1, "")
	}

	// Execute query
	var postsData []models.Post
	_, err := query.ExecuteTo(&postsData)
	if err != nil {
		fmt.Printf("[ListPosts] ERROR: Failed to query posts: %v\n", err)
		response.Success(w, http.StatusOK, []models.PostWithDetails{})
		return
	}

	// Get all unique author user IDs and post IDs
	authorIDs := make(map[string]bool)
	postIDs := make([]string, 0, len(postsData))
	for _, post := range postsData {
		authorIDs[post.AuthorUserID] = true
		postIDs = append(postIDs, post.ID)
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

	// Fetch active view counts for all posts using RPC function (N+1問題を解決)
	// PostgreSQLのGROUP BY集計を使用して効率的にカウント
	activeViewCountMap := make(map[string]int)
	watchCountMap := make(map[string]int)
	fmt.Printf("[ListPosts] Fetching active view counts for %d posts using RPC...\n", len(postIDs))
	if len(postIDs) > 0 {
		counts, err := s.supabase.GetActiveViewCounts(postIDs)
		if err != nil {
			fmt.Printf("[ListPosts] ❌ ERROR: Failed to get active view counts: %v\n", err)
			// Fallback to old method if RPC fails (for backward compatibility)
			var activeViews []models.ProductActiveView
			_, err := client.From("product_active_views").
				Select("post_id", "", false).
				In("post_id", postIDs).
				ExecuteTo(&activeViews)

			if err == nil {
				for _, view := range activeViews {
					activeViewCountMap[view.PostID]++
				}
				fmt.Printf("[ListPosts] ⚠ Used fallback method, retrieved %d active view records\n", len(activeViews))
			}
		} else {
			activeViewCountMap = counts
			totalViews := 0
			for _, count := range counts {
				totalViews += count
			}
			fmt.Printf("[ListPosts] ✓ Retrieved active view counts via RPC (total: %d views)\n", totalViews)
		}

		// Fetch watch counts for recommended sort
		if sortBy == "recommended" {
			var watchViews []models.ProductActiveView
			_, err := client.From("product_active_views").
				Select("post_id", "", false).
				In("post_id", postIDs).
				ExecuteTo(&watchViews)

			if err == nil {
				for _, view := range watchViews {
					watchCountMap[view.PostID]++
				}
				fmt.Printf("[ListPosts] ✓ Retrieved watch counts (total: %d watches)\n", len(watchViews))
			} else {
				fmt.Printf("[ListPosts] ⚠ Failed to get watch counts: %v\n", err)
			}
		}
	}

	// Transform to PostWithDetails and apply NDA filtering for secret posts
	result := make([]models.PostWithDetails, 0, len(postsData))
	for _, post := range postsData {
		activeCount := activeViewCountMap[post.ID]
		
		// For secret posts, check NDA agreement and filter/hide details if not signed
		if post.Type == models.PostTypeSecret {
			// If user is not authenticated, hide all details
			if currentUserID == "" {
				// Hide title, body, and other sensitive information
				post.Title = ""
				post.Body = nil
				post.AppCategories = nil
				post.ServiceURLs = nil
				post.RevenueModels = nil
				post.MonthlyRevenue = nil
				post.MonthlyCost = nil
				post.AppealText = nil
				post.TechStack = nil
				post.UserCount = nil
				post.ReleaseDate = nil
				post.OperationForm = nil
				post.OperationEffort = nil
				post.TransferItems = nil
				post.DesiredTransferTiming = nil
				post.GrowthPotential = nil
				post.TargetCustomers = nil
				post.MarketingChannels = nil
				post.MediaMentions = nil
				post.ExtraImageURLs = nil
				post.DashboardURL = nil
				post.UserUIURL = nil
				post.PerformanceURL = nil
			} else {
				// Check NDA agreement
				hasNDA, err := s.checkNDAAgreement(client, currentUserID, post.AuthorUserID, post.AuthorOrgID)
				if err != nil {
					fmt.Printf("[ListPosts] ⚠️ Warning: Failed to check NDA for post %s: %v\n", post.ID, err)
				}
				if !hasNDA {
					// Hide details if NDA not signed
					post.Title = ""
					post.Body = nil
					post.AppCategories = nil
					post.ServiceURLs = nil
					post.RevenueModels = nil
					post.MonthlyRevenue = nil
					post.MonthlyCost = nil
					post.AppealText = nil
					post.TechStack = nil
					post.UserCount = nil
					post.ReleaseDate = nil
					post.OperationForm = nil
					post.OperationEffort = nil
					post.TransferItems = nil
					post.DesiredTransferTiming = nil
					post.GrowthPotential = nil
					post.TargetCustomers = nil
					post.MarketingChannels = nil
					post.MediaMentions = nil
					post.ExtraImageURLs = nil
					post.DashboardURL = nil
					post.UserUIURL = nil
					post.PerformanceURL = nil
					// Hide author profile name for secret posts without NDA
					if profilesMap[post.AuthorUserID] != nil {
						profileCopy := *profilesMap[post.AuthorUserID]
						profileCopy.DisplayName = ""
						profilesMap[post.AuthorUserID] = &profileCopy
					}
				}
			}
		}
		
		result = append(result, models.PostWithDetails{
			Post:            post,
			AuthorProfile:   profilesMap[post.AuthorUserID],
			ActiveViewCount: activeCount,
		})
		if activeCount > 0 {
			fmt.Printf("[ListPosts] Post %s (%s) has %d active views\n", post.ID, post.Title, activeCount)
		}
	}

	// Sort by watch count if sort=recommended
	if sortBy == "recommended" {
		fmt.Printf("[ListPosts] Sorting by watch count (recommended)\n")
		// ウォッチ数でソート（降順）
		sort.Slice(result, func(i, j int) bool {
			watchCountI := watchCountMap[result[i].ID]
			watchCountJ := watchCountMap[result[j].ID]
			if watchCountI != watchCountJ {
				return watchCountI > watchCountJ
			}
			// ウォッチ数が同じ場合は作成日時で比較（新しい順）
			return result[i].CreatedAt.After(result[j].CreatedAt)
		})
		// ソート後に要求されたlimitを適用
		if len(result) > params.Limit {
			result = result[:params.Limit]
		}
	}

	// 空の配列でも正常に返す
	if result == nil {
		result = []models.PostWithDetails{}
	}

	fmt.Printf("[ListPosts] ✅ Returning %d posts with active view counts\n", len(result))
	fmt.Printf("========== LIST POSTS END ==========\n\n")
	response.Success(w, http.StatusOK, result)
}

// GetPost retrieves a single post by ID with details using Supabase
func (s *Server) GetPost(w http.ResponseWriter, r *http.Request, postID string) {
	fmt.Printf("[GET /api/posts/%s] Querying post from Supabase...\n", postID)

	// Get user ID from context if available (for NDA check)
	var currentUserID string
	if userID, ok := r.Context().Value("user_id").(string); ok {
		currentUserID = userID
		fmt.Printf("[GET /api/posts/%s] Current user ID: %s\n", postID, currentUserID)
	}

	// 🔒 SECURITY: Use access token if authenticated, otherwise use Anon Client to enforce RLS
	var client *supabase.Client
	if accessToken, ok := r.Context().Value("access_token").(string); ok && accessToken != "" {
		// Authenticated user - can see more details based on RLS policies
		client = s.supabase.GetAuthenticatedClient(accessToken)
	} else {
		// Unauthenticated user - can only see public posts
		client = s.supabase.GetAnonClient()
	}
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

	// For secret posts, check NDA agreement and return 403 if not signed
	if post.Type == models.PostTypeSecret {
		// If user is not authenticated, return 403
		if currentUserID == "" {
			fmt.Printf("[GET /api/posts/%s] ❌ ERROR: Unauthenticated user trying to access secret post\n", postID)
			http.Error(w, "NDA agreement required", http.StatusForbidden)
			return
		}

		// Check NDA agreement
		hasNDA, err := s.checkNDAAgreement(client, currentUserID, post.AuthorUserID, post.AuthorOrgID)
		if err != nil {
			fmt.Printf("[GET /api/posts/%s] ❌ ERROR: Failed to check NDA: %v\n", postID, err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		if !hasNDA {
			fmt.Printf("[GET /api/posts/%s] ❌ ERROR: User %s does not have NDA agreement for this post\n", postID, currentUserID)
			http.Error(w, "NDA agreement required", http.StatusForbidden)
			return
		}
		fmt.Printf("[GET /api/posts/%s] ✓ User %s has NDA agreement\n", postID, currentUserID)
	}

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

	// Fetch active view count for this post
	activeViewCount := 0
	var activeViews []models.ProductActiveView
	fmt.Printf("[GET /api/posts/%s] Fetching active view count...\n", postID)
	_, err = client.From("product_active_views").
		Select("*", "", false).
		Eq("post_id", postID).
		ExecuteTo(&activeViews)

	if err != nil {
		fmt.Printf("[GET /api/posts/%s] ❌ ERROR: Failed to query active view count: %v\n", postID, err)
	} else {
		activeViewCount = len(activeViews)
		fmt.Printf("[GET /api/posts/%s] ✓ Retrieved %d active view records (count: %d)\n", postID, len(activeViews), activeViewCount)
	}

	response := models.PostWithDetails{
		Post:            post,
		AuthorProfile:   authorProfilePtr,
		ActiveViewCount: activeViewCount,
	}

	fmt.Printf("[GET /api/posts/%s] ✅ Returning post with author profile\n", postID)
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

	// Get access token from context (set by auth middleware)
	accessToken, ok := r.Context().Value("access_token").(string)
	if !ok || accessToken == "" {
		fmt.Printf("[POST /api/posts] ❌ ERROR: Access token not found in context\n")
		fmt.Printf("========== CREATE POST END (FAILED) ==========\n\n")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	fmt.Printf("[POST /api/posts] ✓ Access token found (length: %d)\n", len(accessToken))

	var req models.CreatePostRequest
	fmt.Printf("[POST /api/posts] Decoding request body...\n")
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fmt.Printf("[POST /api/posts] ❌ ERROR: Failed to decode request body: %v\n", err)
		fmt.Printf("========== CREATE POST END (FAILED) ==========\n\n")
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	fmt.Printf("[POST /api/posts] ✓ Request decoded successfully\n")
	bodyLength := 0
	if req.Body != nil {
		bodyLength = len(*req.Body)
	}
	fmt.Printf("[POST /api/posts] Request payload: type=%s, title=%s, body_length=%d\n",
		req.Type, req.Title, bodyLength)

	// Validate request
	fmt.Printf("[POST /api/posts] Validating request...\n")
	if err := utils.ValidateStruct(req); err != nil {
		fmt.Printf("[POST /api/posts] ❌ ERROR: Validation failed: %v\n", err)
		fmt.Printf("========== CREATE POST END (FAILED) ==========\n\n")
		http.Error(w, fmt.Sprintf("Validation error: %v", err), http.StatusBadRequest)
		return
	}

	// 🔒 SECURITY: 入力値をサニタイズ（XSS、インジェクション攻撃防止）
	titleResult := utils.SanitizeText(utils.SanitizeInput{
		Value:      req.Title,
		MaxLength:  utils.MaxTitleLength,
		AllowHTML:  false,
		StrictMode: true,
	})
	if !titleResult.IsValid {
		fmt.Printf("[POST /api/posts] ❌ WARNING: Title contains potentially malicious content: %v\n", titleResult.Errors)
	}
	req.Title = titleResult.Sanitized

	if req.Body != nil {
		bodyResult := utils.SanitizeRichText(*req.Body, utils.MaxDescriptionLength)
		if !bodyResult.IsValid {
			fmt.Printf("[POST /api/posts] ❌ WARNING: Body contains potentially malicious content: %v\n", bodyResult.Errors)
		}
		sanitizedBody := bodyResult.Sanitized
		req.Body = &sanitizedBody
	}

	if req.AppealText != nil {
		appealResult := utils.SanitizeText(utils.SanitizeInput{
			Value:      *req.AppealText,
			MaxLength:  utils.MaxDescriptionLength,
			AllowHTML:  false,
			StrictMode: false,
		})
		if !appealResult.IsValid {
			fmt.Printf("[POST /api/posts] ❌ WARNING: Appeal text contains potentially malicious content: %v\n", appealResult.Errors)
		}
		sanitizedAppeal := appealResult.Sanitized
		req.AppealText = &sanitizedAppeal
	}

	// URLのサニタイゼーション
	if req.EyecatchURL != nil {
		eyecatchResult := utils.SanitizeURL(*req.EyecatchURL)
		if !eyecatchResult.IsValid {
			fmt.Printf("[POST /api/posts] ❌ ERROR: Invalid eyecatch URL: %v\n", eyecatchResult.Errors)
			http.Error(w, "Invalid eyecatch URL", http.StatusBadRequest)
			return
		}
		req.EyecatchURL = &eyecatchResult.Sanitized
	}

	if req.DashboardURL != nil {
		dashboardResult := utils.SanitizeURL(*req.DashboardURL)
		if !dashboardResult.IsValid {
			fmt.Printf("[POST /api/posts] ❌ ERROR: Invalid dashboard URL: %v\n", dashboardResult.Errors)
			http.Error(w, "Invalid dashboard URL", http.StatusBadRequest)
			return
		}
		req.DashboardURL = &dashboardResult.Sanitized
	}
	
	// Additional validation for transaction type
	if req.Type == models.PostTypeTransaction {
		fmt.Printf("[POST /api/posts] Validating transaction-specific fields...\n")
		
		if req.Price == nil || *req.Price <= 0 {
			fmt.Printf("[POST /api/posts] ❌ ERROR: Price is required for transaction posts\n")
			fmt.Printf("========== CREATE POST END (FAILED) ==========\n\n")
			http.Error(w, "Price is required for transaction posts", http.StatusBadRequest)
			return
		}
		
		if len(req.AppCategories) == 0 {
			fmt.Printf("[POST /api/posts] ❌ ERROR: At least one app category is required for transaction posts\n")
			fmt.Printf("========== CREATE POST END (FAILED) ==========\n\n")
			http.Error(w, "At least one app category is required for transaction posts", http.StatusBadRequest)
			return
		}
		
		if req.MonthlyRevenue == nil || *req.MonthlyRevenue < 0 {
			fmt.Printf("[POST /api/posts] ❌ ERROR: Monthly revenue is required for transaction posts\n")
			fmt.Printf("========== CREATE POST END (FAILED) ==========\n\n")
			http.Error(w, "Monthly revenue is required for transaction posts", http.StatusBadRequest)
			return
		}
		
		if req.MonthlyCost == nil || *req.MonthlyCost < 0 {
			fmt.Printf("[POST /api/posts] ❌ ERROR: Monthly cost is required for transaction posts\n")
			fmt.Printf("========== CREATE POST END (FAILED) ==========\n\n")
			http.Error(w, "Monthly cost is required for transaction posts", http.StatusBadRequest)
			return
		}
		
		if req.AppealText == nil || len(*req.AppealText) < 50 {
			fmt.Printf("[POST /api/posts] ❌ ERROR: Appeal text must be at least 50 characters for transaction posts\n")
			fmt.Printf("========== CREATE POST END (FAILED) ==========\n\n")
			http.Error(w, "Appeal text must be at least 50 characters for transaction posts", http.StatusBadRequest)
			return
		}
		
		if req.EyecatchURL == nil || *req.EyecatchURL == "" {
			fmt.Printf("[POST /api/posts] ❌ ERROR: Eyecatch URL is required for transaction posts\n")
			fmt.Printf("========== CREATE POST END (FAILED) ==========\n\n")
			http.Error(w, "Eyecatch URL is required for transaction posts", http.StatusBadRequest)
			return
		}
		
		if req.DashboardURL == nil || *req.DashboardURL == "" {
			fmt.Printf("[POST /api/posts] ❌ ERROR: Dashboard URL is required for transaction posts\n")
			fmt.Printf("========== CREATE POST END (FAILED) ==========\n\n")
			http.Error(w, "Dashboard URL is required for transaction posts", http.StatusBadRequest)
			return
		}
		
		if req.UserUIURL == nil || *req.UserUIURL == "" {
			fmt.Printf("[POST /api/posts] ❌ ERROR: User UI URL is required for transaction posts\n")
			fmt.Printf("========== CREATE POST END (FAILED) ==========\n\n")
			http.Error(w, "User UI URL is required for transaction posts", http.StatusBadRequest)
			return
		}
		
		if req.PerformanceURL == nil || *req.PerformanceURL == "" {
			fmt.Printf("[POST /api/posts] ❌ ERROR: Performance URL is required for transaction posts\n")
			fmt.Printf("========== CREATE POST END (FAILED) ==========\n\n")
			http.Error(w, "Performance URL is required for transaction posts", http.StatusBadRequest)
			return
		}
		
		fmt.Printf("[POST /api/posts] ✓ Transaction validation passed\n")
	}
	
	fmt.Printf("[POST /api/posts] ✓ Validation passed\n")

	// Create a new Supabase client with access token (for RLS)
	fmt.Printf("[POST /api/posts] Creating Supabase client with access token...\n")
	authClient := s.supabase.GetAuthenticatedClient(accessToken)
	fmt.Printf("[POST /api/posts] ✓ Supabase client created\n")

	// Get user's organization if they have one
	fmt.Printf("[POST /api/posts] Querying user organization...\n")
	type OrgMembership struct {
		OrgID string `json:"org_id"`
	}
	var orgMemberships []OrgMembership
	var authorOrgID *string

	_, err := authClient.From("org_memberships").
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
		"author_user_id":           userID,
		"author_org_id":            authorOrgID,
		"type":                     req.Type,
		"title":                    req.Title,
		"body":                     req.Body,
		"price":                    req.Price,
		"secret_visibility":        req.SecretVisibility,
		"is_active":                true,
		"eyecatch_url":             req.EyecatchURL,
		"dashboard_url":            req.DashboardURL,
		"user_ui_url":              req.UserUIURL,
		"performance_url":          req.PerformanceURL,
		"app_categories":           req.AppCategories,
		"service_urls":             req.ServiceURLs,
		"revenue_models":           req.RevenueModels,
		"monthly_revenue":          req.MonthlyRevenue,
		"monthly_cost":             req.MonthlyCost,
		"appeal_text":              req.AppealText,
		"tech_stack":               req.TechStack,
		"user_count":               req.UserCount,
		"release_date":             req.ReleaseDate,
		"operation_form":           req.OperationForm,
		"operation_effort":         req.OperationEffort,
		"transfer_items":           req.TransferItems,
		"desired_transfer_timing":  req.DesiredTransferTiming,
		"growth_potential":         req.GrowthPotential,
		"target_customers":         req.TargetCustomers,
		"marketing_channels":       req.MarketingChannels,
		"media_mentions":           req.MediaMentions,
		"extra_image_urls":         req.ExtraImageURLs,
	}

	// Add subscribe field only if it's not nil
	if req.Subscribe != nil {
		postData["subscribe"] = req.Subscribe
	}

	// Insert post with access token (RLS will automatically check permissions)
	fmt.Printf("[POST /api/posts] Inserting post into database...\n")
	fmt.Printf("[POST /api/posts] Post data: %+v\n", postData)
	var createdPosts []models.Post
	_, err = authClient.From("posts").
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
	// Get user ID and access token from context
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	accessToken, ok := r.Context().Value("access_token").(string)
	if !ok || accessToken == "" {
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

	// Use authenticated client (RLS will check permissions automatically)
	client := s.supabase.GetAuthenticatedClient(accessToken)

	// Check if post exists and get its type
	type PostInfo struct {
		AuthorUserID string           `json:"author_user_id"`
		Type         models.PostType  `json:"type"`
	}
	var postsInfo []PostInfo
	_, err := client.From("posts").
		Select("author_user_id, type", "", false).
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
	if req.Price != nil {
		postUpdateData["price"] = *req.Price
	}
	if req.SecretVisibility != nil {
		postUpdateData["secret_visibility"] = *req.SecretVisibility
	}
	if req.IsActive != nil {
		postUpdateData["is_active"] = *req.IsActive
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
	if req.Subscribe != nil {
		postUpdateData["subscribe"] = *req.Subscribe
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
	// Get user ID and access token from context
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	accessToken, ok := r.Context().Value("access_token").(string)
	if !ok || accessToken == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Use authenticated client (RLS will check permissions automatically)
	client := s.supabase.GetAuthenticatedClient(accessToken)

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

// HandlePostLikes handles GET (status) and POST (toggle) for post likes
func (s *Server) HandlePostLikes(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 4 || parts[3] != "likes" {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	postID := parts[2]
	switch r.Method {
	case http.MethodGet:
		s.GetPostLikes(w, r, postID)
	case http.MethodPost:
		s.TogglePostLike(w, r, postID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// HandlePostDislikes handles GET (status) and POST (toggle) for post dislikes
func (s *Server) HandlePostDislikes(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 4 || parts[3] != "dislikes" {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	postID := parts[2]
	switch r.Method {
	case http.MethodGet:
		s.GetPostDislikes(w, r, postID)
	case http.MethodPost:
		s.TogglePostDislike(w, r, postID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// GetPostLikes returns like count and whether current user liked the post
func (s *Server) GetPostLikes(w http.ResponseWriter, r *http.Request, postID string) {
	userID, _ := r.Context().Value("user_id").(string)

	// 🔒 SECURITY: Use access token if authenticated, otherwise use Anon Client to enforce RLS
	var client *supabase.Client
	if accessToken, ok := r.Context().Value("access_token").(string); ok && accessToken != "" {
		client = s.supabase.GetAuthenticatedClient(accessToken)
	} else {
		client = s.supabase.GetAnonClient()
	}

	type Row struct {
		PostID string `json:"post_id"`
		UserID string `json:"user_id"`
	}
	var rows []Row
	_, err := client.From("post_likes").
		Select("post_id, user_id", "", false).
		Eq("post_id", postID).
		ExecuteTo(&rows)
	if err != nil {
		http.Error(w, "Failed to fetch likes", http.StatusInternalServerError)
		return
	}

	// クライアント側で集計
	likeCount := len(rows)
	isLiked := false
	if userID != "" {
		for _, row := range rows {
			if row.UserID == userID {
				isLiked = true
				break
			}
		}
	}

	result := map[string]interface{}{
		"post_id":    postID,
		"like_count": likeCount,
		"is_liked":   isLiked,
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

// TogglePostLike toggles like for the current user
func (s *Server) TogglePostLike(w http.ResponseWriter, r *http.Request, postID string) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	accessToken, ok := r.Context().Value("access_token").(string)
	if !ok || accessToken == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	client := s.supabase.GetAuthenticatedClient(accessToken)

	// Check existing
	type Row struct {
		PostID string `json:"post_id"`
		UserID string `json:"user_id"`
	}
	var existing []Row
	_, err := client.From("post_likes").
		Select("post_id, user_id", "", false).
		Eq("post_id", postID).
		Eq("user_id", userID).
		Limit(1, "").
		ExecuteTo(&existing)
	if err == nil && len(existing) > 0 {
		// Unlike
		_, _, err = client.From("post_likes").
			Delete("", "").
			Eq("post_id", postID).
			Eq("user_id", userID).
			Execute()
		if err != nil {
			http.Error(w, "Failed to unlike post", http.StatusInternalServerError)
			return
		}
	} else {
		// Like
		data := map[string]interface{}{
			"post_id": postID,
			"user_id": userID,
		}
		_, _, err = client.From("post_likes").
			Insert(data, false, "", "", "").
			Execute()
		if err != nil {
			http.Error(w, "Failed to like post", http.StatusInternalServerError)
			return
		}
	}
	s.GetPostLikes(w, r, postID)
}

// GetPostDislikes returns dislike count and whether current user disliked the post
func (s *Server) GetPostDislikes(w http.ResponseWriter, r *http.Request, postID string) {
	userID, _ := r.Context().Value("user_id").(string)

	// 🔒 SECURITY: Use access token if authenticated, otherwise use Anon Client to enforce RLS
	var client *supabase.Client
	if accessToken, ok := r.Context().Value("access_token").(string); ok && accessToken != "" {
		client = s.supabase.GetAuthenticatedClient(accessToken)
	} else {
		client = s.supabase.GetAnonClient()
	}

	type Row struct {
		PostID string `json:"post_id"`
		UserID string `json:"user_id"`
	}
	var rows []Row
	_, err := client.From("post_dislikes").
		Select("post_id, user_id", "", false).
		Eq("post_id", postID).
		ExecuteTo(&rows)
	if err != nil {
		http.Error(w, "Failed to fetch dislikes", http.StatusInternalServerError)
		return
	}

	// クライアント側で集計
	count := len(rows)
	isDisliked := false
	if userID != "" {
		for _, row := range rows {
			if row.UserID == userID {
				isDisliked = true
				break
			}
		}
	}

	result := map[string]interface{}{
		"post_id":       postID,
		"dislike_count": count,
		"is_disliked":   isDisliked,
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

// TogglePostDislike toggles dislike for the current user
func (s *Server) TogglePostDislike(w http.ResponseWriter, r *http.Request, postID string) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	accessToken, ok := r.Context().Value("access_token").(string)
	if !ok || accessToken == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	client := s.supabase.GetAuthenticatedClient(accessToken)

	// Check existing
	type Row struct {
		PostID string `json:"post_id"`
		UserID string `json:"user_id"`
	}
	var existing []Row
	_, err := client.From("post_dislikes").
		Select("post_id, user_id", "", false).
		Eq("post_id", postID).
		Eq("user_id", userID).
		Limit(1, "").
		ExecuteTo(&existing)
	if err == nil && len(existing) > 0 {
		// Remove
		_, _, err = client.From("post_dislikes").
			Delete("", "").
			Eq("post_id", postID).
			Eq("user_id", userID).
			Execute()
		if err != nil {
			http.Error(w, "Failed to remove dislike", http.StatusInternalServerError)
			return
		}
	} else {
		// Add
		data := map[string]interface{}{
			"post_id": postID,
			"user_id": userID,
		}
		_, _, err = client.From("post_dislikes").
			Insert(data, false, "", "", "").
			Execute()
		if err != nil {
			http.Error(w, "Failed to add dislike", http.StatusInternalServerError)
			return
		}
	}
	s.GetPostDislikes(w, r, postID)
}

// GetPostsMetadata returns metadata (likes, dislikes, comment counts) for multiple posts
// Expected query parameter: post_ids[] (can be repeated multiple times)
// Example: /api/posts/metadata?post_ids[]=id1&post_ids[]=id2&post_ids[]=id3
func (s *Server) GetPostsMetadata(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, _ := r.Context().Value("user_id").(string)

	// 🔒 SECURITY: Use access token if authenticated, otherwise use Anon Client to enforce RLS
	var client *supabase.Client
	if accessToken, ok := r.Context().Value("access_token").(string); ok && accessToken != "" {
		client = s.supabase.GetAuthenticatedClient(accessToken)
	} else {
		client = s.supabase.GetAnonClient()
	}

	// Parse post IDs from query parameters
	postIDs := r.URL.Query()["post_ids[]"]
	if len(postIDs) == 0 {
		http.Error(w, "No post IDs provided", http.StatusBadRequest)
		return
	}

	// Prepare result structure
	type PostMetadata struct {
		PostID       string `json:"post_id"`
		LikeCount    int    `json:"like_count"`
		IsLiked      bool   `json:"is_liked"`
		DislikeCount int    `json:"dislike_count"`
		IsDisliked   bool   `json:"is_disliked"`
		CommentCount int    `json:"comment_count"`
	}

	// Fetch all likes for the requested posts
	type LikeRow struct {
		PostID string `json:"post_id"`
		UserID string `json:"user_id"`
	}
	var likeRows []LikeRow
	_, err := client.From("post_likes").
		Select("post_id, user_id", "", false).
		In("post_id", postIDs).
		ExecuteTo(&likeRows)
	if err != nil {
		http.Error(w, "Failed to fetch likes", http.StatusInternalServerError)
		return
	}

	// Fetch all dislikes for the requested posts
	type DislikeRow struct {
		PostID string `json:"post_id"`
		UserID string `json:"user_id"`
	}
	var dislikeRows []DislikeRow
	_, err = client.From("post_dislikes").
		Select("post_id, user_id", "", false).
		In("post_id", postIDs).
		ExecuteTo(&dislikeRows)
	if err != nil {
		http.Error(w, "Failed to fetch dislikes", http.StatusInternalServerError)
		return
	}

	// Fetch all comment counts for the requested posts
	type CommentRow struct {
		PostID string `json:"post_id"`
	}
	var commentRows []CommentRow
	_, err = client.From("post_comments").
		Select("post_id", "", false).
		In("post_id", postIDs).
		ExecuteTo(&commentRows)
	if err != nil {
		http.Error(w, "Failed to fetch comments", http.StatusInternalServerError)
		return
	}

	// Build metadata map
	metadataMap := make(map[string]*PostMetadata)
	for _, postID := range postIDs {
		metadataMap[postID] = &PostMetadata{
			PostID:       postID,
			LikeCount:    0,
			IsLiked:      false,
			DislikeCount: 0,
			IsDisliked:   false,
			CommentCount: 0,
		}
	}

	// Aggregate likes
	for _, like := range likeRows {
		if meta, ok := metadataMap[like.PostID]; ok {
			meta.LikeCount++
			if userID != "" && like.UserID == userID {
				meta.IsLiked = true
			}
		}
	}

	// Aggregate dislikes
	for _, dislike := range dislikeRows {
		if meta, ok := metadataMap[dislike.PostID]; ok {
			meta.DislikeCount++
			if userID != "" && dislike.UserID == userID {
				meta.IsDisliked = true
			}
		}
	}

	// Aggregate comments
	for _, comment := range commentRows {
		if meta, ok := metadataMap[comment.PostID]; ok {
			meta.CommentCount++
		}
	}

	// Convert map to slice
	var result []PostMetadata
	for _, meta := range metadataMap {
		result = append(result, *meta)
	}

	response.Success(w, http.StatusOK, result)
}

// BoardSidebarData represents the sidebar data for board posts
type BoardSidebarData struct {
	Stats struct {
		TotalPosts    int    `json:"total_posts"`
		UniqueAuthors int    `json:"unique_authors"`
		FirstPostDate string `json:"first_post_date"`
		TotalComments int    `json:"total_comments"`
	} `json:"stats"`
	PopularPosts []struct {
		ID        string `json:"id"`
		Title     string `json:"title"`
		LikeCount int    `json:"like_count"`
	} `json:"popular_posts"`
	RecentPosts []struct {
		ID        string `json:"id"`
		Title     string `json:"title"`
		CreatedAt string `json:"created_at"`
	} `json:"recent_posts"`
}

// HandleBoardSidebar returns sidebar data for board posts
func (s *Server) HandleBoardSidebar(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	fmt.Printf("\n========== BOARD SIDEBAR START ==========\n")

	// 🔒 SECURITY: Use access token if authenticated, otherwise use Anon Client to enforce RLS
	var client *supabase.Client
	if accessToken, ok := r.Context().Value("access_token").(string); ok && accessToken != "" {
		client = s.supabase.GetAuthenticatedClient(accessToken)
	} else {
		client = s.supabase.GetAnonClient()
	}

	// Get all board posts
	var boardPosts []models.Post
	_, err := client.From("posts").
		Select("id, title, created_at, author_user_id", "", false).
		Eq("type", "board").
		Eq("is_active", "true").
		ExecuteTo(&boardPosts)

	if err != nil {
		fmt.Printf("[HandleBoardSidebar] ERROR: Failed to query posts: %v\n", err)
		response.Error(w, http.StatusInternalServerError, "Failed to fetch sidebar data")
		return
	}

	var result BoardSidebarData

	// Calculate stats
	result.Stats.TotalPosts = len(boardPosts)

	// Get unique authors
	authorMap := make(map[string]bool)
	for _, post := range boardPosts {
		authorMap[post.AuthorUserID] = true
	}
	result.Stats.UniqueAuthors = len(authorMap)

	// Get first post date
	if len(boardPosts) > 0 {
		firstPost := boardPosts[0]
		for _, post := range boardPosts {
			if post.CreatedAt.Before(firstPost.CreatedAt) {
				firstPost = post
			}
		}
		result.Stats.FirstPostDate = firstPost.CreatedAt.Format(time.RFC3339)
	}

	// Get comment count
	boardPostIDs := make([]string, len(boardPosts))
	for i, post := range boardPosts {
		boardPostIDs[i] = post.ID
	}

	var commentRows []struct {
		PostID string `json:"post_id"`
	}
	if len(boardPostIDs) > 0 {
		_, err = client.From("post_comments").
			Select("post_id", "", false).
			In("post_id", boardPostIDs).
			ExecuteTo(&commentRows)
		if err != nil {
			fmt.Printf("[HandleBoardSidebar] WARNING: Failed to query comments: %v\n", err)
		} else {
			result.Stats.TotalComments = len(commentRows)
		}
	}

	// Get like counts for all posts
	postLikeCounts := make(map[string]int)

	if len(boardPostIDs) > 0 {
		var likeRows []struct {
			PostID string `json:"post_id"`
		}
		_, err = client.From("post_likes").
			Select("post_id", "", false).
			In("post_id", boardPostIDs).
			ExecuteTo(&likeRows)
		if err != nil {
			fmt.Printf("[HandleBoardSidebar] WARNING: Failed to query likes: %v\n", err)
		} else {
			for _, like := range likeRows {
				postLikeCounts[like.PostID]++
			}
		}
	}

	// Build popular posts (top 5 by like count)
	type PopularPost struct {
		ID        string
		Title     string
		LikeCount int
	}
	popularPostsList := make([]PopularPost, 0, len(boardPosts))
	for _, post := range boardPosts {
		popularPostsList = append(popularPostsList, PopularPost{
			ID:        post.ID,
			Title:     post.Title,
			LikeCount: postLikeCounts[post.ID],
		})
	}

	// Sort by like count (descending)
	for i := 0; i < len(popularPostsList)-1; i++ {
		for j := i + 1; j < len(popularPostsList); j++ {
			if popularPostsList[i].LikeCount < popularPostsList[j].LikeCount {
				popularPostsList[i], popularPostsList[j] = popularPostsList[j], popularPostsList[i]
			}
		}
	}

	// Take top 5
	if len(popularPostsList) > 5 {
		popularPostsList = popularPostsList[:5]
	}

	result.PopularPosts = make([]struct {
		ID        string `json:"id"`
		Title     string `json:"title"`
		LikeCount int    `json:"like_count"`
	}, len(popularPostsList))
	for i, pp := range popularPostsList {
		result.PopularPosts[i].ID = pp.ID
		result.PopularPosts[i].Title = pp.Title
		result.PopularPosts[i].LikeCount = pp.LikeCount
	}

	// Get recent posts (top 5 by created_at)
	type RecentPost struct {
		ID        string
		Title     string
		CreatedAt time.Time
	}
	recentPostsList := make([]RecentPost, 0, len(boardPosts))
	for _, post := range boardPosts {
		recentPostsList = append(recentPostsList, RecentPost{
			ID:        post.ID,
			Title:     post.Title,
			CreatedAt: post.CreatedAt,
		})
	}

	// Sort by created_at (descending)
	for i := 0; i < len(recentPostsList)-1; i++ {
		for j := i + 1; j < len(recentPostsList); j++ {
			if recentPostsList[i].CreatedAt.Before(recentPostsList[j].CreatedAt) {
				recentPostsList[i], recentPostsList[j] = recentPostsList[j], recentPostsList[i]
			}
		}
	}

	// Take top 5
	if len(recentPostsList) > 5 {
		recentPostsList = recentPostsList[:5]
	}

	result.RecentPosts = make([]struct {
		ID        string `json:"id"`
		Title     string `json:"title"`
		CreatedAt string `json:"created_at"`
	}, len(recentPostsList))
	for i, rp := range recentPostsList {
		result.RecentPosts[i].ID = rp.ID
		result.RecentPosts[i].Title = rp.Title
		result.RecentPosts[i].CreatedAt = rp.CreatedAt.Format(time.RFC3339)
	}

	fmt.Printf("[HandleBoardSidebar] ✅ Returning sidebar data\n")
	fmt.Printf("========== BOARD SIDEBAR END ==========\n\n")
	response.Success(w, http.StatusOK, result)
}
