import type { NextRequest } from 'next/server';
import { contestAsyncResponse } from '@/lib/contest-admin/http';
import { testEmbeddedRule } from '@/lib/contest-admin/contest-service';
import type { SaveRuleRequestVM } from '@spec/contest-admin-vm';
type Context={params:Promise<{contestId:string;versionId:string;ruleId:string}>};
export async function POST(request:NextRequest,context:Context) { const p=await context.params; const body=await request.json() as SaveRuleRequestVM; return contestAsyncResponse(() => testEmbeddedRule(p.contestId,p.versionId,p.ruleId,body)); }