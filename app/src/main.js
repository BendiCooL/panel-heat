// Panel Heat entry point: starts the editor, or — when the URL carries a
// ?shot= parameter — poses the app for a screenshot: ?shot=cover renders one
// cover full-bleed on the stage canvas, ?shot=editor opens the editor with
// sample photos already loaded. Both set window.__shotReady when done.

import {
  startEditor,
  loadSamplePhoto,
  createCoverState,
  syncPanelsToLayout,
  blankPanel,
} from './editor.js';
import { renderCover } from './compose.js';
import { sizeById } from './exporter.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot');

function stateFromParams() {
  const state = createCoverState();
  if (params.get('layout')) state.layoutId = params.get('layout');
  if (params.get('grade')) state.gradeId = params.get('grade');
  if (params.get('size')) state.sizeId = params.get('size');
  if (params.get('title')) state.title = params.get('title');
  if (params.get('tagline')) state.tagline = params.get('tagline');
  syncPanelsToLayout(state);
  return state;
}

async function loadNamedPhotos() {
  const names = (params.get('photos') || 'coupe').split(',').map((name) => name.trim()).filter(Boolean);
  const photos = new Map();
  const loaded = [];
  for (const name of names) {
    const photo = await loadSamplePhoto(name);
    photos.set(photo.id, photo);
    loaded.push(photo);
  }
  return { photos, loaded };
}

// Gives each panel the next photo in turn, so several photos share a cover.
function assignRoundRobin(state, loaded) {
  state.panels = state.panels.map((panel, index) =>
    loaded.length ? blankPanel(loaded[index % loaded.length].id) : panel,
  );
}

async function poseCoverShot() {
  document.body.classList.add('shot-cover');
  const state = stateFromParams();
  const { photos, loaded } = await loadNamedPhotos();
  assignRoundRobin(state, loaded);

  const size = sizeById(state.sizeId);
  const scale = Math.min(1, 1280 / Math.max(size.w, size.h));
  const stage = document.getElementById('stage');
  stage.width = Math.round(size.w * scale);
  stage.height = Math.round(size.h * scale);

  if (document.fonts?.ready) {
    await document.fonts.load('100px Anton');
    await document.fonts.ready;
  }
  renderCover(stage, state, photos, { showHints: false });
  window.__shotReady = true;
}

async function poseEditorShot(editor) {
  const { loaded } = await loadNamedPhotos();
  for (const photo of loaded) await editor.addPhoto(photo, { fill: false });
  const wanted = stateFromParams();
  editor.state.layoutId = wanted.layoutId;
  editor.state.gradeId = wanted.gradeId;
  editor.state.sizeId = wanted.sizeId;
  editor.state.title = wanted.title;
  editor.state.tagline = wanted.tagline;
  syncPanelsToLayout(editor.state);
  assignRoundRobin(editor.state, loaded);
  document.getElementById('title-input').value = wanted.title;
  document.getElementById('tagline-input').value = wanted.tagline;
  document.getElementById('status-line').textContent =
    `${loaded.length} photos loaded — drag on the cover to reposition, scroll to zoom, then export.`;
  if (document.fonts?.ready) await document.fonts.ready;
  editor.render();
  window.__shotReady = true;
}

if (shot === 'cover') {
  poseCoverShot();
} else {
  const editor = startEditor();
  if (shot === 'editor') poseEditorShot(editor);
}
