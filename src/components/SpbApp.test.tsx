// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../theme/ThemeContext';
import SpbApp from './SpbApp';

vi.mock('./SpbOrderForm', () => ({
  default: ({ selectedDate, onDateChange }: {
    selectedDate: string;
    onDateChange: (date: string) => void;
  }) => (
    <input
      aria-label="Дата нового заказа"
      type="date"
      value={selectedDate}
      onChange={event => onDateChange(event.target.value)}
    />
  ),
}));

const dishes = {
  '2026-10-02': { id: 'previous-dish', name: 'Суп с тыквой', category: 'Супы', price: 225 },
  '2026-10-03': { id: 'current-dish', name: 'Курица с рисом', category: 'Горячее', price: 225 },
  '2026-10-05': { id: 'next-dish', name: 'Рыба с овощами', category: 'Горячее', price: 225 },
};

function menuResponse(date: string): Response {
  const dish = dishes[date as keyof typeof dishes];
  return response(dish ? {
    period: { id: `period-${date}`, name: `Период ${date}`, startDate: date, endDate: date },
    items: [dish],
  } : { error: 'No menu period found for this date' }, dish ? 200 : 404);
}

function response(payload: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => payload } as Response;
}

let container: HTMLDivElement;
let root: Root;
let delayedMenus: Map<string, Promise<Response>>;

function ordersSection(): HTMLElement {
  return container.querySelectorAll<HTMLElement>('main section')[1];
}

function ordersDate(): HTMLInputElement {
  return ordersSection().querySelector<HTMLInputElement>('input[type="date"]')!;
}

async function changeDate(input: HTMLInputElement, date: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, date);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

async function renderApp() {
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={['/spb']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ThemeProvider><SpbApp /></ThemeProvider>
      </MemoryRouter>,
    );
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 3, 12));
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  localStorage.clear();
  delayedMenus = new Map();
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), 'http://localhost');
    if (url.pathname === '/api/menu/sides') return response([]);
    if (url.pathname === '/api/spb/menu') {
      const date = url.searchParams.get('date')!;
      return delayedMenus.get(date) || menuResponse(date);
    }
    if (url.pathname.startsWith('/api/spb/orders/')) {
      const date = url.pathname.split('/').pop()!;
      const dishId = dishes[date as keyof typeof dishes]?.id || 'current-dish';
      return response([{
        id: `fixture-order-${date}`,
        employeeName: 'Тестовый сотрудник',
        department: 'Тестовый отдел',
        orderDate: date,
        items: [{ dishId }],
        address: 'kirova',
        city: 'spb',
        timestamp: `${date}T09:00:00.000Z`,
        floor: '',
      }]);
    }
    throw new Error(`Unexpected test request: ${url.pathname}`);
  }));
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

describe('SPB order dish names', () => {
  it('uses the viewed date menu independently of the new-order date', async () => {
    await renderApp();
    expect(ordersSection().textContent).toContain('Курица с рисом');

    await changeDate(ordersDate(), '2026-10-02');
    expect(ordersSection().textContent).toContain('Суп с тыквой');
    expect(ordersSection().textContent).not.toContain('Блюдо');

    const formDate = container.querySelector<HTMLInputElement>('[aria-label="Дата нового заказа"]')!;
    await changeDate(formDate, '2026-10-05');
    expect(ordersDate().value).toBe('2026-10-02');
    expect(ordersSection().textContent).toContain('Суп с тыквой');
    expect(ordersSection().textContent).not.toContain('Рыба с овощами');
  });

  it('ignores a late menu response after switching the viewed date again', async () => {
    await renderApp();
    let resolveEarlierMenu!: (value: Response) => void;
    delayedMenus.set('2026-10-02', new Promise(resolve => { resolveEarlierMenu = resolve; }));

    await changeDate(ordersDate(), '2026-10-02');
    await changeDate(ordersDate(), '2026-10-05');
    expect(ordersSection().textContent).toContain('Рыба с овощами');

    await act(async () => resolveEarlierMenu(menuResponse('2026-10-02')));
    expect(ordersSection().textContent).toContain('Рыба с овощами');
    expect(ordersSection().textContent).not.toContain('Блюдо');
  });

  it('does not reuse a previous name when the viewed date has no menu', async () => {
    await renderApp();
    expect(ordersSection().textContent).toContain('Курица с рисом');
    // A legacy order may reuse an ID even when its period menu is unavailable.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await changeDate(ordersDate(), '2026-10-01');

    expect(ordersSection().textContent).toContain('Тестовый сотрудник');
    expect(ordersSection().textContent).not.toContain('Курица с рисом');
    expect(ordersSection().textContent).toContain('Блюдо');
  });
});
