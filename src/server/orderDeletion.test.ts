import { describe, expect, it } from 'vitest';
import { createOrderDeletionToken, matchesOrderDeletionToken } from './orderDeletion';

describe('order deletion token', () => {
  it('issues an unguessable one-time token and validates only the matching token', () => {
    const issued = createOrderDeletionToken();
    expect(issued.token).toMatch(/^[a-f0-9]{64}$/);
    expect(issued.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(issued.tokenHash).not.toBe(issued.token);
    expect(matchesOrderDeletionToken(issued.token, issued.tokenHash)).toBe(true);
    expect(matchesOrderDeletionToken(`${issued.token.slice(0, -1)}0`, issued.tokenHash)).toBe(false);
    expect(matchesOrderDeletionToken('', issued.tokenHash)).toBe(false);
    expect(matchesOrderDeletionToken(issued.token, undefined)).toBe(false);
  });
});
