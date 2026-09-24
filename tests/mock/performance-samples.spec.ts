import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import en from '../../vendor/spec/en.json';
import { watchConsole } from '../support/console';
import { parsePerformanceSamples } from '../../src/lib/performanceMock';

const profiles = parsePerformanceSamples(JSON.parse(readFileSync(path.resolve(__dirname, '../../', process.env.VITE_PERFORMANCE_MOCK_SAMPLES_FILE ?? 'data/performance-mocks/samples.json'), 'utf8')));
const profile = (kind: string) => profiles.find(p => p.kind === kind)!;
const selectorName = en['insights.dev.sample.label'];
const card = (page: Page, code: string) => page.locator('.mcard').filter({ has: page.locator('.name', { hasText: new RegExp(`^${en[`insights.metric.${code}.title` as keyof typeof en]}$`) }) });

test('AC-PA-DIRECT-12 production sample displays imported values instead of ALL/EMPTY', async ({ page }) => {
  const consoleWatch = watchConsole(page);
  const response = page.waitForResponse(r => r.url().includes('/api/bff/v1/performance/dashboard'));
  await page.goto('/insights/performance');
  const res = await response;
  expect(res.status()).toBe(200);
  expect(res.request().headers()['x-agent-id']).toBe(profile('PRODUCTION').agentId);
  expect(new URL(res.url()).searchParams.get('businessLine')).toBe('INSURANCE');
  expect(new URL(res.url()).searchParams.get('scope')).toBe('SELF');
  expect(new URL(res.url()).searchParams.get('period')).toBe('YTD');
  await expect(card(page, 'TPC').locator('.value')).toHaveText('48.5K');
  await expect(card(page, 'PTPC').locator('.value')).toHaveText('29.2K');
  await expect(card(page, 'FYP').locator('.value')).toHaveText('68.8K');
  await expect(card(page, 'CASE_COUNT').locator('.value')).toHaveText('8');
  await expect(card(page, 'FYC')).toContainText(en['insights.state.empty.title']);
  expect(consoleWatch.errors).toEqual([]);
  expect(consoleWatch.warnings).toEqual([]);
});

test('AC-PA-DIRECT-13 MAPA selection switches identity and displays its supplied Group values', async ({ page }) => {
  const consoleWatch = watchConsole(page);
  await page.goto('/insights/performance');
  await expect(page.getByRole('combobox', { name: selectorName })).toBeVisible();
  const response = page.waitForResponse(r => r.url().includes('/api/bff/v1/performance/dashboard') && r.request().headers()['x-agent-id'] === profile('MAPA').agentId);
  await page.getByRole('combobox', { name: selectorName }).selectOption(profile('MAPA').id);
  const res = await response;
  expect(res.status()).toBe(200);
  expect(new URL(res.url()).searchParams.get('scope')).toBe('TEAM');
  expect(new URL(res.url()).searchParams.get('teamView')).toBe('GROUP');
  await expect(card(page, 'MANPOWER').locator('.value')).toHaveText('12');
  await expect(card(page, 'ACTIVITY_RATIO').locator('.value')).toHaveText('12%');
  await expect(card(page, 'PRODUCTIVITY').locator('.value')).toHaveText('1.0');
  await expect(card(page, 'AVERAGE_CASE_SIZE').locator('.value')).toHaveText('3.9K');
  await expect(card(page, 'TPC')).toContainText(en['insights.state.empty.title']);
  expect(consoleWatch.errors).toEqual([]);
  expect(consoleWatch.warnings).toEqual([]);
});

test('AC-PA-DIRECT-14 AC-PA-DIRECT-15 persistency survives reload and detail navigation with 88%', async ({ page }) => {
  const consoleWatch = watchConsole(page);
  await page.goto('/insights/performance');
  await page.getByRole('combobox', { name: selectorName }).selectOption(profile('PERSISTENCY').id);
  await expect(card(page, 'PERSISTENCY_CY').locator('.value')).toHaveText('100%');
  await page.reload();
  await expect(page.getByRole('combobox', { name: selectorName })).toHaveValue(profile('PERSISTENCY').id);
  const request = page.waitForResponse(r => r.url().includes('/api/bff/v1/performance/metrics/PERSISTENCY_CY'));
  await card(page, 'PERSISTENCY_CY').click();
  expect((await request).request().headers()['x-agent-id']).toBe(profile('PERSISTENCY').agentId);
  await expect(page.getByRole('img', { name: '100%', exact: true })).toBeVisible();
  const y1 = page.waitForResponse(r => r.url().includes('/api/bff/v1/performance/metrics/PERSISTENCY_Y1'));
  await page.goto('/insights/metric-detail?metricCode=PERSISTENCY_Y1&scope=TEAM&teamView=GROUP&businessLine=INSURANCE&period=YTD&basis=STANDARD');
  expect((await y1).request().headers()['x-agent-id']).toBe(profile('PERSISTENCY').agentId);
  await expect(page.getByRole('img', { name: '88%', exact: true })).toBeVisible();
  expect(consoleWatch.errors).toEqual([]);
  expect(consoleWatch.warnings).toEqual([]);
});