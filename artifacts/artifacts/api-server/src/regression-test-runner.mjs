// Regression Test Runner for Tests 1 - 16
const BASE = "http://127.0.0.1:3000";

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log("=== STARTING FULL POST-FIX E2E REGRESSION SUITE ===");
  await wait(4000); // warm-up

  // ==========================================
  // TEST 1: HEALTH
  // ==========================================
  console.log("\n--- TEST 1: BUILD & RUNTIME HEALTH ---");
  const healthRes = await fetch(`${BASE}/api/health`);
  const healthData = await healthRes.json();
  console.log("Health status:", healthRes.status, "Payload:", JSON.stringify(healthData));

  // ==========================================
  // TEST 2: ALL 5 PERSONAS SWITCH & AUTH/ME & VENTURE
  // ==========================================
  console.log("\n--- TEST 2: ALL FIVE PERSONAS SWITCHES ---");
  const personas = ["chidi", "amara", "fatima", "emeka", "ada"];
  const personaTokens = {};
  const personaUsers = {};
  const personaVentures = {};

  for (const p of personas) {
    const swRes = await fetch(`${BASE}/api/demo/switch-persona/${p}`, { method: "POST" });
    const swData = await swRes.json();
    personaTokens[p] = swData.token;
    personaUsers[p] = swData.user;

    const meRes = await fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${swData.token}` }
    });
    const meData = await meRes.json();

    const venRes = await fetch(`${BASE}/api/ventures/my`, {
      headers: { Authorization: `Bearer ${swData.token}` }
    });
    const venData = await venRes.json();
    personaVentures[p] = venData;

    console.log(`Persona [${p}]: Switch=${swRes.status}, Me=${meRes.status}, Name="${meData?.name}", Role="${meData?.role}", Ventures=${venData?.length || 0}`);
  }

  // ==========================================
  // TEST 3: COPILOT IDENTITY GROUNDING FOR ALL 5 PERSONAS
  // ==========================================
  console.log("\n--- TEST 3: COPILOT IDENTITY GROUNDING ---");
  for (const p of personas) {
    const token = personaTokens[p];
    const copilotRes = await fetch(`${BASE}/api/copilot/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        message: "What do you know about me, my business, my current venture, my location, my current stage, and my current bottleneck?"
      })
    });
    const copilotData = await copilotRes.json();
    console.log(`\n[Identity Grounding - Persona ${p} (${personaUsers[p]?.name})]:`);
    console.log(`Copilot Status: ${copilotRes.status}`);
    console.log(`Reply snippet (first 300 chars): ${copilotData?.reply?.slice(0, 300)}...`);
    console.log(`Actions: ${JSON.stringify(copilotData?.suggestedActions)}`);
  }
}

run().catch(console.error);
