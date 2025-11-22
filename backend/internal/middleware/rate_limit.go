package middleware

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/yourusername/appexit-backend/pkg/response"
)

const (
	MaxLoginAttempts    = 3
	LockoutDuration     = 60 * time.Second // 1分
	LoginAttemptCookie  = "login_attempts"
	LockoutTimeCookie   = "lockout_until"
)

// CheckLoginRateLimit checks if the user has exceeded login attempts
// Returns true if the user is locked out, false otherwise
func CheckLoginRateLimit(w http.ResponseWriter, r *http.Request) bool {
	// ロックアウト時刻を確認
	lockoutCookie, err := r.Cookie(LockoutTimeCookie)
	if err == nil && lockoutCookie.Value != "" {
		lockoutTime, parseErr := strconv.ParseInt(lockoutCookie.Value, 10, 64)
		if parseErr == nil {
			lockoutUntil := time.Unix(lockoutTime, 0)
			if time.Now().Before(lockoutUntil) {
				remainingSeconds := int(time.Until(lockoutUntil).Seconds())
				fmt.Printf("[RATE LIMIT] User is locked out. Remaining: %d seconds\n", remainingSeconds)

				response.Error(w, http.StatusTooManyRequests,
					fmt.Sprintf("ログイン試行回数が上限に達しました。%d秒後に再試行してください。", remainingSeconds))
				return true
			}

			// ロックアウト期間が過ぎた場合、Cookieをクリア
			ClearLoginRateLimitCookies(w)
			fmt.Printf("[RATE LIMIT] Lockout period expired, cookies cleared\n")
		}
	}

	return false
}

// IncrementLoginAttempts increments the failed login attempt counter
func IncrementLoginAttempts(w http.ResponseWriter, r *http.Request) {
	attempts := 1

	// 既存の試行回数を取得
	attemptsCookie, err := r.Cookie(LoginAttemptCookie)
	if err == nil && attemptsCookie.Value != "" {
		currentAttempts, parseErr := strconv.Atoi(attemptsCookie.Value)
		if parseErr == nil {
			attempts = currentAttempts + 1
		}
	}

	fmt.Printf("[RATE LIMIT] Login attempt #%d\n", attempts)

	// 試行回数を更新
	http.SetCookie(w, &http.Cookie{
		Name:     LoginAttemptCookie,
		Value:    strconv.Itoa(attempts),
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   int(LockoutDuration.Seconds()), // ロックアウト期間と同じ
	})

	// 3回以上失敗した場合、ロックアウト
	if attempts >= MaxLoginAttempts {
		lockoutUntil := time.Now().Add(LockoutDuration).Unix()

		http.SetCookie(w, &http.Cookie{
			Name:     LockoutTimeCookie,
			Value:    strconv.FormatInt(lockoutUntil, 10),
			Path:     "/",
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteStrictMode,
			MaxAge:   int(LockoutDuration.Seconds()),
		})

		fmt.Printf("[RATE LIMIT] User locked out until %s\n", time.Unix(lockoutUntil, 0).Format(time.RFC3339))

		response.Error(w, http.StatusTooManyRequests,
			fmt.Sprintf("ログイン試行回数が上限に達しました。%d秒後に再試行してください。", int(LockoutDuration.Seconds())))
	}
}

// ClearLoginRateLimitCookies clears all rate limit cookies (called on successful login)
func ClearLoginRateLimitCookies(w http.ResponseWriter) {
	// 試行回数をクリア
	http.SetCookie(w, &http.Cookie{
		Name:     LoginAttemptCookie,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   -1, // 即座に削除
	})

	// ロックアウト時刻をクリア
	http.SetCookie(w, &http.Cookie{
		Name:     LockoutTimeCookie,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   -1, // 即座に削除
	})

	fmt.Printf("[RATE LIMIT] Rate limit cookies cleared\n")
}
