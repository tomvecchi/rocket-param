import { state } from '../state.js';

// Smallest ring radius that leaves adjacent engines exactly one unit apart.
const ringRadius = n => (n < 2 ? 0 : 1 / (2 * Math.sin(Math.PI / n)));

// How many engines sit in each ring, index 0 being the centre position.
// A centre engine only earns its place from 5 up: below that a plain symmetric
// ring is what real twin, triple and quad layouts actually look like.
function ringPopulations(count) {
  if (count <= 1) return [count];
  const centre    = count >= 5 ? 1 : 0;
  const remaining = count - centre;

  // Ring k seats up to 8k, so the inner ring takes the eight engines that
  // surround a centre engine on Falcon 9, Electron and other nine-engine stages.
  let rings = 0, capacity = 0;
  while (capacity < remaining) capacity += 8 * ++rings;

  // Spread across the rings in proportion to their capacity rather than filling
  // each one before starting the next, so the outermost ring never ends up
  // holding a single lonely engine.
  const weight = rings * (rings + 1) / 2;
  const pop = [centre];
  let placed = 0;
  for (let k = 1; k <= rings; k++) {
    const n = k === rings ? remaining - placed
                          : Math.max(1, Math.round(remaining * k / weight));
    pop.push(n);
    placed += n;
  }
  return pop;
}

// Returns [{x, y, ring}] in normalised coordinates where the minimum spacing
// between any two engines is exactly 1, whichever ring they belong to.
function computeEnginePositions(count) {
  const pop       = ringPopulations(count);
  const positions = pop[0] > 0 ? [{ x: 0, y: 0, ring: 0 }] : [];

  let prev = pop[0] > 0 ? 1 : 0; // clearance owed to whatever is already inside
  for (let ring = 1; ring < pop.length; ring++) {
    const n = pop[ring];
    const r = Math.max(prev, ringRadius(n));
    // Odd counts point one engine at the top; even counts straddle the axis, so
    // a pair reads as side-by-side rather than stacked front-to-back.
    const a0 = -Math.PI / 2 + (n % 2 === 0 ? Math.PI / n : 0);
    for (let k = 0; k < n; k++) {
      const a = a0 + (k / n) * 2 * Math.PI;
      positions.push({ x: r * Math.cos(a), y: r * Math.sin(a), ring });
    }
    prev = r + 1;
  }
  return positions;
}

// Draws the engine cluster as it actually appears side-on: an orthographic
// projection of the top-down layout, so each bell sits at the x it really
// occupies and pairs at equal depth line up behind one another. Painted back to
// front, letting nearer bells occlude the ones behind exactly as they would.
function sideViewEngines(engineCount, thrustPerEngine, geom) {
  const { cx, top, halfWidth, height, strokeWidth } = geom;
  const positions = engineCount > 0
    ? computeEnginePositions(engineCount)
    : [{ x: 0, y: 0 }];              // solid motor, or count not yet resolved

  const maxR   = positions.reduce((m, p) => Math.max(m, Math.hypot(p.x, p.y)), 0);
  const scale  = (halfWidth * 0.85) / (maxR + 0.52);
  // Same bell sizing as the top-down inset, so the two views agree.
  const factor = Math.pow(Math.max(10, thrustPerEngine || 800) / 800, 0.32);
  const bellR  = Math.min(scale * 0.44, Math.max(2.2, scale * 0.38 * factor));
  const throat = bellR * 0.32;
  const exitY  = top + height;

  let out = '';
  for (const p of [...positions].sort((a, b) => a.y - b.y)) {
    const bx = cx + p.x * scale;
    out += `<polygon points="${bx - throat},${top} ${bx + throat},${top}
      ${bx + bellR},${exitY} ${bx - bellR},${exitY}"
      fill="#111827" stroke="#334155" stroke-width="${strokeWidth}"/>`;
    out += `<ellipse cx="${bx}" cy="${exitY}" rx="${bellR}" ry="${bellR * 0.24}"
      fill="none" stroke="#4b6080" stroke-width="${strokeWidth * 0.83}"/>`;
  }
  return out;
}

