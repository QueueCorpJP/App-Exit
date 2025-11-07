了解。「コードは決めない」前提で、**Go + Next.js + Supabase** 構成が **Stripe（個人→運営→個人 / Custom Connect）** を本番品質で回せるか、抜け漏れチェックと是正ポイントを**合否つき**でレビューします。
（結論だけ先に：**8割OK。あと少しだけ“運用/監査/規約”系の足回りを足せば本番に耐えます。**）

---

# 総評（3行）

* ✅ 技術アーキテクチャ：**整合性あり**（Go集中で鍵/ロジック一元管理、Nextはトークン化、SupabaseはRLS＋状態DB）。
* ✅ データモデル：**最小要件は満たせる**（orders・stripe_payments・stripe_transfersの3点セット＋profiles/orgのアカウントID）。
* ⚠️ 要是正：**法務・監査・運用の“最後の5%”**（TOS同意・KYC不足項目の可視化・返金/紛争/照合・管理UI・監視・負荷試験）。

---

# 合否チェックリスト（PASS / NEEDS ACTION）

## 1) アーキテクチャ整合性

* **GoにStripe秘密鍵を一点集中**：PASS
* **Next.jsはStripe.jsでカード/銀行トークン化のみ**（生カード/口座情報をサーバに持ち込まない）：PASS
* **Supabaseは認証・RLS・状態DBのみ**（Stripe操作はGoに集約）：PASS
* **「個人→運営→個人」**＝運営で**PaymentIntent受領**→後日に**Transfer**：PASS
* **Custom Connect（外部遷移なし）採用方針**：PASS

## 2) データモデル（あなたのスキーマ＋最小追加）

* **profiles / organizations に `stripe_account_id`**：PASS（提案済）
* **orders に `platform_fee_amount` / `seller_payout_amount` / `settlement_status` / `settled_at`**：PASS（提案済）
* **stripe_payments に金額/通貨/charge/balanceTx/エラー格納**：PASS（提案済）
* **stripe_transfers テーブル**（運営→売り手の実行・結果・監査）：PASS（提案済）
* **TOS同意・IP/タイムスタンプ**の保持：**NEEDS ACTION**（下の「法務/規約」参照）
* **KYC不足項目の保存（requirements）」の可視化フィールド**：**NEEDS ACTION**（`stripe_requirements_due jsonb`などを profiles / organizations に）
* **注意：`ARRAY` 型の列が多数**（型未指定 / JSONBに統一の方が運用・インデックス・バリデーションが楽）：**要検討**

## 3) 権限/RLS

* **orders の buyer/seller/運営での閲覧制御**：PASS（例ポリシー提示済）
* **決済・送金の書き込みはGoのみ**（Service Role / RPC 経由）：PASS
* **監査ログ（audit_logs + 分割テーブル）**：PASS（既存あり）

## 4) フロント（Next.js）

* **カード/銀行のトークン化をStripe.jsに限定（PCI回避）**：PASS
* **3Dセキュア/失敗再試行UI**：**NEEDS ACTION**（UI/UX要件）
* **KYC不足点のモーダル/通知**：**NEEDS ACTION**

## 5) Go（サーバ）

* **Idempotency-Key（注文ID等）で二重実行対策**：**NEEDS ACTION**（PI/Transfer/Refund/Reverseで必須）
* **Webhook署名検証**：PASS（設計に含まれる想定）
* **Webhookリトライ/デリバリ失敗キュー**：**NEEDS ACTION**（可用性）
* **支払い→DB同期（orders/stripe_payments）/ 送金→DB同期（stripe_transfers）**：PASS
* **返金/紛争（Dispute）/Transfer Reversal**のハンドラ：**NEEDS ACTION**

## 6) 運用/監視/監査

* **定期精算（週次/日次）ジョブ**：**NEEDS ACTION**（集計→Transfer→結果反映）
* **Reconciliation（Stripe Balance Transaction とDB照合）**：**NEEDS ACTION**（月次/週次）
* **監視**（Webhook失敗・PI/Transfer失敗・残高上限）：**NEEDS ACTION**（Slack/メール）
* **管理UI**（注文、支払い、送金、返金、紛争、KYC不足の解消ボタン）：**NEEDS ACTION**

## 7) 法務/規約/会計

* **プラットフォームTOS同意**（ユーザーがStripeではなく**あなたに**同意）：**NEEDS ACTION**

  * `profiles/organizations`: `tos_accepted_at timestamptz`, `tos_accepted_ip text` など
