export const G0 = 9.80665;

// oxVolFrac = fraction of total propellant *volume* occupied by oxidiser.
// Derived from component densities and mixture ratios (O/F by mass).
//   LOX/LH2  O/F=6.0:  LOX 27.1 % vol  LH2 72.9 % vol
//   LOX/CH4  O/F=3.55: LOX 56.8 % vol  CH4 43.2 % vol
//   LOX/RP-1 O/F=2.72: LOX 66.1 % vol  RP1 33.9 % vol
//   N2O4/UDMH O/F=2.6: N2O4 58.9% vol  UDMH 41.1% vol
export const PROPS = {
  'LOX/LH2': {
    isp_sl: 366, isp_vac: 452, density: 362,
    color: '#60a5fa', name: 'LH₂ / LOX', abbrev: 'LH₂',
    note: 'SL 366 s · Vac 452 s',
    solid: false,
    oxName: 'LOX', fuelName: 'LH₂',
    oxColor: '#1d4ed8', fuelColor: '#bae6fd',
    oxVolFrac: 0.271,
    sigmaOther: 0.02,
  },
  'LOX/CH4': {
    isp_sl: 330, isp_vac: 380, density: 830,
    color: '#34d399', name: 'LCH₄ / LOX', abbrev: 'CH₄',
    note: 'SL 330 s · Vac 380 s',
    solid: false,
    oxName: 'LOX', fuelName: 'LCH₄',
    oxColor: '#1d4ed8', fuelColor: '#34d399',
    oxVolFrac: 0.568,
    sigmaOther: 0.02,
  },
  'LOX/RP-1': {
    isp_sl: 295, isp_vac: 340, density: 1033,
    color: '#fb923c', name: 'RP-1 / LOX', abbrev: 'RP-1',
    note: 'SL 295 s · Vac 340 s',
    solid: false,
    oxName: 'LOX', fuelName: 'RP-1',
    oxColor: '#1d4ed8', fuelColor: '#f59e0b',
    oxVolFrac: 0.661,
    sigmaOther: 0.02,
  },
  'LOX/NH3': {
    isp_sl: 294, isp_vac: 343, density: 770,
    color: '#42fb3c', name: 'NH3 / LOX', abbrev: 'NH3',
    note: 'SL 294 s · Vac 343 s',
    solid: false,
    oxName: 'LOX', fuelName: 'NH3',
    oxColor: '#1d4ed8', fuelColor: '#61f50b',
    oxVolFrac: 0.67,
    sigmaOther: 0.02,
  },
  'N2O4/UDMH': {
    isp_sl: 285, isp_vac: 318, density: 1173,
    color: '#c084fc', name: 'N₂O₄ / UDMH', abbrev: 'UDMH',
    note: 'SL 285 s · Vac 318 s',
    solid: false,
    oxName: 'N₂O₄', fuelName: 'UDMH',
    oxColor: '#dc2626', fuelColor: '#7c3aed',
    oxVolFrac: 0.589,
    sigmaOther: 0.02,
  },
  'H2O2/HTPB': {
    isp_sl: 230, isp_vac: 250, density: 1400,
    color: '#60a5fa', name: 'Hybrid', abbrev: 'Hybrid',
    note: 'SL 230 s · Vac 250 s',
    solid: false,
    oxName: 'H₂O₂', fuelName: 'HTPB',
    oxColor: '#90f8ff', fuelColor: '#292929',
    oxVolFrac: 0.56,
    sigmaOther: 0.05,
  },

  'Solid': {
    isp_sl: 250, isp_vac: 270, density: 1750,
    color: '#f87171', name: 'HTPB Solid', abbrev: 'SRB',
    note: 'SL 250 s · Vac 270 s',
    solid: true,
    sigmaOther: 0.04,
  },
  'Fluorine/LH2': {
    isp_sl: 410, isp_vac: 470, density: 416,
    color: '#60a5fa', name: 'LH₂ / F', abbrev: 'LH₂',
    note: 'SL 410 s · Vac 470 s',
    solid: false,
    oxName: 'F', fuelName: 'LH₂',
    oxColor: '#7e1dd8', fuelColor: '#bae6fd',
    oxVolFrac: 0.271,
    sigmaOther: 0.02,
  },
};

export const MISSIONS = [
  { name: 'LEO',  dv: 9400,  color: '#10b981' },
  { name: 'GTO',  dv: 12000, color: '#f59e0b' },
  { name: 'Moon', dv: 13500, color: '#818cf8' },
  { name: 'Mars', dv: 16000, color: '#f87171' },
];
