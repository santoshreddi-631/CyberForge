const fs = require('node:fs');
const path = require('node:path');
const source = path.join(__dirname, '../src/db/migrations');
const target = path.join(__dirname, '../dist/db/migrations');
fs.mkdirSync(target, { recursive: true });
for (const name of fs.readdirSync(source)) {
  if (name.endsWith('.sql') || name === 'meta') {
    fs.cpSync(path.join(source, name), path.join(target, name), { recursive: true });
  }
}
