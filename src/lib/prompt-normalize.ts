/**
 * Normalize prompt text for deduplication.
 * Handles Turkish characters (İ/i/ı → i) to match DB function exactly.
 * Must stay in sync with onecite.normalize_prompt_text() SQL function.
 *
 * Turkish has two i characters:
 * - Dotted: İ (uppercase) / i (lowercase)
 * - Dotless: I (uppercase) / ı (lowercase)
 *
 * SQL: REPLACE(REPLACE(text, 'İ', 'i'), 'ı', 'i')
 * → First replace dotted İ, then replace dotless ı
 */
export function normalizePromptText(text: string): string {
  // Replace Turkish İ/ı BEFORE lowercasing: JS's .toLowerCase() maps 'İ' to
  // a two-character "i" + combining-dot-above (U+0307) under the default
  // (non-Turkish) locale, which the SQL side (plain REPLACE, no locale
  // rules) never produces. Doing the literal replace first keeps both
  // sides byte-for-byte identical.
  return text
    .replace(/İ/g, 'i')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .trim();
}
