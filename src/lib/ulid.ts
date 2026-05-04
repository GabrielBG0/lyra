// client-side ULID generation for optimistic updates
// Spec: 48-bit ms timestamp (10 Crockford base32 chars) + 80-bit random (16 chars)

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

function encodeTime(ms: number): string {
  const chars = new Array(10)
  for (let i = 9; i >= 0; i--) {
    chars[i] = ENCODING[ms & 0x1f]
    ms = Math.floor(ms / 32)
  }
  return chars.join('')
}

function encodeRandom(): string {
  const bytes = new Uint8Array(10)
  crypto.getRandomValues(bytes)
  const chars = new Array(16)
  let bits = 0
  let bitsAvailable = 0
  let byteIdx = 0
  for (let i = 0; i < 16; i++) {
    while (bitsAvailable < 5) {
      bits = (bits << 8) | bytes[byteIdx++]
      bitsAvailable += 8
    }
    bitsAvailable -= 5
    chars[i] = ENCODING[(bits >>> bitsAvailable) & 0x1f]
  }
  return chars.join('')
}

export function generateUlid(): string {
  return encodeTime(Date.now()) + encodeRandom()
}
