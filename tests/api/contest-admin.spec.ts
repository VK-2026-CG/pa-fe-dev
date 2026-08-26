import { expect, test } from '@playwright/test';

test.describe.serial('Contest Administration BFF — real Contest domain', () => {
  let contestId=''; let versionId=''; let versionUrl=''; let approvalId='';

  test('(AC-CA-01) create is persisted and idempotently replayed by the Contest domain',async({request})=>{
    const data={code:'MY_CREATE_API',nameKey:'contest.created.new',timezone:'Asia/Kuala_Lumpur'};
    expect((await request.post('/api/bff/v1/contest-admin/contests',{data})).status()).toBe(422);
    const headers={'Idempotency-Key':'create-api-test-key'};
    const first=await request.post('/api/bff/v1/contest-admin/contests',{headers,data});const replay=await request.post('/api/bff/v1/contest-admin/contests',{headers,data});
    expect(first.status()).toBe(201);expect(replay.status()).toBe(201);expect(await replay.json()).toEqual(await first.json());
    const created=await first.json();contestId=created.contestId;versionId=created.latestVersionId;versionUrl=`/api/bff/v1/contest-admin/contests/${contestId}/versions/${versionId}`;
    expect(contestId).toMatch(/^contest_/);expect(versionId).toMatch(/^version_/);
  });

  test('(AC-CA-01-01/03) portfolio composes backend list and overview',async({request})=>{
    const response=await request.get('/api/bff/v1/contest-admin/portfolio?status=DRAFT&query=MY_CREATE_API');expect(response.ok()).toBeTruthy();const body=await response.json();
    expect(body.contests).toEqual([expect.objectContaining({contestId,code:'MY_CREATE_API',nameKey:'contest.created.new'})]);
    expect(body.metrics).toContainEqual({code:'TOTAL_CONTESTS',value:7});
  });

  test('(AC-CA-02-02) stale ETag is rejected and current ETag advances backend revision',async({request})=>{
    const stale=await request.patch(versionUrl,{headers:{'If-Match':'"999"'},data:{configuration:{basics:{timezone:'UTC'}}}});expect(stale.status()).toBe(412);expect((await stale.json()).code).toBe('CON-4121');
    const before=await (await request.get(versionUrl)).json();const saved=await request.patch(versionUrl,{headers:{'If-Match':before.etag},data:{configuration:{basics:{code:'MY_CREATE_API',nameKey:'contest.created.new',country:'MY',timezone:'Asia/Kuala_Lumpur',name:'New contest'},audience:{codes:['PERSONAL']},calculation:{metricCode:'FYP'},rewards:{precedenceCode:'HIGHEST_ONLY'},governance:{frequencyCode:'DAILY'}}}});expect(saved.ok()).toBeTruthy();expect((await saved.json()).revision).toBe(before.revision+1);
  });

  test('(AC-CA-ROUTE-01/02) qualification route is persisted through contest-version PATCH',async({request})=>{
    const current=await (await request.get(versionUrl)).json();const response=await request.post(`${versionUrl}/routes`,{headers:{'Idempotency-Key':'route-create-key'},data:{name:'Personal production gate',code:'PERSONAL_GATE',audienceCode:'PERSONAL',rootType:'ALL',tierCode:'SILVER',rewardCode:'STAR_1',periodMode:'FULL_CAMPAIGN',etag:current.etag}});expect(response.status()).toBe(201);const route=await response.json();expect(route).toMatchObject({routeId:'route_personal_gate',expression:{type:'ALL'}});
    const editorUrl=`${versionUrl}/rules/${route.routeId}`;const editor=await (await request.get(editorUrl)).json();const expression={...editor.expression,children:[{nodeId:'fyp_gate',type:'PREDICATE',metricCode:'FYP',operator:'GTE',operand:{kind:'MONEY',value:'25000.00',currency:'MYR'}}]};const saved=await request.patch(editorUrl,{data:{expression,options:editor.options,etag:editor.etag}});expect(saved.ok()).toBeTruthy();expect((await (await request.get(versionUrl)).json()).configuration.qualification.routes[0].expression).toEqual(expression);
  });

  test('(AC-CA-04) review invokes backend validation and reports a valid complete draft',async({request})=>{
    const review=await request.get(`${versionUrl}/review`);expect(review.ok()).toBeTruthy();const body=await review.json();expect(body).toMatchObject({versionId,contest:{contestId},validation:{blocking:false}});expect(body.checksum).toBeTruthy();
  });

  test('(AC-CA-BROCHURE-01/02) PDF brochure upload persists privately and streams through the BFF',async({request})=>{const current=await (await request.get(versionUrl)).json();const pdf=Buffer.from('%PDF-1.7\nprivate contest brochure\n%%EOF');const upload=await request.put(`${versionUrl}/brochure`,{headers:{'If-Match':current.etag,'Idempotency-Key':'brochure-api-key'},multipart:{file:{name:'contest-brochure.pdf',mimeType:'application/pdf',buffer:pdf}}});expect(upload.status()).toBe(201);expect(await upload.json()).toMatchObject({fileName:'contest-brochure.pdf',mediaType:'application/pdf',status:'AVAILABLE'});const download=await request.get(`${versionUrl}/brochure`);expect(download.ok()).toBeTruthy();expect(download.headers()['content-type']).toContain('application/pdf');expect(await download.body()).toEqual(pdf);const reloaded=await (await request.get(versionUrl)).json();expect(reloaded.brochure).toMatchObject({fileName:'contest-brochure.pdf',status:'AVAILABLE'});});

  test('(AC-CA-05-01) simulation command and poll read backend-owned job state',async({request})=>{
    const review=await (await request.get(`${versionUrl}/review`)).json();const url=`${versionUrl}/simulations`;const started=await request.post(url,{headers:{'Idempotency-Key':'simulation-api-key'},data:{type:'PORTFOLIO_IMPACT',versionChecksum:review.checksum}});expect(started.status()).toBe(202);const startBody=await started.json();expect(startBody.simulation).toMatchObject({status:'QUEUED',type:'PORTFOLIO_IMPACT'});const polled=await (await request.get(url)).json();expect(polled.simulation.jobId).toBe(startBody.simulation.jobId);
  });

  test('(AC-CA-07) submit creates a backend approval and checker decision is persisted',async({request})=>{
    const current=await (await request.get(versionUrl)).json();const submitted=await request.post(`${versionUrl}/submit`,{headers:{'If-Match':current.etag,'Idempotency-Key':'submit-api-key'},data:{attested:true,changeRationale:'Ready for governed approval'}});expect(submitted.status()).toBe(201);approvalId=(await submitted.json()).approvalId;
    const inbox=await (await request.get('/api/bff/v1/contest-admin/approvals?inbox=ASSIGNED')).json();expect(inbox.items).toEqual(expect.arrayContaining([expect.objectContaining({approvalId,versionId})]));
    const maker=await request.post(`/api/bff/v1/contest-admin/approvals/${approvalId}/decisions`,{headers:{'X-Contest-Actor':'A1001','If-Match':'"1"','Idempotency-Key':'maker-decision-key'},data:{decision:'APPROVE'}});expect(maker.status()).toBe(403);
    const checker=await request.post(`/api/bff/v1/contest-admin/approvals/${approvalId}/decisions`,{headers:{'X-Contest-Actor':'A2001','If-Match':'"1"','Idempotency-Key':'checker-decision-key'},data:{decision:'APPROVE'}});expect(checker.ok()).toBeTruthy();expect((await checker.json()).status).toBe('APPROVED');
  });

  test('(AC-CA-08-01) audit screen reads domain events; unsupported export fails explicitly',async({request})=>{
    const audit=await (await request.get('/api/bff/v1/contest-admin/audit')).json();expect(audit.items.map((item:{action:string})=>item.action)).toEqual(expect.arrayContaining(['CONTEST_CREATED','CONTEST_VERSION_UPDATED','SIMULATION_STARTED','CONTEST_VERSION_SUBMITTED','APPROVAL_APPROVE']));
    expect((await request.post('/api/bff/v1/contest-admin/audit/exports',{headers:{'Idempotency-Key':'audit-export-key'}})).status()).toBe(501);
  });

  test('(AC-CA-HIST-01) historic list is backend-owned and the transitional Template BFF is removed',async({request})=>{const historic=await request.get('/api/bff/v1/contest-admin/historic-contests');expect(historic.ok()).toBeTruthy();expect((await historic.json()).items).toEqual([]);expect((await request.get('/api/bff/v1/contest-admin/templates')).status()).toBe(404);});

  test('(AC-CA-AI-01/02/03/04) brochure bytes create a complete review-required draft through the BFF',async({request})=>{const code=`AI_API_${Date.now()}`;const pdf=Buffer.from('%PDF-1.7\nsynthetic contest brochure\n%%EOF');const response=await request.post('/api/bff/v1/contest-admin/contest-imports',{headers:{'Idempotency-Key':`ai-import-${Date.now()}`},multipart:{requestedCode:code,file:{name:'contest.pdf',mimeType:'application/pdf',buffer:pdf}}});expect(response.status()).toBe(202);const started=await response.json();expect(started).toMatchObject({status:'QUEUED',statusNav:{route:expect.stringContaining('/contest-admin/contest-imports/')}});let current;for(let index=0;index<30;index++){current=await (await request.get(`/api/bff/v1/contest-admin/contest-imports/${started.importId}`)).json();if(current.status==='COMPLETED')break;await new Promise(resolve=>setTimeout(resolve,100));}expect(current).toMatchObject({status:'COMPLETED',result:{status:'DRAFT',reviewState:'NEEDS_BUSINESS_REVIEW',nav:{route:expect.stringContaining('/edit/BASICS')}}});expect(JSON.stringify(current)).not.toContain('objectKey');const builder=await (await request.get(`/api/bff/v1/contest-admin/contests/${current.result.contestId}/versions/${current.result.versionId}`)).json();expect(builder.configuration.qualification.routes[0].expression).toMatchObject({type:'ALL',children:[{type:'PREDICATE',metricCode:'FYP'}]});const brochure=await request.get(`/api/bff/v1/contest-admin/contests/${current.result.contestId}/versions/${current.result.versionId}/brochure`);expect(await brochure.body()).toEqual(pdf);});

  test('(AC-CA-06-01/05) reusable rule round-trip reaches backend',async({request})=>{
    const url='/api/bff/v1/contest-admin/rules';const data={name:'High quality production',code:'HIGH_QUALITY_PRODUCTION',categoryCode:'QUALITY',rootType:'ALL'};const headers={'Idempotency-Key':'create-rule-api-key'};const first=await request.post(url,{headers,data});const replay=await request.post(url,{headers,data});expect(first.status()).toBe(201);expect(await replay.json()).toEqual(await first.json());const created=await first.json();const editorUrl=`${url}/${created.assetId}/versions/${created.latestVersionId}`;const editor=await (await request.get(editorUrl)).json();const expression={nodeId:editor.expression.nodeId,type:'ALL',children:[{nodeId:'api_fyp_condition',type:'PREDICATE',metricCode:'FYP',operator:'GTE',operand:{kind:'MONEY',value:'25000.00',currency:'MYR'}}]};expect((await request.post(`${editorUrl}/test`,{headers:{'Idempotency-Key':'test-rule-api-key'},data:{expression,options:editor.options}})).ok()).toBeTruthy();expect((await request.patch(editorUrl,{headers:{'Idempotency-Key':'save-rule-api-key'},data:{expression,options:editor.options,etag:editor.etag}})).ok()).toBeTruthy();expect((await request.get(editorUrl)).json()).resolves.toMatchObject({expression,etag:'"2"'});
  });
});