// Separate fuel and oxidiser definitions, with combination data (Isp, O/F) derived from
// astronautix.com propellant dataset plus LOX/LCH4 added manually.

const SOLID_PROPS = {
  isp_sl: 250, isp_vac: 270, density: 1750,
  color: '#f87171', name: 'HTPB Solid', abbrev: 'SRB',
  solid: true, sigmaOther: 0.04,
  components: [{ key: 'Solid', role: 'fuel', name: 'HTPB grain', color: '#f87171', massFrac: 1, volFrac: 1 }],
};

export const OXIDISERS = {
  Solid:      { name: 'HTPB Solid', density_gcc: null,  color: '#f87171', solid: true  },
  Tri:        { name: 'Li/F₂/H₂ tri',  density_gcc: null,  color: '#22d3ee', tri: true    },
  Lox:        { name: 'LOX',        density_gcc: 1.14,  color: '#1d4ed8'               },
  N2O:        { name: 'N₂O',        density_gcc: 1.22,  color: '#dcca26'               },
  N2O4:       { name: 'N₂O₄',       density_gcc: 1.45,  color: '#dc2626'               },
  H2O2:       { name: 'H₂O₂',       density_gcc: 1.44,  color: '#0e7490'               },
  MON:        { name: 'MON',        density_gcc: 1.37,  color: '#b91c1c'               },
  NitricAcid: { name: 'HNO₃',       density_gcc: 1.51,  color: '#b45309'               },
  LF2:        { name: 'LF₂',        density_gcc: 1.51,  color: '#7e22ce'               },
  CF2:        { name: 'CF₂',        density_gcc: 1.52,  color: '#4c1d95'               },
  ClF3:       { name: 'ClF₃',       density_gcc: 1.83,  color: '#7f1d1d'               },
  ClO3F:      { name: 'ClO₃F',      density_gcc: 1.43,  color: '#881337'               },
  BrF5:       { name: 'BrF₅',       density_gcc: 2.48,  color: '#7c2d12'               },
};

export const FUELS = {
  Kerosene:  { name: 'RP-1',    density_gcc: 0.806, color: '#fb923c', abbrev: 'RP-1'   },
  LCH4:      { name: 'LCH₄',    density_gcc: 0.424, color: '#34d399', abbrev: 'LCH₄'   },
  Ethane:    { name: 'Ethane',  density_gcc: 0.544, color: '#34d39e', abbrev: 'C₂H₆' },
  Propane:   { name: 'Propane', density_gcc: 0.582, color: '#34d3c6', abbrev: 'Propane'},
  Butane:    { name: 'Butane',  density_gcc: 0.573, color: '#34aed3', abbrev: 'Butane' },
  Furfuryl:  { name: 'Furfuryl',density_gcc: 1.126, color: '#b2dce9', abbrev: 'Furfuryl'},
  Cyclopropane:  { name: 'Cyclopropane',density_gcc: 0.698, color: '#c2d13d', abbrev: 'Cyclopropane'},
  Propyne:   { name: 'Propyne',density_gcc: 0.671, color: '#d16c3d', abbrev: 'CH₃C≡CH'},
  LH2:       { name: 'LH₂',     density_gcc: 0.071, color: '#60a5fa', abbrev: 'LH₂'    },
  Ammonia:   { name: 'NH₃',     density_gcc: 0.604, color: '#86efac', abbrev: 'NH₃'    },
  Alcohol:   { name: 'Alcohol', density_gcc: 0.870, color: '#fcd34d', abbrev: 'EtOH'   },
  Hydyne:    { name: 'Hydyne',  density_gcc: 0.860, color: '#6ee7b7', abbrev: 'HYDYNE' },
  'JP-X':    { name: 'JP-X',    density_gcc: 0.900, color: '#fbbf24', abbrev: 'JP-X'   },
  UDMH:      { name: 'UDMH',    density_gcc: 0.793, color: '#c084fc', abbrev: 'UDMH'   },
  MMH:       { name: 'MMH',     density_gcc: 0.880, color: '#d8b4fe', abbrev: 'MMH'    },
  Hydrazine: { name: 'N₂H₄',    density_gcc: 1.008, color: '#4ade80', abbrev: 'N₂H₄'   },
  Solid:     { name: 'HTPB',    density_gcc: 1.350, color: '#94a3b8', abbrev: 'HTPB'   },
  LLi:       { name: 'Lithium', density_gcc: 0.534, color: '#d31737', abbrev: 'Li'     },
};

