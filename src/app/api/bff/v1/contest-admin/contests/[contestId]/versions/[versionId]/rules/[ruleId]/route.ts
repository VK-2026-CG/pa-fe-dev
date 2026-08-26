import type { NextRequest } from 'next/server';
import { contestAsyncResponse } from '@/lib/contest-admin/http';
import { getEmbeddedRule, saveEmbeddedRule } from '@/lib/contest-admin/contest-service';
import type { SaveRuleRequestVM } from '@spec/contest-admin-vm';
type Context={params:Promise<{contestId:string;versionId:string;ruleId:string}>};
export async function GET(_:NextRequest,context:Context) { const p=await context.params; return contestAsyncResponse(() => getEmbeddedRule(p.contestId,p.versionId,p.ruleId)); }
export async function PATCH(request:NextRequest,context:Context) { const p=await context.params; const body=await request.json() as SaveRuleRequestVM; return contestAsyncResponse(() => saveEmbeddedRule(p.contestId,p.versionId,p.ruleId,body)); }