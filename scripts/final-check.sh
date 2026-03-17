
#!/bin/bash

echo "🔍 Running Final Verification Checks..."
FAIL=0

echo "1️⃣ Checking for @orvium npm references..."
if grep -r "\"@orvium/" package.json apps/*/package.json packages/*/package.json 2>/dev/null | grep -v "\"name\":"; then
    echo "❌ FAILED: Found @orvium references in package.json files"
    FAIL=1
else
    echo "✅ PASSED: No @orvium references in dependencies"
fi

echo "2️⃣ Checking for eslint-plugin-import..."
if grep -r "eslint-plugin-import" package.json apps/*/package.json packages/*/package.json 2>/dev/null; then
    echo "❌ FAILED: Found eslint-plugin-import references"
    FAIL=1
else
    echo "✅ PASSED: No eslint-plugin-import references"
fi

echo "3️⃣ Checking for backend imports in frontend..."
if grep -r "from ['\"]@orvium/governance['\"]" apps/web/src 2>/dev/null || grep -r "from ['\"]@orvium/integration-sdk['\"]" apps/web/src 2>/dev/null; then
    echo "❌ FAILED: Found backend imports in frontend code"
    FAIL=1
else
    echo "✅ PASSED: No backend imports in frontend"
fi

echo "4️⃣ Checking Vite config for host: '0.0.0.0'..."
if grep -q "host:.*['\"]0\.0\.0\.0['\"]" apps/web/vite.config.js 2>/dev/null; then
    echo "✅ PASSED: Vite configured to listen on all interfaces"
else
    echo "❌ FAILED: Vite host not set to '0.0.0.0'"
    FAIL=1
fi

echo "5️⃣ Checking if node_modules exists..."
if [ -d "node_modules" ]; then
    echo "✅ PASSED: node_modules directory exists"
else
    echo "❌ FAILED: node_modules not found"
    FAIL=1
fi

echo "----------------------------------------"
if [ $FAIL -eq 0 ]; then
    echo "🎉 ALL CHECKS PASSED! The environment is clean and ready."
else
    echo "⚠️ SOME CHECKS FAILED."
    echo "💡 Please run 'bash scripts/nuclear-clean.sh' to fix dependency issues."
fi
