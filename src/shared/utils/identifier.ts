import * as Crypto from 'expo-crypto';

export function newId() {
  return Crypto.randomUUID();
}

/** UUID v8 derivado de `seed`: dois aparelhos chegam ao mesmo id sem combinar nada. */
export async function deterministicId(seed: string) {
  const hex = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, seed);
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const value = `${hex.slice(0, 12)}8${hex.slice(13, 16)}${variant}${hex.slice(17, 32)}`;
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}
