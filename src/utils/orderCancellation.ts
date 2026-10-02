const STORAGE_KEY = 'lunch.order-cancellation-tokens';
const MAX_SAVED_TOKENS = 200;
const TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

function getStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

function readTokens(): Record<string, string> {
  const storage = getStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([id, token]) =>
      id.length > 0 && typeof token === 'string' && TOKEN_PATTERN.test(token)
    )) as Record<string, string>;
  } catch {
    return {};
  }
}

function writeTokens(tokens: Record<string, string>): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // Cancellation remains protected on the server if browser storage is unavailable.
  }
}

export function storeOrderCancellationToken(orderId: string, token: unknown): void {
  if (!orderId || typeof token !== 'string' || !TOKEN_PATTERN.test(token)) return;
  const tokens = readTokens();
  delete tokens[orderId];
  tokens[orderId] = token;
  const retained = Object.entries(tokens).slice(-MAX_SAVED_TOKENS);
  writeTokens(Object.fromEntries(retained));
}

export function getOrderCancellationToken(orderId: string): string | undefined {
  if (!orderId) return undefined;
  return readTokens()[orderId];
}

export function hasOrderCancellationToken(orderId: string): boolean {
  return getOrderCancellationToken(orderId) !== undefined;
}

export function clearOrderCancellationToken(orderId: string): void {
  if (!orderId) return;
  const tokens = readTokens();
  if (!(orderId in tokens)) return;
  delete tokens[orderId];
  writeTokens(tokens);
}
