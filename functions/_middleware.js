const TIME_AUDIT_ORIGIN = 'https://royals-time-audit.ericfarewell.chatgpt.site';

const PRIVATE_TOOL_PATHS = new Map([
  ['/downloads/the-solo-hot-seat.pdf', { tool: 'hotseat', need: 'decision' }],
  ['/the-first-hour', { tool: 'first-hour', need: 'ai' }],
  ['/the-first-hour.html', { tool: 'first-hour', need: 'ai' }],
  ['/the-prompt', { tool: 'find-your-voice', need: 'voice' }],
  ['/the-prompt.html', { tool: 'find-your-voice', need: 'voice' }],
  ['/the-harvest', { tool: 'harvest', need: 'harvest' }],
  ['/the-harvest.html', { tool: 'harvest', need: 'harvest' }],
]);

function shouldProxy(pathname) {
  return pathname === '/time-audit'
    || pathname.startsWith('/time-audit/')
    || pathname === '/tools-library'
    || pathname.startsWith('/tools-library/')
    || pathname.startsWith('/auth/')
    || pathname === '/signin-with-chatgpt'
    || pathname === '/signout-with-chatgpt'
    || pathname === '/callback'
    || pathname.startsWith('/_next/')
    || pathname.startsWith('/api/auth/')
    || pathname.startsWith('/api/journey/')
    || pathname.startsWith('/api/experience/')
    || pathname === '/royals-experience'
    || pathname.startsWith('/royals-experience/')
    || pathname.startsWith('/api/audio/')
    || pathname.startsWith('/api/audit/')
    || pathname.startsWith('/api/google/');
}

function shouldUseUpstreamAuth(pathname) {
  return pathname === '/signin-with-chatgpt'
    || pathname === '/signout-with-chatgpt'
    || pathname === '/callback';
}

function hasSupabaseSession(request) {
  const cookie = request.headers.get('cookie') || '';
  return /(?:^|;\s*)sb-[^=;]+-auth-token(?:\.\d+)?=/.test(cookie);
}

async function hasPrivateLibraryAccess(request, publicUrl) {
  const sessionUrl = new URL('/api/auth/session', TIME_AUDIT_ORIGIN);
  const headers = new Headers();
  const cookie = request.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);
  headers.set('x-forwarded-host', publicUrl.host);
  headers.set('x-forwarded-proto', publicUrl.protocol.replace(':', ''));
  const response = await fetch(sessionUrl, { headers, redirect: 'manual' });
  return response.status === 204;
}

function privateToolSignIn(publicUrl, tool) {
  const signIn = new URL('/auth/sign-in', publicUrl);
  signIn.searchParams.set('tool', tool.tool);
  signIn.searchParams.set('need', tool.need);
  signIn.searchParams.set('next', publicUrl.pathname);
  return signIn;
}

function isTimeAuditSignatureRequest(url) {
  return url.pathname === '/_next/image'
    && url.searchParams.get('url') === '/eric-farewell-signature.png';
}

export async function onRequest(context) {
  const publicUrl = new URL(context.request.url);
  const privateTool = PRIVATE_TOOL_PATHS.get(publicUrl.pathname);
  if (privateTool) {
    if (!hasSupabaseSession(context.request) || !(await hasPrivateLibraryAccess(context.request, publicUrl))) {
      return Response.redirect(privateToolSignIn(publicUrl, privateTool), 307);
    }
    return context.next();
  }
  if (!shouldProxy(publicUrl.pathname)) return context.next();

  // The Time Audit app references a root-level signature that does not exist on
  // ericfarewell.com. Keep the site header and footer on Eric's existing mark.
  if (isTimeAuditSignatureRequest(publicUrl)) {
    return Response.redirect(new URL('/assets/img/signature-white.png', publicUrl), 302);
  }

  const upstreamUrl = new URL(`${publicUrl.pathname}${publicUrl.search}`, TIME_AUDIT_ORIGIN);
  if (shouldUseUpstreamAuth(publicUrl.pathname)) return Response.redirect(upstreamUrl, 307);
  const upstreamRequest = new Request(upstreamUrl, context.request);
  upstreamRequest.headers.set('x-forwarded-host', publicUrl.host);
  upstreamRequest.headers.set('x-forwarded-proto', publicUrl.protocol.replace(':', ''));

  const upstreamResponse = await fetch(upstreamRequest, { redirect: 'manual' });
  const headers = new Headers(upstreamResponse.headers);
  const location = headers.get('location');

  if (location && location.startsWith(TIME_AUDIT_ORIGIN)) {
    headers.set('location', location.replace(TIME_AUDIT_ORIGIN, publicUrl.origin));
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers,
  });
}
