import { cookies } from 'next/headers';
import { resolveCdk } from '@/cdk/registry';
import { DEFAULT_PERSONA, PERSONA_COOKIE, personaById } from '@/lib/persona';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const jar = await cookies();
  const persona = personaById(jar.get(PERSONA_COOKIE)?.value ?? DEFAULT_PERSONA).id;
  const Cdk = resolveCdk('performance');
  return <Cdk query={await searchParams} persona={persona} />;
}
