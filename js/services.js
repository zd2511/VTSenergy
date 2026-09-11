import { getServices } from './data.js';
const icon={solar:'☀',battery:'◉',ups:'↯',inverter:'⌁',energy:'◌',generator:'⚙',audit:'⌕',monitor:'◍',cyber:'◇',network:'⌘',data:'▣',cctv:'◉',access:'▱',biometric:'◌',alarm:'!',remote:'⌁','security-audit':'✓',vulnerability:'△'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function card(s){return `<article class="service-card"><div class="service-icon">${icon[s.image]||'+'}</div><div><h3>${esc(s.name)}</h3><p>${esc(s.description)}</p><a class="text-link" href="contact.html?service=${encodeURIComponent(s.name)}">Discuss this service →</a></div></article>`}
async function boot(){const a=document.querySelector('#energy-services'),b=document.querySelector('#security-services');if(!a&&!b)return;try{const rows=await getServices();a.innerHTML=rows.filter(x=>x.category==='Energy Solutions').map(card).join('');b.innerHTML=rows.filter(x=>x.category==='Digital Security Solutions').map(card).join('')}catch(e){if(a)a.innerHTML='<div class="empty-state">Services could not be loaded.</div>'}}
boot();
