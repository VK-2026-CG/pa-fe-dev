import type { NextRequest } from 'next/server';
import type { ReactivateContestRequestVM } from '@spec/contest-admin-vm';
import { contestAsyncResponse } from '@/lib/contest-admin/http';
import { reactivate } from '@/lib/contest-admin/contest-service';
type Context={params:Promise<{contestId:string}>};
export async function POST(request:NextRequest,context:Context){const {contestId}=await context.params;const key=request.headers.get('idempotency-key');if(!key)return Response.json({status:422,code:'CON-4221',messageKey:'contest.error.idempotencyRequired',traceId:'bff-reactivate'},{status:422});const body=await request.json() as ReactivateContestRequestVM;return contestAsyncResponse(()=>reactivate(contestId,body,request.headers.get('if-match')??'',key),undefined,201);}