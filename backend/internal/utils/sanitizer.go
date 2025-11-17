package utils

import (
	"fmt"
	"html"
	"regexp"
	"strings"
	"unicode/utf8"
)

// 🔒 SECURITY: 入力サニタイゼーションとバリデーション

const (
	// 最大長制限（DoS攻撃防止）
	MaxUsernameLength    = 50
	MaxEmailLength       = 255
	MaxPasswordLength    = 128
	MaxTextFieldLength   = 500
	MaxTextareaLength    = 5000
	MaxTitleLength       = 200
	MaxDescriptionLength = 10000
	MaxURLLength         = 2048
	MaxPhoneLength       = 20

	// ファイルサイズ制限（バイト）
	MaxImageSize    = 5 * 1024 * 1024  // 5MB
	MaxDocumentSize = 10 * 1024 * 1024 // 10MB
)

var (
	// XSS攻撃パターン
	xssPatterns = []*regexp.Regexp{
		regexp.MustCompile(`(?i)<script[^>]*>.*?</script>`),
		regexp.MustCompile(`(?i)<iframe[^>]*>.*?</iframe>`),
		regexp.MustCompile(`(?i)<object[^>]*>.*?</object>`),
		regexp.MustCompile(`(?i)<embed[^>]*>`),
		regexp.MustCompile(`(?i)<applet[^>]*>.*?</applet>`),
		regexp.MustCompile(`(?i)javascript:`),
		regexp.MustCompile(`(?i)on\w+\s*=`), // onclick, onload, etc.
		regexp.MustCompile(`(?i)<link[^>]*>`),
		regexp.MustCompile(`(?i)<meta[^>]*>`),
		regexp.MustCompile(`(?i)<style[^>]*>.*?</style>`),
		regexp.MustCompile(`(?i)expression\s*\(`), // CSS expression
		regexp.MustCompile(`(?i)@import`),
		regexp.MustCompile(`(?i)vbscript:`),
		regexp.MustCompile(`(?i)data:text/html`),
	}

	// SQL injection パターン（追加の防御層として）
	sqlInjectionPatterns = []*regexp.Regexp{
		regexp.MustCompile(`(?i)(union|select|insert|update|delete|drop|create|alter|exec|execute)\s+(from|into|table|database)`),
		regexp.MustCompile(`(?i)(\-\-|;|\/\*|\*\/)`), // SQLコメント
		regexp.MustCompile(`(?i)(or|and)\s+\d+\s*=\s*\d+`),
		regexp.MustCompile(`(?i)(or|and)\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?`),
	}

	// 許可する文字（ユーザー名など）
	validUsernameRegex = regexp.MustCompile(`^[a-zA-Z0-9_\-\.]+$`)
	validEmailRegex    = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	validURLRegex      = regexp.MustCompile(`^https?://[a-zA-Z0-9\-._~:/?#\[\]@!$&'()*+,;=]+$`)
)

// SanitizeInput は汎用的な入力サニタイゼーション
type SanitizeInput struct {
	Value      string
	MaxLength  int
	AllowHTML  bool
	StrictMode bool // trueの場合、より厳格なチェック
}

// SanitizeResult はサニタイズ結果
type SanitizeResult struct {
	Sanitized string
	IsValid   bool
	Errors    []string
}

// SanitizeText は一般的なテキスト入力をサニタイズ
func SanitizeText(input SanitizeInput) SanitizeResult {
	result := SanitizeResult{
		IsValid: true,
		Errors:  []string{},
	}

	value := input.Value

	// 1. 長さチェック（DoS防止）
	if utf8.RuneCountInString(value) > input.MaxLength {
		result.IsValid = false
		result.Errors = append(result.Errors, fmt.Sprintf("Input exceeds maximum length of %d characters", input.MaxLength))
		// 切り詰め
		runes := []rune(value)
		if len(runes) > input.MaxLength {
			value = string(runes[:input.MaxLength])
		}
	}

	// 2. XSS攻撃パターンチェック
	for _, pattern := range xssPatterns {
		if pattern.MatchString(value) {
			result.IsValid = false
			result.Errors = append(result.Errors, "Potentially malicious content detected (XSS)")
			// XSSパターンを削除
			value = pattern.ReplaceAllString(value, "")
		}
	}

	// 3. SQL Injectionパターンチェック（追加の防御層）
	if input.StrictMode {
		for _, pattern := range sqlInjectionPatterns {
			if pattern.MatchString(value) {
				result.IsValid = false
				result.Errors = append(result.Errors, "Potentially malicious content detected (SQL)")
			}
		}
	}

	// 4. HTMLエスケープ（AllowHTMLがfalseの場合）
	if !input.AllowHTML {
		value = html.EscapeString(value)
	}

	// 5. NULL文字削除（セキュリティ対策）
	value = strings.ReplaceAll(value, "\x00", "")

	// 6. 制御文字の削除（印字可能な文字と改行・タブのみ許可）
	value = removeControlCharacters(value)

	result.Sanitized = strings.TrimSpace(value)
	return result
}

