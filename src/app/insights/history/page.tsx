import { resolveCdk } from '@/cdk/registry';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const Cdk = resolveCdk('history');
  return <Cdk query={await searchParams} />;
}
