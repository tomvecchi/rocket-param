import { MISSIONS } from '../../config/propellants.js';
import { calcMaxPayload } from '../physics.js';
import { fmass, fdv, fthrust } from '../format.js';

export function renderResults(phys) {
  const { stages, totalDv, totalWet } = phys;

  // ΔV ceiling (at zero payload)
  const tvEl  = document.getElementById('total-dv');
  const dvKms = totalDv / 1000;
  tvEl.textContent = dvKms.toFixed(2);
  tvEl.style.color = dvKms >= MISSIONS[0].dv / 1000 ? '#10b981' : '#f59e0b';

  // Mission payload capacity cards
  document.getElementById('mission-bars').innerHTML =
    `<div class="mp-grid">${MISSIONS.map(m => {
      const p  = calcMaxPayload(m.dv);
      const ok = p !== null && p >= 1;
      const color = ok ? m.color : 'var(--muted)';
      return `<div class="mp-card" style="border-color:${ok ? m.color + '50' : 'var(--border)'}">
        <div class="mp-name" style="color:${color}">${m.name}</div>
        <div class="mp-req">≥ ${(m.dv / 1000).toFixed(1)} km/s</div>
        <div class="mp-mass" style="color:${color}">${ok ? fmass(p) : '—'}</div>
      </div>`;
    }).join('')}</div>`;

  // Stage breakdown
  const stageCards = [...stages].reverse().map((s, ri) => {
    const i        = stages.length - 1 - ri;
    const c        = s.p.color;
    const ispLabel = i === 0 ? 'Isp (SL)' : 'Isp (vac)';
    return `<div class="stage-result">
      <div class="sr-head">
        <div class="dot" style="background:${c}"></div>
        <span class="sr-name" style="color:${c}">Stage ${i + 1} · ${s.propellant}</span>
        <span class="sr-dv"   style="color:${c}">${fdv(s.dv)} km/s</span>
      </div>
      <div class="stat-grid">
        <div class="stat-item"><div class="sl">Wet Mass</div>   <div class="sv">${fmass(s.wetMass)}</div></div>
        <div class="stat-item"><div class="sl">Dry Mass</div>   <div class="sv">${fmass(s.dryMass)}</div></div>
        <div class="stat-item"><div class="sl">Propellant</div> <div class="sv">${fmass(s.propMass)}</div></div>
        <div class="stat-item"><div class="sl">Mass Ratio</div> <div class="sv">${s.mr.toFixed(2)}</div></div>
        <div class="stat-item"><div class="sl">${ispLabel}</div><div class="sv">${s.isp} s</div></div>
        <div class="stat-item"><div class="sl">Thrust</div>    <div class="sv">${fthrust(s.thrust)}</div></div>
        <div class="stat-item"><div class="sl">σ total</div>
                               <div class="sv">${s.sigma.toFixed(3)}</div></div>
      </div>
      <div class="sigma-breakdown sigma-breakdown-result">
        <div class="sb-row"><span>σ tank</span><span class="sv">${s.sigmaBreakdown.tank.toFixed(4)}</span></div>
        <div class="sb-row"><span>σ engine</span><span class="sv">${s.sigmaBreakdown.engine.toFixed(4)}</span></div>
        <div class="sb-row"><span>σ other</span><span class="sv">${s.sigmaBreakdown.other.toFixed(4)}</span></div>
      </div>
    </div>`;
  }).join('');

  let boosterCard = '';
  if (phys.booster) {
    const br = phys.booster;
    const c  = br.p.color;
    boosterCard = `<div class="stage-result">
      <div class="sr-head">
        <div class="dot" style="background:${c}"></div>
        <span class="sr-name" style="color:${c}">Boosters ×${br.count} · ${br.propellant}</span>
        <span class="sr-dv"   style="color:${c}">${fdv(br.dv)} km/s</span>
      </div>
      <div class="stat-grid">
        <div class="stat-item"><div class="sl">Wet (per unit)</div>  <div class="sv">${fmass(br.wetMass)}</div></div>
        <div class="stat-item"><div class="sl">Dry (per unit)</div>  <div class="sv">${fmass(br.dryMass)}</div></div>
        <div class="stat-item"><div class="sl">Prop. (per unit)</div><div class="sv">${fmass(br.propMass)}</div></div>
        <div class="stat-item"><div class="sl">Mass Ratio</div>      <div class="sv">${br.mr.toFixed(2)}</div></div>
        <div class="stat-item"><div class="sl">Isp (SL)</div>        <div class="sv">${br.isp} s</div></div>
        <div class="stat-item"><div class="sl">Thrust (each)</div>   <div class="sv">${fthrust(br.thrust)}</div></div>
        <div class="stat-item"><div class="sl">σ total</div>
                               <div class="sv">${br.sigma.toFixed(3)}</div></div>
      </div>
      <div class="sigma-breakdown sigma-breakdown-result">
        <div class="sb-row"><span>σ tank</span><span class="sv">${br.sigmaBreakdown.tank.toFixed(4)}</span></div>
        <div class="sb-row"><span>σ engine</span><span class="sv">${br.sigmaBreakdown.engine.toFixed(4)}</span></div>
        <div class="sb-row"><span>σ other</span><span class="sv">${br.sigmaBreakdown.other.toFixed(4)}</span></div>
      </div>
    </div>`;
  }

  document.getElementById('stage-results').innerHTML = stageCards + boosterCard;

  // Vehicle summary
  const totalPropMass = stages.reduce((a, s) => a + s.propMass, 0)
    + (phys.booster ? phys.booster.count * phys.booster.propMass : 0);
  const totalDryMass = stages.reduce((a, s) => a + s.dryMass, 0)
    + (phys.booster ? phys.booster.count * phys.booster.dryMass : 0);

  document.getElementById('vehicle-summary').innerHTML = `
    <div class="sum-item"><div class="sl">Rocket Mass</div><div class="sv">${fmass(totalWet)}</div></div>
    <div class="sum-item"><div class="sl">Propellant</div> <div class="sv">${fmass(totalPropMass)}</div></div>
    <div class="sum-item"><div class="sl">Structure</div>  <div class="sv">${fmass(totalDryMass)}</div></div>
    <div class="sum-item"><div class="sl">Stages</div>     <div class="sv">${stages.length}</div></div>
  `;
}
