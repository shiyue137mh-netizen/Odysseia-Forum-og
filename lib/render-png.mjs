import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

import { HEIGHT, OUTPUT_SCALE, WIDTH, loadEmoji } from './renderer.mjs';

export async function renderPng(element, fontData, mathFontData) {
  const svg = await satori(element, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: 'Odysseia Sans', data: fontData, weight: 400, style: 'normal' },
      ...(mathFontData
        ? [{ name: 'Odysseia Math', data: mathFontData, weight: 400, style: 'normal' }]
        : []),
    ],
    loadAdditionalAsset: loadEmoji,
  });
  const outputWidth = Math.round(WIDTH * OUTPUT_SCALE);
  const outputHeight = Math.round(HEIGHT * OUTPUT_SCALE);
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: outputWidth },
    background: 'rgba(17,19,24,1)',
  }).render().asPng();

  if (
    png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a'
    || png.readUInt32BE(16) !== outputWidth
    || png.readUInt32BE(20) !== outputHeight
  ) {
    throw new Error('OG 渲染没有生成有效的 1.5× PNG');
  }
  return png;
}
