/**
 * Standalone CLI Seed Script for Bizny Synthetic Economic Universe
 * 
 * Safely seeds the 5 interconnected synthetic economic actors:
 * 1. Chidi Okafor (Primary Anchor - Agro-Processor / Starch Extraction, Nsukka)
 * 2. Amara Eze (Agro-Machinery Fabricator, Aba)
 * 3. Dr. Fatima Al-Mansoor (Quality Assurance & Export Auditor, Lagos/Kano)
 * 4. Emeka Nwosu (Logistics & Haulage Fleet Operator, Onitsha)
 * 5. Adaobi "Ada" Adeleke (Packaged Consumer Goods Entrepreneur, Ibadan)
 * 
 * Usage:
 *   npx tsx scripts/seedSyntheticBiznyData.ts
 */

import { seedSyntheticUniverse } from "../artifacts/artifacts/api-server/src/lib/synthetic-universe";

async function main() {
  console.log("=================================================");
  console.log("🚀 Seeding Bizny Synthetic Economic Universe...");
  console.log("=================================================");

  try {
    const result = await seedSyntheticUniverse();
    console.log(`\n✨ Successfully seeded ${result.count} personas:`);
    result.characters.forEach((char, index) => {
      console.log(`  ${index + 1}. ${char}`);
    });
    console.log("\n✅ All ventures, coach plans, listings, deals, and opportunities configured.");
    console.log("=================================================");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed synthetic universe:", error);
    process.exit(1);
  }
}

main();
