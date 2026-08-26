import type { NextRequest } from 'next/server';
import { contestAsyncResponse } from '@/lib/contest-admin/http';
import { createQualificationRoute } from '@/lib/contest-admin/contest-service';
import type { CreateQualificationRouteRequestVM } from '@spec/contest-admin-vm';
type Context={params:Promise<{contestId:string;versionId:string}>};
export async function POST(request:NextRequest,context:Context){const {contestId,versionId}=await context.params;const body=await request.json() as CreateQualificationRouteRequestVM;return contestAsyncResponse(()=>createQualificationRoute(contestId,versionId,body),undefined,201);}