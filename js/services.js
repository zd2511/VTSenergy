import { getServices } from './data.js?v20260911-1600';
const icon={solar:'☀',battery:'◉',ups:'↯',inverter:'⌁',energy:'◌',generator:'⚙',audit:'⌕',monitor:'◍',cyber:'◇',network:'⌘',data:'▣',cctv:'◉',access:'▱',biometric:'◌',alarm:'!',remote:'⌁','security-audit':'✓',vulnerability:'△'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function card(s){return `<article class="service-card"><div class="service-icon">${icon[s.image]||'+'}</div><div><h3>${esc(s.name)}</h3><p>${esc(s.description)}</p><a class="text-link" href="contact.html?service=${encodeURIComponent(s.name)}">Discuss this service →</a></div></article>`}
const FALLBACK_SERVICES=[
['Energy Solutions','Solar power installation','Solar power installation designed to support reliable energy continuity across the region.','solar'],
['Energy Solutions','Backup battery systems','Backup battery systems that help maintain power availability during interruptions.','battery'],
['Energy Solutions','UPS installation','UPS installation for equipment and operations that require protected, uninterrupted power.','ups'],
['Energy Solutions','Inverter systems','Inverter systems for practical energy resilience and power management.','inverter'],
['Energy Solutions','Load shedding protection','Solutions designed to reduce the operational impact of load shedding.','energy'],
['Energy Solutions','Generator integration','Generator integration to support broader backup power strategies.','generator'],
['Energy Solutions','Energy audits','Energy audits to assess requirements and identify practical opportunities for improved energy resilience.','audit'],
['Energy Solutions','Energy monitoring','Energy monitoring to help clients understand and manage their energy use.','monitor'],
['Digital Security Solutions','Cybersecurity services','Cybersecurity services designed to safeguard businesses against modern digital threats.','cyber'],
['Digital Security Solutions','Network security','Network security solutions focused on protecting connected business environments.','network'],
['Digital Security Solutions','Data protection','Data protection measures designed to help safeguard business information.','data'],
['Digital Security Solutions','CCTV surveillance','CCTV surveillance systems for monitoring and protecting business and property environments.','cctv'],
['Digital Security Solutions','Access control systems','Access control systems to manage and secure entry to protected areas.','access'],
['Digital Security Solutions','Biometric security','Biometric security solutions for controlled and accountable access.','biometric'],
['Digital Security Solutions','Alarm systems','Alarm systems for detection and security awareness.','alarm'],
['Digital Security Solutions','Remote monitoring','Remote monitoring solutions for visibility over security systems and environments.','remote'],
['Digital Security Solutions','Security audits','Security audits to review existing security arrangements and requirements.','security-audit'],
['Digital Security Solutions','Vulnerability assessments','Vulnerability assessments to identify potential weaknesses requiring attention.','vulnerability']
].map(([category,name,description,image])=>({category,name,description,image}));
async function boot(){const a=document.querySelector('#energy-services'),b=document.querySelector('#security-services');if(!a&&!b)return;try{const rows=await getServices();const usable=rows.length?rows:FALLBACK_SERVICES;a.innerHTML=usable.filter(x=>x.category==='Energy Solutions').map(card).join('');b.innerHTML=usable.filter(x=>x.category==='Digital Security Solutions').map(card).join('')}catch(e){a.innerHTML=FALLBACK_SERVICES.filter(x=>x.category==='Energy Solutions').map(card).join('');b.innerHTML=FALLBACK_SERVICES.filter(x=>x.category==='Digital Security Solutions').map(card).join('')}}
boot();
