
#!/bin/bash

echo "🚀 Starting Development Environment..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 node_modules not found. Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed."
fi

echo "--------------------------------------------------------------"
echo "🌐 Services will be available at:"
echo "   🖥️  Web App:    http://localhost:3000 (Network: http://0.0.0.0:3000)"
echo "   ⚙️  API Server: http://localhost:3001"
echo "   🗄️  PocketBase: http://localhost:8090"
echo "--------------------------------------------------------------"

# Start the development servers using the root package.json dev script
npm run dev
