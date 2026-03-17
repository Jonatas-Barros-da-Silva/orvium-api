
#!/bin/bash

echo "🔍 Verifying no @orvium references exist in package.json files..."
echo "----------------------------------------------------------------"

FAIL=0
FILES=$(find . -name "package.json" -not -path "*/node_modules/*" -not -path "*/.git/*")

for file in $FILES; do
    if grep -q "@orvium" "$file"; then
        echo "❌ FAILED: Found @orvium reference in $file"
        FAIL=1
    else
        echo "✅ CLEAN: $file"
    fi
done

echo "----------------------------------------------------------------"
if [ $FAIL -eq 0 ]; then
    echo "🎉 SUCCESS: No @orvium references found anywhere!"
    exit 0
else
    echo "⚠️ ERROR: Please remove the remaining @orvium references before continuing."
    exit 1
fi
