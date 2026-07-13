# DDR Flare Skill Simulator

DDR のフレアスキルをシミュレーションするツール。ブックマークレットで DDR World からスコアデータを取得し、新規スコア追加・既存更新・候補曲管理などのシミュレーションが行えます。

> **【2026年7月 更新】** DDR World 公式ページの HTML 構造変更に伴い、ブックマークレットを更新しました。以前に登録済みの方は下記手順で**再登録**してください（旧版のままだと DDR World ページ上で「データが見つかりません」となります）。

## ブックマークレットの登録方法

1. **[シミュレータを開く](https://harug5152.github.io/ddr-flareskill-simulator/)** — ページ右上の「？」ボタン → **ブックマークレット登録** セクションを開く
2. 「コードをコピー」ボタンを押す
3. ブラウザのブックマークを新規作成し、URL 欄にコピーしたコードをそのままペーストして保存する
4. KONAMI の **DDR World** にログインし、フレアスキル対象楽曲ページでブックマークを実行する
5. データ送信後、自動でシミュレータが開く

## Tech Stack

- **Frontend**: HTML / CSS / JavaScript（単一ファイル構成）
- **Backend**: [Supabase](https://supabase.com)（PostgreSQL）
- **Deploy**: GitHub Actions → GitHub Pages
- **Dev**: Claude Code (Sonnet)

## Files

| File | Description |
|------|-------------|
| `index.html` | シミュレータ本体 |
| `bookmarklet.js` | フレアスキルページからデータを取得するブックマークレット。Supabase に POST |
| `config.js` | Supabase 接続情報（gitignore 済み） |
| `.github/workflows/deploy-pages.yml` | main ブランチ → GitHub Pages |
| `.github/workflows/cleanup.yml` | 有効期限切れレコード削除（週次） |

## Self-hosting

Supabase プロジェクトを用意し、`bookmarklet.js` と `config.js` の接続情報を書き換えるだけで自分のスコアデータで動かせます。

## Data Policy

ブックマークレットは KONAMI 公式の DDR World ページ上の楽曲スコアデータ（楽曲名・難易度・レベル・フレアランク・フレアスキル値）のみを取得します。プレイヤー名・アカウント情報・その他の個人情報は一切取得しません。取得データは Supabase に保存され、最終アクセスから 90 日後に自動削除されます。
