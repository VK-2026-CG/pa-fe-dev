import { getLbuContext } from '@/config/lbu';
import type { ApprovalDecisionRequestVM, ArchiveContestResultVM, BrochureMetadataVM, CreateContestRequestVM, HistoricContestSummaryVM, ReactivateContestRequestVM, RuleExpressionVM, RuleOptionsVM, StartSimulationRequestVM, SubmitContestRequestVM } from '@spec/contest-admin-vm';

const context = getLbuContext();
const BASE = context.contestApiUrl;
if (!BASE) throw new Error(`CONTESTS_API_URL is required for LBU_CODE=${context.lbu}`);

export class ContestDomainError extends Error {
  constructor(public status: number, public problem: { status:number;code:string;title:string;traceId:string;detail?:string;errors?:Array<{path:string;code:string;messageKey?:string}> }) { super(problem.code); }
}
export interface ContestIdentity { actorId:string; tenant:string }
const defaultIdentity:ContestIdentity={actorId:'A1001',tenant:context.country};
async function call<T>(path:string,identity:ContestIdentity=defaultIdentity,init?:RequestInit):Promise<{body:T;etag?:string;replay:boolean}>{
  const response=await fetch(`${BASE}${path}`,{...init,headers:{'content-type':'application/json','x-agent-id':identity.actorId,'x-tenant':identity.tenant,...(init?.headers??{})},cache:'no-store'});
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw new ContestDomainError(response.status,{status:response.status,code:body.code??'CON-5031',title:body.title??response.statusText,traceId:body.traceId??'unavailable',detail:body.detail,errors:body.errors});
  return {body:body as T,etag:response.headers.get('etag')??undefined,replay:response.headers.get('idempotent-replay')==='true'};
}
export interface DomainRuleSummary {assetId:string;code:string;name:string;nameKey?:string;type:'RULE';categoryCode:string;status:'DRAFT'|'IN_REVIEW'|'APPROVED'|'DEPRECATED';latestVersion:string;latestVersionId:string;adoptionCount:number}
export interface DomainRuleVersion {assetId:string;ruleVersionId:string;revision:number;code:string;name:string;nameKey?:string;categoryCode:string;status:'DRAFT'|'IN_REVIEW'|'APPROVED'|'SUPERSEDED'|'DEPRECATED';expression:RuleExpressionVM;options:RuleOptionsVM;checksum:string;catalogueVersion:string;createdBy:string;createdAt:string;updatedAt?:string}
export interface DomainRuleReport {valid:boolean;issues:Array<{path:string;code:string;messageKey?:string}>;nodeOutcomes:Array<{nodeId:string;outcome:'PASS'|'FAIL'|'ERROR'|'NOT_EVALUATED';reasonCode?:string}>;configurationChecksum:string;engineVersion:string;catalogueVersion:string}
export interface DomainContestSummary {contestId:string;code:string;nameKey:string;status:string;ownerRef:string;campaignStart:string;campaignEnd:string;audienceCodes:string[];ruleCount:number;updatedAt:string;latestVersionId?:string;country?:string;timezone?:string}
export interface DomainContestVersion {versionId:string;contestId:string;revision:number;displayVersion:string;status:string;configuration:Record<string,unknown>;checksum:string;createdBy:string;createdAt:string;updatedAt?:string;baseVersionId?:string;brochure?:BrochureMetadataVM}
export interface DomainValidation {validationRunId:string;status:'VALID'|'INVALID';issues:Array<{path:string;code:string;severity:string;messageKey?:string}>;validatedAt:string;configurationChecksum:string}
export interface DomainApproval {approvalId:string;contestId:string;versionId:string;revision:number;status:string;submittedBy:string;submittedAt:string;snapshotChecksum:string;stages:Array<{stageId:string;status:string}>;decidedAt?:string;decision?:string;returnedVersionId?:string}
export interface DomainSimulation {simulationId:string;jobId:string;versionId:string;simulationType:'SAMPLE_PARTICIPANT'|'PORTFOLIO_IMPACT';status:string;progressPct:number;reconciliation?:Record<string,number>;problemCode?:string}
export interface DomainAsset {assetId:string;code:string;name?:string;type:'RULE';categoryCode:string;status:'DRAFT'|'IN_REVIEW'|'APPROVED'|'DEPRECATED';latestVersion:string;latestVersionId:string;adoptionCount:number}
export interface DomainAuditEvent {eventId:string;occurredAt:string;actorRef:string;action:string;resourceType:string;resourceId:string;outcome:string;versionId?:string}
export const contestDomain={
  listContests:(search='',identity?:ContestIdentity)=>call<{items:DomainContestSummary[];page:{hasMore:boolean;count:number}}>(`/contests${search}`,identity),
  overview:(identity?:ContestIdentity)=>call<{metrics:Array<{code:string;value:number}>;attentionItems:Array<{id:string;type:string;severity:'INFO'|'WARNING'|'ERROR'}>}>('/contests/overview',identity),
  createContest:(input:CreateContestRequestVM,key:string,identity?:ContestIdentity)=>call<DomainContestSummary>('/contests',identity,{method:'POST',headers:{'idempotency-key':key},body:JSON.stringify(input)}),
  getContest:(contestId:string,identity?:ContestIdentity)=>call<DomainContestSummary>(`/contests/${encodeURIComponent(contestId)}`,identity),
  getContestVersion:(versionId:string,identity?:ContestIdentity)=>call<DomainContestVersion>(`/contest-versions/${encodeURIComponent(versionId)}`,identity),
  patchContestVersion:(versionId:string,configuration:Record<string,unknown>,etag:string,identity?:ContestIdentity)=>call<DomainContestVersion>(`/contest-versions/${encodeURIComponent(versionId)}`,identity,{method:'PATCH',headers:{'if-match':etag},body:JSON.stringify(configuration)}),
  validateContestVersion:(versionId:string,key:string,identity?:ContestIdentity)=>call<DomainValidation>(`/contest-versions/${encodeURIComponent(versionId)}/validate`,identity,{method:'POST',headers:{'idempotency-key':key},body:'{}'}),
  submitContestVersion:(versionId:string,input:SubmitContestRequestVM,etag:string,key:string,identity?:ContestIdentity)=>call<DomainApproval>(`/contest-versions/${encodeURIComponent(versionId)}/submit`,identity,{method:'POST',headers:{'if-match':etag,'idempotency-key':key},body:JSON.stringify(input)}),
  listHistoric:(search='',identity?:ContestIdentity)=>call<{items:HistoricContestSummaryVM[];page:{hasMore:boolean;count:number}}>(`/historic-contests${search}`,identity),
  archiveContest:(contestId:string,etag:string,key:string,identity?:ContestIdentity)=>call<ArchiveContestResultVM>(`/contests/${encodeURIComponent(contestId)}`,identity,{method:'DELETE',headers:{'if-match':etag,'idempotency-key':key}}),
  reactivateContest:(contestId:string,input:ReactivateContestRequestVM,etag:string,key:string,identity?:ContestIdentity)=>call<DomainContestVersion>(`/contests/${encodeURIComponent(contestId)}/reactivations`,identity,{method:'POST',headers:{'if-match':etag,'idempotency-key':key},body:JSON.stringify(input)}),
  listApprovals:(status:string|undefined,identity?:ContestIdentity)=>call<{items:DomainApproval[];page:{hasMore:boolean;count:number}}>(`/approvals${status?`?status=${encodeURIComponent(status)}`:''}`,identity),
  decideApproval:(approvalId:string,input:ApprovalDecisionRequestVM,etag:string,key:string,identity?:ContestIdentity)=>call<DomainApproval>(`/approvals/${encodeURIComponent(approvalId)}/decisions`,identity,{method:'POST',headers:{'if-match':etag,'idempotency-key':key},body:JSON.stringify(input)}),
  startSimulation:(versionId:string,input:StartSimulationRequestVM,key:string,identity?:ContestIdentity)=>call<DomainSimulation>(`/contest-versions/${encodeURIComponent(versionId)}/simulations`,identity,{method:'POST',headers:{'idempotency-key':key},body:JSON.stringify(input)}),
  getSimulation:(simulationId:string,identity?:ContestIdentity)=>call<DomainSimulation>(`/simulations/${encodeURIComponent(simulationId)}`,identity),
  listAudit:(identity?:ContestIdentity)=>call<{items:DomainAuditEvent[];page:{hasMore:boolean;count:number}}>('/audit-events',identity),
  listRules:(identity?:ContestIdentity)=>call<{items:DomainRuleSummary[]}>('/rules',identity),
  createRule:(input:{code:string;name:string;categoryCode:string;configuration:RuleExpressionVM},idempotencyKey:string,identity?:ContestIdentity)=>call<DomainRuleSummary>('/rules',identity,{method:'POST',headers:{'idempotency-key':idempotencyKey},body:JSON.stringify(input)}),
  getRuleVersion:(ruleVersionId:string,identity?:ContestIdentity)=>call<DomainRuleVersion>(`/rule-versions/${encodeURIComponent(ruleVersionId)}`,identity),
  patchRuleVersion:(ruleVersionId:string,input:{expression:RuleExpressionVM;options:RuleOptionsVM},etag:string,idempotencyKey:string,identity?:ContestIdentity)=>call<DomainRuleVersion>(`/rule-versions/${encodeURIComponent(ruleVersionId)}`,identity,{method:'PATCH',headers:{'if-match':etag,'idempotency-key':idempotencyKey},body:JSON.stringify(input)}),
  validateRuleVersion:(ruleVersionId:string,input:{expression:RuleExpressionVM;options:RuleOptionsVM},idempotencyKey:string,identity?:ContestIdentity)=>call<DomainRuleReport>(`/rule-versions/${encodeURIComponent(ruleVersionId)}/validate`,identity,{method:'POST',headers:{'idempotency-key':idempotencyKey},body:JSON.stringify(input)}),
  getContestImport:(importId:string,identity?:ContestIdentity)=>call<Record<string,unknown>>(`/contest-imports/${encodeURIComponent(importId)}`,identity),
};

export async function brochureCall(path:string,identity:ContestIdentity=defaultIdentity,init?:RequestInit){const response=await fetch(`${BASE}${path}`,{...init,headers:{'x-agent-id':identity.actorId,'x-tenant':identity.tenant,...(init?.headers??{})},cache:'no-store'});if(!response.ok){const body=await response.json().catch(()=>({}));throw new ContestDomainError(response.status,{status:response.status,code:body.code??'CON-5031',title:body.title??response.statusText,traceId:body.traceId??'unavailable'});}return response;}