/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("schema_migrations");
  collection.indexes.push("CREATE UNIQUE INDEX idx_schema_migrations_migration_name ON schema_migrations (migration_name)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("schema_migrations");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_schema_migrations_migration_name"));
  return app.save(collection);
})
