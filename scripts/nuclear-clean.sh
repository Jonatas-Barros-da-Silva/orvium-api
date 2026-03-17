
#!/bin/bash

echo "☢️  Starting Nuclear Clean..."

echo "🧹 Removing node_modules directories..."
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

echo "🧹 Removing lock files..."
find . -name "package-lock.json" -type f -delete
find . -name "yarn.lock" -type f -delete
find . -name "pnpm-lock.yaml" -type f -delete

echo "🧹 Removing dist directories..."
find . -name "dist" -type d -prune -exec rm -rf '{}' +

echo "🧹 Clearing npm cache..."
npm cache clean --force

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "🔍 Verifying no @orvium references in dependencies..."
if grep -r "\"@orvium/" package.json apps/*/package.json packages/*/package.json 2>/dev/null | grep -v "\"name\":"; then
    echo "❌ Found @orvium references in dependencies!"
else
    echo "✅ No @orvium references found in dependencies."
fi

echo "🔍 Verifying no eslint-plugin-import references..."
if grep -r "eslint-plugin-import" package.json apps/*/package.json packages/*/package.json 2>/dev/null; then
    echo "❌ Found eslint-plugin-import references!"
else
    echo "✅ No eslint-plugin-import references found."
fi

echo "✨ Nuclear clean complete! You can now run 'npm run dev'"
