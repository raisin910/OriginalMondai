# OriginalMondai
試験勉強をサポートするためのWebアプリケーションです。Excelで作成した問題集を読み込み、ランダムに問題を出題して学習効率を高めます。

## 機能

- **Excelファイルからの問題読み込み**：A列に問題、B列に回答が入力されたExcelファイルから問題を読み込みます
- **ランダム出題**：問題をランダムに表示して学習できます
- **採点機能**：回答の正誤判定と解説を表示します
- **統計機能**：正解率や間違えやすい問題のランキングを表示します
- **データ保存**：ブラウザのローカルストレージを使用して学習データを保存します

## 使い方

1. Excelファイルを用意します（A列：問題文、B列：回答）
2. 「問題ファイルを選択」からExcelファイルをアップロードします
3. 「読み込み」ボタンをクリックして問題集を読み込みます
4. 問題に回答し、「回答する」ボタンをクリックします
5. フィードバックを確認し、「次の問題」をクリックして次に進みます

## データの保存について

- このアプリはブラウザのローカルストレージを使用して学習データを保存します
- 保存データをクリアする場合は「保存データをクリア」ボタンをクリックしてください

## 技術情報

- HTML/CSS/JavaScriptで構築されたクライアントサイドWebアプリケーション
- SheetJS（xlsx）ライブラリを使用してExcelファイルを読み込み
- レスポンシブデザインで様々なデバイスに対応

## カスタマイズ

このアプリは以下のように拡張することができます：

- 問題カテゴリの追加
- タイマー機能
- 問題の編集機能
- 複数の問題集を管理する機能

## ライセンス

MITライセンス
