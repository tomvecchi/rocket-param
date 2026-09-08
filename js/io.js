import { OXIDISERS, FUELS, COMBINATIONS } from '../config/propellant_components.js';
import { state, resetNextId } from './state.js';
import { renderCards, renderBoosterSection } from './render/cards.js';
import { update } from './update.js';

const FORMAT_VERSION = 1;

export function saveConfig() {
  const payload = {
    version: FORMAT_VERSION,
    stages:  state.stages,
    boosters: state.boosters,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'rocket.json';
  a.click();
  URL.revokeObjectURL(url);
}

function validateStage(s) {
  const isSolid = OXIDISERS[s.oxidiser]?.solid === true;
  const isTri   = OXIDISERS[s.oxidiser]?.tri   === true;
  if (!OXIDISERS[s.oxidiser]) throw new Error(`Unknown oxidiser: ${s.oxidiser}`);
  if (!isSolid && !isTri) {
    if (!FUELS[s.fuel])                            throw new Error(`Unknown fuel: ${s.fuel}`);
    if (!COMBINATIONS[`${s.oxidiser}/${s.fuel}`])  throw new Error(`No combination: ${s.oxidiser}/${s.fuel}`);
  }
  if (!isSolid) {
    // Configs saved before burn time became a derived value carry no engine count.
    if (!Number.isInteger(s.engineCount) || s.engineCount < 1)
      throw new Error(`Invalid engineCount: ${s.engineCount}`
        + (s.burnTime !== undefined ? ' (config predates the engine-count input)' : ''));
  }
  for (const field of ['diameter', 'height', 'fill']) {
    if (typeof s[field] !== 'number' || s[field] <= 0)
      throw new Error(`Invalid ${field}: ${s[field]}`);
  }
}

export function loadConfig() {
  const input = document.getElementById('file-input');
  input.value = '';
  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data.stages) || data.stages.length < 1)
          throw new Error('stages must be a non-empty array');
        data.stages.forEach(validateStage);
        validateStage(data.boosters);

        state.stages   = data.stages;
        state.boosters = data.boosters;
        resetNextId(data.stages.map(s => s.id));
        renderCards();
        renderBoosterSection();
        update();
      } catch (err) {
        alert(`Could not load config: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}
