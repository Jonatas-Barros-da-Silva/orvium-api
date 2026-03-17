
export class MigrationManager {
  constructor(pb) {
    this.pb = pb;
    this.collectionName = 'schema_migrations';
  }

  async getAppliedMigrations() {
    try {
      const records = await this.pb.collection(this.collectionName).getFullList({
        sort: 'created',
        $autoCancel: false
      });
      return records.map(r => r.migration_name);
    } catch (error) {
      // If collection doesn't exist yet, return empty array
      return [];
    }
  }

  async registerMigration(migrationName, status = 'completed', errorMessage = '') {
    try {
      await this.pb.collection(this.collectionName).create({
        migration_name: migrationName,
        status: status,
        error_message: errorMessage
      }, { $autoCancel: false });
    } catch (error) {
      console.error(`❌ Failed to register migration ${migrationName}:`, error.message);
      throw error;
    }
  }

  async executeMigration(migrationName, migrationFn) {
    console.log(`⏳ Executing migration: ${migrationName}...`);
    try {
      await migrationFn(this.pb);
      await this.registerMigration(migrationName, 'completed');
      console.log(`✅ Migration ${migrationName} completed successfully.`);
      return true;
    } catch (error) {
      console.error(`❌ Migration ${migrationName} failed:`, error.message);
      await this.registerMigration(migrationName, 'failed', error.message).catch(() => {});
      return false;
    }
  }

  async runPendingMigrations(migrations) {
    console.log('📋 Checking for pending migrations...');
    const applied = await this.getAppliedMigrations();
    const pending = migrations.filter(m => !applied.includes(m.name));

    if (pending.length === 0) {
      console.log('✅ No pending migrations found. Database is up to date.');
      return { total: 0, successful: 0, failed: 0 };
    }

    console.log(`📊 Found ${pending.length} pending migration(s).`);
    let successful = 0;
    let failed = 0;

    for (const migration of pending) {
      const success = await this.executeMigration(migration.name, migration.up);
      if (success) {
        successful++;
      } else {
        failed++;
        console.error('🛑 Stopping migration process due to failure.');
        break; // Stop on first failure to prevent cascading issues
      }
    }

    return { total: pending.length, successful, failed };
  }

  async getStatus(migrations) {
    const applied = await this.getAppliedMigrations();
    return {
      appliedCount: applied.length,
      totalCount: migrations.length,
      applied,
      migrations: migrations.map(m => ({
        name: m.name,
        isApplied: applied.includes(m.name)
      }))
    };
  }
}
