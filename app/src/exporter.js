// PNG export: renders the cover once more at full post size on an offscreen
// canvas and downloads it. The three sizes are the common post sizes the
// bounty asks for.

import { renderCover } from './compose.js';

export const EXPORT_SIZES = [
  { id: 'square', name: 'Square post', detail: '1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', name: 'Portrait post', detail: '1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', name: 'Wide post', detail: '1920 × 1080', w: 1920, h: 1080 },
];

export function sizeById(id) {
  return EXPORT_SIZES.find((size) => size.id === id) ?? EXPORT_SIZES[0];
}

export function renderCoverAtSize(state, photosById, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  renderCover(canvas, state, photosById, { showHints: false });
  return canvas;
}

export function exportCoverPng(state, photosById) {
  const size = sizeById(state.sizeId);
  const canvas = renderCoverAtSize(state, photosById, size);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `panel-heat-cover-${size.w}x${size.h}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, 'image/png');
}
