import type { NextRequest } from 'next/server';
import { contestAsyncResponse } from '@/lib/contest-admin/http';
import { archive } from '@/lib/contest-admin/contest-service';
type Context={params:Promise<{contestId:string}>};
export async function DELETE(request:NextRequest,context:Context){const {contestId}=await context.params;const key=request.headers.get('idempotency-key');if(!key)return Response.json({status:422,code:'CON-4221',messageKey:'contest.error.idempotencyRequired',traceId:'bff-archive'},{status:422});return contestAsyncResponse(()=>archive(contestId,request.headers.get('if-match')??'',key));}