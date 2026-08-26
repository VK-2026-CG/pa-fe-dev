import { resolveCdk } from '@/cdk/registry';

export default function Page() {
  const Cdk = resolveCdk('moc');
  return <Cdk />;
}
