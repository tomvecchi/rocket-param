// Tank wall materials: density (kg/m³), yield strength (Pa)
export const TANK_MATERIALS = {
  'Al-2219': { name: 'Al 2219-T87',  rho: 2700, sigmaY: 393e6  },
  'Al-Li':   { name: 'Al-Li 2195',   rho: 2640, sigmaY: 550e6  },
  'CFRP':    { name: 'CFRP',          rho: 1600, sigmaY: 1000e6 },
  'Steel':   { name: 'Steel 301-HH', rho: 7900, sigmaY: 1310e6 },
};
