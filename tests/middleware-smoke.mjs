import assert from 'node:assert/strict';
import { onRequest } from '../functions/_middleware.js';

const upstream = 'https://royals-time-audit.ericfarewell.chatgpt.site';

async function run(url, { cookie = '', upstreamResponse, nextResponse } = {}) {
  let fetched = null;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (request) => {
    fetched = request;
    return upstreamResponse || new Response('proxied', { status: 200 });
  };
  try {
    const headers = cookie ? { cookie } : undefined;
    const response = await onRequest({
      request: new Request(url, { headers }),
      next: async () => nextResponse || new Response('static', { status: 200 }),
    });
    return { response, fetched };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

{
  const { response, fetched } = await run('https://ericfarewell.com/time-audit/app');
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'proxied');
  assert.equal(new URL(fetched.url).origin, upstream);
  assert.equal(fetched.headers.get('x-forwarded-host'), 'ericfarewell.com');
}

{
  const { response, fetched } = await run('https://ericfarewell.com/tools-library?first=time-audit');
  assert.equal(response.status, 200);
  assert.equal(new URL(fetched.url).pathname, '/tools-library');
  assert.equal(new URL(fetched.url).search, '?first=time-audit');
}

{
  const { response, fetched } = await run('https://ericfarewell.com/the-prompt.html');
  assert.equal(response.status, 307);
  assert.equal(fetched, null);
  const location = new URL(response.headers.get('location'));
  assert.equal(location.pathname, '/auth/sign-in');
  assert.equal(location.searchParams.get('tool'), 'find-your-voice');
  assert.equal(location.searchParams.get('next'), '/the-prompt.html');
}

for (const [pathname, tool, need] of [
  ['/downloads/the-solo-hot-seat.pdf', 'hotseat', 'decision'],
  ['/the-first-hour', 'first-hour', 'ai'],
  ['/the-prompt', 'find-your-voice', 'voice'],
  ['/the-harvest', 'harvest', 'harvest'],
]) {
  const { response, fetched } = await run(`https://ericfarewell.com${pathname}`);
  assert.equal(response.status, 307);
  assert.equal(fetched, null);
  const location = new URL(response.headers.get('location'));
  assert.equal(location.pathname, '/auth/sign-in');
  assert.equal(location.searchParams.get('tool'), tool);
  assert.equal(location.searchParams.get('need'), need);
  assert.equal(location.searchParams.get('next'), pathname);
}

{
  const { response } = await run('https://ericfarewell.com/_next/image?url=%2Feric-farewell-signature.png');
  assert.equal(response.status, 302);
  assert.equal(new URL(response.headers.get('location')).pathname, '/assets/img/signature-white.png');
}

{
  const { response, fetched } = await run('https://ericfarewell.com/blog.html');
  assert.equal(await response.text(), 'static');
  assert.equal(fetched, null);
}

for (const [pathname, expected] of [
  ['/terms-of-service', 'https://coaching.ericfarewell.com/terms-of-service'],
  ['/privacy-policy', 'https://coaching.ericfarewell.com/privacy-policy'],
]) {
  const { response, fetched } = await run(`https://ericfarewell.com${pathname}`);
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), expected);
  assert.equal(fetched, null);
}

console.log('middleware smoke tests passed');
