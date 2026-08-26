import type { NextRequest } from 'next/server';
import { contestAsyncResponse } from '@/lib/contest-admin/http';
import { createContest } from '@/lib/contest-admin/contest-service';
import type { CreateContestRequestVM } from '@spec/contest-admin-vm';

export async function POST(request: NextRequest) {
  const body = await request.json() as CreateContestRequestVM;
  const key=request.headers.get('idempotency-key');
  if(!key)return Response.json({status:422,code:'CON-4221',messageKey:'contest.error.idempotencyRequired',traceId:'bff-contest-create'},{status:422});
  return contestAsyncResponse(() => createContest(body, key), undefined, 201);
}