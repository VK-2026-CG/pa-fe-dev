/**
 * Client-side persona identity (replaces the pre-migration `pa_persona`
 * cookie + `src/app/api/dev/persona` route). The selection now lives in
 * `localStorage` and travels to pa-be-dev as the `x-persona` request header
 * (see `@/lib/apiClient`) — same unverified trust level as the cookie it
 * replaces, just a different transport now that the BFF is cross-origin.
 */
import {
  createContext, useContext, useMemo, useState, type ReactNode,
} from 'react';
import { DEFAULT_PERSONA, personaById, type PersonaId } from '@/lib/persona';

export const PERSONA_STORAGE_KEY = 'pa_persona';

/** Pure read, safe for non-component call sites (e.g. `apiClient`). */
export function getStoredPersonaId(): PersonaId {
  if (typeof window === 'undefined') return DEFAULT_PERSONA;
  return personaById(window.localStorage.getItem(PERSONA_STORAGE_KEY) ?? undefined).id;
}

interface PersonaContextValue {
  personaId: PersonaId;
  setPersonaId: (id: PersonaId) => void;
}

const PersonaContext = createContext<PersonaContextValue | null>(null);

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [personaId, setPersonaIdState] = useState<PersonaId>(() => getStoredPersonaId());

  const value = useMemo<PersonaContextValue>(() => ({
    personaId,
    setPersonaId: (id) => {
      window.localStorage.setItem(PERSONA_STORAGE_KEY, id);
      setPersonaIdState(id);
    },
  }), [personaId]);

  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>;
}

export function usePersona(): PersonaContextValue {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error('usePersona must be used within a PersonaProvider');
  return ctx;
}
