import fs from 'node:fs';
import path from 'node:path';
const input = String(process.env.GABA_API_BASE || '').trim().replace(/\/+$/, '');
if (!input) throw new Error('GABA_API_BASE HTTPS URL required');
const u = new URL(input);
if (u.protocol !== 'https:' || !u.hostname.endsWith('.supabase.co') ||
    !u.pathname.startsWith('/functions/v1/waterwatch-api')) {
  throw new Error('Only the approved Supabase HTTPS WaterWatch function is supported');
}
const content = '// Public endpoint only; never include privileged keys or secrets.\n' +
  'window.GABA_API_BASE = ' + JSON.stringify(input) + ';\n';
let count=0;
for (const target of [
  'android/app/src/main/assets/public/config.js',
  'ios/App/App/public/config.js'
]) {
  if (!fs.existsSync(path.dirname(target))) continue;
  fs.writeFileSync(target, content, 'utf8');
  count++;
}
if (count < 1) throw new Error('Missing native platform; run cap sync first');
console.log('Configured public HTTPS API endpoint in available native bundles');
