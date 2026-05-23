export const state = {
  stages: [
    { id: 1, propellant: 'LOX/RP-1', diameter: 3.7, height: 40, fill: 0.85,
      tankMaterial: 'Al-2219', engineType: 'pump-fed', thrustPerEngine: 850, burnTime: 180 },
    { id: 2, propellant: 'LOX/LH2',  diameter: 3.7, height: 10, fill: 0.85,
      tankMaterial: 'Al-2219', engineType: 'pump-fed', thrustPerEngine: 110, burnTime: 360 },
  ],
  boosters: { count: 0, propellant: 'LOX/RP-1', diameter: 2.0, height: 25, fill: 0.85,
    tankMaterial: 'Al-2219', engineType: 'pump-fed', thrustPerEngine: 850, burnTime: 120 },
};

// Tracks which stage advanced sections are expanded, keyed by stage id or 'booster'.
export const advancedOpen = {};

let _nextId = 3;
export const getNextId = () => _nextId++;
