import { resolveCdk } from '@/cdk/registry';

export default function Page() {
  const Cdk = resolveCdk('set-goals');
  return <Cdk />;
}
