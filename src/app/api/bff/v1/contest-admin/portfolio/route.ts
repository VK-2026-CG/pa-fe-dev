import type { NextRequest } from 'next/server';
import { contestAsyncResponse } from '@/lib/contest-admin/http';
import { portfolio } from '@/lib/contest-admin/contest-service';

export function GET(request: NextRequest) { return contestAsyncResponse(() => portfolio(request.nextUrl.searchParams)); }