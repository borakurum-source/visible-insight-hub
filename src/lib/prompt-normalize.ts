/**
 * Normalize prompt text for deduplication.
 * Handles Turkish characters (İ/ı → i) to match DB function exactly.
 * Must stay in sync with onecite.normalize_prompt_text() SQL function.
 */
export function normalizePromptText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[İi]/g, 'i') // Turkish İ/ı → lowercase i
    .replace(/[Ş]/g, 'ş')   // Turkish Ş edge cases
    .trim();
}
