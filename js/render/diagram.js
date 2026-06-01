import { state } from '../state.js';

// Returns [{x, y, ring}] in normalised "ring-spacing = 1" coordinates.
// Ring 0 = centre engine; ring k holds floor(2π·k) engines evenly spaced.
function computeEnginePositions(count) {
  const positions = [];
  let remaining = count;
  for (let ring = 0; remaining > 0; ring++) {
    const cap = ring === 0 ? 1 : Math.floor(2 * Math.PI * ring);
    const n   = Math.min(remaining, cap);
    if (ring === 0) {
      positions.push({ x: 0, y: 0, ring: 0 });
    } else {
      for (let k = 0; k < n; k++) {
        const a = (k / n) * 2 * Math.PI - Math.PI / 2;
        positions.push({ x: ring * Math.cos(a), y: ring * Math.sin(a), ring });
      }
    }
    remaining -= n;
  }
  return positions;
}

// Returns how many engine bells are visible in the side-on rocket diagram.
// Logic: each ring that has >=3 engines contributes 2 visible bells (left + right extreme);
// the centre engine (ring 0) contributes 1. For <=3 engines the raw count is returned.
function sideViewBells(engineCount) {
  if (!engineCount || engineCount <= 0) return 1;  // solid / unknown → single nozzle
  if (engineCount <= 3) return engineCount;
  const positions = computeEnginePositions(engineCount);
  const ringPop = {};
  for (const p of positions) ringPop[p.ring] = (ringPop[p.ring] || 0) + 1;
  let outerRing = 0;
  for (const [r, n] of Object.entries(ringPop)) {
    if (n >= 3) outerRing = Math.max(outerRing, Number(r));
  }
  return 2 * outerRing + 1;
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
      const maxRing   = positions.reduce((m, p) => Math.max(m, p.ring), 0);

      // Scale so outermost ring edge fits within tank (leave wall gap).
      const posScale  = (tankR * 0.84) / Math.max(maxRing + 0.52, 0.52);

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
      const fuC = s.p.fuelColor, oxC = s.p.oxColor;
      html += `
      <linearGradient id="gfu${i}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stop-color="${fuC}" stop-opacity=".07"/>
        <stop offset="40%"  stop-color="${fuC}" stop-opacity=".30"/>
        <stop offset="60%"  stop-color="${fuC}" stop-opacity=".30"/>
        <stop offset="100%" stop-color="${fuC}" stop-opacity=".07"/>
      </linearGradient>
      <linearGradient id="gox${i}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stop-color="${oxC}" stop-opacity=".07"/>
        <stop offset="40%"  stop-color="${oxC}" stop-opacity=".30"/>
        <stop offset="60%"  stop-color="${oxC}" stop-opacity=".30"/>
        <stop offset="100%" stop-color="${oxC}" stop-opacity=".07"/>
      </linearGradient>`;
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
      <linearGradient id="gboostfu" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stop-color="${bp.fuelColor}" stop-opacity=".07"/>
        <stop offset="40%"  stop-color="${bp.fuelColor}" stop-opacity=".28"/>
        <stop offset="60%"  stop-color="${bp.fuelColor}" stop-opacity=".28"/>
        <stop offset="100%" stop-color="${bp.fuelColor}" stop-opacity=".07"/>
      </linearGradient>
      <linearGradient id="gboostox" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stop-color="${bp.oxColor}" stop-opacity=".07"/>
        <stop offset="40%"  stop-color="${bp.oxColor}" stop-opacity=".28"/>
        <stop offset="60%"  stop-color="${bp.oxColor}" stop-opacity=".28"/>
        <stop offset="100%" stop-color="${bp.oxColor}" stop-opacity=".07"/>
      </linearGradient>`;
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
      const fuFrac = 1 - s.p.oxVolFrac;
      const fuH = h * fuFrac, oxH = h * s.p.oxVolFrac;
      const fuY = y, oxY = y + fuH;
      const fuC = s.p.fuelColor, oxC = s.p.oxColor;

      html += `<rect x="${sx}" y="${fuY}" width="${w}" height="${fuH}" fill="url(#gfu${i})"/>`;
      html += `<rect x="${sx}" y="${oxY}" width="${w}" height="${oxH}" fill="url(#gox${i})"/>`;
      html += `<rect x="${sx}" y="${y}" width="${w}" height="${h}"
        fill="none" stroke="${c}" stroke-width="1.5" rx="1"/>`;
      html += `<line x1="${sx + 3}" y1="${oxY}" x2="${sx + w - 3}" y2="${oxY}"
        stroke="${c}" stroke-width="1.5" opacity="0.65"/>`;
      html += `<line x1="${cx}" y1="${y}" x2="${cx}" y2="${y + h}"
        stroke="${c}18" stroke-width="1" stroke-dasharray="5,4"/>`;

      const fuBands = Math.floor(fuH / 28);
      for (let b = 1; b <= fuBands; b++) {
        const by = fuY + b * fuH / (fuBands + 1);
        html += `<line x1="${sx+4}" y1="${by}" x2="${sx+w-4}" y2="${by}" stroke="${fuC}22" stroke-width="1"/>`;
      }
      const oxBands = Math.floor(oxH / 28);
      for (let b = 1; b <= oxBands; b++) {
        const by = oxY + b * oxH / (oxBands + 1);
        html += `<line x1="${sx+4}" y1="${by}" x2="${sx+w-4}" y2="${by}" stroke="${oxC}22" stroke-width="1"/>`;
      }

      html += `<text x="${sx + 5}" y="${fuY + 4}" dominant-baseline="hanging"
        fill="${c}90" font-size="9" font-family="monospace" font-weight="700">S${i+1}</text>`;
      if (fuH > 18) {
        html += `<text x="${cx}" y="${fuY + fuH/2}" text-anchor="middle"
          dominant-baseline="middle" fill="${fuC}" fill-opacity=".95"
          font-size="${fsize}" font-weight="700" font-family="monospace">${s.p.fuelName}</text>`;
      }
      if (oxH > 18) {
        html += `<text x="${cx}" y="${oxY + oxH/2}" text-anchor="middle"
          dominant-baseline="middle" fill="${oxC}" fill-opacity=".95"
          font-size="${fsize}" font-weight="700" font-family="monospace">${s.p.oxName}</text>`;
      }
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

    const engHpx  = s.diameter * 0.40 * scale;
    const nEng    = sideViewBells(s.sigmaBreakdown?.engineCount);
    const engTW   = s.diameter * scale * 0.85;
    const cellW   = engTW / nEng;
    const gutter  = cellW * 0.12;
    const bW      = cellW - gutter * 2;
    const throatW = bW * 0.32;
    const ex0     = cx - engTW / 2;

    for (let e = 0; e < nEng; e++) {
      const bx  = ex0 + e * cellW + gutter;
      const tx  = bx + (bW - throatW) / 2;
      const eyY = y + engHpx;
      html += `<polygon points="${tx},${y} ${tx+throatW},${y} ${bx+bW},${eyY} ${bx},${eyY}"
        fill="#111827" stroke="#334155" stroke-width="1.2"/>`;
      html += `<ellipse cx="${bx + bW/2}" cy="${eyY}" rx="${bW/2}" ry="${bW*0.12}"
        fill="none" stroke="#4b6080" stroke-width="1"/>`;
    }

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
        const fuH = bH * (1 - bp.oxVolFrac), oxH = bH * bp.oxVolFrac;
        const fuY = bBodyTop, oxY = bBodyTop + fuH;
        html += `<rect x="${bx}" y="${fuY}" width="${bW}" height="${fuH}" fill="url(#gboostfu)"/>`;
        html += `<rect x="${bx}" y="${oxY}" width="${bW}" height="${oxH}" fill="url(#gboostox)"/>`;
        html += `<rect x="${bx}" y="${bBodyTop}" width="${bW}" height="${bH}"
          fill="none" stroke="${bc}" stroke-width="1.2" rx="1"/>`;
        html += `<line x1="${bx+2}" y1="${oxY}" x2="${bx+bW-2}" y2="${oxY}"
          stroke="${bc}" stroke-width="1.2" opacity="0.6"/>`;
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

      const nBEng   = sideViewBells(phys.booster.sigmaBreakdown?.engineCount);
      const bEngTW  = bW * 0.85;
      const bCellW  = bEngTW / nBEng;
      const bGutter = bCellW * 0.12;
      const bBellW  = bCellW - bGutter * 2;
      const bThroW  = bBellW * 0.32;
      const bEx0    = bx + (bW - bEngTW) / 2;
      for (let e = 0; e < nBEng; e++) {
        const bellX = bEx0 + e * bCellW + bGutter;
        const tx    = bellX + (bBellW - bThroW) / 2;
        const exitY = bBodyBottom + bEngH;
        html += `<polygon points="${tx},${bBodyBottom} ${tx+bThroW},${bBodyBottom} ${bellX+bBellW},${exitY} ${bellX},${exitY}"
          fill="#111827" stroke="#334155" stroke-width="1"/>`;
        html += `<ellipse cx="${bellX+bBellW/2}" cy="${exitY}" rx="${bBellW/2}" ry="${bBellW*0.12}"
          fill="none" stroke="#4b6080" stroke-width="0.8"/>`;
      }

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

  html += renderTopViews(W, H, phys);

  el.innerHTML = html;
}
