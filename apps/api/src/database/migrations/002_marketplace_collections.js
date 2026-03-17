
export async function up(pb) {
  const collections = [
    'integration_apps',
    'integration_versions',
    'integration_permissions',
    'integration_metadata',
    'integration_installations'
  ];

  for (const name of collections) {
    try {
      await pb.collections.getOne(name, { $autoCancel: false });
      console.log(`   ✅ Verified collection exists: ${name}`);
    } catch (error) {
      throw new Error(`Required collection '${name}' does not exist. Please ensure it is created before running this migration.`);
    }
  }
}
