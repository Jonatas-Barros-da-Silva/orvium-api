
import fs from 'fs';
import path from 'path';

const files = [
  'apps/api/package.json',
  'apps/web/package.json',
  'apps/pocketbase/package.json',
  'package.json'
];

console.log('🔍 Scanning package.json files for workspace:* protocol...');

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    const depth = file === 'package.json' ? './' : '../../';
    
    // Replace workspace:* with file: relative paths for @orvium packages
    const regex = /"@orvium\/([^"]+)":\s*"workspace:\*"/g;
    
    if (regex.test(content)) {
      content = content.replace(regex, `"@orvium/$1": "file:${depth}packages/$1"`);
      fs.writeFileSync(file, content);
      console.log(`✅ Updated ${file} to use file: protocol`);
    } else {
      console.log(`ℹ️ No workspace:* references found in ${file}`);
    }
  }
});
