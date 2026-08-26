import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

import {
  HEIGHT,
  WIDTH,
  loadBaseImages,
  loadEmoji,
  mockData,
  prepareLiveAuthor,
  prepareLiveCollection,
  prepareLiveThread,
  renderLayout,
} from '../lib/renderer.mjs';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const OUTPUT_DIR = resolve(PROJECT_ROOT, 'output');
const FONT_PATH = process.env.OG_FONT_PATH || '/System/Library/Fonts/Supplemental/Arial Unicode.ttf';
const requestedScale = Number(process.env.OG_RENDER_SCALE || 1);
const renderScale = Number.isFinite(requestedScale) && requestedScale >= 1 && requestedScale <= 2
  ? requestedScale
  : 1;

function assertPng(buffer, name, width = WIDTH, height = HEIGHT) {
  if (buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error(`${name}: Resvg 没有生成有效 PNG`);
  }
  if (buffer.readUInt32BE(16) !== width || buffer.readUInt32BE(20) !== height) {
    throw new Error(`${name}: 输出尺寸不是 ${width}×${height}`);
  }
}

async function renderImage(name, data, images, fontData, scale = 1) {
  const svg = await satori(renderLayout(data, images), {
    width: WIDTH,
    height: HEIGHT,
    fonts: [{ name: 'Odysseia Sans', data: fontData, weight: 400, style: 'normal' }],
    loadAdditionalAsset: loadEmoji,
  });
  const outputWidth = WIDTH * scale;
  const outputHeight = HEIGHT * scale;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: outputWidth },
    background: 'rgba(17,19,24,1)',
  }).render().asPng();
  assertPng(png, name, outputWidth, outputHeight);
  await Promise.all([
    scale === 1 ? writeFile(resolve(OUTPUT_DIR, `${name}.svg`), svg) : Promise.resolve(),
    writeFile(resolve(OUTPUT_DIR, `${name}${scale === 1 ? '' : `@${scale}x`}.png`), png),
  ]);
  console.log(`generated ${name}${scale === 1 ? '' : `@${scale}x`}.png (${outputWidth}x${outputHeight})`);
}

await access(FONT_PATH).catch(() => {
  throw new Error(`找不到中文字体：${FONT_PATH}\n请通过 OG_FONT_PATH 指定 TTF、OTF 或 WOFF 字体。`);
});

const [fontData, images] = await Promise.all([readFile(FONT_PATH), loadBaseImages()]);
await mkdir(OUTPUT_DIR, { recursive: true });

for (const [name, data] of Object.entries(mockData)) {
  await renderImage(name, data, images, fontData, renderScale);
}
if (!process.env.OG_RENDER_SCALE) await renderImage('author', mockData.author, images, fontData, 2);

if (!process.env.OG_SERVICE_TOKEN) {
  console.warn('skipped live metadata: OG_SERVICE_TOKEN is missing');
  process.exit(0);
}

const token = process.env.OG_SERVICE_TOKEN;
const authorId = process.env.OG_AUTHOR_ID || '1175027899703758933';
const threadId = process.env.OG_THREAD_ID || '1535568851536977981';
const booklistId = process.env.OG_BOOKLIST_ID || '426';
const tournamentId = process.env.OG_TOURNAMENT_ID || '4849';
const resources = await Promise.all([
  prepareLiveAuthor(token, images, authorId).then((value) => [`author-${authorId}`, value]),
  prepareLiveThread(token, images, threadId).then((value) => [`thread-${threadId}`, value]),
  prepareLiveCollection(token, images, booklistId, 'booklist').then((value) => [`booklist-${booklistId}`, value]),
  prepareLiveCollection(token, images, tournamentId, 'tournament').then((value) => [`tournament-${tournamentId}`, value]),
]);

for (const [name, live] of resources) {
  if (!live) {
    console.warn(`${name} returned 404; production should use the default site OG`);
    continue;
  }
  await renderImage(name, live.data, live.images, fontData);
  await renderImage(name, live.data, live.images, fontData, 2);
}
