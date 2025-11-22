# 勉強時間管理アプリ

勉強時間を記録・管理するPWAアプリケーションです。ユーザーはスタート/ストップボタンで勉強時間を計測し、教科別に記録できます。管理者は全ユーザーのデータを閲覧可能です。

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript
- **UI**: React + Tailwind CSS
- **状態管理**: Zustand
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **日時処理**: date-fns
- **通知**: react-hot-toast

## 主要機能

### 1. 認証機能
- メールアドレスとパスワードによるユーザー登録・ログイン
- セッション管理とログアウト

### 2. 記録機能
- スタート/ストップボタンで勉強時間を計測
- 教科選択（算数、国語、理科、社会、指定なし）
- 当日の合計勉強時間表示
- セッションの手動追加・編集・削除

### 3. 履歴機能
- 日別サマリー表示
- 日別詳細表示（各セッションの詳細）

### 4. 管理者機能
- 全ユーザーの一覧表示
- ユーザー別の学習履歴閲覧

## セットアップ手順

### 1. 環境変数の設定

`.env.local` ファイルが既に設定されています：

```env
NEXT_PUBLIC_SUPABASE_URL=https://punfnxqmfilpbgxgcjbc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

### 2. Supabaseデータベースのセットアップ

**重要**: 以下の手順でデータベースをセットアップする必要があります。

1. [Supabaseダッシュボード](https://supabase.com/dashboard) にアクセス
2. プロジェクトを開く
3. 左サイドバーから **SQL Editor** を選択
4. `supabase-setup.sql` ファイルの内容をコピー&ペースト
5. 「Run」ボタンをクリックして実行

このSQLファイルは以下を作成します：
- `users` テーブル
- `study_sessions` テーブル
- インデックス
- 自動更新トリガー
- Row Level Security (RLS) ポリシー
- 新規ユーザー登録時の自動プロフィール作成トリガー

### 3. 依存パッケージのインストール

```bash
npm install
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

アプリは [http://localhost:3000](http://localhost:3000) で起動します。

### 5. 初期管理者アカウントの作成

1. アプリで新規アカウントを作成
2. Supabaseダッシュボードの **SQL Editor** で以下を実行：

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

## プロジェクト構造

```
studytimer/
├── app/
│   ├── (auth)/              # 認証関連ページ
│   │   ├── login/
│   │   └── signup/
│   ├── (protected)/         # 認証必須ページ
│   │   ├── page.tsx         # 記録画面
│   │   ├── history/         # 履歴画面
│   │   └── admin/           # 管理者画面
│   ├── api/
│   │   └── auth/callback/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── auth/                # 認証コンポーネント
│   ├── record/              # 記録コンポーネント
│   ├── history/             # 履歴コンポーネント
│   ├── admin/               # 管理者コンポーネント
│   ├── layout/              # レイアウトコンポーネント
│   └── ui/                  # UI共通コンポーネント
├── lib/
│   ├── supabase/            # Supabaseクライアント
│   ├── store/               # Zustand状態管理
│   └── utils/               # ユーティリティ関数
├── types/                   # TypeScript型定義
├── middleware.ts            # 認証ミドルウェア
├── supabase-setup.sql       # データベースセットアップSQL
└── .env.local               # 環境変数
```

## 使い方

### 一般ユーザー

1. **新規登録**: `/signup` でアカウントを作成
2. **ログイン**: `/login` でログイン
3. **勉強を記録**:
   - 教科を選択
   - スタートボタンをクリック
   - 勉強終了後、ストップボタンをクリック
4. **履歴を確認**: フッターの「履歴」タブから過去の記録を閲覧
5. **手動追加**: 記録画面の「手動追加」ボタンから過去のセッションを追加

### 管理者

1. 管理者権限を付与されたアカウントでログイン
2. フッターの「管理」タブをクリック
3. ユーザー一覧から任意のユーザーを選択
4. そのユーザーの学習履歴を閲覧

## データベーススキーマ

### users テーブル

| カラム名 | データ型 | 説明 |
|---------|---------|------|
| user_id | UUID | ユーザーID（主キー） |
| email | VARCHAR(255) | メールアドレス |
| name | VARCHAR(100) | ユーザー名 |
| role | VARCHAR(20) | 権限（user/admin） |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

### study_sessions テーブル

| カラム名 | データ型 | 説明 |
|---------|---------|------|
| session_id | UUID | セッションID（主キー） |
| user_id | UUID | ユーザーID（外部キー） |
| subject | VARCHAR(20) | 教科 |
| start_time | TIMESTAMPTZ | 開始時刻 |
| end_time | TIMESTAMPTZ | 終了時刻 |
| duration_minutes | INTEGER | 勉強時間（分） |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

## セキュリティ

- Row Level Security (RLS) を使用してデータアクセスを制限
- ユーザーは自分のデータのみ閲覧・編集可能
- 管理者は全ユーザーのデータを閲覧可能（編集は不可）
- Supabase Auth による安全な認証

## トラブルシューティング

### データベースエラーが発生する

- Supabaseダッシュボードで `supabase-setup.sql` が正しく実行されたか確認
- RLSポリシーが有効になっているか確認

### ログインできない

- メールアドレスとパスワードが正しいか確認
- Supabaseダッシュボードの Authentication > Users でユーザーが作成されているか確認

### 管理者画面が表示されない

- ユーザーのroleが'admin'に設定されているか確認：

```sql
SELECT role FROM users WHERE email = 'your-email@example.com';
```

## 今後の拡張案

- PWA対応（オフライン機能、ホーム画面追加）
- 統計・グラフ機能
- 目標設定とプログレスバー
- 教科別統計
- CSVエクスポート
- プッシュ通知

## ライセンス

MIT

## 開発者

このアプリは指示書に基づいてClaude Codeによって開発されました。
