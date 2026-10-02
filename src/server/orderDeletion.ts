import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

interface IssuedOrderDeletionToken {
  token: string;
  tokenHash: string;
}

export function createOrderDeletionToken(): IssuedOrderDeletionToken {
  const token = randomBytes(32).toString('hex');
  return { token, tokenHash: hashOrderDeletionToken(token) };
}

function hashOrderDeletionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function matchesOrderDeletionToken(token: unknown, tokenHash: unknown): boolean {
  if (typeof token !== 'string' || token.length === 0 || typeof tokenHash !== 'string') return false;
  const submittedHash = Buffer.from(hashOrderDeletionToken(token), 'hex');
  const storedHash = Buffer.from(tokenHash, 'hex');
  return storedHash.length === submittedHash.length && timingSafeEqual(storedHash, submittedHash);
}
