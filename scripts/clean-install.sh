
#!/bin/bash

echo "🧹 Starting clean installation process..."

echo "🗑️  Removing root node_modules and package-lock.json..."
rm -rf node_modules package-lock.json

echo "🗑️  Removing apps node_modules and package-lock.json..."
rm -rf apps/*/node_modules apps/*/package-lock.json

echo "🗑️  Removing packages node_modules and package-lock.json..."
rm -rf packages/*/node_modules packages/*/package-lock.json

echo "📦 Running npm install..."
npm install

echo "✅ Clean installation complete!"
