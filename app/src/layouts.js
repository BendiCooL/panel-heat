// Panel layouts for Panel Heat covers.
//
// Every layout is a list of rectangles in unit space (x, y, w, h as fractions
// of the whole cover), so the same layout works at 1080 x 1080, 1080 x 1350
// and 1920 x 1080. The composer scales the rectangles to the canvas, clips
// each panel, paints its photo inside and frames it with a bold border.

export const LAYOUTS = [
  {
    id: 'solo',
    name: 'Solo Shot',
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
  },
  {
    id: 'duo',
    name: 'Split Duo',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
  {
    id: 'triptych',
    name: 'Triptych',
    panels: [
      { x: 0, y: 0, w: 0.34, h: 1 },
      { x: 0.34, y: 0, w: 0.32, h: 1 },
      { x: 0.66, y: 0, w: 0.34, h: 1 },
    ],
  },
  {
    id: 'hero',
    name: 'Hero & Crew',
    panels: [
      { x: 0, y: 0, w: 0.6, h: 1 },
      { x: 0.6, y: 0, w: 0.4, h: 0.52 },
      { x: 0.6, y: 0.52, w: 0.4, h: 0.48 },
    ],
  },
  {
    id: 'quad',
    name: 'Quad Grid',
    panels: [
      { x: 0, y: 0, w: 0.52, h: 0.58 },
      { x: 0.52, y: 0, w: 0.48, h: 0.58 },
      { x: 0, y: 0.58, w: 0.52, h: 0.42 },
      { x: 0.52, y: 0.58, w: 0.48, h: 0.42 },
    ],
  },
  {
    id: 'penta',
    name: 'Five Star',
    panels: [
      { x: 0, y: 0, w: 0.36, h: 1 },
      { x: 0.36, y: 0, w: 0.32, h: 0.5 },
      { x: 0.68, y: 0, w: 0.32, h: 0.5 },
      { x: 0.36, y: 0.5, w: 0.32, h: 0.5 },
      { x: 0.68, y: 0.5, w: 0.32, h: 0.5 },
    ],
  },
];

export function layoutById(id) {
  return LAYOUTS.find((layout) => layout.id === id) ?? LAYOUTS[2];
}

export function panelRectPixels(layout, index, width, height) {
  const rect = layout.panels[index];
  return {
    x: Math.round(rect.x * width),
    y: Math.round(rect.y * height),
    w: Math.round(rect.w * width),
    h: Math.round(rect.h * height),
  };
}

export function panelIndexAt(layout, unitX, unitY) {
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const rect = layout.panels[i];
    if (unitX >= rect.x && unitX <= rect.x + rect.w && unitY >= rect.y && unitY <= rect.y + rect.h) {
      return i;
    }
  }
  return -1;
}
