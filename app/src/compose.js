// The cover composer: draws a complete Panel Heat cover onto any canvas.
//
// One render path serves the live editor preview, the PNG export and the
// screenshot stage, so what the user sees is exactly what gets exported.
// Everything is drawn from the cover state: layout, per-panel photos with
// their pan and zoom, the colour grade and the caption lettering.

import { layoutById, panelRectPixels } from './layouts.js';
import { gradeById, paintGradeWashes } from './grade.js';

export const COVER_FONT = 'Anton, "Arial Narrow", sans-serif';

// Where a photo lands inside its panel: cover-fit scale, grown by the
// panel's zoom, centred, then shifted by the panel's pan offsets (fractions
// of the panel's size, so -0.5..0.5 moves the photo by half a panel).
export function photoPlacement(image, panelW, panelH, panel) {
  const base = Math.max(panelW / image.naturalWidth, panelH / image.naturalHeight);
  const scale = base * (panel.zoom || 1);
  const drawW = image.naturalWidth * scale;
  const drawH = image.naturalHeight * scale;
  return {
    x: (panelW - drawW) / 2 + (panel.ox || 0) * panelW,
    y: (panelH - drawH) / 2 + (panel.oy || 0) * panelH,
    w: drawW,
    h: drawH,
  };
}

function drawPanelPhoto(ctx, rect, panel, photo, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (photo && photo.image) {
    const place = photoPlacement(photo.image, rect.w, rect.h, panel);
    ctx.filter = grade.filter;
    ctx.drawImage(photo.image, rect.x + place.x, rect.y + place.y, place.w, place.h);
    ctx.filter = 'none';
  } else {
    const empty = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    empty.addColorStop(0, '#2a2438');
    empty.addColorStop(1, '#17131f');
    ctx.fillStyle = empty;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  paintGradeWashes(ctx, grade, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function drawEmptyPanelHint(ctx, rect, index, height) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.font = `${Math.round(height * 0.022)}px ${COVER_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`PANEL ${index + 1}`, rect.x + rect.w / 2, rect.y + rect.h / 2 - height * 0.016);
  ctx.font = `${Math.round(height * 0.014)}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillText('add a photo', rect.x + rect.w / 2, rect.y + rect.h / 2 + height * 0.016);
  ctx.restore();
}

function drawPanelFrames(ctx, layout, width, height, selectedIndex) {
  const outer = Math.max(5, Math.round(height * 0.011));
  for (let i = 0; i < layout.panels.length; i++) {
    const rect = panelRectPixels(layout, i, width, height);
    ctx.save();
    ctx.strokeStyle = '#0a0a0c';
    ctx.lineWidth = outer;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
    ctx.lineWidth = Math.max(1, Math.round(height * 0.0022));
    ctx.strokeRect(rect.x + outer / 2, rect.y + outer / 2, rect.w - outer, rect.h - outer);
    if (i === selectedIndex) {
      ctx.strokeStyle = '#ffd23e';
      ctx.lineWidth = Math.max(2, Math.round(height * 0.004));
      ctx.strokeRect(rect.x + outer, rect.y + outer, rect.w - outer * 2, rect.h - outer * 2);
    }
    ctx.restore();
  }
}

// The caption block: a soft scrim along the bottom, the tagline in spaced
// capitals and the title in heavy display lettering, fitted to the width.
export function drawCaption(ctx, state, grade, width, height) {
  const title = (state.title || '').trim();
  const tagline = (state.tagline || '').trim();
  if (!title && !tagline) return;

  ctx.save();
  const scrimH = height * 0.42;
  const scrim = ctx.createLinearGradient(0, height - scrimH, 0, height);
  scrim.addColorStop(0, 'rgba(5, 4, 10, 0)');
  scrim.addColorStop(0.62, 'rgba(5, 4, 10, 0.42)');
  scrim.addColorStop(1, 'rgba(5, 4, 10, 0.78)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, height - scrimH, width, scrimH);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  let titleBaseline = height * 0.955;
  if (title) {
    let size = height * 0.125;
    ctx.font = `${size}px ${COVER_FONT}`;
    const maxW = width * 0.92;
    const measured = ctx.measureText(title.toUpperCase()).width;
    if (measured > maxW) {
      size = Math.floor(size * (maxW / measured));
      ctx.font = `${size}px ${COVER_FONT}`;
    }
    const fill = ctx.createLinearGradient(0, titleBaseline - size, 0, titleBaseline);
    fill.addColorStop(0, grade.titleTop);
    fill.addColorStop(1, grade.titleBottom);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = Math.round(height * 0.012);
    ctx.shadowOffsetY = Math.round(height * 0.006);
    ctx.lineWidth = Math.max(2, size / 14);
    ctx.strokeStyle = '#0b0b10';
    const text = title.toUpperCase();
    ctx.strokeText(text, width / 2, titleBaseline);
    ctx.fillStyle = fill;
    ctx.fillText(text, width / 2, titleBaseline);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  if (tagline) {
    const size = Math.round(height * 0.027);
    ctx.font = `${size}px ${COVER_FONT}`;
    ctx.fillStyle = grade.tagline;
    const spaced = tagline.toUpperCase().split('').join('  ');
    const y = title ? titleBaseline - height * 0.125 - size * 0.4 : height * 0.93;
    ctx.fillText(spaced, width / 2, y);
    const ruleW = Math.min(width * 0.3, ctx.measureText(spaced).width);
    ctx.fillStyle = grade.accent;
    ctx.fillRect(width / 2 - ruleW / 2, y + size * 0.55, ruleW, Math.max(2, height * 0.004));
  }
  ctx.restore();
}

function drawVignette(ctx, width, height) {
  const radius = Math.max(width, height) * 0.78;
  const glow = ctx.createRadialGradient(width / 2, height / 2, radius * 0.55, width / 2, height / 2, radius);
  glow.addColorStop(0, 'rgba(0, 0, 0, 0)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0.30)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

// Renders the whole cover. photosById maps a panel's photoId to a loaded
// photo ({ image }). opts.showHints draws the "add a photo" hints and the
// selection frame (editor only); opts.selectedIndex marks the edited panel.
export function renderCover(canvas, state, photosById, opts = {}) {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d');
  const layout = layoutById(state.layoutId);
  const grade = gradeById(state.gradeId);

  ctx.fillStyle = '#14101d';
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < layout.panels.length; i++) {
    const panel = state.panels[i] || { photoId: null, zoom: 1, ox: 0, oy: 0 };
    const rect = panelRectPixels(layout, i, width, height);
    const photo = panel.photoId ? photosById.get(panel.photoId) : null;
    drawPanelPhoto(ctx, rect, panel, photo, grade);
    if (!photo && opts.showHints) drawEmptyPanelHint(ctx, rect, i, height);
  }

  drawVignette(ctx, width, height);
  drawCaption(ctx, state, grade, width, height);
  drawPanelFrames(ctx, layout, width, height, opts.showHints ? state.selected : -1);
  return canvas;
}
