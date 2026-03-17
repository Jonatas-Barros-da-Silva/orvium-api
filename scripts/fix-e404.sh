
#!/bin/bash

echo "🚨 Starting E404 Fix Cleanup..."
echo "----------------------------------------------------------------"

echo "1️⃣ Deleting all package-lock.json files..."
find . -name "package-lock.json" -type f -delete

echo "2️⃣ Deleting yarn.lock and pnpm-lock.yaml files..."
find . -name "yarn.lock" -type f -delete
find . -name "pnpm-lock.yaml" -type f -delete

echo "3️⃣ Removing all node_modules directories recursively..."
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

echo "4️⃣ Clearing npm cache..."
npm cache clean --force

echo "5️⃣ Running fresh npm install..."
npm install --legacy-peer-deps

echo "----------------------------------------------------------------"
echo "✨ Cleanup complete! You can now start the dev server."
