// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeContext';
import OmskAdmin from './OmskAdmin';

// Neither order has a browser cancellation token: an admin can manage both.
const orders = [
  {
    id: 'legacy/order ?#',
    employeeName: 'Анна Архивная',
    department: 'Бухгалтерия',
    orderDate: '2026-10-03',
    items: [{ dishId: 'soup', dishName: 'Тыквенный суп', category: 'soup', price: 225 }],
    address: 'office',
    city: 'omsk',
    timestamp: '2026-10-02T09:00:00.000Z',
    totalPrice: 225,
  },
  {
    id: 'other-browser-order',
    employeeName: 'Борис Другой',
    department: 'Разработка',
    orderDate: '2026-10-03',
    items: [{ dishId: 'hot', dishName: 'Курица с рисом', category: 'hot', price: 225 }],
    address: 'coffee-shop',
    city: 'omsk',
    timestamp: '2026-10-02T10:00:00.000Z',
    totalPrice: 225,
  },
];

const emptyDataEndpoints = new Set([
  '/api/omsk/weeks', '/api/omsk/admin/dishes', '/api/omsk/admin/garnishes',
  '/api/omsk/admin/sauces', '/api/omsk/admin/vegan-items',
  '/api/omsk/admin/pastries', '/api/omsk/disabled-dates',
]);

let container: HTMLDivElement;
let root: Root;
let deleteRequests: { url: string; init: RequestInit }[];
let deleteResponse: () => Promise<Response>;
let ordersResponse: () => Promise<Response>;

function response(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}

function button(name: string, scope: ParentNode = container): HTMLButtonElement {
  const result = [...scope.querySelectorAll<HTMLButtonElement>('button')]
    .find(element => (element.getAttribute('aria-label') || element.textContent?.trim()) === name);
  expect(result, `Expected button "${name}"`).toBeDefined();
  return result!;
}

function dialog(): HTMLElement {
  const result = document.querySelector<HTMLElement>('[role="dialog"]');
  expect(result, 'Expected order deletion confirmation dialog').not.toBeNull();
  return result!;
}

async function click(element: HTMLElement) {
  await act(async () => element.click());
}

async function key(key: string, shiftKey = false) {
  await act(async () => {
    (document.activeElement || document).dispatchEvent(new KeyboardEvent('keydown', {
      key, shiftKey, bubbles: true, cancelable: true,
    }));
  });
}

