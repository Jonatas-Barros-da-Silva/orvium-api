
#!/bin/bash

echo "🔍 Diagnosing Frontend Setup..."
echo "----------------------------------------"

FAIL=0

# 1. Check index.html
echo -n "1️⃣ Checking index.html... "
if [ -f "apps/web/index.html" ] && grep -q "id=\"root\"" "apps/web/index.html"; then
    echo "✅ PASSED"
else
    echo "❌ FAILED (Missing or no root div)"
    FAIL=1
fi

# 2. Check index.jsx
echo -n "2️⃣ Checking index.jsx... "
if [ -f "apps/web/src/index.jsx" ] && grep -q "ReactDOM.createRoot" "apps/web/src/index.jsx"; then
    echo "✅ PASSED"
else
    echo "❌ FAILED (Missing or no createRoot)"
    FAIL=1
fi

# 3. Check App.jsx
echo -n "3️⃣ Checking App.jsx... "
if [ -f "apps/web/src/App.jsx" ] && grep -q "export default" "apps/web/src/App.jsx"; then
    echo "✅ PASSED"
else
    echo "❌ FAILED (Missing or no default export)"
    FAIL=1
fi

# 4. Check for @orvium references
echo -n "4️⃣ Checking for @orvium references in src... "
if grep -r "@orvium" apps/web/src 2>/dev/null; then
    echo "❌ FAILED (Found @orvium references)"
    FAIL=1
else
    echo "✅ PASSED (Clean)"
fi

# 5. Check Vite config
echo -n "5️⃣ Checking Vite config (host: 0.0.0.0)... "
if grep -q "host:.*['\"]0\.0\.0\.0['\"]" apps/web/vite.config.js 2>/dev/null; then
    echo "✅ PASSED"
else
    echo "❌ FAILED (Host not set to 0.0.0.0)"
    FAIL=1
fi

echo "----------------------------------------"
if [ $FAIL -eq 0 ]; then
    echo "🎉 ALL CHECKS PASSED! Frontend is correctly configured."
else
    echo "⚠️ SOME CHECKS FAILED. Please review the errors above."
fi
