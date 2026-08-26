import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

import { HEIGHT, OUTPUT_SCALE, WIDTH, loadEmoji } from './renderer.mjs';

export async function renderPng(element, fontData) {
  const svg = await satori(element, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [{ name: 'Odysseia Sans', data: fontData, weight: 400, style: 'normal' }],
    loadAdditionalAsset: loadEmoji,
  });
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH * OUTPUT_SCALE },
    background: 'rgba(17,19,24,1)',
  }).render().asPng();

  if (
    png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a'
    || png.readUInt32BE(16) !== WIDTH * OUTPUT_SCALE
    || png.readUInt32BE(20) !== HEIGHT * OUTPUT_SCALE
  ) {
    throw new Error('OG 渲染没有生成有效的 2× PNG');
  }
  return png;
}
