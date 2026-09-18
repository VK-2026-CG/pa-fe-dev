import { defineConfig } from '@playwright/test';
import config from './playwright.config';

/** Cross-platform pure-module entrypoint; no environment shell syntax or servers. */
export default defineConfig({ ...config, webServer: undefined });