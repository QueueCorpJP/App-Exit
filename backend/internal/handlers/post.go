package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/supabase-community/supabase-go"
	"github.com/yourusername/appexit-backend/internal/models"
	"github.com/yourusername/appexit-backend/internal/utils"
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

// ListPosts retrieves a list of posts with optional filters
func (s *Server) ListPosts(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	// Build query parameters
	params := models.PostQueryParams{
		Limit:  20, // Default limit
		Offset: 0,
	}

	if postType := query.Get("type"); postType != "" {
		pt := models.PostType(postType)
		params.Type = &pt
	}
	if authorUserID := query.Get("author_user_id"); authorUserID != "" {
		params.AuthorUserID = &authorUserID
	}
	if authorOrgID := query.Get("author_org_id"); authorOrgID != "" {
		params.AuthorOrgID = &authorOrgID
	}
	if isActiveStr := query.Get("is_active"); isActiveStr != "" {
		isActive := isActiveStr == "true"
		params.IsActive = &isActive
	}
	if limitStr := query.Get("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 {
			params.Limit = limit
		}
	}
	if offsetStr := query.Get("offset"); offsetStr != "" {
		if offset, err := strconv.Atoi(offsetStr); err == nil && offset >= 0 {
			params.Offset = offset
		}
	}

	// Build SQL query
	sqlQuery := `SELECT id, author_user_id, author_org_id, type, title, body,
	                   cover_image_url, budget_min, budget_max, price,
	                   secret_visibility, is_active, created_at, updated_at
	            FROM posts WHERE 1=1`
	args := []interface{}{}
	argIdx := 1

	if params.Type != nil {
		sqlQuery += fmt.Sprintf(" AND type = $%d", argIdx)
		args = append(args, *params.Type)
		argIdx++
	}
	if params.AuthorUserID != nil {
		sqlQuery += fmt.Sprintf(" AND author_user_id = $%d", argIdx)
		args = append(args, *params.AuthorUserID)
		argIdx++
	}
	if params.AuthorOrgID != nil {
		sqlQuery += fmt.Sprintf(" AND author_org_id = $%d", argIdx)
		args = append(args, *params.AuthorOrgID)
		argIdx++
	}
	if params.IsActive != nil {
		sqlQuery += fmt.Sprintf(" AND is_active = $%d", argIdx)
		args = append(args, *params.IsActive)
		argIdx++
	}

	sqlQuery += " ORDER BY created_at DESC"
	sqlQuery += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, params.Limit, params.Offset)

	rows, err := s.db.Query(sqlQuery, args...)
	if err != nil {
		http.Error(w, "Failed to query posts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	posts := []models.Post{}
	for rows.Next() {
		var post models.Post
		err := rows.Scan(
			&post.ID, &post.AuthorUserID, &post.AuthorOrgID, &post.Type,
			&post.Title, &post.Body, &post.CoverImageURL,
			&post.BudgetMin, &post.BudgetMax, &post.Price,
			&post.SecretVisibility, &post.IsActive,
			&post.CreatedAt, &post.UpdatedAt,
		)
		if err != nil {
			http.Error(w, "Failed to scan post", http.StatusInternalServerError)
			return
		}
		posts = append(posts, post)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

// GetPost retrieves a single post by ID with details using Supabase
func (s *Server) GetPost(w http.ResponseWriter, r *http.Request, postID string) {
	// Try to get user token if available (for RLS)
	authHeader := r.Header.Get("Authorization")
	userToken := strings.TrimPrefix(authHeader, "Bearer ")

	var client *supabase.Client
	var err error
	if userToken != "" {
		client, err = s.supabase.GetClientWithToken(s.config, userToken)
		if err != nil {
			client = s.supabase.GetAnonClient()
		}
	} else {
		client = s.supabase.GetAnonClient()
	}

	// Get post
	fmt.Printf("[GET /api/posts/%s] Querying post from database...\n", postID)
	var post models.Post
	_, err = client.From("posts").
		Select("*", "", false).
		Eq("id", postID).
		Single().
		ExecuteTo(&post)

	if err != nil {
		fmt.Printf("[GET /api/posts/%s] ❌ ERROR: Failed to query post: %v\n", postID, err)
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	fmt.Printf("[GET /api/posts/%s] ✓ Post found: %s\n", postID, post.Title)

	// Get post details if it's a transaction or secret post
	var details *models.PostDetail
	if post.Type == models.PostTypeTransaction || post.Type == models.PostTypeSecret {
		fmt.Printf("[GET /api/posts/%s] Querying post details...\n", postID)
		var postDetail models.PostDetail
		_, err := client.From("post_details").
			Select("*", "", false).
			Eq("post_id", postID).
			Single().
			ExecuteTo(&postDetail)

		if err != nil {
			fmt.Printf("[GET /api/posts/%s] ⚠️ Warning: Failed to query post details: %v\n", postID, err)
			// Continue without details
		} else {
			details = &postDetail
			fmt.Printf("[GET /api/posts/%s] ✓ Post details found\n", postID)
		}
	}

	response := models.PostWithDetails{
		Post:    post,
		Details: details,
	}

	fmt.Printf("[GET /api/posts/%s] ✅ Returning post with details\n", postID)
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
		"author_user_id": userID,
		"author_org_id":  authorOrgID,
		"type":           req.Type,
		"title":          req.Title,
		"body":           req.Body,
		"cover_image_url": req.CoverImageURL,
		"budget_min":     req.BudgetMin,
		"budget_max":     req.BudgetMax,
		"price":          req.Price,
		"secret_visibility": req.SecretVisibility,
		"is_active":      true,
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

	// Insert post details if it's a transaction or secret post
	if req.Type == models.PostTypeTransaction || req.Type == models.PostTypeSecret {
		fmt.Printf("[POST /api/posts] Inserting post details for type: %s\n", req.Type)

		detailsData := map[string]interface{}{
			"post_id":         postID,
			"app_name":        req.AppName,
			"app_category":    req.AppCategory,
			"monthly_revenue": req.MonthlyRevenue,
			"monthly_profit":  req.MonthlyProfit,
			"mau":             req.MAU,
			"dau":             req.DAU,
			"store_url":       req.StoreURL,
			"tech_stack":      req.TechStack,
			"notes":           req.Notes,
		}

		fmt.Printf("[POST /api/posts] Post details data: %+v\n", detailsData)

		var createdDetails []models.PostDetail
		_, err = impersonateClient.From("post_details").
			Insert(detailsData, false, "", "", "").
			ExecuteTo(&createdDetails)

		if err != nil {
			fmt.Printf("[POST /api/posts] ❌ ERROR: Failed to insert post details: %v\n", err)
			fmt.Printf("[POST /api/posts] Rolling back: Deleting post ID: %s\n", postID)
			// Try to delete the post
			impersonateClient.From("posts").Delete("", "").Eq("id", postID).Execute()
			fmt.Printf("========== CREATE POST END (FAILED) ==========\n\n")
			http.Error(w, "Failed to create post details", http.StatusInternalServerError)
			return
		}
		fmt.Printf("[POST /api/posts] ✓ Post details inserted successfully\n")
	}

	// Retrieve the created post with details
	fmt.Printf("[POST /api/posts] Retrieving created post with ID: %s\n", postID)
	s.GetPost(w, r, postID)
	fmt.Printf("[POST /api/posts] ✅ CreatePost completed successfully\n")
	fmt.Printf("========== CREATE POST END (SUCCESS) ==========\n\n")
}

// UpdatePost updates an existing post
func (s *Server) UpdatePost(w http.ResponseWriter, r *http.Request, postID string) {
	// Get user ID from context
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
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

	// Check if post exists and user is the author
	var authorUserID string
	var postType models.PostType
	err := s.db.QueryRow(`
		SELECT author_user_id, type FROM posts WHERE id = $1
	`, postID).Scan(&authorUserID, &postType)

	if err == sql.ErrNoRows {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Failed to query post", http.StatusInternalServerError)
		return
	}
	if authorUserID != userID {
		http.Error(w, "Forbidden: You are not the author of this post", http.StatusForbidden)
		return
	}

	// Start transaction
	tx, err := s.db.Begin()
	if err != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Build update query dynamically
	updates := []string{}
	args := []interface{}{}
	argIdx := 1

	if req.Title != nil {
		updates = append(updates, fmt.Sprintf("title = $%d", argIdx))
		args = append(args, *req.Title)
		argIdx++
	}
	if req.Body != nil {
		updates = append(updates, fmt.Sprintf("body = $%d", argIdx))
		args = append(args, *req.Body)
		argIdx++
	}
	if req.CoverImageURL != nil {
		updates = append(updates, fmt.Sprintf("cover_image_url = $%d", argIdx))
		args = append(args, *req.CoverImageURL)
		argIdx++
	}
	if req.BudgetMin != nil {
		updates = append(updates, fmt.Sprintf("budget_min = $%d", argIdx))
		args = append(args, *req.BudgetMin)
		argIdx++
	}
	if req.BudgetMax != nil {
		updates = append(updates, fmt.Sprintf("budget_max = $%d", argIdx))
		args = append(args, *req.BudgetMax)
		argIdx++
	}
	if req.Price != nil {
		updates = append(updates, fmt.Sprintf("price = $%d", argIdx))
		args = append(args, *req.Price)
		argIdx++
	}
	if req.SecretVisibility != nil {
		updates = append(updates, fmt.Sprintf("secret_visibility = $%d", argIdx))
		args = append(args, *req.SecretVisibility)
		argIdx++
	}
	if req.IsActive != nil {
		updates = append(updates, fmt.Sprintf("is_active = $%d", argIdx))
		args = append(args, *req.IsActive)
		argIdx++
	}

	if len(updates) > 0 {
		updates = append(updates, "updated_at = NOW()")
		args = append(args, postID)
		query := fmt.Sprintf("UPDATE posts SET %s WHERE id = $%d", strings.Join(updates, ", "), argIdx)
		_, err = tx.Exec(query, args...)
		if err != nil {
			http.Error(w, "Failed to update post", http.StatusInternalServerError)
			return
		}
	}

	// Update post details if it's a transaction or secret post
	if postType == models.PostTypeTransaction || postType == models.PostTypeSecret {
		detailUpdates := []string{}
		detailArgs := []interface{}{}
		detailArgIdx := 1

		if req.AppName != nil {
			detailUpdates = append(detailUpdates, fmt.Sprintf("app_name = $%d", detailArgIdx))
			detailArgs = append(detailArgs, *req.AppName)
			detailArgIdx++
		}
		if req.AppCategory != nil {
			detailUpdates = append(detailUpdates, fmt.Sprintf("app_category = $%d", detailArgIdx))
			detailArgs = append(detailArgs, *req.AppCategory)
			detailArgIdx++
		}
		if req.MonthlyRevenue != nil {
			detailUpdates = append(detailUpdates, fmt.Sprintf("monthly_revenue = $%d", detailArgIdx))
			detailArgs = append(detailArgs, *req.MonthlyRevenue)
			detailArgIdx++
		}
		if req.MonthlyProfit != nil {
			detailUpdates = append(detailUpdates, fmt.Sprintf("monthly_profit = $%d", detailArgIdx))
			detailArgs = append(detailArgs, *req.MonthlyProfit)
			detailArgIdx++
		}
		if req.MAU != nil {
			detailUpdates = append(detailUpdates, fmt.Sprintf("mau = $%d", detailArgIdx))
			detailArgs = append(detailArgs, *req.MAU)
			detailArgIdx++
		}
		if req.DAU != nil {
			detailUpdates = append(detailUpdates, fmt.Sprintf("dau = $%d", detailArgIdx))
			detailArgs = append(detailArgs, *req.DAU)
			detailArgIdx++
		}
		if req.StoreURL != nil {
			detailUpdates = append(detailUpdates, fmt.Sprintf("store_url = $%d", detailArgIdx))
			detailArgs = append(detailArgs, *req.StoreURL)
			detailArgIdx++
		}
		if req.TechStack != nil {
			detailUpdates = append(detailUpdates, fmt.Sprintf("tech_stack = $%d", detailArgIdx))
			detailArgs = append(detailArgs, *req.TechStack)
			detailArgIdx++
		}
		if req.Notes != nil {
			detailUpdates = append(detailUpdates, fmt.Sprintf("notes = $%d", detailArgIdx))
			detailArgs = append(detailArgs, *req.Notes)
			detailArgIdx++
		}

		if len(detailUpdates) > 0 {
			detailArgs = append(detailArgs, postID)
			detailQuery := fmt.Sprintf("UPDATE post_details SET %s WHERE post_id = $%d",
				strings.Join(detailUpdates, ", "), detailArgIdx)
			_, err = tx.Exec(detailQuery, detailArgs...)
			if err != nil {
				http.Error(w, "Failed to update post details", http.StatusInternalServerError)
				return
			}
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	// Return updated post
	s.GetPost(w, r, postID)
}

// DeletePost deletes a post (soft delete by setting is_active to false)
func (s *Server) DeletePost(w http.ResponseWriter, r *http.Request, postID string) {
	// Get user ID from context
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Check if post exists and user is the author
	var authorUserID string
	err := s.db.QueryRow(`
		SELECT author_user_id FROM posts WHERE id = $1
	`, postID).Scan(&authorUserID)

	if err == sql.ErrNoRows {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Failed to query post", http.StatusInternalServerError)
		return
	}
	if authorUserID != userID {
		http.Error(w, "Forbidden: You are not the author of this post", http.StatusForbidden)
		return
	}

	// Soft delete by setting is_active to false
	_, err = s.db.Exec(`
		UPDATE posts SET is_active = false, updated_at = NOW() WHERE id = $1
	`, postID)

	if err != nil {
		http.Error(w, "Failed to delete post", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
