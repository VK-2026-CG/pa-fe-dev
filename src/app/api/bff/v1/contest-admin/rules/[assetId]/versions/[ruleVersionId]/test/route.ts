import type { NextRequest } from 'next/server';
import { contestAsyncResponse } from '@/lib/contest-admin/http';
import { testRule } from '@/lib/contest-admin/rule-service';
import type { TestRuleRequestVM } from '@spec/contest-admin-vm';
type Context={params:Promise<{assetId:string;ruleVersionId:string}>};
const identity=(request:NextRequest)=>({actorId:request.headers.get('x-contest-actor')??'A1001',tenant:request.headers.get('x-contest-tenant')??'MY'});
export async function POST(request:NextRequest,context:Context){const {assetId,ruleVersionId}=await context.params;const body=await request.json() as TestRuleRequestVM;const key=request.headers.get('idempotency-key');if(!key)return Response.json({status:422,code:'CON-4221',messageKey:'contest.error.idempotencyRequired',traceId:'bff-rule-test'},{status:422});return contestAsyncResponse(()=>testRule(assetId,ruleVersionId,body,key,identity(request)));}