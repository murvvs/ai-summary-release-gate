import { test as base, expect, type Locator, type Page } from '@playwright/test';

export interface MockResponse { status: number; body: unknown }

// Service-boundary response builders (the 3 contract shapes + invalid variants).
export const ok = (summary: string, sourceIds?: string[]): MockResponse => ({
  status: 200,
  body: { status: 'ok', summary, ...(sourceIds ? { sourceIds } : {}) },
});
export const insufficient = (): MockResponse => ({ status: 200, body: { status: 'insufficient_information' } });
export const unavailable = (): MockResponse => ({ status: 503, body: { error: 'unavailable' } });

/** Page object + service mock. One instance per test = no shared state = parallel-safe. */
export class Dashboard {
  calls = 0;
  constructor(readonly page: Page) {}

  get generate(): Locator { return this.page.getByRole('button', { name: 'Generate summary' }); }
  get retry(): Locator { return this.page.getByRole('button', { name: 'Retry' }); }
  get approve(): Locator { return this.page.getByRole('button', { name: 'Approve summary' }); }
  get status(): Locator { return this.page.getByRole('status'); }
  get summary(): Locator { return this.page.getByTestId('summary'); }
  get approved(): Locator { return this.page.getByText('Summary approved'); }

  /** Responses are served in order; the last one repeats. */
  async mockService(ticketId: string, ...responses: MockResponse[]) {
    this.calls = 0;
    // Catch-all first: any unexpected API call fails the test instead of silently passing.
    await this.page.route('**/api/**', (route) => route.abort());
    await this.page.route(`**/api/tickets/${ticketId}/summary`, async (route) => {
      const r = responses[Math.min(this.calls, responses.length - 1)];
      this.calls++;
      await route.fulfill({ status: r.status, contentType: 'application/json', body: JSON.stringify(r.body) });
    });
  }

  async open(ticketId: string) {
    await this.page.goto(`/?ticket=${ticketId}`);
    await expect(this.page.getByRole('heading', { level: 1 })).toContainText(ticketId);
  }
}

export const test = base.extend<{ dashboard: Dashboard }>({
  dashboard: async ({ page }, use) => {
    await use(new Dashboard(page));
  },
});
export { expect };