// SanitizeUsername はユーザー名をサニタイズ
func SanitizeUsername(username string) SanitizeResult {
	result := SanitizeResult{IsValid: true, Errors: []string{}}

	// 長さチェック
	if len(username) == 0 {
		result.IsValid = false
		result.Errors = append(result.Errors, "Username cannot be empty")
		return result
	}

	if len(username) > MaxUsernameLength {
		result.IsValid = false
		result.Errors = append(result.Errors, fmt.Sprintf("Username exceeds maximum length of %d", MaxUsernameLength))
		username = username[:MaxUsernameLength]
	}

	// 許可された文字のみ
	if !validUsernameRegex.MatchString(username) {
		result.IsValid = false
		result.Errors = append(result.Errors, "Username contains invalid characters (allowed: a-z, A-Z, 0-9, _, -, .)")
	}

	// 予約語チェック
	reservedWords := []string{"admin", "root", "system", "api", "null", "undefined"}
	lowerUsername := strings.ToLower(username)
	for _, reserved := range reservedWords {
		if lowerUsername == reserved {
			result.IsValid = false
			result.Errors = append(result.Errors, "Username is reserved")
			break
		}
	}

	result.Sanitized = username
	return result
}

// SanitizeEmail はメールアドレスをサニタイズ
func SanitizeEmail(email string) SanitizeResult {
	result := SanitizeResult{IsValid: true, Errors: []string{}}

	email = strings.TrimSpace(strings.ToLower(email))

	// 長さチェック
	if len(email) > MaxEmailLength {
		result.IsValid = false
		result.Errors = append(result.Errors, fmt.Sprintf("Email exceeds maximum length of %d", MaxEmailLength))
		return result
	}

	// フォーマットチェック
	if !validEmailRegex.MatchString(email) {
		result.IsValid = false
		result.Errors = append(result.Errors, "Invalid email format")
	}

	result.Sanitized = email
	return result
}

// SanitizeURL はURLをサニタイズ
func SanitizeURL(url string) SanitizeResult {
	result := SanitizeResult{IsValid: true, Errors: []string{}}

	url = strings.TrimSpace(url)

	// 長さチェック
	if len(url) > MaxURLLength {
		result.IsValid = false
		result.Errors = append(result.Errors, fmt.Sprintf("URL exceeds maximum length of %d", MaxURLLength))
		return result
	}

	// 危険なスキームを拒否
	dangerousSchemes := []string{"javascript:", "data:", "vbscript:", "file:"}
	lowerURL := strings.ToLower(url)
	for _, scheme := range dangerousSchemes {
		if strings.HasPrefix(lowerURL, scheme) {
			result.IsValid = false
			result.Errors = append(result.Errors, "Dangerous URL scheme detected")
			return result
		}
	}

	// HTTPまたはHTTPSのみ許可
	if !strings.HasPrefix(lowerURL, "http://") && !strings.HasPrefix(lowerURL, "https://") {
		result.IsValid = false
		result.Errors = append(result.Errors, "Only HTTP and HTTPS URLs are allowed")
		return result
	}

	// URLフォーマットチェック
	if !validURLRegex.MatchString(url) {
		result.IsValid = false
		result.Errors = append(result.Errors, "Invalid URL format")
	}

	result.Sanitized = url
	return result
}

