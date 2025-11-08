package config

import (
	"fmt"
	"log"
	"os"
)

type Config struct {
	ServerPort         string
	Environment        string
	BackendURL         string
	FrontendURL        string
	SupabaseURL        string
	SupabaseAnonKey    string
	SupabaseServiceKey string
	SupabaseJWTSecret  string
	AllowedOrigins     []string
	StripeSecretKey    string
	StripePublicKey    string
	StripeWebhookSecret string
}

func LoadConfig() *Config {
	cfg := &Config{
		ServerPort:         getEnv("PORT", "8080"),
		Environment:        getEnv("ENV", "development"),
		BackendURL:         getEnv("BACKEND_URL", "http://localhost:8080"),
		FrontendURL:        getEnv("FRONTEND_URL", "http://localhost:3000"),
		SupabaseURL:        getEnv("SUPABASE_URL", ""),
		SupabaseAnonKey:    getEnv("SUPABASE_ANON_KEY", ""),
		SupabaseServiceKey: getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),
		SupabaseJWTSecret:  getEnv("SUPABASE_JWT_SECRET", ""),
		AllowedOrigins:     parseAllowedOrigins(),
		StripeSecretKey:    getEnv("STRIPE_SECRET_KEY", ""),
		StripePublicKey:    getEnv("STRIPE_PUBLIC_KEY", ""),
		StripeWebhookSecret: getEnv("STRIPE_WEBHOOK_SECRET", ""),
	}

	// 必須の環境変数をチェック
	if err := cfg.Validate(); err != nil {
		log.Fatalf("Configuration validation failed: %v", err)
	}

	return cfg
}

// Validate checks if required configuration values are set
func (c *Config) Validate() error {
	if c.BackendURL == "" {
		return fmt.Errorf("BACKEND_URL is required")
	}

	if c.SupabaseURL == "" {
		return fmt.Errorf("SUPABASE_URL is required")
	}

	if c.SupabaseAnonKey == "" {
		return fmt.Errorf("SUPABASE_ANON_KEY is required")
	}

	if c.SupabaseServiceKey == "" {
		return fmt.Errorf("SUPABASE_SERVICE_ROLE_KEY is required")
	}

	if c.SupabaseJWTSecret == "" {
		return fmt.Errorf("SUPABASE_JWT_SECRET is required")
	}

	// Stripe keys are optional in development
	if c.Environment == "production" && c.StripeSecretKey == "" {
		return fmt.Errorf("STRIPE_SECRET_KEY is required in production")
	}

	return nil
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// parseAllowedOrigins parses ALLOWED_ORIGINS environment variable
// Format: comma-separated list of origins, e.g., "http://localhost:3000,https://yourdomain.com"
func parseAllowedOrigins() []string {
	originsEnv := os.Getenv("ALLOWED_ORIGINS")

	// デフォルト: 開発環境用
	if originsEnv == "" {
		return []string{
			"http://localhost:3000",
			"http://127.0.0.1:3000",
		}
	}

	// カンマ区切りでパース
	origins := []string{}
	for _, origin := range splitAndTrim(originsEnv, ",") {
		if origin != "" {
			origins = append(origins, origin)
		}
	}

	return origins
}

// splitAndTrim splits a string by separator and trims whitespace
func splitAndTrim(s, sep string) []string {
	parts := []string{}
	for _, part := range splitString(s, sep) {
		trimmed := trimSpace(part)
		if trimmed != "" {
			parts = append(parts, trimmed)
		}
	}
	return parts
}

func splitString(s, sep string) []string {
	if s == "" {
		return []string{}
	}
	result := []string{}
	current := ""
	for i := 0; i < len(s); i++ {
		if i+len(sep) <= len(s) && s[i:i+len(sep)] == sep {
			result = append(result, current)
			current = ""
			i += len(sep) - 1
		} else {
			current += string(s[i])
		}
	}
	result = append(result, current)
	return result
}

func trimSpace(s string) string {
	start := 0
	end := len(s)

	for start < end && (s[start] == ' ' || s[start] == '\t' || s[start] == '\n' || s[start] == '\r') {
		start++
	}

	for end > start && (s[end-1] == ' ' || s[end-1] == '\t' || s[end-1] == '\n' || s[end-1] == '\r') {
		end--
	}

	return s[start:end]
}
