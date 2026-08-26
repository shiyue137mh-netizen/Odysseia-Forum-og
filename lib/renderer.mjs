import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createElement as h } from 'react';

const LIB_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(LIB_DIR, '..');
export const WIDTH = 1200;
export const HEIGHT = 630;
const DEFAULT_API_BASE_URL = 'https://forum.shimmerday.top/v1';
const AUTHOR_ID = process.env.OG_AUTHOR_ID || '1175027899703758933';
const THREAD_ID = process.env.OG_THREAD_ID || '1535568851536977981';
const BOOKLIST_ID = process.env.OG_BOOKLIST_ID || '426';
const TOURNAMENT_ID = process.env.OG_TOURNAMENT_ID || '4849';
const BACKGROUND_POOL = ['apple', 'garden', 'railways', 'rainyday', 'roof', 'space', 'vendingMachine'];
const emojiAssets = new Map();

const imagePaths = {
  apple: 'public/og-assets/backgrounds/apple.jpg',
  garden: 'public/og-assets/backgrounds/garden.jpg',
  railways: 'public/og-assets/backgrounds/railways.jpg',
  rainyday: 'public/og-assets/backgrounds/rainyday.jpg',
  roof: 'public/og-assets/backgrounds/roof.jpg',
  space: 'public/og-assets/backgrounds/space.jpg',
  vendingMachine: 'public/og-assets/backgrounds/vending_machine.jpg',
  avatar: 'public/og-assets/mascot-avatar-256.png',
  logo: 'public/og-assets/server-logo-128.png',
};

export const mockData = {
  post: {
    type: '帖子 / POST',
    typeIcon: 'post',
    accent: '#c084fc',
    title: '【侦探 / 强推理】兰斯伯里与雾都失踪案',
    description: '一位在迷雾之都游走的私家侦探。高智商、性格冷淡，却始终追逐被掩埋的真相。',
    author: '雾中记录者',
    createdAt: '2026-08-08',
    background: 'rainyday',
    covers: ['rainyday'],
    stats: [['heart', '反应', '1,284'], ['message', '回复', '136'], ['bookmark', '收藏', '72']],
  },
  author: {
    type: '作者 / CREATOR',
    typeIcon: 'author',
    accent: '#34d399',
    title: '《星际漫游指南》',
    description: '最新发布',
    author: '🐍 Thiên Ngỗng Phi Tiên',
    createdAt: '最新发布于 2026-08-08',
    background: 'garden',
    covers: ['garden', 'rainyday', 'apple', 'space', 'roof'],
    stats: [['post', '作品', '42'], ['heart', '反应', '12,580'], ['message', '回复', '3,206']],
  },
  booklist: {
    type: '书单 / COLLECTION',
    typeIcon: 'booklist',
    accent: '#60a5fa',
    title: '【种田 / 沙盘 / 创世神】饲养全人类',
    description: '收录多个精选角色卡的世界观设定集，观察文明、种族与时代在沙盘中的演进。',
    author: '书单创建者',
    createdAt: '2026-07-21',
    background: 'space',
    covers: ['apple', 'garden', 'space', 'rainyday', 'roof'],
    stats: [['booklist', '收录', '28'], ['bookmark', '收藏', '346'], ['eye', '浏览', '8,920']],
  },
  tournament: {
    type: '赛事 / EVENT',
    typeIcon: 'tournament',
    accent: '#fbbf24',
    title: '2026 夏季角色卡创作大赛',
    description: '本届主题为「星际边缘」。用角色与叙事描绘文明尽头仍未熄灭的光。',
    author: '赛事组织者',
    createdAt: '2026-08-01',
    background: 'railways',
    covers: ['space', 'vendingMachine', 'railways', 'roof', 'apple'],
    stats: [['post', '参赛作品', '36'], ['bookmark', '收藏', '218'], ['eye', '浏览', '6,431']],
  },
};

function mimeType(path) {
  const extension = extname(path).toLowerCase();
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  return 'image/png';
}

async function loadImage(relativePath) {
  const { readFile } = await import('node:fs/promises');
  const absolutePath = resolve(PROJECT_ROOT, relativePath);
  const data = await readFile(/* turbopackIgnore: true */ absolutePath);
  const contentType = mimeType(absolutePath);
  return {
    src: `data:${contentType};base64,${data.toString('base64')}`,
    ...readImageDimensions(data, contentType),
  };
}

