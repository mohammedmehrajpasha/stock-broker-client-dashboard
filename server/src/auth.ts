import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const TOKEN_TTL = '12h';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && EMAIL_RE.test(email.trim());
}

/** Email-only "login": no password, just a signed identity token. */
export function issueToken(email: string): string {
  return jwt.sign({ email: email.trim().toLowerCase() }, SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string | undefined): { email: string } | null {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, SECRET) as { email?: string };
    return payload.email ? { email: payload.email } : null;
  } catch {
    return null;
  }
}
