import { getSettings } from './data.js';
async function boot(){try{const s=await getSettings();document.querySelector('#mission-text').textContent=s.mission;document.querySelector('#vision-text').textContent=s.vision;document.querySelector('#values-list').innerHTML=s.values.split('|').map(v=>`<div>${v.trim()}</div>`).join('')}catch(e){}}boot();