export const COMBINATIONS = {
  'Lox/LH2':              { isp_sl: 391, isp_vac: 451, of_ratio: 6.00 },
  'Lox/LCH4':             { isp_sl: 330, isp_vac: 380, of_ratio: 3.55 },
  'Lox/Ethane':           { isp_sl: 330, isp_vac: 378, of_ratio: 3.2 },
  'Lox/Propane':          { isp_sl: 330, isp_vac: 376, of_ratio: 3.1 },
  'Lox/Butane':           { isp_sl: 330, isp_vac: 368, of_ratio: 3.0 },
  'Lox/Furfuryl':         { isp_sl: 300, isp_vac: 350, of_ratio: 1.5 },
  'Lox/Cyclopropane':     { isp_sl: 330, isp_vac: 380, of_ratio: 2.6 },
  'Lox/Propyne':          { isp_sl: 300, isp_vac: 385, of_ratio: 2.3 },
  'Lox/Kerosene':         { isp_sl: 300, isp_vac: 353, of_ratio: 2.56 },
  'Lox/Ammonia':          { isp_sl: 294, isp_vac: 343, of_ratio: 1.40 },
  'Lox/Hydrazine':        { isp_sl: 313, isp_vac: 365, of_ratio: 0.90 },
  'Lox/Hydyne':           { isp_sl: 306, isp_vac: 359, of_ratio: 1.73 },
  'Lox/Alcohol':          { isp_sl: 284, isp_vac: 338, of_ratio: 1.43 },
  'Lox/UDMH':             { isp_sl: 310, isp_vac: 363, of_ratio: 1.67 },
  'N2O4/UDMH':            { isp_sl: 285, isp_vac: 333, of_ratio: 2.61 },
  'N2O4/MMH':             { isp_sl: 288, isp_vac: 336, of_ratio: 2.16 },
  'N2O4/Hydrazine':       { isp_sl: 292, isp_vac: 339, of_ratio: 1.34 },
  'N2O4/Hydyne':          { isp_sl: 282, isp_vac: 330, of_ratio: 2.71 },
  'N2O4/Kerosene':        { isp_sl: 276, isp_vac: 323, of_ratio: 4.04 },
  'N2O4/Ammonia':         { isp_sl: 215, isp_vac: 280, of_ratio: 2.04 },
  'H2O2/LH2':             { isp_sl: 351, isp_vac: 380, of_ratio: 15.00 },
  'H2O2/LCH4':            { isp_sl: 300, isp_vac: 340, of_ratio: 8.4 },
  'H2O2/Ethane':          { isp_sl: 300, isp_vac: 340, of_ratio: 7.8 },
  'H2O2/Propane':         { isp_sl: 300, isp_vac: 340, of_ratio: 7.7 },
  'H2O2/Butane':          { isp_sl: 300, isp_vac: 340, of_ratio: 7.5 },
  'H2O2/Furfuryl':        { isp_sl: 280, isp_vac: 330, of_ratio: 3.8 },
  'H2O2/Cyclopropane':    { isp_sl: 280, isp_vac: 340, of_ratio: 7.1 },
  'H2O2/Propyne':         { isp_sl: 280, isp_vac: 340, of_ratio: 6.4},
  'H2O2/Hydrazine':       { isp_sl: 282, isp_vac: 327, of_ratio: 2.01 },
  'H2O2/Hydyne':          { isp_sl: 276, isp_vac: 322, of_ratio: 4.68 },
  'H2O2/Kerosene':        { isp_sl: 273, isp_vac: 319, of_ratio: 7.07 },
  'H2O2/UDMH':            { isp_sl: 278, isp_vac: 325, of_ratio: 4.36 },
  'H2O2/Solid':           { isp_sl: 250, isp_vac: 294, of_ratio: 0.84, sigmaOther: 0.05 },
  'MON/Hydrazine':        { isp_sl: 295, isp_vac: 343, of_ratio: 1.40 },
  'MON/MMH':              { isp_sl: 292, isp_vac: 340, of_ratio: 2.27 },
  'MON/Hydyne':           { isp_sl: 287, isp_vac: 335, of_ratio: 2.84 },
  'MON/UDMH':             { isp_sl: 290, isp_vac: 338, of_ratio: 2.72 },
  'N2O/Ethane':           { isp_sl: 260, isp_vac: 300, of_ratio: 6.0  },
  'N2O/Solid':            { isp_sl: 245, isp_vac: 275, of_ratio: 5.0, sigmaOther: 0.05 },
  'NitricAcid/Kerosene':  { isp_sl: 268, isp_vac: 314, of_ratio: 4.80 },
  'NitricAcid/Hydyne':    { isp_sl: 273, isp_vac: 320, of_ratio: 3.11 },
  'NitricAcid/UDMH':      { isp_sl: 276, isp_vac: 323, of_ratio: 3.00 },
  'NitricAcid/MMH':       { isp_sl: 279, isp_vac: 326, of_ratio: 2.47 },
  'NitricAcid/Hydrazine': { isp_sl: 283, isp_vac: 328, of_ratio: 1.45 },
  'NitricAcid/Ammonia':   { isp_sl: 217, isp_vac: 255, of_ratio: 2.10 },
  'NitricAcid/JP-X':      { isp_sl: 269, isp_vac: 315, of_ratio: 4.13 },
  'NitricAcid/Furfuryl':  { isp_sl: 280, isp_vac: 320, of_ratio: 2.7  },
  'LF2/LH2':              { isp_sl: 410, isp_vac: 470, of_ratio: 8.00 },
  'LF2/LLi':              { isp_sl: 410, isp_vac: 458, of_ratio: 2.70, sigmaOther: 0.05 },
  'LF2/Hydrazine':        { isp_sl: 363, isp_vac: 422, of_ratio: 2.18 },
  'LF2/Ammonia':          { isp_sl: 357, isp_vac: 414, of_ratio: 3.15 },
  'LF2/UDMH':             { isp_sl: 341, isp_vac: 403, of_ratio: 2.55 },
  'LF2/Kerosene':         { isp_sl: 322, isp_vac: 380, of_ratio: 2.80 },
  'CF2/LH2':              { isp_sl: 341, isp_vac: 401, of_ratio: 6.00 },
  'CF2/Hydrazine':        { isp_sl: 273, isp_vac: 321, of_ratio: 1.50 },
  'ClF3/Hydrazine':       { isp_sl: 294, isp_vac: 338, of_ratio: 2.77 },
  'ClF3/Hydyne':          { isp_sl: 276, isp_vac: 321, of_ratio: 2.98 },
  'ClF3/Kerosene':        { isp_sl: 258, isp_vac: 301, of_ratio: 3.26 },
  'ClF3/UDMH':            { isp_sl: 280, isp_vac: 325, of_ratio: 3.03 },
  'ClO3F/Hydrazine':      { isp_sl: 295, isp_vac: 295, of_ratio: 1.42 },
  'ClO3F/Hydyne':         { isp_sl: 285, isp_vac: 285, of_ratio: 2.78 },
  'ClO3F/Kerosene':       { isp_sl: 280, isp_vac: 280, of_ratio: 4.23 },
  'ClO3F/MMH':            { isp_sl: 291, isp_vac: 291, of_ratio: 2.67 },
  'ClO3F/UDMH':           { isp_sl: 288, isp_vac: 288, of_ratio: 2.67 },
  'BrF5/Hydrazine':       { isp_sl: 243, isp_vac: 243, of_ratio: 3.35 },
  'BrF5/MMH':             { isp_sl: 236, isp_vac: 236, of_ratio: 3.55 },
  'BrF5/Hydyne':          { isp_sl: 227, isp_vac: 227, of_ratio: 3.85 },
  'BrF5/UDMH':            { isp_sl: 231, isp_vac: 231, of_ratio: 3.80 },
};

