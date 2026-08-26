import { resolveCdk } from '@/cdk/registry';
export default function Page() { const Cdk = resolveCdk('contest-admin'); return <Cdk page="audit"/>; }