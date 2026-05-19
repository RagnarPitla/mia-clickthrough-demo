/**
 * Strip common LLM / Worker output noise (markdown fences, ANSI codes,
 * excessive whitespace) and optionally truncate for compact display.
 */
export function sanitizeOutput(
  text: string | null | undefined,
  maxLength = 120,
): string {
  if (!text) return '';
  let clean = stripNoise(text);
  if (clean.length > maxLength) {
    clean = clean.slice(0, maxLength).trimEnd() + '…';
  }
  return clean;
}

/** Full sanitize without truncation — for detail panels. */
export function sanitizeOutputFull(text: string | null | undefined): string {
  if (!text) return '';
  return stripNoise(text);
}

function stripNoise(raw: string): string {
  return raw
    // Remove ANSI escape codes
    .replace(/\x1b\[[0-9;]*m/g, '')
    // Remove markdown code fences
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```\w*\n?/g, '').replace(/```/g, ''))
    // Collapse multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    // Collapse multiple spaces
    .replace(/ {2,}/g, ' ')
    .trim();
}