// Renders a right-side column of top-down cross-section insets, one per stage + booster.
function renderTopViews(W, H, phys) {
  const { stages } = phys;
  const hasBst  = phys.booster !== null;
  const numViews = stages.length + (hasBst ? 1 : 0);
  if (numViews === 0) return '';

  const gap    = 6;
  const maxSz  = 110;
  const minSz  = 56;
  const availH = H * 0.92;
  const sz     = Math.max(minSz, Math.min(maxSz,
                   Math.floor((availH - gap * (numViews - 1)) / numViews)));
  const totalH = numViews * sz + (numViews - 1) * gap;
  const ix     = W - sz - 10;
  const startY = (H - totalH) / 2;

  // Build view descriptors: top stage first, then lower stages, then booster.
  const views = [
    ...[...stages].reverse().map((s, vi) => ({
      s,
      label:  `S${stages.length - vi}`,
      isVac:  stages.length - 1 - vi > 0,  // vacuum engines for upper stages
    })),
    ...(hasBst ? [{ s: phys.booster, label: `B×${phys.booster.count}`, isVac: false }] : []),
  ];

  let out = '';
  const lfsBase  = Math.max(6, sz * 0.092);
  const labelH   = lfsBase + 5;

  views.forEach(({ s, label, isVac }, vi) => {
    const iy   = startY + vi * (sz + gap);
    const icx  = ix + sz / 2;
    const icy  = iy + labelH + (sz - labelH) / 2;
    const tankR = (sz - labelH) / 2 - 4;
    const c    = s.p.color;

    // Background
    out += `<rect x="${ix}" y="${iy}" width="${sz}" height="${sz}"
      fill="#07090f" fill-opacity="0.93" stroke="#1e293b" stroke-width="1" rx="4"/>`;

    // Tank outline
    out += `<circle cx="${icx}" cy="${icy}" r="${tankR}"
      fill="${c}12" stroke="${c}" stroke-width="1.4"/>`;

    // Stage label
    out += `<text x="${icx}" y="${iy + lfsBase + 1}" text-anchor="middle"
      fill="${c}bb" font-size="${lfsBase}" font-family="monospace" font-weight="700">${label}</text>`;

    const engCount = s.sigmaBreakdown?.engineCount;

    if (s.p.solid) {
      // Solid grain: concentric bands + central bore
      for (let j = 1; j <= 3; j++) {
        const br = tankR * (0.30 + j * 0.19);
        out += `<circle cx="${icx}" cy="${icy}" r="${br}"
          fill="none" stroke="${c}22" stroke-width="0.8"/>`;
      }
      out += `<circle cx="${icx}" cy="${icy}" r="${tankR * 0.25}"
        fill="#0d1117" stroke="${c}55" stroke-width="0.8"/>`;

    } else if (engCount && engCount > 0) {
      const positions = computeEnginePositions(engCount);
      const maxR      = positions.reduce((m, p) => Math.max(m, Math.hypot(p.x, p.y)), 0);

      // Scale so outermost ring edge fits within tank (leave wall gap).
      const posScale  = (tankR * 0.84) / (maxR + 0.52);

      // Engine radius: proportional to sqrt(thrust), normalised to 800 kN reference.
      const thrustFactor = Math.pow(Math.max(10, s.thrustPerEngine) / 800, 0.32);
      const engineR = Math.min(
        posScale * 0.44,                     // cap at 44% of ring spacing (no overlap)
        Math.max(2.2, posScale * 0.38 * thrustFactor)
      );

      for (const p of positions) {
        const ex = icx + p.x * posScale;
        const ey = icy + p.y * posScale;

        if (isVac) {
          // Vacuum: dashed outer ring representing expanded nozzle bell
          out += `<circle cx="${ex}" cy="${ey}" r="${engineR * 1.55}"
            fill="none" stroke="${c}45" stroke-width="0.7" stroke-dasharray="2,1.5"/>`;
        }
        // Nozzle throat circle
        out += `<circle cx="${ex}" cy="${ey}" r="${engineR}"
          fill="${c}22" stroke="${c}" stroke-width="0.75"/>`;
        // Chamber centre dot
        out += `<circle cx="${ex}" cy="${ey}" r="${engineR * 0.38}"
          fill="${c}95"/>`;
      }

      // Engine count badge (bottom-right)
      const bfs = Math.max(6, sz * 0.085);
      out += `<text x="${ix + sz - 4}" y="${iy + sz - 3}"
        text-anchor="end" dominant-baseline="auto"
        fill="${c}65" font-size="${bfs}" font-family="monospace">×${engCount}</text>`;

    } else {
      // Liquid but engineCount not yet calculated (edge case) — show crosshair
      out += `<line x1="${icx - tankR*0.4}" y1="${icy}" x2="${icx + tankR*0.4}" y2="${icy}"
        stroke="${c}35" stroke-width="0.8"/>`;
      out += `<line x1="${icx}" y1="${icy - tankR*0.4}" x2="${icx}" y2="${icy + tankR*0.4}"
        stroke="${c}35" stroke-width="0.8"/>`;
    }
  });

  return out;
}

