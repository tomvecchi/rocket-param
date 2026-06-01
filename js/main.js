import { initStars, renderSVG } from './render/diagram.js';
import { renderCards, renderBoosterSection } from './render/cards.js';
import { setupEvents } from './events.js';
import { update } from './update.js';
import { calcPhysics } from './physics.js';
import { saveConfig, loadConfig } from './io.js';

initStars();
renderCards();
renderBoosterSection();
update();
setupEvents();

document.getElementById('btn-save').addEventListener('click', saveConfig);
document.getElementById('btn-load').addEventListener('click', loadConfig);

window.addEventListener('resize', () => {
  renderSVG(calcPhysics(0));
  initStars();
});
