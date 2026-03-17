
#!/bin/bash

echo "🚀 Starting EUNSUPPORTEDPROTOCOL fix process..."
echo "----------------------------------------------------------------"

echo "1️⃣ Replacing 'workspace:*' with 'file:' protocol in all package.json files..."
node scripts/replace-workspace-protocol.js

echo "----------------------------------------------------------------"
echo "2️⃣ Deleting all package-lock.json files..."
find . -name "package-lock.json" -type f -delete
echo "✅ package-lock.json files removed."

echo "----------------------------------------------------------------"
echo "3️⃣ Deleting all node_modules directories..."
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
echo "✅ node_modules directories removed."

echo "----------------------------------------------------------------"
echo "4️⃣ Clearing npm cache..."
npm cache clean --force
echo "✅ npm cache cleared."

echo "----------------------------------------------------------------"
echo "5️⃣ Installing dependencies with file: protocol..."
npm install

echo "----------------------------------------------------------------"
echo "🎉 Fix complete! The EUNSUPPORTEDPROTOCOL error should now be resolved."
echo "You can now start the development servers using 'npm run dev'."
