/**
 * Deterministically maps a stable id (e.g. cuid of a guest User) to a cute
 * "anonymous animal" identity à la Google Docs / Sheets — used purely for
 * presentation when the actor has no real avatar/name.
 */

export interface AnonymousAnimal {
  /** Localized display word, e.g. "Hà mã". */
  name: string;
  /** Single emoji to use as the avatar. */
  emoji: string;
  /** A pleasant hue (0-360) for the avatar background. */
  hue: number;
}

const ANIMALS: ReadonlyArray<{ name: string; emoji: string }> = [
  { name: 'Hà mã', emoji: '🦛' },
  { name: 'Hươu cao cổ', emoji: '🦒' },
  { name: 'Gấu trúc', emoji: '🐼' },
  { name: 'Cáo', emoji: '🦊' },
  { name: 'Gấu túi', emoji: '🐨' },
  { name: 'Chim cánh cụt', emoji: '🐧' },
  { name: 'Cú', emoji: '🦉' },
  { name: 'Voi', emoji: '🐘' },
  { name: 'Hổ', emoji: '🐯' },
  { name: 'Sư tử', emoji: '🦁' },
  { name: 'Khỉ', emoji: '🐵' },
  { name: 'Ếch', emoji: '🐸' },
  { name: 'Rùa', emoji: '🐢' },
  { name: 'Bạch tuộc', emoji: '🐙' },
  { name: 'Kỳ lân', emoji: '🦄' },
  { name: 'Cá heo', emoji: '🐬' },
  { name: 'Cá voi', emoji: '🐳' },
  { name: 'Gấu mèo', emoji: '🦝' },
  { name: 'Nhím', emoji: '🦔' },
  { name: 'Rái cá', emoji: '🦦' },
  { name: 'Lười', emoji: '🦥' },
  { name: 'Kangaroo', emoji: '🦘' },
  { name: 'Bướm', emoji: '🦋' },
  { name: 'Ong', emoji: '🐝' },
];

function hash(input: string): number {
  // FNV-1a 32-bit — small, dependency-free, stable.
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function pickAnimal(id: string): AnonymousAnimal {
  const h = hash(id);
  const animal = ANIMALS[h % ANIMALS.length];
  // Spread hues across the wheel using a second mix to decorrelate from index.
  const hue = (Math.imul(h, 0x9e3779b1) >>> 0) % 360;
  return { ...animal, hue };
}
