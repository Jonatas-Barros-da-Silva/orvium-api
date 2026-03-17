
import 'dotenv/config';
import PocketBase from 'pocketbase';
import { MigrationManager } from '../src/database/migrations/MigrationManager.js';
import { migrations } from '../src/database/migrations/index.js';

async function run() {
  const url = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
  const email = process.env.POCKETBASE_ADMIN_EMAIL;
  const password = process.env.POCKETBASE_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('❌ Missing POCKETBASE_ADMIN_EMAIL or POCKETBASE_ADMIN_PASSWORD environment variables.');
    process.exit(1);
  }

  const pb = new PocketBase(url);

  try {
    console.log(`🔌 Connecting to PocketBase at ${url}...`);
    await pb.admins.authWithPassword(email, password, { $autoCancel: false });
    console.log('✅ Authenticated as admin.');

    const manager = new MigrationManager(pb);
    
    const status = await manager.getStatus(migrations);
    console.log(`📊 Current status: ${status.appliedCount}/${status.totalCount} migrations applied.`);

    const result = await manager.runPendingMigrations(migrations);

    console.log('\n📋 Migration Summary:');
    console.log(`   Total pending: ${result.total}`);
    console.log(`   Successful:    ${result.successful}`);
    console.log(`   Failed:        ${result.failed}`);

    if (result.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Migration script failed:', error.message);
    process.exit(1);
  }
}

run();
