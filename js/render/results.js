import { MISSIONS, G0 } from '../../config/propellants.js';
import { calcMaxPayload } from '../physics.js';
import { ASCENT } from '../trajectory.js';
import { calcCost } from '../cost.js';
import { fmass, fdv, fthrust, fcost } from '../format.js';

export function renderResults(phys) {
  const { stages, totalDv, totalWet, traj, dvRequiredLeo } = phys;

  // ΔV ceiling (at zero payload)
  const tvEl  = document.getElementById('total-dv');
  const dvKms = totalDv / 1000;
  tvEl.textContent = dvKms.toFixed(2);
  const viable = totalDv >= dvRequiredLeo && !traj.overQ && !traj.cannotLift;
  tvEl.style.color = viable ? '#10b981' : '#f59e0b';

  // Mission payload capacity cards
  document.getElementById('mission-bars').innerHTML =
    `<div class="mp-grid">${MISSIONS.map(m => {
      const r  = calcMaxPayload(m.dvBeyondLeo);
      const ok = r.payload !== null && r.payload >= 1 && !r.overQ;
      const color = ok ? m.color : 'var(--muted)';
      const note  = r.overQ      ? `max-Q ${(r.maxQ / 1000).toFixed(0)} kPa`
                  : r.cannotLift ? 'T/W &lt; 1'
                  : `≥ ${((dvRequiredLeo + m.dvBeyondLeo) / 1000).toFixed(1)} km/s`;
      return `<div class="mp-card" style="border-color:${ok ? m.color + '50' : 'var(--border)'}">
        <div class="mp-name" style="color:${color}">${m.name}</div>
        <div class="mp-req">${note}</div>
        <div class="mp-mass" style="color:${color}">${ok ? fmass(r.payload) : '—'}</div>
      </div>`;
    }).join('')}</div>`;

  // Ascent loss budget
  const lossEl = document.getElementById('loss-budget');
  if (lossEl) {
    const warn = traj.cannotLift
      ? '<div class="loss-warn">Thrust below weight at liftoff — vehicle cannot leave the pad.</div>'
      : traj.overQ
      ? `<div class="loss-warn">Max-Q ${(traj.maxQ / 1000).toFixed(0)} kPa exceeds the
         ${(ASCENT.maxQLimit / 1000).toFixed(0)} kPa structural limit — fit fewer
         engines, or smaller ones.</div>`
      : '';
    lossEl.innerHTML = `
      <div class="stat-grid">
        <div class="stat-item"><div class="sl">Liftoff T/W</div><div class="sv">${traj.liftoffTwr.toFixed(2)}</div></div>
        <div class="stat-item"><div class="sl">Peak accel</div> <div class="sv">${traj.peakAccel.toFixed(1)} g</div></div>
        <div class="stat-item"><div class="sl">Max-Q</div>      <div class="sv">${(traj.maxQ / 1000).toFixed(0)} kPa</div></div>
        <div class="stat-item"><div class="sl">Gravity loss</div><div class="sv">${fdv(traj.dvGrav)} km/s</div></div>
        <div class="stat-item"><div class="sl">Drag loss</div>  <div class="sv">${Math.round(traj.dvDrag)} m/s</div></div>
        <div class="stat-item"><div class="sl">LEO required</div><div class="sv">${fdv(dvRequiredLeo)} km/s</div></div>
      </div>${warn}`;
  }

  // Stage breakdown
  const stageCards = [...stages].reverse().map((s, ri) => {
    const i        = stages.length - 1 - ri;
    const c        = s.p.color;
    return `<div class="stage-result">
      <div class="sr-head">
        <div class="dot" style="background:${c}"></div>
        <span class="sr-name" style="color:${c}">Stage ${i + 1} · ${s.p.name}</span>
        <span class="sr-dv"   style="color:${c}">${fdv(s.dv)} km/s</span>
      </div>
      <div class="stat-grid">
        <div class="stat-item"><div class="sl">Wet Mass</div>   <div class="sv">${fmass(s.wetMass)}</div></div>
        <div class="stat-item"><div class="sl">Dry Mass</div>   <div class="sv">${fmass(s.dryMass)}</div></div>
        <div class="stat-item"><div class="sl">Propellant</div> <div class="sv">${fmass(s.propMass)}</div></div>
        <div class="stat-item"><div class="sl">Mass Ratio</div> <div class="sv">${s.mr.toFixed(2)}</div></div>
        <div class="stat-item"><div class="sl">Isp (eff)</div><div class="sv">${Math.round(s.isp)} s</div></div>
        <div class="stat-item"><div class="sl">Thrust</div>    <div class="sv">${fthrust(s.thrust)}</div></div>
        <div class="stat-item"><div class="sl">Burn time</div> <div class="sv">${Math.round(s.burnTime)} s</div></div>
        <div class="stat-item"><div class="sl">T/W at ignition</div><div class="sv">${(s.thrust / (s.m0 * G0)).toFixed(2)}</div></div>
        <div class="stat-item"><div class="sl">σ total</div>  <div class="sv">${s.sigma.toFixed(3)}</div></div>
        ${s.sigmaBreakdown.engineCount !== null
          ? `<div class="stat-item"><div class="sl">Engines</div>   <div class="sv">${s.sigmaBreakdown.engineCount} × ${s.thrustPerEngine} kN</div></div>`
          : ''}
      </div>
      <div class="sigma-breakdown sigma-breakdown-result">
        <div class="sb-row"><span>Tank</span>   <span class="sv">${fmass(s.sigmaBreakdown.tank   * s.propMass)}</span></div>
        <div class="sb-row"><span>Engines</span><span class="sv">${fmass(s.sigmaBreakdown.engine * s.propMass)}</span></div>
        <div class="sb-row"><span>Other</span>  <span class="sv">${fmass(s.sigmaBreakdown.other  * s.propMass)}</span></div>
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
        <span class="sr-name" style="color:${c}">Boosters ×${br.count} · ${br.p.name}</span>
        <span class="sr-dv"   style="color:${c}">${fdv(br.dv)} km/s</span>
      </div>
      <div class="stat-grid">
        <div class="stat-item"><div class="sl">Wet (per unit)</div>  <div class="sv">${fmass(br.wetMass)}</div></div>
        <div class="stat-item"><div class="sl">Dry (per unit)</div>  <div class="sv">${fmass(br.dryMass)}</div></div>
        <div class="stat-item"><div class="sl">Prop. (per unit)</div><div class="sv">${fmass(br.propMass)}</div></div>
        <div class="stat-item"><div class="sl">Mass Ratio</div>      <div class="sv">${br.mr.toFixed(2)}</div></div>
        <div class="stat-item"><div class="sl">Isp (eff)</div>       <div class="sv">${Math.round(br.isp)} s</div></div>
        <div class="stat-item"><div class="sl">Thrust (each)</div>   <div class="sv">${fthrust(br.thrust)}</div></div>
        <div class="stat-item"><div class="sl">Burn time</div>       <div class="sv">${Math.round(br.burnTime)} s</div></div>
        <div class="stat-item"><div class="sl">σ total</div>         <div class="sv">${br.sigma.toFixed(3)}</div></div>
        ${br.sigmaBreakdown.engineCount !== null
          ? `<div class="stat-item"><div class="sl">Engines (each)</div><div class="sv">${br.sigmaBreakdown.engineCount} × ${br.thrustPerEngine} kN</div></div>`
          : ''}
      </div>
      <div class="sigma-breakdown sigma-breakdown-result">
        <div class="sb-row"><span>Tank</span>   <span class="sv">${fmass(br.sigmaBreakdown.tank   * br.propMass)}</span></div>
        <div class="sb-row"><span>Engines</span><span class="sv">${fmass(br.sigmaBreakdown.engine * br.propMass)}</span></div>
        <div class="sb-row"><span>Other</span>  <span class="sv">${fmass(br.sigmaBreakdown.other  * br.propMass)}</span></div>
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

  // Cost estimate
  const cost    = calcCost(phys);
  const leo     = calcMaxPayload(MISSIONS[0].dvBeyondLeo);
  const costPerKg = (leo.payload !== null && leo.payload >= 1 && !leo.overQ)
    ? cost.total / leo.payload : null;

  const pct = v => `${Math.round(v / cost.total * 100)}%`;
  document.getElementById('cost-section').innerHTML = `
    <div class="cost-totals">
      <div class="cost-total-item">
        <div class="total-label">Vehicle Cost</div>
        <div class="total-val" style="font-size:18px">${fcost(cost.total)}</div>
      </div>
      <div class="cost-total-item">
        <div class="total-label">Cost / kg to LEO</div>
        <div class="total-val" style="font-size:18px">${costPerKg !== null ? fcost(costPerKg) + '/kg' : '—'}</div>
      </div>
    </div>
    <div class="cost-breakdown">
      <div class="cb-row">
        <span class="cb-label">Propellant</span>
        <div class="cb-bar-wrap"><div class="cb-bar" style="width:${pct(cost.propTotal)};background:#10b981"></div></div>
        <span class="cb-val">${fcost(cost.propTotal)}</span>
      </div>
      <div class="cb-row">
        <span class="cb-label">Tanks</span>
        <div class="cb-bar-wrap"><div class="cb-bar" style="width:${pct(cost.tankTotal)};background:#0ea5e9"></div></div>
        <span class="cb-val">${fcost(cost.tankTotal)}</span>
      </div>
      <div class="cb-row">
        <span class="cb-label">Engines</span>
        <div class="cb-bar-wrap"><div class="cb-bar" style="width:${pct(cost.engineTotal)};background:#a78bfa"></div></div>
        <span class="cb-val">${fcost(cost.engineTotal)}</span>
      </div>
      <div class="cb-row">
        <span class="cb-label">Other</span>
        <div class="cb-bar-wrap"><div class="cb-bar" style="width:${pct(cost.otherTotal)};background:#64748b"></div></div>
        <span class="cb-val">${fcost(cost.otherTotal)}</span>
      </div>
    </div>
  `;
}
