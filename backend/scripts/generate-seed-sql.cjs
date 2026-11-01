const fs = require('fs');
const ref = require('../src/db/seeds/reference.js');

let sql = '-- Seed script for  (CyberForge)\nBEGIN;\n\n';

sql += '-- 1. Areas (Appendix B centroids)\n';
for (const [pincode, locality, city, lat, lng] of ref.areas) {
  sql += `INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('${pincode}', '${locality}', '${city}', '${lat}', '${lng}') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;\n`;
}

sql += '\n-- 2. Scam Types (Appendix C)\n';
for (const st of [...ref.scamTypes, 'other']) {
  sql += `INSERT INTO scam_types (value) VALUES ('${st}') ON CONFLICT (value) DO NOTHING;\n`;
}

sql += '\n-- 3. Channels (Appendix C)\n';
for (const ch of ref.channels) {
  sql += `INSERT INTO channels (value) VALUES ('${ch}') ON CONFLICT (value) DO NOTHING;\n`;
}

sql += '\n-- 4. Verified Identifiers (Appendix C)\n';
for (const [type, val, label] of ref.verified) {
  const cleanLabel = label.replace(/'/g, "''");
  sql += `WITH ins AS (\n`;
  sql += `  INSERT INTO identifiers (identifier_type, normalized_value) VALUES ('${type}', '${val}')\n`;
  sql += `  ON CONFLICT (identifier_type, normalized_value) DO UPDATE SET normalized_value = EXCLUDED.normalized_value\n`;
  sql += `  RETURNING id\n`;
  sql += `)\n`;
  sql += `INSERT INTO verified_identifiers (identifier_id, label)\n`;
  sql += `SELECT id, '${cleanLabel}' FROM ins\n`;
  sql += `ON CONFLICT (identifier_id) DO UPDATE SET label = EXCLUDED.label;\n`;
}

sql += '\n-- 5. Baseline 1-Year Production License\n';
sql += `INSERT INTO license_state (id, licensee, expires_at, signature)\n`;
sql += `VALUES (1, 'Demo Bank - 1 Year Production', '2027-11-01T00:19:27.675Z', 'D8cBr3/Chxj7CHPQAccZdDbOxJc1+4iNdM/yl05DuReBYzyPHnk6V8OcBkRUcdVh/vq8YqxmoEdhxrqsxXKYCA==')\n`;
sql += `ON CONFLICT (id) DO UPDATE SET licensee = EXCLUDED.licensee, expires_at = EXCLUDED.expires_at, signature = EXCLUDED.signature;\n`;

sql += '\nCOMMIT;\n';

fs.writeFileSync(__dirname + '/seed.sql', sql);
console.log('Generated seed.sql successfully! Total lines:', sql.split('\n').length);
