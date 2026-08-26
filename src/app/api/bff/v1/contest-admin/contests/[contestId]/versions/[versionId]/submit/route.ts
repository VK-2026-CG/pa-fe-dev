import type { NextRequest } from 'next/server';
import { contestAsyncResponse } from '@/lib/contest-admin/http';
import { submit } from '@/lib/contest-admin/contest-service';
import type { SubmitContestRequestVM } from '@spec/contest-admin-vm';
type Context={params:Promise<{versionId:string}>};
export async function POST(request:NextRequest,context:Context) { const {versionId}=await context.params; const body=await request.json() as SubmitContestRequestVM;const key=request.headers.get('idempotency-key');if(!key)return Response.json({status:422,code:'CON-4221',messageKey:'contest.error.idempotencyRequired',traceId:'bff-submit'},{status:422}); return contestAsyncResponse(() => submit(versionId,body,request.headers.get('if-match')??'',key),undefined,201); }