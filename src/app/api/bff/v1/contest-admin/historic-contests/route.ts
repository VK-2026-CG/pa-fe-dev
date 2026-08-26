import type { NextRequest } from 'next/server';
import { contestAsyncResponse } from '@/lib/contest-admin/http';
import { historicContests } from '@/lib/contest-admin/contest-service';
export function GET(request:NextRequest){return contestAsyncResponse(()=>historicContests(request.nextUrl.searchParams));}