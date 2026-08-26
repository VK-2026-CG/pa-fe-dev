import { contestAsyncResponse } from '@/lib/contest-admin/http';
import { review } from '@/lib/contest-admin/contest-service';
type Context={params:Promise<{contestId:string;versionId:string}>};
export async function GET(_request:Request,context:Context) { const {contestId,versionId}=await context.params; return contestAsyncResponse(()=>review(contestId,versionId)); }