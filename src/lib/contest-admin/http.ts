import { NextResponse } from 'next/server';
import { ContestDomainError } from './domain-client';

export async function contestAsyncResponse<T>(work:()=>Promise<T>,headers?:HeadersInit,status=200):Promise<NextResponse<T|unknown>>{
  try{return NextResponse.json(await work(),{headers,status});}
  catch(error){if(error instanceof ContestDomainError)return NextResponse.json({status:error.status,code:error.problem.code,messageKey:mapMessage(error.problem.code),traceId:error.problem.traceId,errors:error.problem.errors?.map(item=>({...item,messageKey:item.messageKey??mapMessage(item.code)}))},{status:error.status});throw error;}
}
const mapMessage=(code:string)=>({['CON-4091']:'contest.error.duplicateCode',['CON-4092']:'contest.error.staleSnapshot',['CON-4121']:'contest.error.conflict',['CON-4221']:'contest.error.ruleInvalid',['CON-4041']:'contest.error.notFound'}[code]??'contest.error.generic');