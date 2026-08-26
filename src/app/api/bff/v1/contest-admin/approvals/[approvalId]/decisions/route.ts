import type { NextRequest } from 'next/server';
import { contestAsyncResponse } from '@/lib/contest-admin/http';
import { decide } from '@/lib/contest-admin/contest-service';
import type { ApprovalDecisionRequestVM } from '@spec/contest-admin-vm';
type Context={params:Promise<{approvalId:string}>};
export async function POST(request:NextRequest,context:Context) { const {approvalId}=await context.params; const body=await request.json() as ApprovalDecisionRequestVM;const key=request.headers.get('idempotency-key');if(!key)return Response.json({status:422,code:'CON-4221',messageKey:'contest.error.idempotencyRequired',traceId:'bff-decision'},{status:422});const identity={actorId:request.headers.get('x-contest-actor')??'A2001',tenant:request.headers.get('x-contest-tenant')??'MY'}; return contestAsyncResponse(() => decide(approvalId,body,request.headers.get('if-match')??'',key,identity)); }