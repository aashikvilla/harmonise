/** Reject provider formatting and analysis artifacts before showing model text. */
const INTERNAL_MODEL_ARTIFACTS = [
  /<\/?s>/i,
  /<\|[^>]{1,80}\|>/,
  /\bjson\s+(?:is\s+)?malformed\b/i,
  /\bneed(?:s)?\s+to\s+(?:produce|return|write)\s+(?:the\s+)?(?:final|answer|response|json)\b/i,
  /\bprevious\s+pattern\b/i,
  /\binstruction\s+only\s+says\b/i,
  /\b(?:system|developer)\s+prompt\b/i,
];

export function isCleanModelText(value: string) {
  const text = value.trim();
  return text.length > 0 && !INTERNAL_MODEL_ARTIFACTS.some((pattern) => pattern.test(text));
}
