import { contestAsyncResponse } from '@/lib/contest-admin/http';
import { audit } from '@/lib/contest-admin/contest-service';
export function GET() { return contestAsyncResponse(audit); }