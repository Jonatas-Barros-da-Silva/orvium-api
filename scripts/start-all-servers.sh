
#!/bin/bash

echo "🚀 Starting All Development Servers..."
echo "----------------------------------------------------------------"

# 1. Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️ node_modules not found. Running npm install first..."
    npm install --legacy-peer-deps
fi

# 2. Print startup info
echo "Starting services on the following ports:"
echo "🌐 Web App:      http://localhost:3000"
echo "⚙️  API Server:   http://localhost:3001"
echo "🗄️  PocketBase:   http://localhost:8090"
echo "----------------------------------------------------------------"
echo "Press Ctrl+C to stop all servers."
echo ""

# 3. Run dev script
npm run dev
