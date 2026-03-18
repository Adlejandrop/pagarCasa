#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.warn('.env not found. Create one by copying .env.example and filling your keys.');
  process.exit(0);
}

const content = fs.readFileSync(envPath, 'utf8');
const obj = {};
content.split(/\r?\n/).forEach(line => {
  line = line.trim();
  if (!line || line.startsWith('#')) return;
  const idx = line.indexOf('=');
  if (idx === -1) return;
  const key = line.slice(0, idx).trim();
  let val = line.slice(idx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  obj[key] = val;
});

const outDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'env.js');
const outContent = 'window.__ENV__ = ' + JSON.stringify(obj, null, 2) + ';\n';
fs.writeFileSync(outPath, outContent, 'utf8');
console.log('Wrote', outPath);
