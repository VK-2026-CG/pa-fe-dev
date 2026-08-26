import type { NextRequest } from 'next/server';
import { contestAsyncResponse } from '@/lib/contest-admin/http';
import { getRuleEditor, saveRule } from '@/lib/contest-admin/rule-service';
import type { SaveRuleRequestVM } from '@spec/contest-admin-vm';
type Context={params:Promise<{assetId:string;ruleVersionId:string}>};
const identity=(request:NextRequest)=>({actorId:request.headers.get('x-contest-actor')??'A1001',tenant:request.headers.get('x-contest-tenant')??'MY'});
export async function GET(request:NextRequest,context:Context){const {assetId,ruleVersionId}=await context.params;return contestAsyncResponse(()=>getRuleEditor(assetId,ruleVersionId,identity(request)));}
export async function PATCH(request:NextRequest,context:Context){const {assetId,ruleVersionId}=await context.params;const body=await request.json() as SaveRuleRequestVM;const key=request.headers.get('idempotency-key');if(!key)return Response.json({status:422,code:'CON-4221',messageKey:'contest.error.idempotencyRequired',traceId:'bff-rule-save'},{status:422});return contestAsyncResponse(()=>saveRule(assetId,ruleVersionId,body,key,identity(request)));}