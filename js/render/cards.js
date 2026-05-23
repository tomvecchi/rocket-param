import { PROPS } from '../../config/propellants.js';
import { TANK_MATERIALS } from '../../config/materials.js';
import { state, advancedOpen } from '../state.js';
import { update } from '../update.js';

function materialOptions(selected) {
  return Object.entries(TANK_MATERIALS).map(([key, m]) =>
    `<option value="${key}" ${key === selected ? 'selected' : ''}>${m.name}</option>`
  ).join('');
}


export function renderCards() {
  const cont     = document.getElementById('stage-cards');
  const { stages } = state;

  cont.innerHTML = stages.map((s, i) => {
    const p       = PROPS[s.propellant];
    const open    = advancedOpen[s.id] || false;
    const isSolid = p.solid;

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
          <select class="prop-select" data-id="${s.id}" data-param="prop">
            ${Object.entries(PROPS).map(([key, pp]) =>
              `<option value="${key}" ${key === s.propellant ? 'selected' : ''}>${pp.name}</option>`
            ).join('')}
          </select>
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
            <div class="row">
              <div class="row-label">
                <span>Tank pressure</span>
                <span class="val" id="v-pressure-${s.id}">${s.tankPressure} bar</span>
              </div>
              <input type="range" min="1" max="${isSolid ? 100 : 10}" step="${isSolid ? 5 : 0.5}"
                value="${s.tankPressure}" data-id="${s.id}" data-param="tankPressure">
            </div>
            ${!isSolid ? `
            <div class="row">
              <div class="row-label">
                <span>Burn time</span>
                <span class="val" id="v-burntime-${s.id}">${s.burnTime} s</span>
              </div>
              <input type="range" min="30" max="600" step="10" value="${s.burnTime}"
                data-id="${s.id}" data-param="burnTime">
            </div>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');

  document.getElementById('btn-add').disabled = stages.length >= 5;
}

export function renderBoosterSection() {
  const cont    = document.getElementById('booster-section');
  if (!cont) return;
  const bst     = state.boosters;
  const hasBoost = bst.count > 0;
  const p       = PROPS[bst.propellant];
  const isSolid = p.solid;

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
        <select class="prop-select" id="s-boost-prop">
          ${Object.entries(PROPS).map(([key, pp]) =>
            `<option value="${key}" ${key === bst.propellant ? 'selected' : ''}>${pp.name}</option>`
          ).join('')}
        </select>
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
          <div class="row">
            <div class="row-label">
              <span>Tank pressure</span>
              <span class="val" id="v-boost-pressure">${bst.tankPressure} bar</span>
            </div>
            <input type="range" min="1" max="${isSolid ? 100 : 10}" step="${isSolid ? 5 : 0.5}"
              value="${bst.tankPressure}" id="s-boost-pressure">
          </div>
          ${!isSolid ? `
          <div class="row">
            <div class="row-label">
              <span>Burn time</span>
              <span class="val" id="v-boost-burntime">${bst.burnTime} s</span>
            </div>
            <input type="range" min="30" max="600" step="10" value="${bst.burnTime}" id="s-boost-burntime">
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
  document.getElementById('s-boost-pressure').addEventListener('input', e => {
    state.boosters.tankPressure = +e.target.value;
    document.getElementById('v-boost-pressure').textContent = e.target.value + ' bar';
    update();
  });
  const boostBurntime = document.getElementById('s-boost-burntime');
  if (boostBurntime) {
    boostBurntime.addEventListener('input', e => {
      state.boosters.burnTime = +e.target.value;
      document.getElementById('v-boost-burntime').textContent = e.target.value + ' s';
      update();
    });
  }
  document.getElementById('btn-adv-toggle-boost').addEventListener('click', () => {
    advancedOpen['booster'] = !advancedOpen['booster'];
    document.getElementById('card-adv-boost').style.display = advancedOpen['booster'] ? '' : 'none';
    document.querySelector('#btn-adv-toggle-boost .adv-chevron').textContent = advancedOpen['booster'] ? '▴' : '▾';
  });
  document.getElementById('s-boost-prop').addEventListener('change', e => {
    state.boosters.propellant = e.target.value;
    state.boosters.tankPressure = PROPS[e.target.value].defaultPressure;
    renderBoosterSection();
    update();
  });
  document.getElementById('s-boost-material').addEventListener('change', e => {
    state.boosters.tankMaterial = e.target.value;
    update();
  });
}
