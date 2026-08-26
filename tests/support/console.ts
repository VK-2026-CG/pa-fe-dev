import type { Page } from '@playwright/test';

export interface ConsoleWatch {
  errors: string[];
  warnings: string[];
}

/**
 * Collect console errors / page errors / missing-i18n warnings.
 * AGENTS.md definition of done: zero console errors in the flows you touch.
 */
export function watchConsole(page: Page): ConsoleWatch {
  const watch: ConsoleWatch = { errors: [], warnings: [] };
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') watch.errors.push(text);
    // The i18n helper warns on any key missing from the vendored bundle.
    if (msg.type() === 'warning' && text.includes('[i18n] missing key')) watch.warnings.push(text);
  });
  page.on('pageerror', (err) => watch.errors.push(`pageerror: ${err.message}`));
  return watch;
}
