
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting ESLint configuration fix...');

const files = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  'apps/web/eslint.config.js',
  'apps/web/eslint.config.mjs',
  'apps/web/.eslintrc.cjs',
  'apps/web/.eslintrc.js',
  'apps/api/eslint.config.js',
  'apps/api/eslint.config.mjs',
  'apps/api/.eslintrc.cjs',
  'apps/api/.eslintrc.js',
  'package.json',
  'apps/web/package.json',
  'apps/api/package.json'
];

let patched = false;

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if the file contains an import/resolver with an alias
    if (content.includes('import/resolver') && content.includes('alias')) {
      console.log(`🔍 Found alias resolver in ${file}, patching...`);
      
      // Replace alias configuration with node configuration
      // This regex attempts to match the alias object block commonly used
      let newContent = content.replace(/alias:\s*\{[\s\S]*?map:\s*\[[\s\S]*?\][\s\S]*?\}/g, `node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] }`);
      
      // Fallback if the above regex didn't match the specific map structure
      if (newContent.includes('alias:')) {
         newContent = newContent.replace(/alias:\s*\{[^}]*\}/g, `node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] }`);
      }
      
      if (content !== newContent) {
        fs.writeFileSync(file, newContent);
        console.log(`✅ Successfully patched ${file}`);
        patched = true;
      }
    }
  }
}

if (!patched) {
  console.log('ℹ️ No alias resolver found in ESLint configs or it has already been removed.');
}

console.log('🧹 Clearing ESLint cache directories...');

// Clear cache
const cacheDirs = [
  'node_modules/.cache/eslint',
  'apps/web/node_modules/.cache/eslint',
  'apps/api/node_modules/.cache/eslint',
  '.eslintcache',
  'apps/web/.eslintcache',
  'apps/api/.eslintcache'
];

let cacheCleared = false;
for (const dir of cacheDirs) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`✅ Cleared ESLint cache: ${dir}`);
    cacheCleared = true;
  }
}

if (!cacheCleared) {
  console.log('ℹ️ No ESLint cache directories found.');
}

console.log('🎉 ESLint configuration fix complete!');
