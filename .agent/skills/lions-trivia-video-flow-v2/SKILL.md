---
name: lions-trivia-video-flow
description: 埼玉西武ライオンズのトリビア動画を生成するための一連のワークフロー（データ収集から動画レンダリングまで）をガイドします。Claude/Codex/Gemini の三者協調による台本生成と、必須の人手チェック工程を含みます。過去台本の学習・参照機能を含みます。
---

# Lions Trivia 動画制作フロー

## ワークフローの概要

1. **データ収集**: 試合結果、ニュース、ファンの反応を収集
2. **台本生成 (三者協調)**:
   - **Phase A** — Claude (Director): 過去台本学習 → 戦略立案 + outline設計
   - **Phase B** — Gemini (Writer): 対話台本の生成
   - **Phase C** — Codex (Editor): 事実/フォーマット検証・機械修正
   - **Phase D** — Claude (Reviewer): 品質レビュー + outline改善
   - PASSするまで Phase B→C→D を反復
3. **★人手チェック**: 生成された台本の確認・修正（必須）
4. **メディア合成**: 音声(TTS)、字幕、画像アセットの生成
5. **動画レンダリング**: 最終的な動画ファイルの出力

## 各AIの役割分担

| AI | 役割 | 得意領域 |
|---|---|---|
| **Claude** (Director/Reviewer) | 過去台本学習・戦略立案・品質判定・outline設計 | 深い推論・分析、ファクトチェック、多面的品質評価 |
| **Gemini** (Writer) | 対話台本の生成 | 巨大コンテキスト窓(1M+)、自然な日本語対話、創造的文章力 |
| **Codex** (Editor) | 事実/フォーマット検証・修正 | 高速な構造化検証、ルールベースの機械修正 |

---

## ステップごとの手順

### 1. データ収集 (Phase 1)

```bash
python scripts/step1_fetch_data.py --date YYYY-MM-DD
```
- 出力先: `output/workflow/YYYY-MM-DD/context.txt`

---

### 2. 台本生成 (Phase 2) — 三者協調

#### 一括実行（推奨）

```bash
# 1回実行（plan → generate → validate → review）
make step2-auto DATE=YYYY-MM-DD

# 反復実行（Claude PASS まで自動ループ）
make step2-agentic DATE=YYYY-MM-DD AUTO_ITERATIONS=2
```

#### 個別実行

```bash
# Phase A: Claude が過去台本を学習して戦略 + outline を設計
make step2-plan DATE=YYYY-MM-DD

# Phase B: Gemini が台本生成
make step2-from-outline DATE=YYYY-MM-DD USE_DIRECTIVES=1

# Phase C: Codex が事実/フォーマット検証
make step2-validate DATE=YYYY-MM-DD

# Phase D: Claude が品質レビュー
make step2-review DATE=YYYY-MM-DD
```

#### フロー詳細

```
Claude (Phase A: 過去台本学習 → plan) --> Gemini (Phase B: generate) --> Codex (Phase C: validate) --> Claude (Phase D: review)
                                                   ^                                                              |
                                                   |                        PASS -> 完了                         |
                                                   +----------------------- NG -> outline改善して再生成 ----------+
```

**生成ファイル:**
- `codex_directives.txt`: Claude が作成する戦略指示書（過去台本の知見を含む）
- `script_outline.txt`: 30ターン構成計画（Claude が設計、レビュー時に改善）
- `script.txt`: Gemini が生成する対話台本
- `review_feedback.txt`: Claude のレビュー結果（`PASS` or 改善フィードバック）

---

### Phase A の詳細手順（Claude が実行）

#### Step A-1: 過去台本の学習

`codex_directives.txt` を書く前に、必ず以下を実行すること。

**1. 対象ディレクトリの特定**

`output/workflow/` 配下の `YYYY-MM-DD` 形式のディレクトリを日付降順で並べ、
今日の日付を除いた直近2〜3件を学習対象とする。
（`company_*` などの非日付ディレクトリは除外する）

**2. 各ディレクトリから以下を読み込む**

| ファイル | 読み込む内容 | 用途 |
|---|---|---|
| `script_outline.txt` | 冒頭の `arc:` と `opening:` の値 | 今回の回避パターンリスト作成 |
| `script.txt` | 先頭から非空行20行 | Geminiへの会話スタイル参照例 |
| `review_feedback.txt` | 存在すれば全文 | 繰り返してはいけないNGパターンの把握 |

**3. 学習結果を `codex_directives.txt` に組み込む**

以下の3セクションを `codex_directives.txt` の末尾に追加する:

```
【過去台本から学んだ回避パターン】
- YYYY-MM-DD: arc=xxx, opening=xxx  ← 今回は選ばない
- YYYY-MM-DD: arc=xxx, opening=xxx  ← 今回は選ばない

【過去台本スタイル参照（会話の自然さ・流れの参考。内容をそのまま再利用しないこと）】
（直近1〜2件の script.txt 冒頭20行を抜粋して貼る）

【過去レビューから学んだNG（繰り返し禁止）】
（review_feedback.txt の主要指摘を箇条書きで要約する。
  例: 「ペルソナ呼称ルール（〜くん/〜選手）が守られていなかった」
      「具体的な場面引用がなく抽象的な発話になっていた」）
```

> **各エージェントへの伝達について**: `codex_directives.txt` に組み込むことで、
> Gemini（Phase B）とCodex（Phase C）が自動的に受け取る。
> 各エージェントへ個別に指示する必要はない。

#### Step A-2: 戦略立案・outline設計

学習結果を踏まえた上で、通常通り `codex_directives.txt` と `script_outline.txt` を作成する:

```bash
make step2-plan DATE=YYYY-MM-DD
```

- arc/opening は上記の回避パターンと被らない型を選ぶ
- 過去のレビューNGパターンを踏まえて outline のビートを設計する

---

### 3. 【重要】人手チェック (Human Review)

生成された台本（`script.txt`）の内容を確認する。

- **チェック項目**:
  - 事実関係（勝敗、スコア、選手名）の誤りがないか
  - ペルソナの言葉遣い（敬語、呼称ルール等）が自然か
  - YouTube等のポリシーに抵触する表現がないか
- **修正方法**: `script.txt` を直接編集して保存する
- **完了通知**: 修正が終わったら、次のステップへ進むことをエージェントに伝える

---

### 4. メディア合成 (Phase 3-6)

```bash
python scripts/step3_generate_audio.py --date YYYY-MM-DD
python scripts/step4_generate_subtitles.py --date YYYY-MM-DD
python scripts/step5_gather_assets.py --date YYYY-MM-DD
python scripts/step6_process_images.py --date YYYY-MM-DD
```

### 5. 動画レンダリング (Phase 7)

```bash
python scripts/step7_render_video.py --date YYYY-MM-DD
```
- 出力先: `output/workflow/YYYY-MM-DD/video.mp4`

---

## トラブルシューティング

- **step2-agentic が PASS しない**: `review_feedback.txt` を確認し、Claude の指摘事項を手動で `script_outline.txt` に反映してから `make step2-from-outline` で再生成する
- **過去台本が見つからない**: `output/workflow/` に `YYYY-MM-DD` 形式のディレクトリがなければ学習スキップで問題なし
- **ペルソナの性格調整**: `config/personas/*.json` を編集する
