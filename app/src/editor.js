// The Panel Heat editor: cover state, photo loading and every control.
//
// Photos are read from the person's own machine with FileReader and held as
// object URLs in memory. Nothing is uploaded anywhere; the app works fully
// offline once its own files are loaded.

import { LAYOUTS, layoutById, panelIndexAt, panelRectPixels } from './layouts.js';
import { GRADES } from './grade.js';
import { renderCover } from './compose.js';
import { EXPORT_SIZES, exportCoverPng } from './exporter.js';

export const SAMPLE_PHOTOS = [
  { name: 'coupe', label: 'Sunset Coupe', src: 'samples/coupe.jpg' },
  { name: 'marina', label: 'Neon Marina', src: 'samples/marina.jpg' },
  { name: 'boulevard', label: 'The Boulevard', src: 'samples/boulevard.jpg' },
  { name: 'pier', label: 'The Pier', src: 'samples/pier.jpg' },
];

let photoSeq = 0;

export function blankPanel(photoId = null) {
  return { photoId, zoom: 1, ox: 0, oy: 0 };
}

export function createCoverState() {
  return {
    layoutId: 'penta',
    gradeId: 'sunset',
    sizeId: 'wide',
    title: 'Neon Harbor',
    tagline: 'Every saint has a past',
    selected: 0,
    panels: [],
  };
}

// Keeps the panels array matched to the layout: keeps each panel's photo and
// framing where it can, adds blank panels, drops the extras.
export function syncPanelsToLayout(state) {
  const count = layoutById(state.layoutId).panels.length;
  while (state.panels.length < count) state.panels.push(blankPanel());
  state.panels.length = count;
  if (state.selected >= count) state.selected = count - 1;
}

export function loadImageFromUrl(url, name) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ id: `photo-${++photoSeq}`, name, image, url });
    image.onerror = reject;
    image.src = url;
  });
}

export function loadSamplePhoto(sampleName) {
  const sample = SAMPLE_PHOTOS.find((entry) => entry.name === sampleName) ?? SAMPLE_PHOTOS[0];
  return loadImageFromUrl(sample.src, sample.label);
}

export function loadPhotoFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      loadImageFromUrl(reader.result, file.name).then(resolve, reject);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Puts a photo into the first panels that still need one.
export function fillEmptyPanels(state, photo) {
  for (let i = 0; i < state.panels.length; i++) {
    if (!state.panels[i].photoId) state.panels[i] = blankPanel(photo.id);
  }
}

export function spreadPhotoAcrossPanels(state, photo) {
  state.panels = state.panels.map(() => blankPanel(photo.id));
}

function buttonRow(container, items, currentId, onPick) {
  container.innerHTML = '';
  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip' + (item.id === currentId ? ' chip-on' : '');
    button.textContent = item.detail ? `${item.name} · ${item.detail}` : item.name;
    button.addEventListener('click', () => onPick(item.id));
    container.appendChild(button);
  }
}

