const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function segment(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join('')
}

export function generateCode(): string {
  return `${segment()}-${segment()}-${segment()}-${segment()}`
}

export function generateCodes(count: number): string[] {
  const codes = new Set<string>()
  while (codes.size < count) {
    codes.add(generateCode())
  }
  return Array.from(codes)
}
