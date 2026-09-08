import { OXIDISERS, FUELS, COMBINATIONS, resolveProp } from '../../config/propellant_components.js';
import { TANK_MATERIALS } from '../../config/materials.js';
import { ENGINE_TYPES } from '../../config/engines.js';
import { state, advancedOpen } from '../state.js';
import { update } from '../update.js';

function materialOptions(selected) {
  return Object.entries(TANK_MATERIALS).map(([key, m]) =>
    `<option value="${key}" ${key === selected ? 'selected' : ''}>${m.name}</option>`
  ).join('');
}

function engineTypeOptions(selected) {
  return Object.entries(ENGINE_TYPES).map(([key, e]) =>
    `<option value="${key}" ${key === selected ? 'selected' : ''}>${e.name}</option>`
  ).join('');
}

function oxidiserOptions(selected) {
  return Object.entries(OXIDISERS).map(([key, ox]) =>
    `<option value="${key}" ${key === selected ? 'selected' : ''}>${ox.name}</option>`
  ).join('');
}

function fuelOptions(oxidiser, selected) {
  return Object.keys(FUELS)
    .filter(fk => COMBINATIONS[`${oxidiser}/${fk}`])
    .map(fk => {
      const f = FUELS[fk];
      return `<option value="${fk}" ${fk === selected ? 'selected' : ''}>${f.name}</option>`;
    }).join('');
}

function liquidAdvanced(s, isSuffix) {
  const id = s.id + isSuffix;
  return `
    <div class="row">
      <div class="row-label"><span>Engine cycle</span></div>
      <select class="prop-select" data-id="${s.id}" data-param="engineType">
        ${engineTypeOptions(s.engineType)}
      </select>
    </div>
    <div class="row">
      <div class="row-label">
        <span>Thrust / engine</span>
        <span class="val" id="v-thrust-${s.id}">${s.thrustPerEngine} kN</span>
      </div>
      <input type="range" min="10" max="5000" step="10" value="${s.thrustPerEngine}"
        data-id="${s.id}" data-param="thrustPerEngine">
    </div>
    <div class="row">
      <div class="row-label">
        <span>Engines</span>
        <span class="val" id="v-engines-${s.id}">${s.engineCount === 1 ? '1 engine' : s.engineCount + ' engines'}</span>
      </div>
      <input type="range" min="1" max="40" step="1" value="${s.engineCount}"
        data-id="${s.id}" data-param="engineCount">
    </div>`;
}

export function renderCards() {
  const cont     = document.getElementById('stage-cards');
  const { stages } = state;

  cont.innerHTML = stages.map((s, i) => {
    const p    = resolveProp(s.oxidiser, s.fuel);
    const open = advancedOpen[s.id] || false;
    const isSolid = OXIDISERS[s.oxidiser]?.solid === true;
    const hasFuelChoice = !isSolid && !OXIDISERS[s.oxidiser]?.tri;

    return `
      <div class="stage-card" data-id="${s.id}">
        <div class="card-head">
          <div class="card-badge">
            <div class="dot" style="background:${p.color}"></div>
            <span class="card-title" style="color:${p.color}">Stage ${i + 1}</span>
          </div>
          <span class="card-sub">${p.name}</span>
          <button class="btn btn-remove-stage" data-remove="${s.id}"
            ${stages.length <= 1 ? 'disabled' : ''} title="Remove stage">×</button>
        </div>
        <div class="card-body">
          <select class="prop-select" data-id="${s.id}" data-param="oxidiser">
            ${oxidiserOptions(s.oxidiser)}
          </select>
          ${hasFuelChoice ? `<select class="prop-select" data-id="${s.id}" data-param="fuel">
            ${fuelOptions(s.oxidiser, s.fuel)}
          </select>` : ''}
          <div class="row">
            <div class="row-label">
              <span>Diameter</span>
              <span class="val" id="v-diam-${s.id}">${s.diameter.toFixed(1)} m</span>
            </div>
            <input type="range" min="0.5" max="40" step="0.1" value="${s.diameter}"
              data-id="${s.id}" data-param="diameter">
          </div>
          <div class="row">
            <div class="row-label">
              <span>Height</span>
              <span class="val" id="v-height-${s.id}">${s.height.toFixed(1)} m</span>
            </div>
            <input type="range" min="0.5" max="70" step="0.5" value="${s.height}"
              data-id="${s.id}" data-param="height">
          </div>
          <button class="btn-adv-toggle" data-adv-toggle="${s.id}">
            Advanced <span class="adv-chevron">${open ? '▴' : '▾'}</span>
          </button>
          <div class="card-adv" id="card-adv-${s.id}" ${open ? '' : 'style="display:none"'}>
            <div class="row">
              <div class="row-label">
                <span>Tank fill <span style="font-size:10px;color:#64748b">(propellant/vol)</span></span>
                <span class="val" id="v-fill-${s.id}">${Math.round(s.fill * 100)}%</span>
              </div>
              <input type="range" min="0.50" max="0.95" step="0.01" value="${s.fill}"
                data-id="${s.id}" data-param="fill">
            </div>
            <div class="row">
              <div class="row-label"><span>Tank material</span></div>
              <select class="prop-select" data-id="${s.id}" data-param="tankMaterial">
                ${materialOptions(s.tankMaterial)}
              </select>
            </div>
            ${!isSolid ? liquidAdvanced(s, '') : ''}
          </div>
        </div>
      </div>`;
  }).join('');

  document.getElementById('btn-add').disabled = stages.length >= 5;
}

