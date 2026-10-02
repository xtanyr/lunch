import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, RequestHandler } from 'express';

export type AdminScope = 'omsk' | 'generic';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const SESSION_TTL_SECONDS = SESSION_TTL_MS / 1000;
const LOGIN_WINDOW_MS = 60 * 1000;
const LOGIN_MAX_FAILURES = 10;
const MAX_LOGIN_CLIENTS = 5_000;
const COOKIE_NAMES: Record<AdminScope, string> = {
  omsk: 'lunch_admin_omsk',
  generic: 'lunch_admin_generic',
};

interface AdminSession {
  scope: AdminScope;
  expiresAt: number;
}

interface LoginAttempts {
  windowStartedAt: number;
  failures: number;
}

interface CreateAdminAuthOptions {
  codes: Record<AdminScope, string | undefined>;
  secureCookies: boolean;
  now?: () => number;
}

function safeEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function getCookieValues(request: Request, name: string): string[] {
  const header = request.headers.cookie;
  if (!header) return [];

  return header.split(';').flatMap(part => {
    const separator = part.indexOf('=');
    if (separator < 0 || part.slice(0, separator).trim() !== name) return [];
    return [part.slice(separator + 1).trim()];
  });
}

export function createAdminAuth({ codes, secureCookies, now = Date.now }: CreateAdminAuthOptions) {
  const signingKey = randomBytes(32);
  const sessions = new Map<string, AdminSession>();
  const loginAttempts = new Map<string, LoginAttempts>();

  const loginAttemptKey = (request: Request, scope: AdminScope) =>
    `${scope}:${request.ip || request.socket.remoteAddress || 'unknown'}`;

  const pruneLoginAttempts = (currentTime: number) => {
    for (const [key, attempts] of loginAttempts) {
      if (currentTime - attempts.windowStartedAt >= LOGIN_WINDOW_MS) loginAttempts.delete(key);
    }
  };

  const sign = (scope: AdminScope, sessionId: string) => createHmac('sha256', signingKey)
    .update(`${COOKIE_NAMES[scope]}:${scope}:${sessionId}`)
    .digest('base64url');

  const validSessionId = (request: Request, scope: AdminScope): string | null => {
    const cookieValues = getCookieValues(request, COOKIE_NAMES[scope]);
    if (cookieValues.length !== 1) return null;

    const [sessionId, signature, ...extra] = cookieValues[0].split('.');
    if (!sessionId || !signature || extra.length > 0 || !safeEqual(signature, sign(scope, sessionId))) return null;

    const session = sessions.get(sessionId);
    if (!session || session.scope !== scope || session.expiresAt <= now()) {
      sessions.delete(sessionId);
      return null;
    }
    return sessionId;
  };

  const cookieHeader = (scope: AdminScope, value: string, maxAge: number) => {
    const flags = [
      `${COOKIE_NAMES[scope]}=${value}`,
      'Path=/',
      `Max-Age=${maxAge}`,
      'HttpOnly',
      'SameSite=Strict',
    ];
    if (secureCookies) flags.push('Secure');
    return flags.join('; ');
  };

  const verify = (scope: AdminScope): RequestHandler => (request, response) => {
    const submittedCode = request.body?.code;
    if (submittedCode !== undefined) {
      const currentTime = now();
      pruneLoginAttempts(currentTime);
      const attemptKey = loginAttemptKey(request, scope);
      const attempts = loginAttempts.get(attemptKey);
      if (attempts && attempts.failures >= LOGIN_MAX_FAILURES) {
        const retryAfter = Math.max(1, Math.ceil((attempts.windowStartedAt + LOGIN_WINDOW_MS - currentTime) / 1000));
        response.setHeader('Retry-After', String(retryAfter));
        return response.status(429).json({ valid: false, error: 'Too many login attempts' });
      }

      const configuredCode = codes[scope];
      if (typeof configuredCode !== 'string' || configuredCode.length === 0 ||
          typeof submittedCode !== 'string' || submittedCode.length === 0 ||
          !safeEqual(submittedCode, configuredCode)) {
        const activeAttempts = attempts && currentTime - attempts.windowStartedAt < LOGIN_WINDOW_MS
          ? attempts
          : { windowStartedAt: currentTime, failures: 0 };
        activeAttempts.failures += 1;
        loginAttempts.delete(attemptKey);
        loginAttempts.set(attemptKey, activeAttempts);
        if (loginAttempts.size > MAX_LOGIN_CLIENTS) {
          const oldestKey = loginAttempts.keys().next().value;
          if (oldestKey !== undefined) loginAttempts.delete(oldestKey);
        }
        return response.status(401).json({ valid: false, error: 'Invalid code' });
      }

      loginAttempts.delete(attemptKey);
      for (const [id, session] of sessions) {
        if (session.expiresAt <= currentTime) sessions.delete(id);
      }
      const sessionId = randomBytes(32).toString('base64url');
      sessions.set(sessionId, { scope, expiresAt: currentTime + SESSION_TTL_MS });
      response.setHeader('Set-Cookie', cookieHeader(scope, `${sessionId}.${sign(scope, sessionId)}`, SESSION_TTL_SECONDS));
      return response.json({ valid: true });
    }

    if (!validSessionId(request, scope)) return response.status(401).json({ valid: false });
    return response.json({ valid: true });
  };

  const require = (scope: AdminScope): RequestHandler => (request, response, next) => {
    if (!validSessionId(request, scope)) return response.status(401).json({ error: 'Unauthorized' });
    return next();
  };

  const logout = (scope: AdminScope): RequestHandler => (request, response) => {
    const sessionId = validSessionId(request, scope);
    if (sessionId) sessions.delete(sessionId);
    response.setHeader('Set-Cookie', cookieHeader(scope, '', 0));
    return response.json({ success: true });
  };

  return {
    verify,
    require,
    logout,
    hasSession: (request: Request, scope: AdminScope) => validSessionId(request, scope) !== null,
  };
}
