async function run() {
  const res = await fetch("http://localhost:3000/api/health");
  console.log("Health status:", res.status, await res.text());
}
run();
