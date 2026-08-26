import type { NextRequest } from 'next/server';
import { contestAsyncResponse } from '@/lib/contest-admin/http';
import { pollSimulation, startSimulation } from '@/lib/contest-admin/contest-service';
import type { StartSimulationRequestVM } from '@spec/contest-admin-vm';
type Context={params:Promise<{contestId:string;versionId:string}>};
export async function GET(_request:NextRequest,context:Context) { const {contestId,versionId}=await context.params; return contestAsyncResponse(()=>pollSimulation(contestId,versionId)); }
export async function POST(request:NextRequest,context:Context) { const {contestId,versionId}=await context.params; const body=await request.json() as StartSimulationRequestVM;const key=request.headers.get('idempotency-key');if(!key)return Response.json({status:422,code:'CON-4221',messageKey:'contest.error.idempotencyRequired',traceId:'bff-simulation'},{status:422}); return contestAsyncResponse(() => startSimulation(contestId,versionId,body,key),undefined,202); }