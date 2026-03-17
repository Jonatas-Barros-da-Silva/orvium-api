
#!/bin/bash

echo "🔍 Verifying Vite dev server configuration for Horizons Preview..."
echo "--------------------------------------------------------------"

CONFIG_FILE="apps/web/vite.config.js"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Error: $CONFIG_FILE not found!"
    exit 1
fi

# Check host
if grep -q "host:.*['\"]0\.0\.0\.0['\"]" "$CONFIG_FILE"; then
    echo "✅ host: '0.0.0.0' is configured (Listens on all network interfaces)"
else
    echo "❌ host: '0.0.0.0' is missing"
fi

# Check strictPort
if grep -q "strictPort:.*true" "$CONFIG_FILE"; then
    echo "✅ strictPort: true is configured (Ensures port 3000 is used)"
else
    echo "❌ strictPort: true is missing"
fi

# Check proxy
if grep -q "target:.*['\"]http://localhost:3001['\"]" "$CONFIG_FILE" || grep -q "target:.*['\"]http://127\.0\.0\.1:3001['\"]" "$CONFIG_FILE"; then
    echo "✅ API proxy to http://localhost:3001 is configured"
else
    echo "❌ API proxy configuration is missing or incorrect"
fi

echo "--------------------------------------------------------------"
echo "💡 To start the development server, run:"
echo "   npm run dev"
echo "   or use the quick start script:"
echo "   bash scripts/start-dev.sh"
