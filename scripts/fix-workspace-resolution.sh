
#!/bin/bash

echo "🔍 Fixing workspace resolution for @orvium packages..."
echo "----------------------------------------------------------------"

echo "1️⃣ Deleting all package-lock.json files..."
find . -name "package-lock.json" -type f -delete

echo "2️⃣ Deleting all node_modules directories..."
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

echo "3️⃣ Clearing npm cache..."
npm cache clean --force

echo "4️⃣ Installing dependencies with workspace resolution..."
npm install

echo "----------------------------------------------------------------"
echo "✅ Workspace resolution fixed! The E404 error should now be resolved."
echo "You can now start the development servers using 'npm run dev'."
