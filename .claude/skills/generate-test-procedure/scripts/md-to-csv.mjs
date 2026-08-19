/**
 * テスト仕様書 MD → CSV 変換スクリプト
 *
 * 使い方: node md-to-csv.mjs <input.md> [output.csv]
 *
 * 出力先を省略した場合、入力ファイルと同じディレクトリに .csv で出力する。
 * Excel での文字化けを防ぐため UTF-8 BOM を付与する。
 */

import { readFileSync, writeFileSync } from "fs";

// --- エラーハンドリング ---

function fail(what, cause, fix) {
  console.error(`[ERROR] ${what}`);
  console.error(`  Cause: ${cause}`);
  console.error(`  Fix: ${fix}`);
  process.exit(1);
}

// --- 引数チェック ---

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath) {
  fail(
    "入力ファイルが指定されていません",
    "第1引数に MD ファイルのパスが必要です",
    "node md-to-csv.mjs <input.md> [output.csv]",
  );
}

// --- ファイル読み込み ---

let content;
try {
  content = readFileSync(inputPath, "utf-8");
} catch (e) {
  fail(
    `ファイルを読み込めません: ${inputPath}`,
    e.message,
    "正しいファイルパスを指定してください",
  );
}

// --- テストケースのパース ---

const sections = content.split(/(?=### TC-\d{3}:)/);
const testCases = [];

for (const section of sections) {
  const headerMatch = section.match(/^### (TC-\d{3}): (.+)/);
  if (!headerMatch) continue;

  const id = headerMatch[1];
  const name = headerMatch[2].trim();

  const fields = {};
  const rowRegex = /^\| (.+?) \| (.+) \|$/gm;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(section)) !== null) {
    const key = rowMatch[1].trim();
    const value = rowMatch[2].trim();
    // ヘッダー行とセパレーター行をスキップ
    if (key === "項目" || /^-+$/.test(key)) continue;
    fields[key] = value;
  }

  testCases.push({ id, name, ...fields });
}

if (testCases.length === 0) {
  fail(
    "テストケースが見つかりません",
    "MD ファイル内に ### TC-XXX: 形式のテストケースが存在しません",
    "テスト仕様書のフォーマットを確認してください",
  );
}

// --- CSV 生成 ---

const headers = [
  "テストケースID",
  "テストケース名",
  "カテゴリ",
  "優先度",
  "画面",
  "前提条件",
  "操作概要",
  "期待結果",
  "テスト手順",
  "備考",
  "実施日",
  "実施者",
  "結果",
  "不具合ID",
];

/**
 * CSV セルのエスケープ。
 * - ダブルクォートを含む場合はエスケープ
 * - カンマ・改行を含む場合はダブルクォートで囲む
 * - テスト手順内の \n は実際の改行に変換する
 */
function csvEscape(value) {
  if (!value || value === "--") return "";
  const str = String(value).replace(/\\n/g, "\n");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const rows = testCases.map((tc) =>
  [
    tc.id,
    tc.name,
    tc["カテゴリ"] || "",
    tc["優先度"] || "",
    tc["画面"] || "",
    tc["前提条件"] || "",
    tc["操作概要"] || "",
    tc["期待結果"] || "",
    tc["テスト手順"] || "",
    tc["備考"] || "",
    "", // 実施日
    "", // 実施者
    "", // 結果
    "", // 不具合ID
  ]
    .map(csvEscape)
    .join(","),
);

// UTF-8 BOM + ヘッダー + データ行
const csv = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n") + "\n";

const outPath = outputPath || inputPath.replace(/\.md$/, ".csv");
writeFileSync(outPath, csv, "utf-8");

console.log(`CSV 出力完了: ${outPath}`);
console.log(`テストケース数: ${testCases.length}`);
