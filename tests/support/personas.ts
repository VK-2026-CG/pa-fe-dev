/** Persona stub cookie (pa_persona) — the same identities the header picker offers. */
export const PERSONA_COOKIE = 'pa_persona';

export const PERSONAS = {
  LEADER_P2: 'LEADER_P2',
  LEADER_P3: 'LEADER_P3',
  AGENT_P4: 'AGENT_P4',
  AGENT_EMPTY: 'AGENT_EMPTY',
  AGENT_PROCESSING: 'AGENT_PROCESSING',
} as const;

export type PersonaKey = keyof typeof PERSONAS;

/** Header form for API requests. */
export function personaHeaders(persona: PersonaKey): Record<string, string> {
  return { cookie: `${PERSONA_COOKIE}=${PERSONAS[persona]}` };
}

/** Cookie form for browser contexts. */
export function personaCookie(persona: PersonaKey, url = 'http://127.0.0.1:3600') {
  return {
    name: PERSONA_COOKIE,
    value: PERSONAS[persona],
    url,
  };
}
