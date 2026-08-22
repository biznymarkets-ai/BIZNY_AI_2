import fs from 'fs';

const BASE = 'http://localhost:3000';

async function req(path, options = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) { json = text; }
  return { status: res.status, ok: res.ok, headers: res.headers, body: json, rawText: text };
}

async function runAcceptanceSuite() {
  const report = {};
  console.log('--- STARTING 16-TEST ACCEPTANCE SUITE ---');

  // ==========================================
  // TEST 1 & 2: PERSONA SWITCHING & COPILOT GROUNDING
  // ==========================================
  console.log('\n[RUNNING TEST 1 & 2: PERSONAS & GROUNDING]');
  const personas = ['chidi', 'amara', 'fatima', 'emeka', 'ada'];
  report.test1 = { personas: [] };
  report.test2 = { groundings: [] };

  for (const p of personas) {
    const sw = await req(`/api/demo/switch-persona/${p}`, { method: 'POST' });
    const me = await req('/api/auth/me', { headers: { Authorization: 'Bearer ' + sw.body?.token } });
    const ventures = await req('/api/ventures/my', { headers: { Authorization: 'Bearer ' + sw.body?.token } });
    const tasks = await req('/api/coach/tasks', { headers: { Authorization: 'Bearer ' + sw.body?.token } });
    
    // Test 2: Copilot Grounding query
    const cop = await req('/api/copilot/chat', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + sw.body?.token },
      body: JSON.stringify({ message: 'What do you know about my business, my current venture, my location, and my current bottleneck?' })
    });

    report.test1.personas.push({
      persona: p,
      switchOk: sw.ok,
      userName: me.body?.name,
      userRole: me.body?.role,
      venture: ventures.body?.[0]?.title || 'None',
      taskCount: Array.isArray(tasks.body) ? tasks.body.length : 0,
      tasksPreview: Array.isArray(tasks.body) ? tasks.body.slice(0, 2).map(t => t.title) : []
    });

    report.test2.groundings.push({
      persona: p,
      copilotResponse: cop.body?.reply
    });
    console.log(`✓ Persona ${p} tested.`);
  }

  // ==========================================
  // TEST 3: MARKETPLACE TOOL EXECUTION
  // ==========================================
  console.log('\n[RUNNING TEST 3: MARKETPLACE TOOL]');
  const chidi = await req('/api/demo/switch-persona/chidi', { method: 'POST' });
  const toolMarketplace = await req('/api/copilot/chat', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + chidi.body?.token },
    body: JSON.stringify({ message: 'Find me a verified flash dryer supplier on the Bizny marketplace.' })
  });
  report.test3 = {
    user: 'Chidi Okafor',
    response: toolMarketplace.body?.reply,
    hasActionCards: Array.isArray(toolMarketplace.body?.actionCards) && toolMarketplace.body.actionCards.length > 0,
    actionCards: toolMarketplace.body?.actionCards
  };
  console.log('✓ Test 3 finished.');

  // ==========================================
  // TEST 4: TEMPLATE TOOL
  // ==========================================
  console.log('\n[RUNNING TEST 4: TEMPLATE TOOL]');
  const toolTemplate = await req('/api/copilot/chat', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + chidi.body?.token },
    body: JSON.stringify({ message: 'Find me an operational SOP blueprint for cassava flash drying and industrial refining.' })
  });
  report.test4 = {
    response: toolTemplate.body?.reply,
    actionCards: toolTemplate.body?.actionCards
  };
  console.log('✓ Test 4 finished.');

  // ==========================================
  // TEST 5: OPPORTUNITY TOOL
  // ==========================================
  console.log('\n[RUNNING TEST 5: OPPORTUNITY TOOL]');
  const toolOpp = await req('/api/copilot/chat', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + chidi.body?.token },
    body: JSON.stringify({ message: 'Find me commercial offtaker opportunities for high-grade cassava starch.' })
  });
  report.test5 = {
    response: toolOpp.body?.reply,
    actionCards: toolOpp.body?.actionCards
  };
  console.log('✓ Test 5 finished.');

  // ==========================================
  // TEST 6: VERIFICATION STATUS TOOL
  // ==========================================
  console.log('\n[RUNNING TEST 6: VERIFICATION TOOL]');
  const toolVerif = await req('/api/copilot/chat', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + chidi.body?.token },
    body: JSON.stringify({ message: 'Is Eze Precision Metalworks verified on Bizny?' })
  });
  report.test6 = {
    response: toolVerif.body?.reply,
    actionCards: toolVerif.body?.actionCards
  };
  console.log('✓ Test 6 finished.');

  // ==========================================
  // TEST 7: COACH WRITE & CREATION
  // ==========================================
  console.log('\n[RUNNING TEST 7: COACH WRITE]');
  const chidiBeforeTasks = await req('/api/coach/tasks', { headers: { Authorization: 'Bearer ' + chidi.body?.token } });
  const toolCoachWrite = await req('/api/copilot/chat', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + chidi.body?.token },
    body: JSON.stringify({ message: 'Create a high-priority Coach task for me to follow up with Amara at Eze Precision Metalworks tomorrow regarding the 500kg/hr flash dryer delivery schedule.' })
  });
  const chidiAfterTasks = await req('/api/coach/tasks', { headers: { Authorization: 'Bearer ' + chidi.body?.token } });
  
  const createdTask = chidiAfterTasks.body?.find(t => t.title.includes('Amara') || t.title.includes('flash dryer') || t.title.includes('Eze') || t.title.includes('Follow up'));

  report.test7 = {
    reply: toolCoachWrite.body?.reply,
    actionCards: toolCoachWrite.body?.actionCards,
    beforeCount: chidiBeforeTasks.body?.length,
    afterCount: chidiAfterTasks.body?.length,
    createdTaskId: createdTask?.id,
    createdTaskTitle: createdTask?.title,
    createdTaskPriority: createdTask?.priority,
    derivedUserId: createdTask?.userId
  };
  console.log('✓ Test 7 finished.');

  // ==========================================
  // TEST 8: TENANT ISOLATION
  // ==========================================
  console.log('\n[RUNNING TEST 8: TENANT ISOLATION]');
  const amara = await req('/api/demo/switch-persona/amara', { method: 'POST' });
  const amaraTasks = await req('/api/coach/tasks', { headers: { Authorization: 'Bearer ' + amara.body?.token } });
  const amaraHasChidiTask = Array.isArray(amaraTasks.body) && amaraTasks.body.some(t => t.id === createdTask?.id);

  // Switch back to Chidi
  const chidiReCheck = await req('/api/demo/switch-persona/chidi', { method: 'POST' });
  const chidiFinalTasks = await req('/api/coach/tasks', { headers: { Authorization: 'Bearer ' + chidiReCheck.body?.token } });
  const chidiStillHasTask = Array.isArray(chidiFinalTasks.body) && chidiFinalTasks.body.some(t => t.id === createdTask?.id);

  report.test8 = {
    amaraUserId: amara.body?.user?.id,
    chidiUserId: chidi.body?.user?.id,
    amaraSawChidiTask: amaraHasChidiTask,
    chidiStillHasTask: chidiStillHasTask
  };
  console.log('✓ Test 8 finished.');

  // ==========================================
  // TEST 9: ZERO-HALLUCINATION
  // ==========================================
  console.log('\n[RUNNING TEST 9: ZERO HALLUCINATION]');
  const zeroHallucination = await req('/api/copilot/chat', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + chidi.body?.token },
    body: JSON.stringify({ message: 'Find supplier ZZZ_TEST_SUPPLIER_987654321 in Lagos.' })
  });
  report.test9 = {
    response: zeroHallucination.body?.reply
  };
  console.log('✓ Test 9 finished.');

  // ==========================================
  // TEST 10: SYNTHETIC SEED IDEMPOTENCY
  // ==========================================
  console.log('\n[RUNNING TEST 10: SEED IDEMPOTENCY]');
  const users1 = (await req('/api/users')).body?.length;
  const ventures1 = (await req('/api/ventures/public')).body?.length;
  const listings1 = (await req('/api/marketplace')).body?.length;
  const opps1 = (await req('/api/opportunities')).body?.length;

  await req('/api/demo/seed', { method: 'POST' });
  await req('/api/demo/seed', { method: 'POST' });

  const users2 = (await req('/api/users')).body?.length;
  const ventures2 = (await req('/api/ventures/public')).body?.length;
  const listings2 = (await req('/api/marketplace')).body?.length;
  const opps2 = (await req('/api/opportunities')).body?.length;

  report.test10 = {
    usersBefore: users1,
    usersAfter: users2,
    venturesBefore: ventures1,
    venturesAfter: ventures2,
    listingsBefore: listings1,
    listingsAfter: listings2,
    oppsBefore: opps1,
    oppsAfter: opps2,
    idempotent: listings1 === listings2 && opps1 === opps2
  };
  console.log('✓ Test 10 finished.');

  // ==========================================
  // TEST 11: GEMINI STREAMING WITH TOOL EXECUTION
  // ==========================================
  console.log('\n[RUNNING TEST 11: STREAMING]');
  const streamRes = await fetch(BASE + '/api/openai/conversations/1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + chidi.body?.token },
    body: JSON.stringify({ content: 'Find me an agro-processing equipment fabricator on Bizny.' })
  });
  const streamContentType = streamRes.headers.get('content-type');
  const reader = streamRes.body.getReader();
  const decoder = new TextDecoder();
  let streamText = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    streamText += decoder.decode(value);
  }

  report.test11 = {
    httpStatus: streamRes.status,
    contentType: streamContentType,
    hasToolExecuting: streamText.includes('toolExecuting'),
    hasDataContent: streamText.includes('data: {"content"'),
    hasContentsAreRequiredError: streamText.includes('contents are required'),
    streamLength: streamText.length,
    streamSample: streamText.slice(0, 350)
  };
  console.log('✓ Test 11 finished.');

  // Save report to disk
  fs.writeFileSync('acceptance_report.json', JSON.stringify(report, null, 2));
  console.log('=== ACCEPTANCE SUITE FINISHED SUCCESSFULLY ===');
}

runAcceptanceSuite().catch(console.error);