export function initStars() {
  const canvas = document.getElementById('stars');
  const panel  = canvas.parentElement;
  canvas.width  = panel.clientWidth;
  canvas.height = panel.clientHeight;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 220; i++) {
    const x  = Math.random() * canvas.width;
    const y  = Math.random() * canvas.height;
    const r  = Math.random() * 1.3;
    const op = Math.random() * 0.7 + 0.15;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${op})`;
    ctx.fill();
  }
}

export function renderSVG(phys) {
  const el   = document.getElementById('rocket-svg');
  const cont = el.parentElement;
  const W    = cont.clientWidth  || 500;
  const H    = cont.clientHeight || 700;
  el.setAttribute('width',  W);
  el.setAttribute('height', H);

  const stages = phys.stages;   // [0]=bottom ... [N-1]=top
  const N = stages.length;
  if (!N) { el.innerHTML = ''; return; }

  const cx = W / 2;

  const topD     = stages[N-1].diameter;
  const nosePhys = topD * 2.2;

  const adapters = [];
  for (let i = 0; i < N - 1; i++) {
    const diff = Math.abs(stages[i+1].diameter - stages[i].diameter);
    adapters.push(diff > 0.05 ? Math.max(0.4, diff * 0.35) : 0.2);
  }

  const stagePhysH = stages.reduce((a, s) => a + s.height, 0);
  const adapterH   = adapters.reduce((a, v) => a + v, 0);
  const totalEngH  = stages.reduce((a, s) => a + s.diameter * 0.40, 0);
  const totalPhysH = nosePhys + stagePhysH + adapterH + totalEngH;
  const maxD       = Math.max(...stages.map(s => s.diameter));

  const bst = state.boosters;
  const boostVisCount = bst.count > 0 ? Math.min(bst.count, 2) : 0;
  const gapPhys = 0.4;
  const totalSpanPhys = boostVisCount > 0
    ? stages[0].diameter + 2 * (gapPhys + bst.diameter)
    : maxD;
  const hFrac  = boostVisCount === 0 ? 0.52 : 0.80;
  const scaleW = (W * hFrac) / Math.max(maxD, totalSpanPhys);
  const scaleH = (H * 0.87) / totalPhysH;
  const scale  = Math.min(scaleW, scaleH);

  const marginY = (H - totalPhysH * scale) / 2;
  let y = marginY;

  let html = '<defs>';

  stages.forEach((s, i) => {
    const c = s.p.color;
    html += `<linearGradient id="g${i}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="${c}" stop-opacity=".10"/>
      <stop offset="35%"  stop-color="${c}" stop-opacity=".30"/>
      <stop offset="65%"  stop-color="${c}" stop-opacity=".30"/>
      <stop offset="100%" stop-color="${c}" stop-opacity=".10"/>
    </linearGradient>`;
    if (!s.p.solid) {
      s.p.components.forEach((comp, j) => {
        html += `
      <linearGradient id="gc${i}_${j}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stop-color="${comp.color}" stop-opacity=".07"/>
        <stop offset="40%"  stop-color="${comp.color}" stop-opacity=".30"/>
        <stop offset="60%"  stop-color="${comp.color}" stop-opacity=".30"/>
        <stop offset="100%" stop-color="${comp.color}" stop-opacity=".07"/>
      </linearGradient>`;
      });
    }
  });

  html += `<linearGradient id="gn" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%"   stop-color="#94a3b8" stop-opacity=".1"/>
    <stop offset="50%"  stop-color="#94a3b8" stop-opacity=".45"/>
    <stop offset="100%" stop-color="#94a3b8" stop-opacity=".1"/>
  </linearGradient>`;

  if (boostVisCount > 0) {
    const bp = phys.booster.p;
    const bc = bp.color;
    html += `<linearGradient id="gboost" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="${bc}" stop-opacity=".08"/>
      <stop offset="40%"  stop-color="${bc}" stop-opacity=".25"/>
      <stop offset="60%"  stop-color="${bc}" stop-opacity=".25"/>
      <stop offset="100%" stop-color="${bc}" stop-opacity=".08"/>
    </linearGradient>`;
    if (!bp.solid) {
      html += `
      ${bp.components.map((comp, j) => `
      <linearGradient id="gboostc${j}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stop-color="${comp.color}" stop-opacity=".07"/>
        <stop offset="40%"  stop-color="${comp.color}" stop-opacity=".28"/>
        <stop offset="60%"  stop-color="${comp.color}" stop-opacity=".28"/>
        <stop offset="100%" stop-color="${comp.color}" stop-opacity=".07"/>
      </linearGradient>`).join('')}`;
    }
  }

  html += '</defs>';

  // Nose cone
  const nH    = nosePhys * scale;
  const nW    = topD * scale;
  const halfW = nW / 2;
  // Ogive profile: C1 pushed sideways for convex curve, C2 at full radius for
  // vertical tangent at base, flowing smoothly into the cylinder wall.
  const nosePath = [
    `M ${cx},${y}`,
    `C ${cx - halfW * 0.60},${y + nH * 0.10}`,
    `  ${cx - halfW},${y + nH * 0.65}`,
    `  ${cx - halfW},${y + nH}`,
    `L ${cx + halfW},${y + nH}`,
    `C ${cx + halfW},${y + nH * 0.65}`,
    `  ${cx + halfW * 0.60},${y + nH * 0.10}`,
    `  ${cx},${y} Z`,
  ].join(' ');
  html += `<path d="${nosePath}" fill="url(#gn)" stroke="#94a3b8" stroke-width="1.5"/>`;
  html += `<circle cx="${cx}" cy="${y + 1.5}" r="2.5" fill="#94a3b8" stroke="none" opacity="0.85"/>`;
  html += `<line x1="${cx}" y1="${y + 4}" x2="${cx}" y2="${y + nH}" stroke="#94a3b820" stroke-width="1"/>`;

  y += nH;

  let stage0BodyY = 0, stage0BodyH = 0;
  for (let i = N - 1; i >= 0; i--) {
    const s  = stages[i];
    const w  = s.diameter * scale;
    const h  = s.height * scale;
    const c  = s.p.color;
    const sx = cx - w / 2;

    html += `<rect x="${sx - 2}" y="${y - 2}" width="${w + 4}" height="4" fill="${c}70" rx="2"/>`;

    if (i === 0) stage0BodyY = y;
    const midY  = y + h / 2;
    const fsize = Math.max(9, Math.min(12, w / 7));

    if (s.p.solid) {
      html += `<rect x="${sx}" y="${y}" width="${w}" height="${h}"
        fill="url(#g${i})" stroke="${c}" stroke-width="1.5" rx="1"/>`;
      html += `<line x1="${cx}" y1="${y}" x2="${cx}" y2="${y + h}"
        stroke="${c}25" stroke-width="1" stroke-dasharray="5,4"/>`;
      const bandCount = Math.floor(h / 30);
      for (let b = 1; b <= bandCount; b++) {
        const by = y + (b * h / (bandCount + 1));
        html += `<line x1="${sx + 4}" y1="${by}" x2="${sx + w - 4}" y2="${by}"
          stroke="${c}15" stroke-width="1"/>`;
      }
      if (h > 32) {
        html += `<text x="${cx}" y="${midY - fsize * 0.8}" text-anchor="middle"
          fill="${c}" font-size="${fsize}" font-weight="700" font-family="monospace"
          dominant-baseline="middle">STAGE ${i + 1}</text>`;
        html += `<text x="${cx}" y="${midY + fsize * 0.9}" text-anchor="middle"
          fill="${c}99" font-size="${fsize * 0.8}" font-family="monospace"
          dominant-baseline="middle">${s.p.abbrev}</text>`;
      } else {
        html += `<text x="${cx + w/2 + 7}" y="${midY}" dominant-baseline="middle"
          fill="${c}" font-size="10" font-family="monospace">S${i+1}</text>`;
      }
    } else {
      // One band per constituent, stacked in the order the propellant lists them.
      // A tripropellant simply yields three bands instead of two.
      let bandY = y;
      s.p.components.forEach((comp, j) => {
        const bh = h * comp.volFrac;
        html += `<rect x="${sx}" y="${bandY}" width="${w}" height="${bh}" fill="url(#gc${i}_${j})"/>`;
        if (j > 0) {
          html += `<line x1="${sx + 3}" y1="${bandY}" x2="${sx + w - 3}" y2="${bandY}"
            stroke="${c}" stroke-width="1.5" opacity="0.65"/>`;
        }
        const nb = Math.floor(bh / 28);
        for (let b = 1; b <= nb; b++) {
          const by = bandY + b * bh / (nb + 1);
          html += `<line x1="${sx+4}" y1="${by}" x2="${sx+w-4}" y2="${by}" stroke="${comp.color}22" stroke-width="1"/>`;
        }
        if (bh > 18) {
          html += `<text x="${cx}" y="${bandY + bh/2}" text-anchor="middle"
            dominant-baseline="middle" fill="${comp.color}" fill-opacity=".95"
            font-size="${fsize}" font-weight="700" font-family="monospace">${comp.name}</text>`;
        }
        bandY += bh;
      });

      html += `<rect x="${sx}" y="${y}" width="${w}" height="${h}"
        fill="none" stroke="${c}" stroke-width="1.5" rx="1"/>`;
      html += `<line x1="${cx}" y1="${y}" x2="${cx}" y2="${y + h}"
        stroke="${c}18" stroke-width="1" stroke-dasharray="5,4"/>`;
      html += `<text x="${sx + 5}" y="${y + 4}" dominant-baseline="hanging"
        fill="${c}90" font-size="9" font-family="monospace" font-weight="700">S${i+1}</text>`;
    }

    html += `<line x1="${sx - 6}" y1="${midY}" x2="${sx}" y2="${midY}" stroke="${c}50" stroke-width="1"/>`;
    html += `<text x="${sx - 8}" y="${midY}" text-anchor="end" dominant-baseline="middle"
      fill="${c}80" font-size="9" font-family="monospace">⌀${s.diameter.toFixed(1)}m</text>`;

    const rX = cx + w / 2 + 6;
    html += `<line x1="${cx + w/2}" y1="${y}"    x2="${rX}" y2="${y}"    stroke="${c}30" stroke-width="1"/>`;
    html += `<line x1="${cx + w/2}" y1="${y + h}" x2="${rX}" y2="${y + h}" stroke="${c}30" stroke-width="1"/>`;
    html += `<line x1="${rX}"       y1="${y}"    x2="${rX}" y2="${y + h}" stroke="${c}20" stroke-width="1"/>`;
    if (h > 20) {
      html += `<text x="${rX + 4}" y="${midY}" dominant-baseline="middle"
        fill="${c}60" font-size="9" font-family="monospace">${s.height.toFixed(0)}m</text>`;
    }

    y += h;
    if (i === 0) stage0BodyH = h;

    const engHpx = s.diameter * 0.40 * scale;
    html += sideViewEngines(s.sigmaBreakdown?.engineCount, s.thrustPerEngine, {
      cx, top: y, halfWidth: s.diameter * scale / 2, height: engHpx, strokeWidth: 1.2,
    });

    y += engHpx;

    if (i > 0) {
      const adH = adapters[i - 1] * scale;
      const w1  = s.diameter * scale;
      const w2  = stages[i - 1].diameter * scale;
      html += `<polygon points="${cx-w1/2},${y} ${cx+w1/2},${y} ${cx+w2/2},${y+adH} ${cx-w2/2},${y+adH}"
        fill="#1e293b" stroke="#334155" stroke-width="1"/>`;
      y += adH;
    }
  }

  // Side boosters
  if (boostVisCount > 0) {
    const bp    = phys.booster.p;
    const bc    = bp.color;
    const bW    = bst.diameter * scale;
    const bH    = bst.height   * scale;
    const gapPx = gapPhys * scale;
    const bEngH = bst.diameter * 0.40 * scale;
    const s0W   = stages[0].diameter * scale;

    const bBodyBottom = stage0BodyY + stage0BodyH;
    const bBodyTop    = bBodyBottom - bH;

    const positions = boostVisCount === 1
      ? [cx - s0W / 2 - gapPx - bW]
      : [cx - s0W / 2 - gapPx - bW, cx + s0W / 2 + gapPx];

    for (const bx of positions) {
      const bcx       = bx + bW / 2;
      const isLeft    = bx < cx;
      const mainEdge  = isLeft ? cx - s0W / 2 : cx + s0W / 2;
      const boostEdge = isLeft ? bx + bW : bx;

      const strutY1 = bBodyTop + bH * 0.25;
      const strutY2 = bBodyTop + bH * 0.72;
      html += `<line x1="${mainEdge}" y1="${strutY1}" x2="${boostEdge}" y2="${strutY1}"
        stroke="${bc}55" stroke-width="1.5" stroke-dasharray="3,3"/>`;
      html += `<line x1="${mainEdge}" y1="${strutY2}" x2="${boostEdge}" y2="${strutY2}"
        stroke="${bc}55" stroke-width="1.5" stroke-dasharray="3,3"/>`;

      if (bp.solid) {
        html += `<rect x="${bx}" y="${bBodyTop}" width="${bW}" height="${bH}"
          fill="url(#gboost)" stroke="${bc}" stroke-width="1.2" rx="1"/>`;
        html += `<line x1="${bcx}" y1="${bBodyTop}" x2="${bcx}" y2="${bBodyBottom}"
          stroke="${bc}20" stroke-width="1" stroke-dasharray="4,3"/>`;
      } else {
        let bandY = bBodyTop;
        bp.components.forEach((comp, j) => {
          const bh = bH * comp.volFrac;
          html += `<rect x="${bx}" y="${bandY}" width="${bW}" height="${bh}" fill="url(#gboostc${j})"/>`;
          if (j > 0) {
            html += `<line x1="${bx+2}" y1="${bandY}" x2="${bx+bW-2}" y2="${bandY}"
              stroke="${bc}" stroke-width="1.2" opacity="0.6"/>`;
          }
          bandY += bh;
        });
        html += `<rect x="${bx}" y="${bBodyTop}" width="${bW}" height="${bH}"
          fill="none" stroke="${bc}" stroke-width="1.2" rx="1"/>`;
      }

      const bnH  = bst.diameter * 1.5 * scale;
      const bhW  = bW / 2;
      const bnPath = [
        `M ${bcx},${bBodyTop - bnH}`,
        `C ${bcx - bhW*0.60},${bBodyTop - bnH*0.90}`,
        `  ${bcx - bhW},${bBodyTop - bnH*0.35}`,
        `  ${bcx - bhW},${bBodyTop}`,
        `L ${bcx + bhW},${bBodyTop}`,
        `C ${bcx + bhW},${bBodyTop - bnH*0.35}`,
        `  ${bcx + bhW*0.60},${bBodyTop - bnH*0.90}`,
        `  ${bcx},${bBodyTop - bnH} Z`,
      ].join(' ');
      html += `<path d="${bnPath}" fill="${bc}18" stroke="${bc}" stroke-width="1.2"/>`;

      html += sideViewEngines(phys.booster.sigmaBreakdown?.engineCount,
        phys.booster.thrustPerEngine, {
          cx: bx + bW / 2, top: bBodyBottom, halfWidth: bW / 2,
          height: bEngH, strokeWidth: 1,
        });

      const lfs = Math.max(7, Math.min(10, bW / 5));
      if (bH > 22) {
        html += `<text x="${bcx}" y="${bBodyTop + bH/2}" text-anchor="middle"
          dominant-baseline="middle" fill="${bc}cc" font-size="${lfs}"
          font-family="monospace" font-weight="700">${bp.abbrev}</text>`;
      }
    }

    if (bst.count > 2) {
      const bc = phys.booster.p.color;
      html += `<text x="${positions[0] - 5}" y="${stage0BodyY + stage0BodyH/2}"
        text-anchor="end" dominant-baseline="middle"
        fill="${bc}cc" font-size="11" font-family="monospace" font-weight="700">×${bst.count}</text>`;
    }
  }

  // To-scale astronaut (1.8 m tall) placed to the left of the rocket
  {
    const astroH  = 1.8 * scale;
    const astroSW = astroH * 0.31;   // shoulder width ≈ 0.56 m
    const groundY = y;
    const aTop    = groundY - astroH;

    const leftEdge = boostVisCount > 0
      ? cx - stages[0].diameter * scale / 2 - gapPhys * scale - bst.diameter * scale
      : cx - maxD * scale / 2;

    // Place astronaut 58 px to the left of the rocket edge (clears dimension labels)
    const aCX = leftEdge - 58 - astroSW / 2;

    if (aCX - astroSW / 2 > 4 && aTop > 4) {
      const sc = '#c8d8e8';   // suit
      const hc = '#ddeeff';   // helmet shell
      const vc = '#1a3050';   // visor
      const dc = '#7a8fa8';   // dark trim

      const headR  = astroH * 0.085;
      const headCY = aTop + headR;
      const neckH  = Math.max(1, astroH * 0.025);
      const shldrY = headCY + headR + neckH;
      const torsoH = astroH * 0.27;
      const hipY   = shldrY + torsoH;
      const legOff = astroSW * 0.20;
      const armSX  = astroSW * 0.48;
      const armExX = astroSW * 0.36;
      const handY  = shldrY + astroH * 0.32;
      const lw     = Math.max(1.5, astroSW * 0.21);

      // Legs
      html += `<line x1="${aCX - legOff}" y1="${hipY}" x2="${aCX - legOff}" y2="${groundY}"
        stroke="${sc}" stroke-width="${lw}" stroke-linecap="round"/>`;
      html += `<line x1="${aCX + legOff}" y1="${hipY}" x2="${aCX + legOff}" y2="${groundY}"
        stroke="${sc}" stroke-width="${lw}" stroke-linecap="round"/>`;

      // Boots
      html += `<ellipse cx="${aCX - legOff}" cy="${groundY}" rx="${Math.max(2, astroSW * 0.16)}" ry="${Math.max(1, astroH * 0.022)}" fill="${dc}"/>`;
      html += `<ellipse cx="${aCX + legOff}" cy="${groundY}" rx="${Math.max(2, astroSW * 0.16)}" ry="${Math.max(1, astroH * 0.022)}" fill="${dc}"/>`;

      // Arms
      const aw = Math.max(1.2, lw * 0.88);
      html += `<line x1="${aCX - armSX}" y1="${shldrY}" x2="${aCX - armExX}" y2="${handY}"
        stroke="${sc}" stroke-width="${aw}" stroke-linecap="round"/>`;
      html += `<line x1="${aCX + armSX}" y1="${shldrY}" x2="${aCX + armExX}" y2="${handY}"
        stroke="${sc}" stroke-width="${aw}" stroke-linecap="round"/>`;

      // Torso
      html += `<rect x="${aCX - astroSW / 2}" y="${shldrY}" width="${astroSW}" height="${torsoH}"
        fill="${sc}" rx="${Math.max(1, astroSW * 0.12)}"/>`;

      // Chest pack
      const cpW = astroSW * 0.44, cpH = torsoH * 0.33;
      html += `<rect x="${aCX - cpW / 2}" y="${shldrY + torsoH * 0.2}" width="${cpW}" height="${cpH}"
        fill="${dc}" opacity="0.45" rx="1"/>`;

      // Belt
      html += `<rect x="${aCX - astroSW / 2 + 1}" y="${hipY - astroH * 0.022}"
        width="${astroSW - 2}" height="${astroH * 0.032}" fill="${dc}" rx="1"/>`;

      // Neck ring
      const nkW = astroSW * 0.40;
      html += `<rect x="${aCX - nkW / 2}" y="${headCY + headR}" width="${nkW}" height="${neckH}"
        fill="${dc}" rx="1"/>`;

      // Helmet
      html += `<circle cx="${aCX}" cy="${headCY}" r="${headR}"
        fill="${hc}" stroke="${dc}" stroke-width="${Math.max(0.7, headR * 0.08)}"/>`;

      // Visor
      const vW = headR * 1.18, vH = headR * 0.70;
      html += `<ellipse cx="${aCX}" cy="${headCY + headR * 0.07}"
        rx="${vW * 0.5}" ry="${vH * 0.5}" fill="${vc}" opacity="0.88"/>`;

      if (headR > 4) {
        html += `<ellipse cx="${aCX - vW * 0.14}" cy="${headCY - headR * 0.05}"
          rx="${vW * 0.14}" ry="${vH * 0.21}" fill="white" opacity="0.28"/>`;
      }

      // "1.8m" label below feet
      const lfs = Math.max(7, Math.min(9, scale * 0.11));
      html += `<text x="${aCX}" y="${groundY + lfs + 4}"
        text-anchor="middle" fill="#3a5878" font-size="${lfs}" font-family="monospace">1.8m</text>`;
    }
  }

  html += renderTopViews(W, H, phys);

  el.innerHTML = html;
}
