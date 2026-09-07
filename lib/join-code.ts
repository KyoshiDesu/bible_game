/**
 * Join codes.
 *
 * Six characters from a 31-character alphabet with the visually ambiguous ones
 * removed — no `0`, `O`, `1`, `I`, or `L` — because these are read aloud in a
 * room and typed on a phone. That leaves 31^6, about 887 million combinations.
 */

export const JOIN_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const JOIN_CODE_LENGTH = 6;

/**
 * The largest multiple of the alphabet size that fits in a byte. Bytes at or
 * above this are rejected rather than folded with `%`, which would make the
 * first few characters of the alphabet measurably more likely.
 */
const REJECT_AT = 256 - (256 % JOIN_CODE_ALPHABET.length);

export function generateJoinCode(): string {
  let code = "";
  const bytes = new Uint8Array(JOIN_CODE_LENGTH);

  while (code.length < JOIN_CODE_LENGTH) {
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte >= REJECT_AT) continue;
      code += JOIN_CODE_ALPHABET[byte % JOIN_CODE_ALPHABET.length];
      if (code.length === JOIN_CODE_LENGTH) break;
    }
  }

  return code;
}

/**
 * What someone typed, as the database stores it. People read these off a
 * screen at the front of a room, so lower case and stray spaces are typos to
 * absorb, not errors to report.
 */
export function normalizeJoinCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

export function isJoinCode(value: string): boolean {
  if (value.length !== JOIN_CODE_LENGTH) return false;
  return [...value].every((character) =>
    JOIN_CODE_ALPHABET.includes(character),
  );
}
