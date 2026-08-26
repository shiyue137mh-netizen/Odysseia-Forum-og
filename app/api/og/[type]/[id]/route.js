import { ImageResponse } from 'next/og';

import { HEIGHT, WIDTH, prepareOgImage } from '../../../../../lib/renderer.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ROUTE_TYPES = {
  threads: 'thread',
  authors: 'author',
  booklists: 'booklist',
  tournaments: 'tournament',
};

function imageResponse(body, cacheControl, extraHeaders = {}) {
  return new Response(body, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': cacheControl,
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex',
      ...extraHeaders,
    },
  });
}

async function fallbackResponse(request, reason) {
  const response = await fetch(new URL('/fallback.png', request.url));
  return imageResponse(
    await response.arrayBuffer(),
    'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
    { 'X-OG-Fallback': reason },
  );
}

export async function GET(request, context) {
  const { type: routeType, id } = await context.params;
  const type = ROUTE_TYPES[routeType];
  if (!type || !/^\d+$/.test(id)) {
    return new Response('Not Found', { status: 404 });
  }

  const token = process.env.OG_SERVICE_TOKEN?.trim();
  if (!token) {
    console.error('OG_SERVICE_TOKEN 未配置');
    return fallbackResponse(request, 'missing-token');
  }

  try {
    const prepared = await prepareOgImage({
      type,
      id,
      token,
      assetBaseUrl: request.url,
      apiBaseUrl: process.env.API_BASE_URL,
    });
    if (!prepared) return fallbackResponse(request, 'not-found');

    const versioned = new URL(request.url).searchParams.has('v');
    return new ImageResponse(prepared.element, {
      width: WIDTH,
      height: HEIGHT,
      fonts: [{ name: 'Odysseia Sans', data: prepared.fontData, weight: 400, style: 'normal' }],
      headers: {
        'Cache-Control': versioned
        ? 'public, max-age=31536000, s-maxage=31536000, immutable'
        : 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (error) {
    console.error('OG 图片生成失败', {
      type,
      id,
      message: error instanceof Error ? error.message : String(error),
    });
    return fallbackResponse(request, 'render-error');
  }
}
