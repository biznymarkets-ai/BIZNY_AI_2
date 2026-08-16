async function run() {
  const email = `test-single-${Date.now()}@bizny.io`;
  const regRes = await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      name: "Single Tester",
      role: "creator",
      country: "Nigeria",
      industry: "Agriculture",
    })
  });
  const regData = await regRes.json();
  const token = regData.token;
  console.log("Registered token:", token ? "YES" : "NO");

  const chatRes = await fetch("http://localhost:3000/api/copilot/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      message: "Find me a relevant Bizny template or blueprint for solving my coconut nursery and commercialization bottleneck."
    })
  });

  const chatData = await chatRes.json();
  console.log("Chat response:", chatData);
}

run().catch(console.error);
