# スコアサーバ実装計画

## 現在の実装状況

### 🟢 完了済み
- **WebAuthn認証機能**: パスキー認証の基本機能は実装済み
  - 登録: `/register-request`, `/register-response`
  - サインイン: `/signin-request`, `/signin-response`
- **ゲーム機能**: 完全に実装済み
  - スコア計算システム
  - ステージ進行システム
  - 難易度選択システム
  - ローカル履歴保存 (`localStorage`)
- **データベーススキーマ**: 基本構造は定義済み
  - `users` テーブル
  - `passkeys` テーブル
  - `scores` テーブル（スキーマ定義済み）

### 🟡 部分実装済み
- **認証UI**: 登録画面は実装済みだが、ゲームとの統合が未完了
- **データベース**: スキーマ定義済みだが、scoresテーブルのマイグレーションが未実行

### 🔴 未実装
1. **認証状態管理**: ログイン状態の保持・管理
2. **スコア関連API**: スコア登録・取得・ランキング
3. **ゲーム統合**: 認証とゲームの統合
4. **ランキング表示**: スコアランキング機能

## 実装計画

### Phase 1: データベース・API基盤構築

#### 1.1 データベースマイグレーション
- [ ] `scores` テーブルのマイグレーション実行
- [ ] 必要に応じてスキーマ調整

#### 1.2 スコア関連Repository実装
- [ ] `backend/src/repository/scores.ts` の作成
- [ ] スコア登録・取得・ランキング取得の関数実装

#### 1.3 スコア関連API実装
- [ ] `POST /scores` - スコア登録
- [ ] `GET /scores/ranking` - ランキング取得
- [ ] `GET /scores/user/:userId` - ユーザー個人スコア履歴取得

### Phase 2: 認証状態管理

#### 2.1 ユーザー情報取得API
- [ ] `GET /user/me` - 現在のユーザー情報取得
- [ ] セッション管理の実装

#### 2.2 フロントエンド認証状態管理
- [ ] 認証状態を管理するContextの作成
- [ ] ログイン状態の永続화

### Phase 3: ゲーム統合

#### 3.1 認証フロー統合
- [ ] ゲーム開始前の認証チェック
- [ ] 未認証時の登録・ログイン画面表示
- [ ] 認証成功後のゲーム開始

#### 3.2 スコア登録機能
- [ ] ゲームオーバー時の自動スコア登録
- [ ] スコア登録失敗時のハンドリング

### Phase 4: ランキング表示

#### 4.1 ランキング画面作成
- [ ] ランキング表示コンポーネント作成
- [ ] 個人スコア履歴表示
- [ ] フィルタリング機能（期間、難易度など）

#### 4.2 UI/UX改善
- [ ] ランキング画面へのナビゲーション追加
- [ ] スコア登録時の視覚的フィードバック

## 詳細実装仕様

### データベース設計

#### scores テーブル拡張
現在のスキーマに加えて、以下の情報を含める：
- `score`: 実際のスコア値
- `stage`: 到達ステージ
- `difficulty`: 最終ステージの難易度
- `created_at`: 記録日時
- `game_version`: ゲームバージョン

```sql
-- スキーマ拡張案
ALTER TABLE scores ADD COLUMN score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE scores ADD COLUMN stage INTEGER NOT NULL DEFAULT 1;
ALTER TABLE scores ADD COLUMN difficulty TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE scores ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
```

### API設計

#### POST /scores
```typescript
// リクエスト
{
  score: number;
  stage: number;
  difficulty: 'easy' | 'medium' | 'hard';
  version: string;
}

// レスポンス
{
  success: boolean;
  ranking?: number; // 全体ランキング順位
}
```

#### GET /scores/ranking
```typescript
// クエリパラメータ
{
  limit?: number; // デフォルト50
  offset?: number; // デフォルト0
  difficulty?: 'easy' | 'medium' | 'hard';
  period?: 'daily' | 'weekly' | 'monthly' | 'all'; // デフォルト'all'
}

// レスポンス
{
  rankings: Array<{
    rank: number;
    username: string;
    score: number;
    stage: number;
    difficulty: string;
    created_at: string;
  }>;
  total: number;
  user_rank?: number; // ログインユーザーの順位
}
```

### 認証フロー設計

#### ゲーム開始時の認証チェック
1. ページ読み込み時に認証状態を確認
2. 未認証の場合は認証画面を表示
3. 認証済みの場合はゲーム画面を表示

#### スコア登録時の認証確認
1. ゲームオーバー時に認証状態を再確認
2. 認証が切れている場合は再認証を促す
3. 認証成功後にスコアを登録

### セキュリティ考慮事項

#### スコア不正防止
- ゲームセッション時間の妥当性チェック
- スコア値の上限チェック
- 短時間での大量登録防止

#### 認証セキュリティ
- セッション有効期限の設定
- CSRF対策
- レート制限の実装

## 実装優先度

### 高優先度 (Phase 1)
1. データベースマイグレーション
2. スコア関連API実装
3. 基本的な認証状態管理

### 中優先度 (Phase 2-3)
1. ゲーム統合
2. スコア登録機能
3. 基本的なランキング表示

### 低優先度 (Phase 4)
1. 高度なランキング機能
2. UI/UX改善
3. 分析・統計機能

## 想定作業時間

- **Phase 1**: 約3-4時間
- **Phase 2**: 約2-3時間
- **Phase 3**: 約2-3時間
- **Phase 4**: 約2-4時間

**総計**: 約9-14時間（テスト・デバッグ含む）

## 次のステップ

1. Phase 1から順次実装開始
2. 各Phaseの完了後に動作確認とテスト
3. 必要に応じて設計の調整
4. 本番環境への段階的デプロイ