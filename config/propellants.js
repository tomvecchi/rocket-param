export const G0 = 9.80665;

// dvBeyondLeo: impulsive ΔV needed on top of reaching low Earth orbit. The LEO
// requirement itself is not a constant — it depends on the ascent losses the
// vehicle's own thrust profile incurs, so it is computed per design.
export const MISSIONS = [
  { name: 'LEO',  dvBeyondLeo: 0,    color: '#10b981' },
  { name: 'GTO',  dvBeyondLeo: 2440, color: '#f59e0b' },
  { name: 'Moon', dvBeyondLeo: 3120, color: '#818cf8' },
  { name: 'Mars', dvBeyondLeo: 3600, color: '#f87171' },
];
