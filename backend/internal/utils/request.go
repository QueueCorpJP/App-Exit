package utils

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/yourusername/appexit-backend/pkg/response"
)

// GetAuthContext extracts user_id and access_token from request context
// Returns empty strings if not found
func GetAuthContext(r *http.Request) (userID, accessToken string) {
	userID, _ = r.Context().Value("user_id").(string)
	accessToken, _ = r.Context().Value("access_token").(string)
	return userID, accessToken
}

// RequireAuth extracts and validates authentication information from request context
// If authentication fails, it writes an error response and returns ok=false
// Usage:
//   userID, accessToken, ok := utils.RequireAuth(r, w)
//   if !ok {
//       return // Error response already sent
//   }
func RequireAuth(r *http.Request, w http.ResponseWriter) (userID, accessToken string, ok bool) {
	userID, ok1 := r.Context().Value("user_id").(string)
	if !ok1 || userID == "" {
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return "", "", false
	}

	accessToken, ok2 := r.Context().Value("access_token").(string)
	if !ok2 || accessToken == "" {
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return "", "", false
	}

	return userID, accessToken, true
}

// RequireUserID extracts and validates user_id from request context
// If user_id is not found, it writes an error response and returns ok=false
func RequireUserID(r *http.Request, w http.ResponseWriter) (userID string, ok bool) {
	userID, ok = r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		response.Error(w, http.StatusUnauthorized, "Unauthorized")
		return "", false
	}
	return userID, true
}

// DecodeJSONBody decodes JSON request body into the provided interface
// If decoding fails, it writes an error response and returns ok=false
func DecodeJSONBody(r *http.Request, w http.ResponseWriter, v interface{}) bool {
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return false
	}
	return true
}

// DecodeAndValidate decodes JSON request body and validates it
// If decoding or validation fails, it writes an error response and returns ok=false
func DecodeAndValidate(r *http.Request, w http.ResponseWriter, v interface{}) bool {
	if !DecodeJSONBody(r, w, v) {
		return false
	}

	if err := ValidateStruct(v); err != nil {
		response.Error(w, http.StatusBadRequest, fmt.Sprintf("Validation error: %v", err))
		return false
	}

	return true
}

// RequireMethod checks if the request method matches the expected method
// If not, it writes an error response and returns ok=false
func RequireMethod(r *http.Request, w http.ResponseWriter, method string) bool {
	if r.Method != method {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return false
	}
	return true
}

// ExtractIDFromPath extracts an ID from the URL path at the specified position
// Example: "/api/posts/123/comments" with position 2 returns "123"
func ExtractIDFromPath(path string, position int) (string, error) {
	parts := splitPath(path)
	if len(parts) <= position {
		return "", fmt.Errorf("invalid path: position %d not found", position)
	}
	id := parts[position]
	if id == "" {
		return "", fmt.Errorf("invalid path: empty ID at position %d", position)
	}
	return id, nil
}

// splitPath splits a URL path into parts, removing empty strings
func splitPath(path string) []string {
	var parts []string
	for _, part := range splitBySlash(path) {
		if part != "" {
			parts = append(parts, part)
		}
	}
	return parts
}

// splitBySlash splits a string by '/' character
func splitBySlash(s string) []string {
	var result []string
	current := ""
	for _, c := range s {
		if c == '/' {
			result = append(result, current)
			current = ""
		} else {
			current += string(c)
		}
	}
	result = append(result, current)
	return result
}
