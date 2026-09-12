import type { BrowserContext } from '@playwright/test';

/** Client-side persona storage key (see `src/lib/usePersona.tsx`) — the same identities the header dropdown offers. */
export const PERSONA_STORAGE_KEY = 'pa_persona';

export const PERSONAS = {
  LEADER_P2: 'LEADER_P2',
  LEADER_P3: 'LEADER_P3',
  AGENT_P4: 'AGENT_P4',
  AGENT_EMPTY: 'AGENT_EMPTY',
  AGENT_PROCESSING: 'AGENT_PROCESSING',
} as const;

export type PersonaKey = keyof typeof PERSONAS;

/**
 * Seed the SPA's persona selection before first navigation. The app is a
 * client-side SPA now (no `pa_persona` cookie / server-rendered page), so
 * tests set the same `localStorage` key the persona picker itself writes to,
 * via a context-level init script that runs before any app code does.
 */
export async function setPersona(context: BrowserContext, persona: PersonaKey): Promise<void> {
  await context.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [PERSONA_STORAGE_KEY, PERSONAS[persona]] as [string, string],
  );
}