async function renderOrders() {
  await act(async () => root.render(
    <MemoryRouter initialEntries={['/omsk/admin']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider><OmskAdmin /></ThemeProvider>
    </MemoryRouter>,
  ));
  await click(button('Заказы'));
  expect(container.textContent).toContain('Всего заказов: 2');
}

async function chooseLegacyOrder() {
  const trigger = button('Удалить заказ Анна Архивная');
  trigger.focus();
  await click(trigger);
  return trigger;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 3, 12));
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  localStorage.clear();
  deleteRequests = [];
  deleteResponse = async () => response({ success: true });
  ordersResponse = async () => response(orders);
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    if (init.method === 'DELETE') {
      deleteRequests.push({ url, init });
      return deleteResponse();
    }
    if (emptyDataEndpoints.has(url)) return response([]);
    if (url === '/api/omsk/orders/2026-10-03?address=all') return ordersResponse();
    throw new Error(`Unexpected test request: ${url}`);
  });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('Omsk admin order deletion', () => {
  it('confirms a legacy order using its actual date before sending a delete request', async () => {
    await renderOrders();
    // Changing the filter does not reload the cards until the user clicks Load.
    const dateInput = container.querySelector<HTMLInputElement>('main input[type="date"]')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(dateInput, '2026-10-04');
      dateInput.dispatchEvent(new Event('input', { bubbles: true }));
      dateInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await chooseLegacyOrder();

    const confirmation = dialog();
    const labelledBy = confirmation.getAttribute('aria-labelledby');
    const accessibleName = confirmation.getAttribute('aria-label') || (labelledBy && document.getElementById(labelledBy)?.textContent);
    expect(accessibleName).toBe('Удалить заказ?');
    expect(confirmation.textContent).toContain('Анна Архивная');
    expect(confirmation.textContent).toContain('2026-10-03');
    expect(confirmation.textContent).not.toContain('2026-10-04');
    expect(deleteRequests).toHaveLength(0);
    expect(container.textContent).toContain('Всего заказов: 2');
  });

  it('deletes only the confirmed order using the encoded id and admin session', async () => {
    await renderOrders();
    await chooseLegacyOrder();
    await click(button('Удалить', dialog()));

    expect(deleteRequests).toHaveLength(1);
    expect(deleteRequests[0]).toEqual({
      url: '/api/omsk/orders/legacy%2Forder%20%3F%23',
      init: expect.objectContaining({ method: 'DELETE', credentials: 'same-origin' }),
    });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector('[aria-label="Удалить заказ Анна Архивная"]')).toBeNull();
    expect(container.textContent).toContain('Борис Другой');
    expect(container.textContent).toContain('Всего заказов: 1');
    const notice = container.querySelector('[role="status"]');
    expect(notice?.textContent).toMatch(/Анна Архивная.*удалён/);
  });

  it('lets the user cancel with the button or Escape and restores focus to the order', async () => {
    await renderOrders();
    const trigger = await chooseLegacyOrder();
    const cancel = button('Отмена', dialog());
    const confirm = button('Удалить', dialog());
    expect(document.activeElement).toBe(cancel);
    await key('Tab', true);
    expect(document.activeElement).toBe(confirm);
    await key('Tab');
    expect(document.activeElement).toBe(cancel);
    await click(cancel);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);

    await chooseLegacyOrder();
    await key('Escape');
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(deleteRequests).toHaveLength(0);
    expect(container.textContent).toContain('Всего заказов: 2');
  });

  it('retains the order and confirmation after an expired session so deletion can be retried', async () => {
    deleteResponse = async () => response({ error: 'Unauthorized' }, 401);
    await renderOrders();
    await chooseLegacyOrder();
    await click(button('Удалить', dialog()));

    expect(container.textContent).toContain('Анна Архивная');
    expect(container.textContent).toContain('Всего заказов: 2');
    expect(dialog().textContent).toMatch(/сесси[яи].*истекла|войдите.*снова/i);
    expect(document.activeElement).toBe(dialog().querySelector('[role="alert"]'));
    expect(button('Удалить', dialog()).disabled).toBe(false);

    deleteResponse = async () => response({ success: true });
    await click(button('Удалить', dialog()));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector('[aria-label="Удалить заказ Анна Архивная"]')).toBeNull();
    expect(container.textContent).toContain('Всего заказов: 1');
  });

  it('keeps confirmation open and blocks duplicate actions until the pending deletion finishes', async () => {
    let finishDelete!: (value: Response) => void;
    deleteResponse = () => new Promise(resolve => { finishDelete = resolve; });
    await renderOrders();
    await chooseLegacyOrder();
    const confirm = button('Удалить', dialog());
    const cancel = button('Отмена', dialog());
    await click(confirm);

    expect(confirm.disabled).toBe(true);
    expect(cancel.disabled).toBe(true);
    expect(dialog().textContent).toMatch(/Удаление/);
    await click(confirm);
    await click(cancel);
    await key('Escape');
    expect(deleteRequests).toHaveLength(1);
    expect(dialog().textContent).toContain('Анна Архивная');
    expect(container.textContent).toContain('Всего заказов: 2');

    await act(async () => finishDelete(response({ success: true })));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector('[aria-label="Удалить заказ Анна Архивная"]')).toBeNull();
    expect(container.textContent).toContain('Борис Другой');
    expect(container.textContent).toContain('Всего заказов: 1');
  });

  it('shows the empty state after the last remaining order is deleted', async () => {
    await renderOrders();
    await chooseLegacyOrder();
    await click(button('Удалить', dialog()));
    await click(button('Удалить заказ Борис Другой'));
    await click(button('Удалить', dialog()));

    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector('[aria-label^="Удалить заказ "]')).toBeNull();
    expect(container.textContent).toContain('Нет заказов на эту дату');
    expect(container.textContent).not.toContain('Всего заказов:');
    expect(container.querySelector('[role="status"]')?.textContent).toMatch(/Борис Другой.*удалён/);
  });

  it('ignores a stale load response that would restore an order deleted while loading', async () => {
    await renderOrders();
    let finishOrders!: (value: Response) => void;
    ordersResponse = () => new Promise(resolve => { finishOrders = resolve; });
    await click(button('Загрузить'));
    await chooseLegacyOrder();
    await click(button('Удалить', dialog()));
    expect(container.textContent).toContain('Всего заказов: 1');

    await act(async () => finishOrders(response(orders)));
    expect(container.querySelector('[aria-label="Удалить заказ Анна Архивная"]')).toBeNull();
    expect(container.textContent).toContain('Борис Другой');
    expect(container.textContent).toContain('Всего заказов: 1');
  });
});
