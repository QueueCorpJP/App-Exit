# 400 Bad Request エラーの原因と修正

## 問題

投稿作成時に画像アップロードは成功するが、投稿の作成で400 Bad Requestエラーが発生していた。

### エラー発生箇所
- **フロントエンド**: POST `/api/posts` で 400 エラー
- **バックエンドログ**: "Validation error: ..." というメッセージが出るはず（ユーザーのログには表示されていなかった）

## 根本原因

### 1. フロントエンドが必須フィールドに `null` を送信

`ProjectCreatePage.tsx` の 232-235行目で、必須フィールドが空の場合に `null` を送信していた:

```typescript
// 修正前（❌ 間違い）
payload.app_categories = formData.appCategories.length > 0 ? formData.appCategories : null;
payload.monthly_revenue = formData.monthlyRevenue ? parseInt(...) : null;
payload.monthly_cost = formData.monthlyCost ? parseInt(...) : null;
payload.appeal_text = formData.appealText || null;
```

### 2. バックエンドの厳格な検証

`validator.go` の `validateCreatePostRequest` 関数（169-197行）で、transactionタイプの投稿には以下のフィールドが**必須**:

```go
// transaction タイプの投稿で必須のフィールド
if req.Type == models.PostTypeTransaction {
    if req.Price == nil {
        return fmt.Errorf("price is required for transaction type posts")
    }
    if req.AppCategories == nil || len(req.AppCategories) == 0 {
        return fmt.Errorf("app_categories is required for transaction type posts")
    }
    if req.MonthlyRevenue == nil {
        return fmt.Errorf("monthly_revenue is required for transaction type posts")
    }
    if req.MonthlyCost == nil {
        return fmt.Errorf("monthly_cost is required for transaction type posts")
    }
    if req.AppealText == nil || len(*req.AppealText) < 50 {
        return fmt.Errorf("appeal_text is required and must be at least 50 characters")
    }
    if req.EyecatchURL == nil {
        return fmt.Errorf("eyecatch_url is required for transaction type posts")
    }
    if req.DashboardURL == nil {
        return fmt.Errorf("dashboard_url is required for transaction type posts")
    }
    if req.UserUIURL == nil {
        return fmt.Errorf("user_ui_url is required for transaction type posts")
    }
    if req.PerformanceURL == nil {
        return fmt.Errorf("performance_url is required for transaction type posts")
    }
}
```

### 3. ミスマッチ

- フロントエンド: 必須フィールドが空の場合に `null` を送信
- バックエンド: `null` の場合に検証エラーを返す
- 結果: **400 Bad Request**

## 修正内容

### `/frontend/appexit/components/pages/ProjectCreatePage.tsx`

```typescript
// 修正後（✅ 正しい）
if (formData.type === 'transaction') {
  // バックエンドに送信する前に必須フィールドをチェック
  const missingFields: string[] = [];

  if (!eyecatchPath) missingFields.push('アイキャッチ画像');
  if (!dashboardPath) missingFields.push('管理画面画像');
  if (!userUiPath) missingFields.push('ユーザーUI画像');
  if (!performancePath) missingFields.push('パフォーマンス画像');
  if (!formData.appCategories || formData.appCategories.length === 0) {
    missingFields.push('アプリのカテゴリー');
  }
  if (!formData.monthlyRevenue) missingFields.push('月間売上');
  if (!formData.monthlyCost) missingFields.push('月間コスト');
  if (!formData.appealText || formData.appealText.length < 50) {
    missingFields.push('アピールポイント（50文字以上必須）');
  }

  // 必須フィールドが不足している場合はエラーを表示
  if (missingFields.length > 0) {
    alert(`以下の必須項目が入力されていません:\n\n${missingFields.join('\n')}`);
    setIsSubmitting(false);
    return;
  }

  // すべての必須フィールドが揃っているので、nullなしで送信
  payload.app_categories = formData.appCategories;
  payload.monthly_revenue = parseInt(formData.monthlyRevenue) * parseInt(formData.monthlyRevenueUnit);
  payload.monthly_cost = parseInt(formData.monthlyCost) * parseInt(formData.monthlyCostUnit);
  payload.appeal_text = formData.appealText;
}
```

## 修正の効果

### 修正前
1. ユーザーが必須フィールドを入力せずに送信ボタンを押す
2. 画像はアップロードされる
3. バックエンドが 400 エラーを返す
4. ユーザーに「HTTP 400: Bad Request」という曖昧なエラーメッセージが表示される

### 修正後
1. ユーザーが必須フィールドを入力せずに送信ボタンを押す
2. **フロントエンドが事前にチェック**
3. **不足しているフィールドを具体的にリストアップ**
4. ユーザーに分かりやすいエラーメッセージを表示:
   ```
   以下の必須項目が入力されていません:

   月間売上
   月間コスト
   アピールポイント（50文字以上必須）
   ```
5. 不要な画像アップロードやAPIリクエストを防ぐ

## transactionタイプの投稿で必須のフィールド一覧

| フィールド名 | 日本語名 | 検証ルール |
|-------------|---------|-----------|
| `price` | 価格 | 0以上の整数 |
| `app_categories` | アプリカテゴリー | 空でない配列 |
| `monthly_revenue` | 月間売上 | 0以上の整数 |
| `monthly_cost` | 月間コスト | 0以上の整数 |
| `appeal_text` | アピールポイント | 50文字以上 |
| `eyecatch_url` | アイキャッチ画像 | 文字列（画像パス） |
| `dashboard_url` | 管理画面画像 | 文字列（画像パス） |
| `user_ui_url` | ユーザーUI画像 | 文字列（画像パス） |
| `performance_url` | パフォーマンス画像 | 文字列（画像パス） |

## テスト推奨項目

### 成功ケース
- [ ] すべての必須フィールドを入力して送信 → 成功

### エラーケース
- [ ] 月間売上を空にして送信 → 「月間売上」が不足していると表示
- [ ] 月間コストを空にして送信 → 「月間コスト」が不足していると表示
- [ ] アピールポイントを49文字にして送信 → 「50文字以上必須」と表示
- [ ] アプリカテゴリーを選択せずに送信 → 「アプリのカテゴリー」が不足していると表示
- [ ] 複数のフィールドを空にして送信 → すべての不足フィールドがリストされる

## 今後の改善案

### 1. リアルタイムバリデーション
現在は送信時にのみ検証しているが、各フィールドの入力時に即座にエラーを表示することで、ユーザー体験を向上できる。

### 2. フィールド別エラー表示
アラートではなく、各入力フィールドの下に赤いエラーメッセージを表示する。

### 3. 進捗バーの色変更
必須フィールドが未入力のステップを赤やオレンジで強調表示する。

### 4. バックエンドのエラーメッセージ改善
現在は`http.Error(w, fmt.Sprintf("Validation error: %v", err), http.StatusBadRequest)`で汎用的なエラーを返しているが、構造化されたJSONエラーレスポンスを返すようにする:

```go
// 改善案
type ValidationErrorResponse struct {
    Message string              `json:"message"`
    Errors  map[string]string   `json:"errors"` // field -> error message
}
```

これにより、フロントエンドがフィールドごとのエラーを表示できるようになる。

## まとめ

### 問題の本質
フロントエンドとバックエンドの検証ロジックが不整合で、必須フィールドに `null` が送信されていた。

### 解決策
フロントエンドで事前検証を行い、必須フィールドが揃っていない場合は送信を防ぐ。

### 効果
- ユーザーに分かりやすいエラーメッセージ
- 不要なAPIリクエストの削減
- データ整合性の向上
