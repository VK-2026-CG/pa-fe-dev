import type { NextRequest } from 'next/server';
import { contestAsyncResponse } from '@/lib/contest-admin/http';
import { contestImport } from '@/lib/contest-admin/contest-service';
type Context={params:Promise<{importId:string}>};
export async function GET(request:NextRequest,context:Context){const {importId}=await context.params;return contestAsyncResponse(()=>contestImport(importId,{actorId:request.headers.get('x-contest-actor')??'A1001',tenant:request.headers.get('x-contest-tenant')??'MY'}));}