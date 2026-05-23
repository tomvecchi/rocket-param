import { state, advancedOpen, getNextId } from './state.js';
import { renderCards, renderBoosterSection } from './render/cards.js';
import { update } from './update.js';

export function setupEvents() {
  document.getElementById('btn-add').addEventListener('click', () => {
    if (state.stages.length >= 5) return;
    state.stages.push({
      id: getNextId(),
      propellant: 'LOX/RP-1',
      diameter: 3.7,
      height: 15,
      fill: 0.85,
      tankMaterial: 'Al-2219',
      engineType: 'pump-fed',
      thrustPerEngine: 850,
      burnTime: 180,
    });
    renderCards();
    update();
  });

  // Delegated input handler for stage cards
  document.getElementById('stage-cards').addEventListener('input', e => {
    const el    = e.target;
    const id    = +el.dataset.id;
    const param = el.dataset.param;
    if (!id || !param) return;
    const s = state.stages.find(x => x.id === id);
    if (!s) return;

    s[param] = +el.value;
    let labelId, labelText;
    if      (param === 'diameter')        { labelId = `v-diam-${id}`;    labelText = (+el.value).toFixed(1) + ' m'; }
    else if (param === 'height')          { labelId = `v-height-${id}`;  labelText = (+el.value).toFixed(1) + ' m'; }
    else if (param === 'fill')            { labelId = `v-fill-${id}`;    labelText = Math.round(+el.value * 100) + '%'; }
    else if (param === 'thrustPerEngine') { labelId = `v-thrust-${id}`;  labelText = el.value + ' kN'; }
    else if (param === 'burnTime')        { labelId = `v-burntime-${id}`; labelText = el.value + ' s'; }
    if (labelId) document.getElementById(labelId).textContent = labelText;
    update();
  });

  // Change handler for <select> elements
  document.getElementById('stage-cards').addEventListener('change', e => {
    const el    = e.target;
    const id    = +el.dataset.id;
    const param = el.dataset.param;
    if (!id) return;
    const s = state.stages.find(x => x.id === id);
    if (!s) return;

    if (param === 'prop') {
      s.propellant = el.value;
      renderCards();
    } else if (param === 'tankMaterial') {
      s.tankMaterial = el.value;
    } else if (param === 'engineType') {
      s.engineType = el.value;
    }
    update();
  });

  // Delegated click handler for stage cards
  document.getElementById('stage-cards').addEventListener('click', e => {
    const advToggle = e.target.closest('[data-adv-toggle]');
    if (advToggle) {
      const id = +advToggle.dataset.advToggle;
      advancedOpen[id] = !advancedOpen[id];
      document.getElementById(`card-adv-${id}`).style.display = advancedOpen[id] ? '' : 'none';
      advToggle.querySelector('.adv-chevron').textContent = advancedOpen[id] ? '▴' : '▾';
      return;
    }

    const removeBtn = e.target.closest('.btn-remove-stage');
    if (removeBtn) {
      const id = +removeBtn.dataset.remove;
      if (state.stages.length <= 1) return;
      state.stages = state.stages.filter(x => x.id !== id);
      renderCards();
      update();
    }
  });
}