export function renderBoosterSection() {
  const cont    = document.getElementById('booster-section');
  if (!cont) return;
  const bst      = state.boosters;
  const hasBoost = bst.count > 0;
  const p        = resolveProp(bst.oxidiser, bst.fuel);
  const isSolid  = OXIDISERS[bst.oxidiser]?.solid === true;
  const hasFuelChoice = !isSolid && !OXIDISERS[bst.oxidiser]?.tri;

  cont.innerHTML = `
    <div class="section-label">Side Boosters</div>
    <div class="row">
      <div class="row-label">
        <span>Number of Boosters</span>
        <span class="val" id="v-boost-count">${bst.count}</span>
      </div>
      <input type="range" id="s-boost-count" min="0" max="8" step="1" value="${bst.count}">
    </div>
    ${hasBoost ? `
    <div class="stage-card" style="margin-top:10px">
      <div class="card-head">
        <div class="card-badge">
          <div class="dot" style="background:${p.color}"></div>
          <span class="card-title" style="color:${p.color}">Boosters ×${bst.count}</span>
        </div>
        <span class="card-sub">${p.name}</span>
      </div>
      <div class="card-body">
        <select class="prop-select" id="s-boost-oxidiser">
          ${oxidiserOptions(bst.oxidiser)}
        </select>
        ${hasFuelChoice ? `<select class="prop-select" id="s-boost-fuel">
          ${fuelOptions(bst.oxidiser, bst.fuel)}
        </select>` : ''}
        <div class="row">
          <div class="row-label">
            <span>Diameter</span>
            <span class="val" id="v-boost-diam">${bst.diameter.toFixed(1)} m</span>
          </div>
          <input type="range" min="0.5" max="10" step="0.1" value="${bst.diameter}" id="s-boost-diam">
        </div>
        <div class="row">
          <div class="row-label">
            <span>Height</span>
            <span class="val" id="v-boost-height">${bst.height.toFixed(1)} m</span>
          </div>
          <input type="range" min="0.5" max="70" step="0.5" value="${bst.height}" id="s-boost-height">
        </div>
        <button class="btn-adv-toggle" id="btn-adv-toggle-boost">
          Advanced <span class="adv-chevron">${advancedOpen['booster'] ? '▴' : '▾'}</span>
        </button>
        <div class="card-adv" id="card-adv-boost" ${advancedOpen['booster'] ? '' : 'style="display:none"'}>
          <div class="row">
            <div class="row-label">
              <span>Tank fill <span style="font-size:10px;color:#64748b">(propellant/vol)</span></span>
              <span class="val" id="v-boost-fill">${Math.round(bst.fill * 100)}%</span>
            </div>
            <input type="range" min="0.50" max="0.95" step="0.01" value="${bst.fill}" id="s-boost-fill">
          </div>
          <div class="row">
            <div class="row-label"><span>Tank material</span></div>
            <select class="prop-select" id="s-boost-material">
              ${materialOptions(bst.tankMaterial)}
            </select>
          </div>
          ${!isSolid ? `
          <div class="row">
            <div class="row-label"><span>Engine cycle</span></div>
            <select class="prop-select" id="s-boost-enginetype">
              ${engineTypeOptions(bst.engineType)}
            </select>
          </div>
          <div class="row">
            <div class="row-label">
              <span>Thrust / engine</span>
              <span class="val" id="v-boost-thrust">${bst.thrustPerEngine} kN</span>
            </div>
            <input type="range" min="10" max="5000" step="10" value="${bst.thrustPerEngine}" id="s-boost-thrust">
          </div>
          <div class="row">
            <div class="row-label">
              <span>Engines / booster</span>
              <span class="val" id="v-boost-engines">${bst.engineCount === 1 ? '1 engine' : bst.engineCount + ' engines'}</span>
            </div>
            <input type="range" min="1" max="40" step="1" value="${bst.engineCount}" id="s-boost-engines">
          </div>` : ''}
        </div>
      </div>
    </div>` : ''}
  `;

  document.getElementById('s-boost-count').addEventListener('input', e => {
    state.boosters.count = +e.target.value;
    document.getElementById('v-boost-count').textContent = e.target.value;
    renderBoosterSection();
    update();
  });

  if (!hasBoost) return;

  document.getElementById('s-boost-diam').addEventListener('input', e => {
    state.boosters.diameter = +e.target.value;
    document.getElementById('v-boost-diam').textContent = (+e.target.value).toFixed(1) + ' m';
    update();
  });
  document.getElementById('s-boost-height').addEventListener('input', e => {
    state.boosters.height = +e.target.value;
    document.getElementById('v-boost-height').textContent = (+e.target.value).toFixed(1) + ' m';
    update();
  });
  document.getElementById('s-boost-fill').addEventListener('input', e => {
    state.boosters.fill = +e.target.value;
    document.getElementById('v-boost-fill').textContent = Math.round(+e.target.value * 100) + '%';
    update();
  });
  document.getElementById('s-boost-oxidiser').addEventListener('change', e => {
    const newOx = e.target.value;
    state.boosters.oxidiser = newOx;
    if (OXIDISERS[newOx]?.solid) {
      state.boosters.fuel = null;
    } else if (!COMBINATIONS[`${newOx}/${state.boosters.fuel}`]) {
      state.boosters.fuel = Object.keys(FUELS).find(fk => COMBINATIONS[`${newOx}/${fk}`]) || null;
    }
    renderBoosterSection();
    update();
  });
  const boostFuelEl = document.getElementById('s-boost-fuel');
  if (boostFuelEl) {
    boostFuelEl.addEventListener('change', e => {
      state.boosters.fuel = e.target.value;
      renderBoosterSection();
      update();
    });
  }
  document.getElementById('s-boost-material').addEventListener('change', e => {
    state.boosters.tankMaterial = e.target.value;
    update();
  });

  document.getElementById('btn-adv-toggle-boost').addEventListener('click', () => {
    advancedOpen['booster'] = !advancedOpen['booster'];
    document.getElementById('card-adv-boost').style.display = advancedOpen['booster'] ? '' : 'none';
    document.querySelector('#btn-adv-toggle-boost .adv-chevron').textContent = advancedOpen['booster'] ? '▴' : '▾';
  });

  if (isSolid) return;

  document.getElementById('s-boost-enginetype').addEventListener('change', e => {
    state.boosters.engineType = e.target.value;
    update();
  });
  document.getElementById('s-boost-thrust').addEventListener('input', e => {
    state.boosters.thrustPerEngine = +e.target.value;
    document.getElementById('v-boost-thrust').textContent = e.target.value + ' kN';
    update();
  });
  document.getElementById('s-boost-engines').addEventListener('input', e => {
    state.boosters.engineCount = +e.target.value;
    document.getElementById('v-boost-engines').textContent =
      e.target.value === '1' ? '1 engine' : e.target.value + ' engines';
    update();
  });
}
