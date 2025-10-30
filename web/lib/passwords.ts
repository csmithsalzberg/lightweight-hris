import crypto from 'crypto';

const SCRYPT_N = 16384;
const SCRYPT_r = 8;
const SCRYPT_p = 1;
const KEYLEN = 32;

function b64(input: Buffer) {
  return input.toString('base64');
}

function fromB64(input: string) {
  return Buffer.from(input, 'base64');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_r, p: SCRYPT_p }, (err, buf) => {
      if (err) reject(err);
      else resolve(buf as Buffer);
    });
  });
  return `s2$N=${SCRYPT_N},r=${SCRYPT_r},p=${SCRYPT_p}$${b64(salt)}$${b64(derived)}`;
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  try {
    // format: s2$N=16384,r=8,p=1$<salt_b64>$<hash_b64>
    const parts = passwordHash.split('$');
    if (parts.length !== 4 || parts[0] !== 's2') return false;
    const params = parts[1];
    const saltB64 = parts[2];
    const hashB64 = parts[3];
    const salt = fromB64(saltB64);
    const stored = fromB64(hashB64);
    const parsed = Object.fromEntries(params.split(',').map(kv => kv.split('=')) as Array<[string, string]>);
    const N = Number(parsed.N ?? SCRYPT_N);
    const r = Number(parsed.r ?? SCRYPT_r);
    const p = Number(parsed.p ?? SCRYPT_p);
    const derived = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(password, salt, stored.length, { N, r, p }, (err, buf) => {
        if (err) reject(err);
        else resolve(buf as Buffer);
      });
    });
    return crypto.timingSafeEqual(derived, stored);
  } catch {
    return false;
  }
}


