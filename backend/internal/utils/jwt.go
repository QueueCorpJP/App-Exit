package utils

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	// MaxJWTTokenLength JWTトークンの最大長（10KB）
	MaxJWTTokenLength = 10 * 1024
	// MaxJWTHeaderLength JWTヘッダーの最大長（1KB）
	MaxJWTHeaderLength = 1 * 1024
	// MaxJWTPayloadLength JWTペイロードの最大長（8KB）
	MaxJWTPayloadLength = 8 * 1024
)

type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

func GenerateJWT(userID string, email string, secret string) (string, error) {
	claims := Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ValidateJWTTokenStructure JWTトークンの構造を検証し、過剰なメモリ割り当てを防ぐ
// CVE-2025-30204対策: トークンの長さと構造を事前に検証
func ValidateJWTTokenStructure(tokenString string) error {
	// 1. トークン全体の長さを制限
	if len(tokenString) > MaxJWTTokenLength {
		return fmt.Errorf("token length exceeds maximum allowed size: %d bytes", MaxJWTTokenLength)
	}

	// 2. 空文字列チェック
	if tokenString == "" {
		return errors.New("token string is empty")
	}

	// 3. JWTは3つの部分（header.payload.signature）がドットで区切られている必要がある
	// strings.Splitを使用せず、手動でカウントすることで過剰なメモリ割り当てを防ぐ
	dotCount := 0
	for i := 0; i < len(tokenString); i++ {
		if tokenString[i] == '.' {
			dotCount++
		}
	}

	// 正確に2つのドットが必要（3つの部分を区切る）
	if dotCount != 2 {
		return fmt.Errorf("invalid token format: expected 2 dots, found %d", dotCount)
	}

	// 4. 各部分の長さを検証（メモリ効率的に）
	firstDot := strings.IndexByte(tokenString, '.')
	if firstDot == -1 {
		return errors.New("invalid token format: first dot not found")
	}

	secondDot := strings.IndexByte(tokenString[firstDot+1:], '.')
	if secondDot == -1 {
		return errors.New("invalid token format: second dot not found")
	}
	secondDot += firstDot + 1

	header := tokenString[:firstDot]
	payload := tokenString[firstDot+1 : secondDot]
	signature := tokenString[secondDot+1:]

	// 各部分の長さを制限
	if len(header) > MaxJWTHeaderLength {
		return fmt.Errorf("header length exceeds maximum allowed size: %d bytes", MaxJWTHeaderLength)
	}
	if len(payload) > MaxJWTPayloadLength {
		return fmt.Errorf("payload length exceeds maximum allowed size: %d bytes", MaxJWTPayloadLength)
	}
	if len(signature) > MaxJWTTokenLength {
		return fmt.Errorf("signature length exceeds maximum allowed size: %d bytes", MaxJWTTokenLength)
	}

	// 5. 各部分が空でないことを確認
	if len(header) == 0 || len(payload) == 0 || len(signature) == 0 {
		return errors.New("invalid token format: empty parts detected")
	}

	return nil
}

func ValidateJWT(tokenString string, secret string) (*Claims, error) {
	// 事前検証: 過剰なメモリ割り当てを防ぐ
	if err := ValidateJWTTokenStructure(tokenString); err != nil {
		return nil, fmt.Errorf("token validation failed: %w", err)
	}

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}
