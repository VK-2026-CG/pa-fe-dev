import type { NextRequest } from 'next/server';
import { contestAsyncResponse } from '@/lib/contest-admin/http';
import { approvals } from '@/lib/contest-admin/contest-service';
export function GET(request: NextRequest) { return contestAsyncResponse(() => approvals(request.nextUrl.searchParams.get('inbox') ?? undefined)); }