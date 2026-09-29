export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FILLER_WORDS = /^(cv|resume|curriculum|vitae|final|updated|copy|v\d+|\d+)$/i;

/** Best-effort name from a résumé file name: "john_doe-CV (2).pdf" → "John Doe". */
export function nameFromFileName(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, "")
    .split(/[\s_\-.()[\]]+/)
    .filter((w) => w && !FILLER_WORDS.test(w))
    .map((w) => w[0]!.toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
