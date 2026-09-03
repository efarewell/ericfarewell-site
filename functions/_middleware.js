const TIME_AUDIT_ORIGIN = 'https://royals-time-audit.ericfarewell.chatgpt.site';

function shouldProxy(pathname) {
  return pathname === '/time-audit'
    || pathname.startsWith('/time-audit/')
    || pathname === '/signin-with-chatgpt'
    || pathname === '/signout-with-chatgpt'
    || pathname === '/callback'
    || pathname.startsWith('/_next/')
    || pathname.startsWith('/api/audio/')
    || pathname.startsWith('/api/audit/')
    || pathname.startsWith('/api/google/');
}

function shouldUseUpstreamAuth(pathname) {
  return pathname === '/time-audit/app'
    || pathname.startsWith('/time-audit/app/')
    || pathname === '/signin-with-chatgpt'
    || pathname === '/signout-with-chatgpt'
    || pathname === '/callback';
}

function isTimeAuditSignatureRequest(url) {
  return url.pathname === '/_next/image'
    && url.searchParams.get('url') === '/eric-farewell-signature.png';
}

export async function onRequest(context) {
  const publicUrl = new URL(context.request.url);
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