// Everything dry that is neither tank shell nor engine: residual propellant, He
// pressurisation, insulation, thrust structure, interstage, avionics, separation
// hardware. Split into a floor that scales with propellant mass (residuals and
// hardware, ~1.4%) plus a term inversely proportional to bulk density, since the
// bulky low-density propellants need proportionally more tank volume to insulate,
// pressurise and carry. Calibrated so kerolox lands near Falcon 9 stage 1 (σ 0.054
// total) and LH2 near Centaur/DCSS (σ ~0.10).
const otherFraction = density => 0.0136 + 16.8 / density;

// Bulk density and per-component mass/volume splits for a propellant of any number
// of constituents. Parts are listed in the order they stack in the tank diagram.
function mixture(parts) {
  const mass = parts.reduce((a, p) => a + p.mass, 0);
  const vol  = parts.reduce((a, p) => a + p.mass / p.density, 0);
  return {
    density: (mass / vol) * 1000,
    components: parts.map(p => ({
      key: p.key, name: p.name, color: p.color, role: p.role,
      massFrac: p.mass / mass,
      volFrac:  (p.mass / p.density) / vol,
    })),
  };
}

// Rocketdyne's lithium / fluorine / hydrogen tripropellant, tested on the stand in
// the late 1960s — 542 s, still the highest specific impulse ever measured for a
// chemical rocket.
//
// Lithium burns with fluorine (2Li + F₂ → 2LiF), which is what releases the energy.
// The hydrogen is barely a fuel at all: it is injected as a working fluid to drag
// the mean exhaust molecular weight down from LiF's 25.9, and that is where the
// extra impulse comes from. Masses below are stoichiometric Li/F₂ plus about one
// mole of H₂ per mole of LiF, the ratio that lands on the measured figure.
//
// Never flown, and never will: the exhaust is hydrogen fluoride and molten LiF, it
// needs a tank of liquid metal bolted to one at 20 K, and fluorine attacks almost
// any material you would want to build the rest out of.
const TRI_MIX = mixture([
  { key: 'LH2', role: 'fuel', name: 'LH₂',     color: '#22d3ee', mass:  4.032, density: 0.071 },
  { key: 'LLi', role: 'fuel', name: 'Lithium', color: '#d31737', mass: 13.880, density: 0.534 },
  { key: 'LF2', role: 'ox',   name: 'LF₂',     color: '#7e22ce', mass: 38.000, density: 1.510 },
]);

