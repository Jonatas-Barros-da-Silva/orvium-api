
import 'dotenv/config';
import PocketBase from 'pocketbase';
import { MigrationManager } from '../src/database/migrations/MigrationManager.js';
import { migrations } from '../src/database/migrations/index.js';

async function check() {
  const url = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
  const email = process.env.POCKETBASE_ADMIN_EMAIL;
  const password = process.env.POCKETBASE_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('❌ Missing POCKETBASE_ADMIN_EMAIL or POCKETBASE_ADMIN_PASSWORD environment variables.');
    process.exit(1);
  }

  const pb = new PocketBase(url);

  try {
    await pb.admins.authWithPassword(email, password, { $autoCancel: false });
    
    const manager = new MigrationManager(pb);
    const status = await manager.getStatus(migrations);

    console.log('\n📋 Migration Status\n===================');
    
    for (const m of status.migrations) {
      if (m.isApplied) {
        console.log(`✅ ${m.name} (Applied)`);
      } else {
        console.log(`⏳ ${m.name} (Pending)`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Applied: ${status.appliedCount}`);
    console.log(`   Pending: ${status.totalCount - status.appliedCount}`);
    console.log(`   Total:   ${status.totalCount}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to check migrations:', error.message);
    process.exit(1);
  }
}

check();
