import { cookies } from 'next/headers';
import crypto from 'crypto';

type Session = {
  userId: string;
  role: 'admin' | 'hr' | 'employee';
  employeeId?: string | null;
};

const COOKIE_NAME = 'session';
const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-secret-change-me';

function b64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64urlDecode(input: string): Buffer {
  const pad = 4 - (input.length % 4 || 4);
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad === 4 ? 0 : pad);
  return Buffer.from(b64, 'base64');
}

function sign(payload: string) {
  return b64url(crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest());
}

export function createSessionCookie(session: Session) {
  const expMs = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payloadObj = { ...session, exp: Math.floor(expMs / 1000) } as const;
  const payload = b64url(JSON.stringify(payloadObj));
  const sig = sign(payload);
  const token = `${payload}.${sig}`;
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function getSession(): Promise<Session | null> {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const [payloadPart, sig] = token.split('.') as [string, string];
    if (!payloadPart || !sig) return null;
    const expected = sign(payloadPart);
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const obj = JSON.parse(b64urlDecode(payloadPart).toString('utf8')) as Session & { exp?: number };
    if (obj.exp && obj.exp < Math.floor(Date.now() / 1000)) return null;
    const { userId, role, employeeId } = obj;
    if (!userId || !role) return null;
    return { userId, role, employeeId: employeeId ?? null };
  } catch {
    return null;
  }
}