function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

async function loadRemoteImage(value) {
  const url = safeHttpUrl(value);
  if (!url) throw new Error('图片地址不是有效的 HTTPS URL');
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`图片请求失败：${response.status} ${url}`);
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > 8 * 1024 * 1024) throw new Error(`图片超过 8 MB：${url}`);
  const contentType = response.headers.get('content-type')?.split(';')[0] || 'image/png';
  if (!['image/png', 'image/jpeg', 'image/gif'].includes(contentType)) {
    throw new Error(`OG 渲染不支持图片格式 ${contentType}：${url}`);
  }
  const data = Buffer.from(await response.arrayBuffer());
  const dimensions = readImageDimensions(data, contentType);
  return { src: `data:${contentType};base64,${data.toString('base64')}`, ...dimensions };
}

function readImageDimensions(data, contentType) {
  if (contentType === 'image/png' && data.length >= 24) {
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  }
  if (contentType === 'image/gif' && data.length >= 10) {
    return { width: data.readUInt16LE(6), height: data.readUInt16LE(8) };
  }
  if (contentType === 'image/jpeg') {
    let offset = 2;
    const startOfFrame = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
    while (offset + 9 < data.length) {
      if (data[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = data[offset + 1];
      if (startOfFrame.has(marker)) return { width: data.readUInt16BE(offset + 7), height: data.readUInt16BE(offset + 5) };
      const length = data.readUInt16BE(offset + 2);
      if (length < 2) break;
      offset += length + 2;
    }
  }
  // ponytail: 未识别的 WebP/AVIF 等格式按方图布局；后端增加宽高字段后删除该回退。
  return { width: 1, height: 1 };
}

function sizedAvatarUrl(url) {
  if (!url || !url.includes('cdn.discordapp.com/')) return url;
  const parsed = new URL(url);
  parsed.searchParams.set('size', '256');
  return parsed.toString();
}

async function fetchMetadata(resource, id, token, apiBaseUrl = DEFAULT_API_BASE_URL) {
  const baseUrl = String(apiBaseUrl || DEFAULT_API_BASE_URL).replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/internal/share-metadata/${resource}/${id}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`${resource}/${id} 元数据请求失败：${response.status} ${await response.text()}`);
  return response.json();
}

function pickBackground(key) {
  const hash = [...String(key)].reduce((value, character) => ((value * 31) + character.codePointAt(0)) >>> 0, 0);
  return BACKGROUND_POOL[hash % BACKGROUND_POOL.length];
}

function formatDate(value) {
  return value ? String(value).slice(0, 10) : '';
}

function visualLength(text) {
  return [...new Intl.Segmenter('zh-CN', { granularity: 'grapheme' }).segment(String(text || ''))]
    .reduce((length, { segment }) => length + (/^[\x00-\xff]+$/.test(segment) ? 1 : 2), 0);
}

function authorNameSize(name) {
  const length = visualLength(name);
  if (length <= 18) return 43;
  if (length <= 24) return 38;
  if (length <= 32) return 33;
  return 28;
}

function titleSize(title, mode) {
  const length = visualLength(title);
  if (mode === 'post') {
    if (length <= 22) return 50;
    if (length <= 34) return 43;
    if (length <= 48) return 36;
    return 30;
  }
  if (length <= 20) return 44;
  if (length <= 32) return 38;
  if (length <= 46) return 33;
  return 28;
}

function descriptionSize(description) {
  const length = visualLength(description);
  if (length <= 70) return 19;
  if (length <= 110) return 17;
  return 15;
}

async function loadEmoji(code, segment) {
  if (code !== 'emoji') return undefined;
  if (emojiAssets.has(segment)) return emojiAssets.get(segment);
  const codePoint = [...segment]
    .map((character) => character.codePointAt(0).toString(16))
    .filter((value) => value !== 'fe0f')
    .join('-');
  const response = await fetch(`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codePoint}.svg`);
  if (!response.ok) return undefined;
  const data = `data:image/svg+xml;base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`;
  emojiAssets.set(segment, data);
  return data;
}

function arrangeCenterFirst(items) {
  if (items.length < 2) return items;
  const arranged = Array(items.length);
  const center = Math.floor(items.length / 2);
  items.forEach((item, index) => {
    if (index === 0) arranged[center] = item;
    else {
      const distance = Math.ceil(index / 2);
      arranged[center + (index % 2 === 1 ? -distance : distance)] = item;
    }
  });
  return arranged;
}

async function prepareAvatar(url, fallback) {
  return url ? loadRemoteImage(sizedAvatarUrl(url)).catch(() => fallback) : fallback;
}

async function prepareWorks(prefix, works, baseImages, emptyTitle) {
  const selected = Array.isArray(works) ? works.slice(0, 5) : [];
  const entries = await Promise.all(selected.map(async (work, index) => {
    const key = `${prefix}Cover${index}`;
    if (!work.image_url) return [key, { src: null, title: work.title }];
    return [key, await loadRemoteImage(work.image_url).catch(() => ({ src: null, title: work.title }))];
  }));
  const images = { ...baseImages, ...Object.fromEntries(entries) };
  const covers = arrangeCenterFirst(entries.map(([key]) => key));
  if (covers.length === 0) {
    const key = `${prefix}Empty`;
    covers.push(key);
    images[key] = { src: null, title: emptyTitle };
  }
  return { images, covers };
}

async function prepareLiveAuthor(token, baseImages, id = AUTHOR_ID, apiBaseUrl) {
  const metadata = await fetchMetadata('authors', id, token, apiBaseUrl);
  if (!metadata) return null;
  const prepared = await prepareWorks('author', metadata.works, baseImages, '暂无公开作品');
  prepared.images.avatar = await prepareAvatar(metadata.avatar_url, baseImages.avatar);
  return {
    images: prepared.images,
    data: {
      type: '作者 / CREATOR', typeIcon: 'author', accent: '#34d399',
      title: metadata.latest_work?.title || '暂无公开作品', description: '最新发布',
      author: metadata.display_name || '未知作者',
      createdAt: metadata.latest_work?.created_at ? `最新发布于 ${formatDate(metadata.latest_work.created_at)}` : '',
      background: pickBackground(`author:${id}`), covers: prepared.covers,
      stats: [
        ['post', '作品', Number(metadata.stats?.thread_count || 0).toLocaleString('en-US')],
        ['heart', '反应', Number(metadata.stats?.reaction_count || 0).toLocaleString('en-US')],
        ['message', '回复', Number(metadata.stats?.reply_count || 0).toLocaleString('en-US')],
      ],
    },
  };
}

async function prepareLiveThread(token, baseImages, id = THREAD_ID, apiBaseUrl) {
  const metadata = await fetchMetadata('threads', id, token, apiBaseUrl);
  if (!metadata) return null;
  const key = 'threadCover';
  const cover = metadata.image_url
    ? await loadRemoteImage(metadata.image_url).catch(() => ({ src: null, title: metadata.title }))
    : { src: null, title: metadata.title };
  const images = { ...baseImages, [key]: cover };
  images.avatar = await prepareAvatar(metadata.author?.avatar_url, baseImages.avatar);
  return {
    images,
    data: {
      type: '帖子 / POST', typeIcon: 'post', accent: '#c084fc',
      title: metadata.title || '未命名帖子', description: metadata.description || '在类脑索引查看这篇作品。',
      author: metadata.author?.display_name || '未知作者',
      createdAt: metadata.created_at ? `发布于 ${formatDate(metadata.created_at)}` : '',
      background: pickBackground(`thread:${id}`), covers: [key],
      stats: [
        ['heart', '反应', Number(metadata.stats?.reaction_count || 0).toLocaleString('en-US')],
        ['message', '回复', Number(metadata.stats?.reply_count || 0).toLocaleString('en-US')],
        ['bookmark', '收藏', Number(metadata.stats?.collection_count || 0).toLocaleString('en-US')],
      ],
    },
  };
}

async function prepareLiveCollection(token, baseImages, id, mode, apiBaseUrl) {
  const metadata = await fetchMetadata('booklists', id, token, apiBaseUrl);
  if (!metadata) return null;
  const prepared = await prepareWorks(mode, metadata.works, baseImages, mode === 'tournament' ? '暂无参赛作品' : '暂无收录作品');
  prepared.images.avatar = baseImages.avatar;
  const tournament = mode === 'tournament';
  return {
    images: prepared.images,
    data: {
      type: tournament ? '赛事 / EVENT' : '书单 / COLLECTION',
      typeIcon: tournament ? 'tournament' : 'booklist',
      accent: tournament ? '#fbbf24' : '#60a5fa',
      title: metadata.title || (tournament ? '未命名赛事' : '未命名书单'),
      description: metadata.description || (tournament ? '浏览社区赛事与参赛作品。' : '浏览作者整理的精选作品。'),
      author: metadata.author_name || (tournament ? '赛事组织者' : '书单创建者'),
      createdAt: metadata.created_at ? `创建于 ${formatDate(metadata.created_at)}` : '',
      background: pickBackground(`${mode}:${id}`), covers: prepared.covers,
      stats: [
        ['post', tournament ? '参赛作品' : '收录', Number(metadata.stats?.item_count || 0).toLocaleString('en-US')],
        ['bookmark', '收藏', Number(metadata.stats?.collection_count || 0).toLocaleString('en-US')],
        ['eye', '浏览', Number(metadata.stats?.view_count || 0).toLocaleString('en-US')],
      ],
    },
  };
}

const iconShapes = {
  post: [['path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }], ['path', { d: 'M14 2v6h6' }], ['path', { d: 'M8 13h8M8 17h6' }]],
  booklist: [['path', { d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20' }], ['path', { d: 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' }]],
  tournament: [['path', { d: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z' }], ['path', { d: 'M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4' }]],
  author: [['circle', { cx: 12, cy: 8, r: 4 }], ['path', { d: 'M4 22a8 8 0 0 1 16 0' }]],
  heart: [['path', { d: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z' }]],
  message: [['path', { d: 'M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z' }]],
  bookmark: [['path', { d: 'M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z' }]],
  eye: [['path', { d: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z' }], ['circle', { cx: 12, cy: 12, r: 3 }]],
};

function icon(name, size = 18, color = '#e4e4e7') {
  return h('svg', {
    viewBox: '0 0 24 24',
    width: size,
    height: size,
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }, ...iconShapes[name].map(([tag, props], index) => h(tag, { key: index, ...props })));
}

function card(image, index, total) {
  const distance = Math.abs(index - Math.floor(total / 2));
  const sizes = [{ width: 236, height: 410 }, { width: 132, height: 340 }, { width: 76, height: 278 }];
  const size = sizes[Math.min(distance, 2)];
  return h('div', {
    key: `${index}-${image?.src?.slice(-24) || image?.title || 'placeholder'}`,
    style: {
      display: 'flex', width: size.width, height: size.height, flexShrink: 0, overflow: 'hidden',
      borderRadius: 16, border: '2px solid rgba(255,255,255,0.20)',
      opacity: distance === 2 ? 0.68 : 1,
      filter: distance === 2 ? 'blur(1.2px) brightness(0.78) saturate(0.82)' : 'none',
      boxShadow: '0 18px 38px rgba(0,0,0,0.48)',
    },
  }, image?.src
    ? h('img', { src: image.src, style: { width: '100%', height: '100%', objectFit: 'cover' } })
    : h('div', {
        style: {
          display: 'flex', width: '100%', height: '100%', padding: 18, flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center',
          background: 'rgba(8,10,14,0.68)',
          color: '#d4d4d8', fontSize: distance === 0 ? 17 : 13, lineHeight: 1.35,
        },
      }, icon('post', distance === 0 ? 30 : 22, '#d4d4d8'), h('div', { style: { display: 'flex', maxHeight: 96, overflow: 'hidden' } }, image?.title || '暂无封面')));
}

function statPill([name, label, value]) {
  return h('div', {
    key: label,
    style: {
      display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 999,
      background: 'rgba(0,0,0,0.34)', border: '1px solid rgba(255,255,255,0.12)',
      color: '#e4e4e7', fontSize: 17, whiteSpace: 'nowrap',
    },
  }, icon(name, 18, '#e4e4e7'), value);
}

function fitPostCover(image) {
  const maxWidth = 640;
  const maxHeight = 500;
  const ratio = image.width / image.height;
  const width = Math.min(maxWidth, maxHeight * ratio);
  return { width: Math.round(width), height: Math.round(width / ratio) };
}

function backgroundLayers(data, images) {
  return [
    h('img', {
      key: 'background',
      src: images[data.background].src,
      style: {
        position: 'absolute',
        top: '-4%',
        left: '-4%',
        width: '108%',
        height: '108%',
        objectFit: 'cover',
        filter: 'blur(4px) brightness(0.58) saturate(0.68)',
      },
    }),
    h('div', {
      key: 'overlay',
      style: {
        display: 'flex',
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(105deg, rgba(9,11,16,0.18) 0%, rgba(9,11,16,0.58) 58%, rgba(9,11,16,0.88) 100%)',
      },
    }),
  ];
}

function wordLogo(accent) {
  const paths = ['M 40 16 L 64 64 L 16 64 Z', 'M 16 16 L 40 40 L 40 64 M 40 40 L 64 16', 'M 60 16 L 24 16 L 44 40 L 24 64 L 60 64', 'M 60 16 L 24 16 L 44 40 L 24 64 L 60 64', 'M 60 16 L 24 16 L 24 64 L 60 64 M 24 40 L 52 40', 'M 40 16 L 40 64', 'M 16 64 L 40 16 L 64 64 M 26 44 L 54 44'];
  const svgProps = {
    viewBox: '0 0 80 80', width: 11, height: 11, fill: 'none', stroke: '#a1a1aa',
    strokeWidth: 11, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  return h('div', { style: { display: 'flex', width: 86, height: 11 } },
    h('svg', { ...svgProps, key: 0 },
      h('g', { transform: 'rotate(90 40 40)' }, h('path', { d: 'M 16 40 A 24 24 0 1 0 16 39.99 Z', strokeDasharray: '113 38', strokeDashoffset: 132 })),
      h('circle', { cx: 40, cy: 16, r: 6, fill: accent, stroke: 'none' })),
    ...paths.map((d, index) => h('svg', { ...svgProps, key: index + 1 }, h('path', { d }))));
}

function logo(images, accent) {
  return h('div', {
    style: {
      display: 'flex',
      position: 'absolute',
      top: 28,
      left: 34,
      alignItems: 'center',
      gap: 12,
      color: '#fff',
      fontSize: 17,
      letterSpacing: 1,
    },
  },
  h('img', {
    src: images.logo.src,
    style: { width: 42, height: 42, borderRadius: 12 },
  }),
  h('div', { style: { display: 'flex', flexDirection: 'column' } },
    h('div', { style: { display: 'flex' } }, '类脑'),
    wordLogo(accent),
  ));
}

function typeBadge(data) {
  return h('div', {
    style: {
      display: 'flex', position: 'absolute', top: 34, right: 34, alignItems: 'center', gap: 8,
      padding: '7px 14px', borderRadius: 999, color: data.accent,
      background: 'rgba(255,255,255,0.09)', border: `1px solid ${data.accent}66`,
      fontSize: 16, letterSpacing: 1.4,
    },
  }, icon(data.typeIcon, 18, data.accent), data.type);
}

function creatorRow(data, images, avatarSize = 42) {
  return h('div', {
    style: { display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18, paddingBottom: 4, color: '#d4d4d8', fontSize: visualLength(data.author) > 24 ? 14 : 17, lineHeight: 1.35 },
  },
  h('img', { src: images.avatar.src, style: { width: avatarSize, height: avatarSize, borderRadius: 999, border: '3px solid rgba(255,255,255,0.28)', objectFit: 'cover' } }),
  h('div', { style: { display: 'flex' } }, data.author),
  h('div', { style: { display: 'flex', paddingLeft: 11, borderLeft: '1px solid rgba(255,255,255,0.18)', color: '#a1a1aa', fontSize: 14, whiteSpace: 'nowrap' } }, data.createdAt));
}

function renderPostLayout(data, images) {
  const cover = images[data.covers[0]];
  const coverSize = cover?.src ? fitPostCover(cover) : { width: 500, height: 500 };

  return h('div', {
    lang: 'zh-CN',
    style: {
      display: 'flex',
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      background: '#111318',
      color: '#fff',
      fontFamily: 'Odysseia Sans, Odysseia Math',
    },
  },
  ...backgroundLayers(data, images),
  typeBadge(data),
  h('div', {
    style: {
      display: 'flex',
      position: 'absolute',
      left: 30,
      top: 65,
      width: 700,
      height: 500,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }, h('div', {
      style: {
        display: 'flex',
        width: coverSize.width,
        height: coverSize.height,
        overflow: 'hidden',
        borderRadius: 22,
        border: '3px solid rgba(255,255,255,0.34)',
        boxShadow: '0 22px 48px rgba(0,0,0,0.55)',
      },
    }, cover?.src
      ? h('img', { src: cover.src, style: { width: '100%', height: '100%', objectFit: 'cover' } })
      : h('div', {
          style: {
            display: 'flex', width: '100%', height: '100%', padding: 44, flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 20, textAlign: 'center',
            background: 'rgba(8,10,14,0.68)',
            color: '#e4e4e7', fontSize: 24, lineHeight: 1.35,
          },
        }, icon('post', 44, '#d4d4d8'), h('div', { style: { display: 'flex', maxHeight: 160, overflow: 'hidden' } }, cover?.title || data.title)))),
  h('div', {
    style: {
      display: 'flex',
      position: 'absolute',
      left: 790,
      top: 82,
      width: 400,
      height: 500,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
  },
  h('div', {
    style: {
      display: 'flex',
      maxHeight: 174,
      overflow: 'hidden',
      marginBottom: 18,
      fontSize: titleSize(data.title, 'post'),
      lineHeight: 1.12,
      fontWeight: 700,
      textShadow: '0 4px 18px rgba(0,0,0,0.55)',
    },
  }, data.title),
  h('div', {
    style: {
      display: 'flex',
      maxHeight: 86,
      overflow: 'hidden',
      marginBottom: 22,
      color: '#d4d4d8',
      fontSize: descriptionSize(data.description),
      lineHeight: 1.5,
    },
  }, data.description),
  creatorRow(data, images),
  h('div', {
    style: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  }, ...data.stats.map(statPill))),
  logo(images, data.accent),
  );
}

function renderLayout(data, images) {
  if (data.type === '帖子 / POST') return renderPostLayout(data, images);
  const covers = data.covers.map((name) => images[name]);

  return h('div', {
    lang: 'zh-CN',
    style: {
      display: 'flex',
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      background: '#111318',
      color: '#fff',
      fontFamily: 'Odysseia Sans, Odysseia Math',
    },
  },
  ...backgroundLayers(data, images),
  typeBadge(data),
  h('div', {
    style: {
      display: 'flex',
      position: 'absolute',
      left: 30,
      top: 65,
      width: 700,
      height: 500,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 13,
    },
  }, ...covers.map((image, index) => card(image, index, covers.length))),
  h('div', {
    style: {
      display: 'flex',
      position: 'absolute',
      left: 790,
      top: 82,
      width: 400,
      height: 500,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
  },
  ...(data.typeIcon === 'author' ? [
    h('div', { key: 'identity', style: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 } },
      h('img', { src: images.avatar.src, style: { width: 84, height: 84, borderRadius: 999, border: '3px solid rgba(255,255,255,0.28)', objectFit: 'cover' } }),
      h('div', { style: { display: 'flex', flexDirection: 'column', width: 300 } },
        h('div', { style: { display: 'flex', maxHeight: 104, overflow: 'hidden', fontSize: authorNameSize(data.author), lineHeight: 1.08, fontWeight: 700, textShadow: '0 4px 18px rgba(0,0,0,0.55)' } }, data.author),
        h('div', { style: { display: 'flex', marginTop: 8, color: '#a1a1aa', fontSize: 14 } }, data.createdAt))),
    h('div', { key: 'stats', style: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 } }, ...data.stats.map(statPill)),
    h('div', { key: 'latest', style: { display: 'flex', flexDirection: 'column' } },
      h('div', { style: { display: 'flex', color: '#a1a1aa', fontSize: 14, letterSpacing: 1 } }, data.description),
      h('div', { style: { display: 'flex', maxHeight: 70, overflow: 'hidden', marginTop: 7, fontSize: Math.min(27, titleSize(data.title, 'collection')), lineHeight: 1.25, fontWeight: 700 } }, data.title)),
  ] : [
  h('div', { key: 'title',
    style: {
      display: 'flex',
      maxHeight: 162,
      overflow: 'hidden',
      marginBottom: 16,
      fontSize: titleSize(data.title, 'collection'),
      lineHeight: 1.12,
      fontWeight: 700,
      textShadow: '0 4px 18px rgba(0,0,0,0.55)',
    },
  }, data.title),
  h('div', { key: 'description',
    style: {
      display: 'flex',
      maxHeight: 86,
      overflow: 'hidden',
      marginBottom: 22,
      color: '#d4d4d8',
      fontSize: descriptionSize(data.description),
      lineHeight: 1.5,
    },
  }, data.description),
  creatorRow(data, images),
  h('div', { key: 'stats',
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
    },
  }, ...data.stats.map(statPill)),
  ])),
  logo(images, data.accent),
  );
}

function collectFontText(data, images) {
  return [
    '类脑',
    data.type,
    data.title,
    data.description,
    data.author,
    data.createdAt,
    ...data.stats.flat(),
    ...Object.values(images).map((image) => image?.title),
  ].filter(Boolean).join('');
}

async function loadSubsetFont(text, family = 'Noto Sans SC') {
  const characters = [...new Set(
    [...text].filter((character) => !/\p{Extended_Pictographic}/u.test(character)),
  )].join('');
  const cssFamily = family.trim().replace(/\s+/g, '+');
  const cssUrl = `https://fonts.googleapis.com/css2?family=${cssFamily}:wght@400&display=swap&text=${encodeURIComponent(characters)}`;
  const cssResponse = await fetch(cssUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(8000),
  });
  if (!cssResponse.ok) throw new Error(`Google Fonts CSS 请求失败：${cssResponse.status}`);
  const css = await cssResponse.text();
  const fontUrl = css.match(/url\((https:[^)]+)\)/)?.[1];
  if (!fontUrl) throw new Error('Google Fonts 没有返回字体地址');
  const fontResponse = await fetch(fontUrl, { signal: AbortSignal.timeout(8000) });
  if (!fontResponse.ok) throw new Error(`Google Fonts 字体请求失败：${fontResponse.status}`);
  return fontResponse.arrayBuffer();
}

async function loadPublicImage(baseUrl, relativePath) {
  const url = new URL(`/${relativePath.replace(/^public\//, '')}`, baseUrl);
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`OG 静态资源请求失败：${response.status} ${url}`);
  const contentType = response.headers.get('content-type')?.split(';')[0] || mimeType(relativePath);
  const data = Buffer.from(await response.arrayBuffer());
  return {
    src: `data:${contentType};base64,${data.toString('base64')}`,
    ...readImageDimensions(data, contentType),
  };
}

export async function loadBaseImages(baseUrl, backgroundName) {
  const entries = backgroundName
    ? Object.entries(imagePaths).filter(([name]) => ['avatar', 'logo', backgroundName].includes(name))
    : Object.entries(imagePaths);
  const imageEntries = await Promise.all(
    entries.map(async ([name, path]) => [
      name,
      baseUrl && path.startsWith('public/')
        ? await loadPublicImage(baseUrl, path)
        : await loadImage(path),
    ]),
  );
  return Object.fromEntries(imageEntries);
}

async function prepareLiveResource(type, id, token, baseImages, apiBaseUrl) {
  if (type === 'thread') {
    return prepareLiveThread(token, baseImages, id, apiBaseUrl);
  }
  if (type === 'author') {
    return prepareLiveAuthor(token, baseImages, id, apiBaseUrl);
  }
  return prepareLiveCollection(token, baseImages, id, type, apiBaseUrl);
}

export async function prepareOgImage({
  type,
  id,
  token,
  assetBaseUrl,
  apiBaseUrl = DEFAULT_API_BASE_URL,
}) {
  if (!['thread', 'author', 'booklist', 'tournament'].includes(type)) {
    throw new Error(`不支持的 OG 类型：${type}`);
  }
  if (!/^\d+$/.test(String(id || ''))) throw new Error('OG 资源 ID 必须是纯数字');
  if (!token) throw new Error('OG_SERVICE_TOKEN 未配置');

  const backgroundName = pickBackground(`${type}:${id}`);
  const baseImages = await loadBaseImages(assetBaseUrl, backgroundName);
  const prepared = await prepareLiveResource(type, String(id), token, baseImages, apiBaseUrl);
  if (!prepared) return null;
  const fontText = collectFontText(prepared.data, prepared.images);
  const mathText = [...fontText]
    .filter((character) => /[\u2100-\u214F\u{1D400}-\u{1D7FF}]/u.test(character))
    .join('');
  const [fontData, mathFontData] = await Promise.all([
    loadSubsetFont(fontText),
    mathText ? loadSubsetFont(mathText, 'Noto Sans Math') : null,
  ]);
  return {
    element: renderLayout(prepared.data, prepared.images),
    fontData,
    mathFontData,
  };
}

export { loadEmoji, prepareLiveAuthor, prepareLiveCollection, prepareLiveThread, renderLayout };