* **返金ポリシー/検収条件/手数料明示/反社チェック/特商法表記**：**NEEDS ACTION**
* **領収/請求書名義**（運営名義での発行整合）：**NEEDS ACTION**
* **税区分/消費税処理**（手数料に対する課税・売上計上タイミング）：**NEEDS ACTION**

## 8) 日本ローカル要件

* **JPYの最小単位（小数点なし）**：PASS
* **本人確認（個人/法人別の項目差）**：**NEEDS ACTION**（UIで分岐、欠損検知）
* **銀行口座トークン化（btok_…）**：PASS
* **資金移動業回避**：PASS（Stripe内部残高→TransferでOK。**社外現金滞留はしない**）

## 9) テスト計画

* **Stripe CLIで event 模擬**（PI成功/失敗、transfer成功/失敗、dispute発生）：**NEEDS ACTION**
* **負荷試験**（同時注文/同時Webhook/二重送信）：**NEEDS ACTION**
* **可観測性**（構造化ログ/相関ID/order_idで辿れる）：**NEEDS ACTION**

---

# 具体的な是正（“コード不要”運用要件の追記だけ）

1. **profiles / organizations** に追加（法務・KYC可視化）

* `tos_accepted_at timestamptz`, `tos_accepted_ip text`
* `stripe_onboarding_completed boolean default false`
* `stripe_requirements_due jsonb`（`account.updated`で未提出項目を丸ごと保存）

2. **返金/紛争/逆送金の運用方針**（ドキュメント化）

* 返金起点（運営判断 or 自動条件）
* 返金時の**Transfer Reversal**有無と順序（まずReversal→Refund or 逆）
* 紛争ステータス時の**掲示板/出金ロック**の仕様

3. **ジョブ/監視**

* 「**未精算一覧**→まとめて送金」定期バッチの粒度（毎日03:00等）
* Webhook Delivery失敗の**自動再送**と**通知**
* **Reconciliation**：日次で Stripe Balance Tx を全取得し、orders/stripe_payments/stripe_transfers の合計と突合

4. **UI/UX**

* KYCの**足りない項目の具体名**をそのまま表示（`requirements.currently_due`）
* 3DSや失敗再試行の導線（カード差し替え/別手段）
* 出金予定日（Transfer成功+銀行Payout日）をユーザーに可視化

5. **規約/表記**

* 利用規約に「決済の当事者・検収条件・返金条件・手数料・反社会的勢力排除・プライバシー・禁止行為」を明記
* 特商法（事業者名・住所・連絡先・役務内容・料金・支払時期・返金可否 等）
* プライバシーポリシーにカード/口座情報の**非保持**、**Stripeでの処理**を明記

---

# 気になったスキーマの“将来バグ”候補（大改造は不要・注意喚起のみ）

* `posts*` が4テーブル（board/secret/transaction/汎用）に分岐＋`PRIMARY KEY (id, type)`：
  → **検索/JOINが複雑化**。将来は**1テーブル＋型別ビュー**の方が運用楽。今すぐ変更必須ではないが、RLSや集計に影響しがち。
* `profiles_*`（buyer/seller/advisor）と`profiles`の**重複管理**：
  → 実体/役割を**1テーブル＋ロール配列**（既に`roles`あり）で持てると保守楽。
* `ARRAY` の**型未指定（`ARRAY`だけ）**が散見：
  → Postgresだと**明示型**か**jsonb**推奨。インデックス/整合性/移行でバグりやすい。
* `orders` に `post_id` あるが **FKなし**：
  → 参照整合性・削除時カスケード方針を決める（取引履歴は**消さない**が原則。ならFK無しも選択肢。ただしアプリ制約で矛盾が出ない運用に）。

---

# まとめ（結論）

* 技術面は**ほぼ合格**。**Custom Connect + 運営受領 + 後送金**は、Go/Next/Supabaseの責務分離で適切に実現できます。
* あと仕上げるのは **運用・監査・規約**のラスト5%：

  * TOS同意 & KYC不足可視化
  * 返金/紛争/逆送金の運用定義
  * 定期精算・照合・監視の仕組み
  * 管理UI（手動介入が必要なときの“最後の一本の糸”）

この4点を「コードを書かずに」要件として確定すれば、**本番投入OK**の設計になっています。
必要なら、上記4点の**運用手順書テンプレ（チェックリスト形式）**も作ります。