// SanitizePhone は電話番号をサニタイズ
func SanitizePhone(phone string) SanitizeResult {
	result := SanitizeResult{IsValid: true, Errors: []string{}}

	// 空白とハイフンを削除
	phone = strings.ReplaceAll(phone, " ", "")
	phone = strings.ReplaceAll(phone, "-", "")

	// 長さチェック
	if len(phone) > MaxPhoneLength {
		result.IsValid = false
		result.Errors = append(result.Errors, fmt.Sprintf("Phone number exceeds maximum length of %d", MaxPhoneLength))
		return result
	}

	// 数字と+のみ許可
	validPhone := regexp.MustCompile(`^[+]?[0-9]+$`)
	if !validPhone.MatchString(phone) {
		result.IsValid = false
		result.Errors = append(result.Errors, "Phone number contains invalid characters")
	}

	result.Sanitized = phone
	return result
}

// SanitizeRichText はリッチテキスト（マークダウンなど）をサニタイズ
func SanitizeRichText(text string, maxLength int) SanitizeResult {
	result := SanitizeText(SanitizeInput{
		Value:      text,
		MaxLength:  maxLength,
		AllowHTML:  false, // HTMLは許可しない
		StrictMode: true,
	})

	// 追加のマークダウンインジェクション対策
	// 画像の data: スキームを拒否
	imageDataPattern := regexp.MustCompile(`!\[.*?\]\(data:`)
	if imageDataPattern.MatchString(text) {
		result.IsValid = false
		result.Errors = append(result.Errors, "Data URI in images is not allowed")
		result.Sanitized = imageDataPattern.ReplaceAllString(result.Sanitized, "![](")
	}

	return result
}

// ValidateFileSize はファイルサイズを検証
func ValidateFileSize(size int64, maxSize int64) SanitizeResult {
	result := SanitizeResult{IsValid: true, Errors: []string{}}

	if size > maxSize {
		result.IsValid = false
		result.Errors = append(result.Errors, fmt.Sprintf("File size (%d bytes) exceeds maximum allowed size (%d bytes)", size, maxSize))
	}

	if size <= 0 {
		result.IsValid = false
		result.Errors = append(result.Errors, "File size must be greater than 0")
	}

	return result
}

// ValidateFileType はファイルタイプを検証
func ValidateFileType(filename string, allowedExtensions []string) SanitizeResult {
	result := SanitizeResult{IsValid: true, Errors: []string{}}

	// 拡張子を取得
	parts := strings.Split(filename, ".")
	if len(parts) < 2 {
		result.IsValid = false
		result.Errors = append(result.Errors, "File has no extension")
		return result
	}

	ext := strings.ToLower(parts[len(parts)-1])

	// 許可された拡張子かチェック
	allowed := false
	for _, allowedExt := range allowedExtensions {
		if ext == strings.ToLower(allowedExt) {
			allowed = true
			break
		}
	}

	if !allowed {
		result.IsValid = false
		result.Errors = append(result.Errors, fmt.Sprintf("File type .%s is not allowed", ext))
	}

	// 危険な拡張子を拒否
	dangerousExtensions := []string{"exe", "bat", "cmd", "sh", "ps1", "vbs", "js", "jar", "app", "deb", "rpm"}
	for _, dangerous := range dangerousExtensions {
		if ext == dangerous {
			result.IsValid = false
			result.Errors = append(result.Errors, "Dangerous file type detected")
			break
		}
	}

	result.Sanitized = filename
	return result
}

// removeControlCharacters は制御文字を削除（改行・タブは保持）
func removeControlCharacters(s string) string {
	result := strings.Builder{}
	for _, r := range s {
		// 印字可能な文字、改行、タブのみ許可
		if r == '\n' || r == '\r' || r == '\t' || (r >= 32 && r < 127) || r >= 128 {
			result.WriteRune(r)
		}
	}
	return result.String()
}

// BatchSanitize は複数の入力を一括でサニタイズ
func BatchSanitize(inputs map[string]SanitizeInput) map[string]SanitizeResult {
	results := make(map[string]SanitizeResult)
	for key, input := range inputs {
		results[key] = SanitizeText(input)
	}
	return results
}

// IsAllValid は全てのサニタイズ結果が有効かチェック
func IsAllValid(results map[string]SanitizeResult) bool {
	for _, result := range results {
		if !result.IsValid {
			return false
		}
	}
	return true
}

// GetAllErrors は全てのエラーメッセージを取得
func GetAllErrors(results map[string]SanitizeResult) []string {
	var errors []string
	for key, result := range results {
		for _, err := range result.Errors {
			errors = append(errors, fmt.Sprintf("%s: %s", key, err))
		}
	}
	return errors
}
