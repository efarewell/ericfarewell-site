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
const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
const guidedStartScript = readFileSync(join(root, 'assets/js/guided-start.js'), 'utf8');
const siteScript = readFileSync(join(root, 'assets/js/site.js'), 'utf8');
const securityHeaders = readFileSync(join(root, '_headers'), 'utf8');
assert(existsSync(join(root, 'assets/img/og-default-v2.jpg')), 'The current social-share image is missing');
assert(guidedStartScript.includes('https://tools.ericfarewell.com'), 'Guided Start does not hand authentication to the branded tools app');
assert(siteScript.includes("var toolAppOrigin = 'https://tools.ericfarewell.com'"), 'Private tool links do not use the branded tools domain');
for (const requiredHeader of [
  'Content-Security-Policy:',
  'Permissions-Policy:',
  'Referrer-Policy:',
  'Strict-Transport-Security:',
  'X-Content-Type-Options:',
  'X-Frame-Options:',
]) {
  assert(securityHeaders.includes(requiredHeader), `_headers is missing ${requiredHeader}`);
}

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
const placedQuotes = new Map();
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
  assert.doesNotMatch(metadata, /\/assets\/img\/og-default\.jpg/, `${file} still references the retired social-share image`);
  assert.doesNotMatch(source, />Aligned Freedom Assessment</, `${file} still uses the retired assessment label`);

  if (file !== 'testimonials.html') {
    for (const match of source.matchAll(/<blockquote>([\s\S]*?)<\/blockquote>/gi)) {
      const quote = match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      assert(!placedQuotes.has(quote), `${file} repeats a testimonial already placed on ${placedQuotes.get(quote)}`);
      placedQuotes.set(quote, file);
    }
  }
}

assert.deepEqual(broken, [], `Broken local links or assets:\n${broken.join('\n')}`);

const conversionCopy = [
  'index.html', 'start.html', 'work-with-eric.html', 'coaching.html', 'programs.html',
  'private-coaching.html', 'royals.html', 'speaking.html', 'contact.html', 'free-tools.html',
  'hotseat.html', 'first-hour.html', 'find-your-voice.html', 'harvest.html',
].map((file) => readFileSync(join(root, file), 'utf8')).join('\n');
for (const retiredPhrase of [
  'Start with the thing that keeps returning',
  'name what is actually here',
  'See what is here',
  'The next tool should follow the truth you found',
  'No drip sequence',
  'There are four of these',
  'All four are free',
]) {
  assert(!conversionCopy.includes(retiredPhrase), `Core copy still contains the retired phrase: ${retiredPhrase}`);
}

for (const file of [
  'index.html',
  'start.html',
  'my-story.html',
  'work-with-eric.html',
  'coaching.html',
  'programs.html',
  'private-coaching.html',
  'royals.html',
  'speaking.html',
  'podcasts.html',
  'blog.html',
  'free-tools.html',
  'contact.html',
  'hotseat.html',
  'first-hour.html',
  'find-your-voice.html',
  'harvest.html',
  'the-prompt.html',
]) {
  const source = readFileSync(join(root, file), 'utf8');
  assert.match(source, /class=["'][^"']*(?:proof-band|hotseat-proof)/, `${file} is missing page-level proof`);
  assert.match(source, /assets\/img\/testimonials\/|class=["'][^"']*proof-video|data-yt=|data-src=/, `${file} is missing a portrait or video with its proof`);
}

assert(siteScript.includes("proofLink.textContent = 'Stories'"), 'The primary navigation does not surface the testimonial library');

for (const required of [
  '/time-audit',
  '/time-audit/*',
  '/tools-library',
  '/auth/*',
  '/royals-experience',
  '/api/auth/*',
  '/api/journey/*',
  '/api/experience/*',
  '/the-first-hour',
  '/the-first-hour.html',
  '/the-prompt',
  '/the-prompt.html',
  '/the-harvest',
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
]) {
  assert(redirectSources.has(required), `_redirects is missing ${required}`);
}

for (const required of ['privacy-policy.html', 'terms-of-service.html']) {
  assert(existsSync(join(root, required)), `The first-party legal page ${required} is missing`);
}

for (const required of [
  'https://ericfarewell.com/',
  'https://ericfarewell.com/start.html',
  'https://ericfarewell.com/work-with-eric.html',
  'https://ericfarewell.com/royals.html',
  'https://ericfarewell.com/royals-experience',
  'https://ericfarewell.com/time-audit',
]) {
  assert(sitemap.includes(`<loc>${required}</loc>`), `sitemap.xml is missing ${required}`);
}

for (const privatePath of [
  '/tools-library',
  '/the-first-hour.html',
  '/the-prompt.html',
  '/the-harvest.html',
  '/coaching-system-lab.html',
  '/journey-review.html',
]) {
  assert(!sitemap.includes(`<loc>https://ericfarewell.com${privatePath}</loc>`), `sitemap.xml exposes ${privatePath}`);
}

console.log(`site integrity checks passed (${htmlFiles.length} HTML files)`);
