import { REQUIRED_MISSION, REQUIRED_VISION, REQUIRED_VALUES } from './data.js?v20260911-1600';

function boot(){
  document.querySelector('#mission-text').textContent=REQUIRED_MISSION;
  document.querySelector('#vision-text').textContent=REQUIRED_VISION;
  document.querySelector('#values-list').innerHTML=REQUIRED_VALUES.split('|').map(v=>`<div>${v.trim()}</div>`).join('');
}
boot();
