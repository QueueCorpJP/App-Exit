# セキュアな入力処理ガイド

このガイドでは、XSS攻撃、SQLインジェクション、DoS攻撃などを防ぐためのセキュアな入力処理の実装方法を説明します。

## 📋 目次

1. [概要](#概要)
2. [バックエンド: Goでの実装](#バックエンド-goでの実装)
3. [フロントエンド: React/TypeScriptでの実装](#フロントエンド-reacttypescriptでの実装)
4. [セキュリティ対策一覧](#セキュリティ対策一覧)
5. [実装例](#実装例)

---

## 概要

### 🔒 防御する攻撃

1. **XSS (Cross-Site Scripting)攻撃**
   - `<script>`, `<iframe>`, `javascript:` などの危険なコードを除去
   - HTMLエスケープ処理

2. **SQLインジェクション**
   - SQLコマンドパターンの検出と拒否
   - ORM使用時の追加防御層

3. **DoS (Denial of Service)攻撃**
   - 入力長の制限
   - ファイルサイズの制限
   - レート制限（別途実装推奨）

4. **インジェクション攻撃**
   - 制御文字の削除
   - NULL文字の削除
   - 危険なURLスキームの拒否

---

## バックエンド: Goでの実装

### 📦 サニタイゼーション関数

**場所**: `/backend/internal/utils/sanitizer.go`

### 基本的な使い方

```go
package handlers

import (
	"github.com/yourusername/appexit-backend/internal/utils"
)

func (s *Server) CreatePost(w http.ResponseWriter, r *http.Request) {
	var req CreatePostRequest
	// ... リクエストのデコード ...

	// 🔒 タイトルをサニタイズ
	titleResult := utils.SanitizeText(utils.SanitizeInput{
		Value:      req.Title,
		MaxLength:  utils.MaxTitleLength, // 200文字
		AllowHTML:  false,
		StrictMode: true, // SQLインジェクションチェックも実行
	})

	if !titleResult.IsValid {
		log.Printf("警告: %v", titleResult.Errors)
		// エラーを返すか、サニタイズ済みの値を使用
	}

	req.Title = titleResult.Sanitized

	// 🔒 本文（リッチテキスト）をサニタイズ
	bodyResult := utils.SanitizeRichText(req.Body, utils.MaxDescriptionLength)
	req.Body = bodyResult.Sanitized

	// 🔒 URLをバリデート
	if req.URL != "" {
		urlResult := utils.SanitizeURL(req.URL)
		if !urlResult.IsValid {
			http.Error(w, "Invalid URL", http.StatusBadRequest)
			return
		}
		req.URL = urlResult.Sanitized
	}

	// ... DBへの保存 ...
}
```

### 利用可能な関数

#### 1. 汎用テキストサニタイズ

```go
result := utils.SanitizeText(utils.SanitizeInput{
	Value:      input,
	MaxLength:  500,
	AllowHTML:  false,     // HTMLタグを許可するか
	StrictMode: false,     // SQLインジェクションチェック有効化
})
```

#### 2. ユーザー名バリデーション

```go
result := utils.SanitizeUsername(username)
// 許可: a-z, A-Z, 0-9, _, -, .
// 最大50文字
```

#### 3. メールアドレスバリデーション

```go
result := utils.SanitizeEmail(email)
// RFC準拠のメールアドレス形式チェック
// 最大255文字
```

#### 4. URLバリデーション

```go
result := utils.SanitizeURL(url)
// HTTPまたはHTTPSのみ許可
// javascript:, data: などの危険なスキームを拒否
```

#### 5. 電話番号バリデーション

```go
result := utils.SanitizePhone(phone)
// 数字と+のみ許可
// 最大20文字
```

#### 6. リッチテキストサニタイズ

```go
result := utils.SanitizeRichText(text, maxLength)
// マークダウン対応
// data:スキームの画像を拒否
```

#### 7. ファイルバリデーション

```go
// サイズチェック
sizeResult := utils.ValidateFileSize(size, utils.MaxImageSize)

// タイプチェック
typeResult := utils.ValidateFileType(filename, []string{"jpg", "png", "gif"})
```

### 定数（最大長）

```go
utils.MaxUsernameLength    // 50
utils.MaxEmailLength       // 255
utils.MaxPasswordLength    // 128
utils.MaxTextFieldLength   // 500
utils.MaxTextareaLength    // 5000
utils.MaxTitleLength       // 200
utils.MaxDescriptionLength // 10000
utils.MaxURLLength         // 2048
utils.MaxPhoneLength       // 20
utils.MaxImageSize         // 5MB
utils.MaxDocumentSize      // 10MB
```

---

## フロントエンド: React/TypeScriptでの実装

### 📦 バリデーション関数

**場所**: `/frontend/appexit/lib/input-validator.ts`

### 1. 基本的な使い方

```typescript
import { sanitizeText, INPUT_LIMITS } from '@/lib/input-validator';

function MyComponent() {
  const [title, setTitle] = useState('');

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const result = sanitizeText(e.target.value, INPUT_LIMITS.TITLE, {
      allowHTML: false,
      strictMode: true,
    });

    if (!result.isValid) {
      console.warn('Validation errors:', result.errors);
    }

    setTitle(result.sanitized);
  };

  return <input value={title} onChange={handleTitleChange} />;
}
```

### 2. セキュアな入力コンポーネントの使用

**場所**: `/frontend/appexit/components/ui/SecureInput.tsx`

```typescript
import { SecureInput, SecureTextarea, SecureTitle } from '@/components/ui/SecureInput';

function MyForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');

  return (
    <div>
      {/* タイトル入力（自動的にサニタイズ） */}
      <SecureTitle
        value={title}
        onChange={setTitle}
        placeholder="タイトルを入力"
        showErrors={true}
        onValidationChange={(isValid, errors) => {
          console.log('Valid:', isValid, 'Errors:', errors);
        }}
      />

      {/* テキストエリア */}
      <SecureTextarea
        value={description}
        onChange={setDescription}
        placeholder="説明を入力"
        maxLength={5000}
      />

      {/* メールアドレス */}
      <SecureInput
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="メールアドレス"
      />
    </div>
  );
}
```

### 3. カスタムフックの使用

**場所**: `/frontend/appexit/hooks/useSecureInput.ts`

```typescript
import { useSecureInput } from '@/hooks/useSecureInput';

function MyForm() {
  const username = useSecureInput({ type: 'username' });
  const email = useSecureInput({ type: 'email' });

  const handleSubmit = () => {
    const usernameValidation = username.validate();
    const emailValidation = email.validate();

    if (usernameValidation.isValid && emailValidation.isValid) {
      // フォーム送信
      submitForm({
        username: username.value,
        email: email.value,
      });
    }
  };

  return (
    <div>
      <input
        value={username.value}
        onChange={(e) => username.handleChange(e.target.value)}
        maxLength={username.maxLength}
      />
      {username.errors.length > 0 && (
        <div className="error">{username.errors.join(', ')}</div>
      )}

      <input
        value={email.value}
        onChange={(e) => email.handleChange(e.target.value)}
        maxLength={email.maxLength}
      />
      {email.errors.length > 0 && (
        <div className="error">{email.errors.join(', ')}</div>
      )}

      <button onClick={handleSubmit}>送信</button>
    </div>
  );
}
```

### 4. React Hook Formとの統合

```typescript
import { useForm } from 'react-hook-form';
import { createSecureValidator } from '@/hooks/useSecureInput';

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    console.log('Sanitized data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('username', {
          validate: createSecureValidator('username'),
        })}
      />
      {errors.username && <span>{errors.username.message}</span>}

      <input
        {...register('email', {
          validate: createSecureValidator('email'),
        })}
      />
      {errors.email && <span>{errors.email.message}</span>}

      <button type="submit">送信</button>
    </form>
  );
}
```

---

## セキュリティ対策一覧

### ✅ 実装済みの対策

| 対策 | バックエンド | フロントエンド |
|------|------------|--------------|
| XSSパターン検出 | ✅ | ✅ |
| HTMLエスケープ | ✅ | ✅ |
| SQLインジェクション検出 | ✅ | ✅ |
| 入力長制限 | ✅ | ✅ |
| ファイルサイズ制限 | ✅ | ✅ |
| 危険なURLスキーム拒否 | ✅ | ✅ |
| 制御文字削除 | ✅ | ✅ |
| NULL文字削除 | ✅ | ✅ |
| ユーザー名形式チェック | ✅ | ✅ |
| メール形式チェック | ✅ | ✅ |
| 電話番号形式チェック | ✅ | ✅ |

### 🔧 追加推奨の対策

1. **レート制限**
   - API呼び出し頻度の制限
   - ブルートフォース攻撃対策

2. **CSRF対策**
   - CSRFトークンの実装
   - SameSite Cookie属性の設定

3. **Content Security Policy (CSP)**
   - HTTPヘッダーでのCSP設定
   - インラインスクリプトの制限

---

## 実装例

### 例1: メッセージ送信

**バックエンド** (`message.go`):
```go
// 🔒 SECURITY: メッセージテキストをサニタイズ
sanitizedText := utils.SanitizeText(utils.SanitizeInput{
	Value:      req.Text,
	MaxLength:  utils.MaxTextareaLength,
	AllowHTML:  false,
	StrictMode: false,
})

insertData := messageInsert{
	ThreadID:     req.ThreadID,
	SenderUserID: userID,
	Type:         string(req.Type),
	Text:         sanitizedText.Sanitized,
}
```

**フロントエンド**:
```typescript
<SecureTextarea
  value={message}
  onChange={setMessage}
  placeholder="メッセージを入力"
  maxLength={INPUT_LIMITS.TEXTAREA}
/>
```

### 例2: 投稿作成

**バックエンド** (`post.go`):
```go
// タイトル
titleResult := utils.SanitizeText(utils.SanitizeInput{
	Value:      req.Title,
	MaxLength:  utils.MaxTitleLength,
	AllowHTML:  false,
	StrictMode: true,
})
req.Title = titleResult.Sanitized

// 本文
bodyResult := utils.SanitizeRichText(*req.Body, utils.MaxDescriptionLength)
req.Body = &bodyResult.Sanitized

// URL
urlResult := utils.SanitizeURL(*req.EyecatchURL)
if !urlResult.IsValid {
	http.Error(w, "Invalid URL", http.StatusBadRequest)
	return
}
req.EyecatchURL = &urlResult.Sanitized
```

**フロントエンド**:
```typescript
const title = useSecureInput({ type: 'title' });
const body = useSecureInput({ type: 'richtext', maxLength: 10000 });
const url = useSecureInput({ type: 'url' });

<SecureTitle value={title.value} onChange={title.handleChange} />
<SecureTextarea value={body.value} onChange={body.handleChange} />
<SecureInput type="url" value={url.value} onChange={url.handleChange} />
```

### 例3: ユーザー登録

**バックエンド** (`registration.go`):
```go
// 表示名
displayNameResult := utils.SanitizeText(utils.SanitizeInput{
	Value:      req.DisplayName,
	MaxLength:  utils.MaxUsernameLength,
	AllowHTML:  false,
	StrictMode: true,
})
req.DisplayName = displayNameResult.Sanitized

// ユーザー名
usernameResult := utils.SanitizeUsername(*req.Username)
if !usernameResult.IsValid {
	response.Error(w, http.StatusBadRequest, "Invalid username")
	return
}
req.Username = &usernameResult.Sanitized
```

**フロントエンド**:
```typescript
const username = useSecureInput({ type: 'username' });
const email = useSecureInput({ type: 'email' });

<SecureInput type="username" value={username.value} onChange={username.handleChange} />
<SecureInput type="email" value={email.value} onChange={email.handleChange} />
```

---

## 🚀 次のステップ

1. **全てのフォームを確認**
   - 既存のinput/textareaを`SecureInput`に置き換え
   - バリデーションエラーの表示を実装

2. **バックエンドエンドポイントを確認**
   - 全てのユーザー入力にサニタイゼーションを適用
   - ログに警告を記録

3. **テストを追加**
   - XSS攻撃のテストケース
   - SQLインジェクションのテストケース
   - DoS攻撃のテストケース

4. **セキュリティ監査**
   - 定期的なコードレビュー
   - ペネトレーションテストの実施
   - セキュリティログの監視

---

## 📚 参考資料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
