import { calcPhysics } from './physics.js';
import { renderSVG } from './render/diagram.js';
import { renderResults } from './render/results.js';

export function update() {
  const phys = calcPhysics(0);
  renderSVG(phys);
  renderResults(phys);
}
