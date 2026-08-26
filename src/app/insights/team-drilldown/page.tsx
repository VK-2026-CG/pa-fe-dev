import { resolveCdk } from '@/cdk/registry';

export default function Page() {
  const Cdk = resolveCdk('team-drilldown');
  return <Cdk />;
}