const TRI_PROPS = {
  isp_sl: 477, isp_vac: 542,
  density: TRI_MIX.density, components: TRI_MIX.components,
  color: '#22d3ee', name: 'Li / F₂ / H₂', abbrev: 'TRI',
  solid: false, tri: true,
  // Three tanks instead of two, one of them holding molten metal next to one at
  // 20 K, every wetted surface fluorine-compatible: far more inert mass than the
  // density term alone would suggest.
  sigmaOther: 0.07,
};

// Returns a prop object with the same shape as PROPS entries in propellants.js.
export function resolveProp(oxidiser, fuel) {
  if (OXIDISERS[oxidiser]?.solid) return SOLID_PROPS;
  if (OXIDISERS[oxidiser]?.tri)   return TRI_PROPS;
  const ox   = OXIDISERS[oxidiser];
  const f    = FUELS[fuel];
  const comb = COMBINATIONS[`${oxidiser}/${fuel}`];
  if (!ox || !f || !comb) throw new Error(`Unknown combination: ${oxidiser}/${fuel}`);

  const { isp_sl, isp_vac, of_ratio } = comb;
  const mix = mixture([
    { key: fuel,     role: 'fuel', name: f.name,  color: f.color,  mass: 1,        density: f.density_gcc  },
    { key: oxidiser, role: 'ox',   name: ox.name, color: ox.color, mass: of_ratio, density: ox.density_gcc },
  ]);
  const sigmaOther = comb.sigmaOther ?? otherFraction(mix.density);

  return {
    isp_sl, isp_vac, of_ratio, sigmaOther,
    density:    mix.density,
    components: mix.components,
    oxVolFrac:  mix.components[1].volFrac,
    color:      f.color,
    oxColor:    ox.color,
    fuelColor:  f.color,
    name:       `${f.name} / ${ox.name}`,
    abbrev:     f.abbrev,
    oxName:     ox.name,
    fuelName:   f.name,
    solid:      false,
  };
}
