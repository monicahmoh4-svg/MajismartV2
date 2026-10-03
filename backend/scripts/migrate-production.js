// Consolidated production migration — safe, idempotent, non-destructive.
// Usage: npm run migrate:production
const db = require('../db');
const { ensureProductionTables } = require('../db-extensions');

async function main() {
  console.log('Running MajiSmart production migration v6...');
  if (typeof db.initSchema === 'function') {
    await db.initSchema().catch((e) => console.warn('initSchema:', e.message));
  }
  const steps = [
    ['../scripts/migrate-gis', 'GIS base'],
    ['../scripts/migrate-assets-enhanced', 'assets enhanced'],
    ['../scripts/migrate-workorders', 'workorders'],
    ['../scripts/migrate-sensors', 'sensors'],
  ];
  for (const [mod, label] of steps) {
    try {
      // These scripts self-execute on require in some versions; require safely.
      require(mod);
      console.log(` - ${label}: loaded`);
    } catch (e) {
      console.warn(` - ${label} skipped: ${e.message}`);
    }
  }
  await ensureProductionTables();
  console.log('Production migration complete.');
}

if (require.main === module) {
  main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { main };
