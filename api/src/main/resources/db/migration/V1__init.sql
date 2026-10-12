-- 初期マイグレーション。Flyway の履歴の起点にするだけでテーブルは作らない。
--
-- 規約:
--   - テーブルはモジュールが所有し、名前に `<module>_` を付ける（例: match_matches, analysis_play_logs）
--   - 他モジュールのテーブルに FK を張らない。参照は ID（ULID 文字列）だけ
--   - ファイル名は V<連番>__<module>_<内容>.sql
SELECT 1;
