/**
 * Radio number encoding: converts each character to its Unicode code point.
 * Works for English, Persian (Farsi), and any Unicode text.
 *
 * Example: "Hi!" → "72 105 33"
 * Example: "سلام" → "1587 1604 1575 1605"
 */

export function encodeToNumbers(text) {
  return [...text]
    .map((char) => char.codePointAt(0))
    .join(' ');
}

export function decodeFromNumbers(numStr) {
  return numStr
    .trim()
    .split(/\s+/)
    .map((n) => String.fromCodePoint(parseInt(n, 10)))
    .join('');
}

export function isNumberSequence(str) {
  return /^\d+(\s+\d+)*$/.test(str.trim());
}
