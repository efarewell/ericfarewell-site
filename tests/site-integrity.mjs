import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const htmlFiles = readdirSync(root).filter((name) => name.endsWith('.html'));
const routes = JSON.parse(readFileSync(join(root, '_routes.json'), 'utf8'));
const redirectLines = readFileSync(join(root, '_redirects'), 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'));
const redirectSources = new Set(redirectLines.map((line) => line.split(/\s+/)[0]));

function routeMatches(pathname) {
  return routes.include.some((pattern) => {
    if (pattern.endsWith('/*')) return pathname.startsWith(pattern.slice(0, -1));
    return pathname === pattern;
  });
}

function localTargetExists(file, rawTarget) {
  if (/^(?:https?:|mailto:|tel:|javascript:|data:)/i.test(rawTarget)) return true;
  if (rawTarget.startsWith('#')) return true;

  const withoutQuery = rawTarget.split(/[?#]/, 1)[0];
  if (!withoutQuery) return true;
  if (redirectSources.has(withoutQuery) || routeMatches(withoutQuery)) return true;

  const pathname = withoutQuery.startsWith('/') ? withoutQuery.slice(1) : withoutQuery;
  const resolved = normalize(join(root, withoutQuery.startsWith('/') ? '' : dirname(file), pathname));
  if (!resolved.startsWith(root)) return false;
  if (existsSync(resolved)) return true;
  if (!pathname.includes('.') && existsSync(`${resolved}.html`)) return true;
  return existsSync(join(resolved, 'index.html'));
}

const broken = [];
for (const file of htmlFiles) {
  const source = readFileSync(join(root, file), 'utf8');
  for (const match of source.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    if (!localTargetExists(file, match[1])) broken.push(`${file}: ${match[1]}`);
  }

  const metadata = source
    .split('\n')
    .filter((line) => /<(?:title|meta)\b/i.test(line))
    .join('\n');
  assert.doesNotMatch(metadata, /—/, `${file} contains an em dash in customer-facing metadata`);
  assert.doesNotMatch(metadata, /Somatic business coaching/i, `${file} contains the retired narrow positioning in metadata`);
}

assert.deepEqual(broken, [], `Broken local links or assets:\n${broken.join('\n')}`);

for (const required of [
  '/time-audit',
  '/time-audit/*',
  '/tools-library',
  '/auth/*',
  '/royals-experience',
  '/api/auth/*',
  '/api/journey/*',
  '/api/experience/*',
  '/the-first-hour.html',
  '/the-prompt.html',
  '/the-harvest.html',
  '/downloads/the-solo-hot-seat.pdf',
]) {
  assert(routes.include.includes(required), `_routes.json is missing ${required}`);
}

for (const required of [
  '/coaching',
  '/programs',
  '/free-tools',
  '/mastermind',
  '/assessment',
  '/assesment',
  '/terms-of-service',
  '/privacy-policy',
]) {
  assert(redirectSources.has(required), `_redirects is missing ${required}`);
}

console.log(`site integrity checks passed (${htmlFiles.length} HTML files)`);
