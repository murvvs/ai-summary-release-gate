import { test, expect, ok, insufficient, unavailable } from '../fixtures';

// UI layer: what the agent sees and can do. We do NOT judge summary quality here.
test.describe.configure({ mode: 'parallel' });

const GOOD = 'Customer was charged twice and the duplicate was refunded.';

test.describe('AI summary release gate', () => {
  test('valid summary is shown and can be approved', async ({ dashboard: d }) => {
    await d.mockService('T-100', ok(GOOD, ['m1', 'm2']));
    await d.open('T-100');
    await expect(d.approve).toBeDisabled(); // nothing generated yet

    await d.generate.click();

    await expect(d.summary).toHaveText(GOOD);
    await expect(d.status).toContainText('ready for review');
    await expect(d.approve).toBeEnabled();

    await d.approve.click();
    await expect(d.approved).toBeVisible();
  });

  test('insufficient information keeps approval disabled', async ({ dashboard: d }) => {
    await d.mockService('T-100', insufficient());
    await d.open('T-100');
    await d.generate.click();

    await expect(d.status).toContainText('Insufficient information');
    await expect(d.summary).toBeHidden();
    await expect(d.approve).toBeDisabled();
  });

  test('503 shows error + retry; approval stays disabled until a valid retry', async ({ dashboard: d }) => {
    await d.mockService('T-100', unavailable(), ok(GOOD, ['m1']));
    await d.open('T-100');
    await d.generate.click();

    await expect(d.status).toContainText('unavailable');
    await expect(d.retry).toBeVisible();
    await expect(d.approve).toBeDisabled();

    await d.retry.click();

    await expect(d.summary).toHaveText(GOOD);
    await expect(d.approve).toBeEnabled();
    await expect(d.retry).toBeHidden();
    expect(d.calls).toBe(2);
  });

  test('retry that fails again still blocks approval', async ({ dashboard: d }) => {
    await d.mockService('T-100', unavailable(), unavailable());
    await d.open('T-100');
    await d.generate.click();
    await expect(d.retry).toBeVisible();
    await d.retry.click();

    await expect.poll(() => d.calls).toBe(2);
    await expect(d.retry).toBeVisible();
    await expect(d.approve).toBeDisabled();
  });

  const INVALID = [
    { name: 'missing sourceIds field', ticket: 'T-100', ids: undefined },
    { name: 'empty sourceIds', ticket: 'T-100', ids: [] as string[] },
    { name: 'cites a message from another ticket', ticket: 'T-100', ids: ['m1', 'm9'] },
    { name: 'cites an unknown message id', ticket: 'T-100', ids: ['m99'] },
    { name: 'same ids are invalid on a different ticket', ticket: 'T-200', ids: ['m1'] },
  ];
  for (const c of INVALID) {
    test(`invalid summary blocks approval: ${c.name}`, async ({ dashboard: d }) => {
      await d.mockService(c.ticket, ok(GOOD, c.ids));
      await d.open(c.ticket);
      await d.generate.click();

      await expect(d.status).toContainText('cannot be approved');
      await expect(d.approve).toBeDisabled();
    });
  }
});