export function startEditor(preset = {}) {
  const state = createCoverState();
  Object.assign(state, preset.state || {});
  syncPanelsToLayout(state);
  const photos = new Map();

  const canvas = document.getElementById('preview');
  const strip = document.getElementById('photo-strip');
  const panelLabel = document.getElementById('panel-label');
  const zoomRange = document.getElementById('zoom-range');
  const statusLine = document.getElementById('status-line');

  function say(text) {
    statusLine.textContent = text;
  }

  function fitPreviewCanvas() {
    const size = EXPORT_SIZES.find((entry) => entry.id === state.sizeId) ?? EXPORT_SIZES[0];
    const scale = Math.min(940 / size.w, 720 / size.h);
    canvas.width = Math.round(size.w * scale);
    canvas.height = Math.round(size.h * scale);
  }

  function render() {
    fitPreviewCanvas();
    renderCover(canvas, state, photos, { showHints: true });
    const layout = layoutById(state.layoutId);
    panelLabel.textContent = `Panel ${state.selected + 1} of ${layout.panels.length}`;
    zoomRange.value = String(state.panels[state.selected]?.zoom ?? 1);
    buttonRow(document.getElementById('layout-row'), LAYOUTS, state.layoutId, pickLayout);
    buttonRow(document.getElementById('grade-row'), GRADES, state.gradeId, (id) => {
      state.gradeId = id;
      render();
    });
    buttonRow(document.getElementById('size-row'), EXPORT_SIZES, state.sizeId, (id) => {
      state.sizeId = id;
      render();
    });
  }

  function pickLayout(id) {
    state.layoutId = id;
    syncPanelsToLayout(state);
    render();
  }

  function renderStrip() {
    strip.innerHTML = '';
    if (photos.size === 0) {
      const note = document.createElement('p');
      note.className = 'strip-note';
      note.textContent = 'No photos yet — add your own or start with a sample.';
      strip.appendChild(note);
      return;
    }
    for (const photo of photos.values()) {
      const item = document.createElement('div');
      item.className = 'thumb';
      const img = document.createElement('img');
      img.src = photo.url;
      img.alt = photo.name;
      img.title = `${photo.name} — click to place in the selected panel, double-click to fill every panel`;
      img.addEventListener('click', () => {
        state.panels[state.selected] = blankPanel(photo.id);
        say(`${photo.name} placed in panel ${state.selected + 1}. Drag it on the cover to reposition.`);
        render();
      });
      img.addEventListener('dblclick', () => {
        spreadPhotoAcrossPanels(state, photo);
        say(`${photo.name} now fills every panel.`);
        render();
      });
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'thumb-remove';
      remove.textContent = '×';
      remove.title = `Remove ${photo.name}`;
      remove.addEventListener('click', () => {
        photos.delete(photo.id);
        for (const panel of state.panels) if (panel.photoId === photo.id) panel.photoId = null;
        renderStrip();
        render();
      });
      item.appendChild(img);
      item.appendChild(remove);
      strip.appendChild(item);
    }
  }

  async function addPhoto(photo, { fill = true } = {}) {
    photos.set(photo.id, photo);
    if (fill) fillEmptyPanels(state, photo);
    renderStrip();
    render();
  }

  document.getElementById('add-photos').addEventListener('click', () => {
    document.getElementById('file-input').click();
  });
  document.getElementById('file-input').addEventListener('change', async (event) => {
    const files = [...event.target.files];
    for (const file of files) {
      try {
        await addPhoto(await loadPhotoFile(file));
      } catch {
        say(`Could not read ${file.name}.`);
      }
    }
    if (files.length) say(`${files.length} photo(s) loaded — they never leave this device.`);
    event.target.value = '';
  });

  for (const button of document.querySelectorAll('.sample-btn')) {
    button.addEventListener('click', async () => {
      const photo = await loadSamplePhoto(button.dataset.sample);
      await addPhoto(photo);
      say(`${photo.name} loaded from the built-in samples.`);
    });
  }

  document.getElementById('title-input').addEventListener('input', (event) => {
    state.title = event.target.value;
    render();
  });
  document.getElementById('tagline-input').addEventListener('input', (event) => {
    state.tagline = event.target.value;
    render();
  });
  document.getElementById('spread-btn').addEventListener('click', () => {
    const first = photos.values().next().value;
    if (!first) return say('Add a photo first, then spread it across the panels.');
    spreadPhotoAcrossPanels(state, first);
    render();
  });
  document.getElementById('clear-panel-btn').addEventListener('click', () => {
    state.panels[state.selected] = blankPanel();
    render();
  });
  zoomRange.addEventListener('input', () => {
    state.panels[state.selected].zoom = Number(zoomRange.value);
    renderCover(canvas, state, photos, { showHints: true });
  });
  document.getElementById('export-btn').addEventListener('click', () => {
    exportCoverPng(state, photos);
    say('Cover exported as a PNG. Share it anywhere.');
  });

  // Drag to reposition the selected panel's photo; wheel zooms it.
  let drag = null;
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const unitX = (event.clientX - rect.left) / rect.width;
    const unitY = (event.clientY - rect.top) / rect.height;
    const index = panelIndexAt(layoutById(state.layoutId), unitX, unitY);
    if (index === -1) return;
    state.selected = index;
    drag = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    render();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const panel = state.panels[state.selected];
    const rect = panelRectPixels(layoutById(state.layoutId), state.selected, canvas.width, canvas.height);
    const cssRect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / cssRect.width;
    panel.ox = clamp(panel.ox + ((event.clientX - drag.x) * scaleX) / rect.w, -0.6, 0.6);
    panel.oy = clamp(panel.oy + ((event.clientY - drag.y) * scaleX) / rect.h, -0.6, 0.6);
    drag = { x: event.clientX, y: event.clientY };
    renderCover(canvas, state, photos, { showHints: true });
  });
  canvas.addEventListener('pointerup', () => {
    drag = null;
    render();
  });
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const panel = state.panels[state.selected];
    panel.zoom = clamp(panel.zoom * Math.exp(-event.deltaY * 0.0012), 1, 4);
    render();
  }, { passive: false });

  function clamp(value, lo, hi) {
    return Math.min(hi, Math.max(lo, value));
  }

  renderStrip();
  render();
  if (document.fonts?.ready) document.fonts.ready.then(() => render());

  return { state, photos, addPhoto, render };
}
