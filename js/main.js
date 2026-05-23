import { initStars, renderSVG } from './render/diagram.js';
import { renderCards, renderBoosterSection } from './render/cards.js';
import { setupEvents } from './events.js';
import { update } from './update.js';
import { calcPhysics } from './physics.js';

initStars();
renderCards();
renderBoosterSection();
update();
setupEvents();

window.addEventListener('resize', () => {
  renderSVG(calcPhysics(0));
  initStars();
});
