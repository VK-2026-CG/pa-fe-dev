import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { hasKey, t } from '@/lib/i18n';

function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(f)) out.push(p);
  }
  return out;
}

test.describe('i18n discipline (AGENTS.md hard rules: no invented copy)', () => {
  test('interpolates params', () => {
    expect(t('insights.dashboard.otherFocusMetrics', { n: 2 })).toBe('Other Focus Metrics (2)');
  });
  test("every t('literal') key used in src exists in the vendored bundle", () => {
    const files = walk(path.resolve(__dirname, '../../src'));
    const used = new Set<string>();
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/\bt\(\s*'([^']+)'/g)) used.add(m[1]!);
      for (const m of src.matchAll(/\bt\(\s*"([^"]+)"/g)) used.add(m[1]!);
    }
    expect(used.size).toBeGreaterThan(20);
    const missing = [...used].filter((k) => !k.includes('${') && !hasKey(k));
    expect(missing).toEqual([]);
  });
});
