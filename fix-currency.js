const fs = require('fs');
const path = require('path');
const dir = 'C:\\Users\\Hp\\lupe-and-luxe\\client\\src';

function walk(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dirPath, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.jsx')) processFile(p);
  }
}

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  // Split by backtick - even indexes are outside template literals
  const parts = content.split('`');
  for (let i = 0; i < parts.length; i += 2) {
    parts[i] = parts[i].replace(/₹\$/g, '₹');
  }
  const newContent = parts.join('`');
  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Fixed:', path.basename(file));
  }
}

walk(dir);
console.log('Currency fix complete');
