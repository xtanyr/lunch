import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearOrderCancellationToken, getOrderCancellationToken, storeOrderCancellationToken } from './orderCancellation';

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
    clear: () => values.clear(),
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('employee order cancellation tokens', () => {
  it('stores a token against one order, rejects malformed tokens, and clears it after deletion', () => {
    vi.stubGlobal('localStorage', createStorage());
    const firstToken = 'a'.repeat(64);
    const secondToken = 'b'.repeat(64);

    storeOrderCancellationToken('order-1', firstToken);
    storeOrderCancellationToken('order-2', secondToken);
    storeOrderCancellationToken('order-3', 'not-a-token');

    expect(getOrderCancellationToken('order-1')).toBe(firstToken);
    expect(getOrderCancellationToken('order-2')).toBe(secondToken);
    expect(getOrderCancellationToken('order-3')).toBeUndefined();
    clearOrderCancellationToken('order-1');
    expect(getOrderCancellationToken('order-1')).toBeUndefined();
  });

  it('ignores malformed saved storage without throwing', () => {
    const storage = createStorage();
    storage.setItem('lunch.order-cancellation-tokens', '{broken');
    vi.stubGlobal('localStorage', storage);
    expect(getOrderCancellationToken('order-1')).toBeUndefined();
  });
});
