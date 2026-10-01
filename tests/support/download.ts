import { readFileSync } from 'node:fs';
import type { Download, Page } from '@playwright/test';

/** What can be proven about a downloaded PDF without decrypting it (decryption is checked with pypdf — see the CHANGELOG). */
export interface PdfFacts {
  bytes: number;
  startsWithPdfHeader: boolean;
  hasEncryptDictionary: boolean;
  /** `/CFM /AESV3` = AES-256 (Standard security handler V5). */
  usesAes256: boolean;
  /** Plain-text content that must NOT be readable in an encrypted file. */
  leaks: string[];
}

export async function inspectPdf(download: Download, mustNotLeak: string[] = []): Promise<PdfFacts> {
  const path = await download.path();
  const raw = readFileSync(path);
  const text = raw.toString('latin1');
  return {
    bytes: raw.length,
    startsWithPdfHeader: text.startsWith('%PDF-'),
    hasEncryptDictionary: text.includes('/Encrypt') && text.includes('/Filter /Standard'),
    usesAes256: text.includes('/CFM /AESV3') && text.includes('/V 5'),
    leaks: mustNotLeak.filter((needle) => text.includes(needle)),
  };
}

/**
 * Everything the page sends or stores, so a test can prove the password never leaves the sheet: every request URL
 * and body, every console line, the page URL and both web storages.
 */
export function watchSecrets(page: Page) {
  const traffic: string[] = [];
  const consoleLines: string[] = [];
  page.on('request', (request) => { traffic.push(`${request.method()} ${request.url()} ${request.postData() ?? ''} ${JSON.stringify(request.headers())}`); });
  page.on('console', (message) => { consoleLines.push(message.text()); });
  page.on('pageerror', (error) => { consoleLines.push(error.message); });
  return {
    traffic,
    consoleLines,
    async storage(): Promise<string> {
      return page.evaluate(() => JSON.stringify([{ ...localStorage }, { ...sessionStorage }, document.cookie, location.href]));
    },
  };
}
