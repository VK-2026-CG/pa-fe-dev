import type { NextRequest } from 'next/server';
import { contestAsyncResponse } from '@/lib/contest-admin/http';
import { createRule, listRules } from '@/lib/contest-admin/rule-service';
import type { CreateRuleAssetRequestVM } from '@spec/contest-admin-vm';
const identity=(request:NextRequest)=>({actorId:request.headers.get('x-contest-actor')??'A1001',tenant:request.headers.get('x-contest-tenant')??'MY'});
export function GET(request:NextRequest) { return contestAsyncResponse(()=>listRules(identity(request))); }
export async function POST(request:NextRequest) { const body=await request.json() as CreateRuleAssetRequestVM; const key=request.headers.get('idempotency-key'); if(!key)return Response.json({status:422,code:'CON-4221',messageKey:'contest.error.idempotencyRequired',traceId:'bff-rule-create'},{status:422}); return contestAsyncResponse(()=>createRule(body,key,identity(request)),undefined,201); }