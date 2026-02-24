# AI Study Assistant

D1 × Geminiによる過去問演習AI。独自の資料を解析して問題を自動生成するフルスタックアプリケーションです。

## 概要

このプロジェクトは、メインポートフォリオの一部として統合されています。
フロントエンドは Next.js (Static Export) で構築され、API は Cloudflare Pages Functions (`/functions/study-assistant`) として実装されています。

## データ管理

1. **PDFの準備**: `data/pdf_exams/` 内に解説付きのPDFを配置します。
2. **インポートの実行**:
   ```bash
   cd study-assistant
   # ローカルD1へインポート
   node scripts/import-pdf-questions.mjs
   
   # リモートD1へインポート
   node scripts/import-pdf-questions.mjs --remote
   ```

## 開発とプレビュー

1. **ビルド**:
   ```bash
   npm run build # app/study-assistant に出力されます
   ```
2. **ローカル実行**:
   プロジェクトのルートディレクトリで以下を実行してください。
   ```bash
   npx wrangler pages dev ./app
   ```
